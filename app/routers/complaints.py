from typing import List, Optional  # List already used for old list endpoint

from fastapi import APIRouter, Depends, Request, UploadFile, File, Query, HTTPException
from datetime import datetime
import tempfile
from pathlib import Path
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app.auth.dependencies import get_current_user, require_roles
from app.config import get_settings
from app.dependencies import get_db
from app.exceptions import NotFoundException
from app.models.complaint import Complaint
from app.models.user import User, UserRole
from app.rate_limiter import limiter
from app.cache import cache_delete, cache_delete_pattern, run_async  # for detail cache invalidation in reassign
from app.schemas.complaint import (
    AssignComplaint,
    ComplaintCreate,
    ComplaintDetailOut,
    ComplaintOut,
    StatusHistoryOut,
    UpdateComplaintStatus,
)
from app.schemas.attachment import AttachmentResponse
from app.services.complaint_service import (
    assign_complaint,
    create_complaint,
    get_complaint_detail,
    get_complaint_history,
    get_complaints,
    update_complaint_status,
)
from app.services.attachment_service import (
    upload_attachment,
    list_attachments,
    get_attachment_or_404,
    delete_attachment,
    get_file_path,
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post(
    "/",
    response_model=ComplaintOut,
    status_code=201,
    summary="Submit a new complaint (STUDENT only)",
)
@limiter.limit(get_settings().RATE_LIMIT_COMPLAINT_CREATE)
def submit_complaint(
    data: ComplaintCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
):
    """Submit a complaint. Only authenticated students may use this endpoint."""
    data.title = data.title.strip()
    data.description = data.description.strip()
    return create_complaint(db, data, student_id=current_user.id)


@router.get(
    "/",
    response_model=List[ComplaintOut],
    summary="Get complaints (role-filtered)",
)
def list_complaints(
    sort_by: str = "priority",  # priority, date_new, date_old, category
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return complaints based on caller's role:
    - STUDENT → their own complaints
    - STAFF → complaints assigned to them
    - ADMIN → all complaints
    """
    complaints = get_complaints(db, current_user=current_user)

    if sort_by == "priority":
        return sorted(complaints, key=lambda x: x.priority_score, reverse=True)
    elif sort_by == "date_new":
        return sorted(complaints, key=lambda x: x.created_at, reverse=True)
    elif sort_by == "date_old":
        return sorted(complaints, key=lambda x: x.created_at)
    elif sort_by == "category":
        return sorted(complaints, key=lambda x: x.category)

    return complaints


@router.get(
    "/{complaint_id}",
    response_model=ComplaintDetailOut,
    summary="Get single complaint detail (role-filtered)",
)
def get_complaint_detail_endpoint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full complaint detail with history, assignee, attachments (empty), rating if present.
    Role enforcement: student=own, staff=assigned, admin=all. 404/403 as appropriate.
    """
    from app.services.complaint_service import get_complaint_detail

    return get_complaint_detail(db, complaint_id, current_user)


@router.get(
    "/{complaint_id}/history",
    response_model=List[StatusHistoryOut],
    summary="Get status history for a complaint (role-filtered)",
)
def get_complaint_history_endpoint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Standalone history endpoint (timeline friendly). Same role rules as detail."""
    from app.services.complaint_service import get_complaint_history

    return get_complaint_history(db, complaint_id, current_user)


@router.patch(
    "/{complaint_id}/assign",
    response_model=ComplaintOut,
    summary="Assign complaint to a staff member (ADMIN only)",
)
def assign_complaint_endpoint(
    complaint_id: int,
    data: AssignComplaint,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Assign an existing complaint to a STAFF user. Auto-logs history & notifications."""
    return assign_complaint(
        db,
        complaint_id=complaint_id,
        staff_id=data.staff_id,
        admin_id=current_user.id,
    )


@router.patch(
    "/{complaint_id}/status",
    response_model=ComplaintOut,
    summary="Update complaint status (STAFF only)",
)
def update_status_endpoint(
    complaint_id: int,
    data: UpdateComplaintStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STAFF)),
):
    """Update the status of an assigned complaint. Auto-logs history & notifies student."""
    return update_complaint_status(
        db,
        complaint_id=complaint_id,
        data=data,
        staff_id=current_user.id,
    )


@router.patch(
    "/{complaint_id}/reassign",
    response_model=ComplaintOut,
    summary="Reassign complaint based on ratings (ADMIN only)",
)
def reassign_complaint_endpoint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """
    Reassign a complaint to the best available staff member based on:
    - Average rating and performance tier
    - Current workload
    - Priority level

    Returns updated complaint with new assignment.
    """
    from app.services.allocation_service import reassign_complaint

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise NotFoundException(
            "Complaint not found",
            "COMPLAINT_NOT_FOUND",
        )

    new_staff = reassign_complaint(db, complaint)
    db.refresh(complaint)
    # invalidate detail + list caches
    run_async(cache_delete(f"complaints:{complaint_id}"))
    run_async(cache_delete_pattern("complaints:list:*"))
    return complaint


# =============================================================================
# Attachments endpoints (under /complaints/{id}/attachments)
# =============================================================================

@router.post(
    "/{complaint_id}/attachments",
    response_model=AttachmentResponse,
    status_code=201,
    summary="Upload attachment to a complaint",
)
async def upload_attachment_endpoint(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a file (max 5MB, specific types) to complaint.
    Student: own + active status; Staff: assigned; Admin: any.
    """
    return upload_attachment(db, complaint_id, file, current_user)


@router.get(
    "/{complaint_id}/attachments",
    response_model=List[AttachmentResponse],
    summary="List attachments for a complaint",
)
def list_attachments_endpoint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List metadata for attachments. Same auth as complaint detail."""
    return list_attachments(db, complaint_id, current_user)


@router.get(
    "/{complaint_id}/attachments/{attachment_id}",
    summary="Download a specific attachment",
)
def download_attachment_endpoint(
    complaint_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the file as download. Auth same as detail view."""
    att = get_attachment_or_404(db, complaint_id, attachment_id, current_user)
    file_path = get_file_path(att)
    if not file_path.exists():
        raise NotFoundException("File not found on disk", "ATTACHMENT_FILE_MISSING")
    return FileResponse(
        path=str(file_path),
        filename=att.original_name,
        media_type=att.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{att.original_name}"'},
    )


@router.delete(
    "/{complaint_id}/attachments/{attachment_id}",
    status_code=204,
    summary="Delete an attachment (uploader or admin only)",
)
def delete_attachment_endpoint(
    complaint_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete file from disk + DB record. Only uploader or admin."""
    delete_attachment(db, complaint_id, attachment_id, current_user)
    return None


# =============================================================================
# Server-side PDF export (WeasyPrint) - replaces client-side jsPDF
# =============================================================================

@router.get(
    "/export/pdf",
    summary="Export filtered complaints as PDF report (ADMIN only)",
    description="Generates a printable PDF with header, summary stats, and complaint table.",
)
def export_complaints_pdf(
    status: Optional[str] = Query(None, description="Filter by status e.g. RESOLVED"),
    department_id: Optional[int] = Query(None, description="Filter by department id"),
    date_from: Optional[str] = Query(None, description="ISO date e.g. 2025-01-01"),
    date_to: Optional[str] = Query(None, description="ISO date e.g. 2025-12-31"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Admin-only PDF report. Builds HTML table + stats then renders via WeasyPrint."""
    from app.models.complaint import ComplaintStatus  # local to avoid circular if any

    q = db.query(Complaint)
    if status:
        try:
            q = q.filter(Complaint.status == ComplaintStatus(status))
        except ValueError:
            pass  # ignore bad status
    if department_id:
        q = q.filter(Complaint.department_id == department_id)
    if date_from:
        try:
            df = datetime.fromisoformat(date_from)
            q = q.filter(Complaint.created_at >= df)
        except Exception:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            q = q.filter(Complaint.created_at <= dt)
        except Exception:
            pass

    complaints = q.order_by(Complaint.created_at.desc()).limit(500).all()  # safety cap

    # stats
    total = len(complaints)
    status_counts: dict = {}
    dept_counts: dict = {}
    for c in complaints:
        s = str(c.status)
        status_counts[s] = status_counts.get(s, 0) + 1
        dname = getattr(getattr(c, "department", None), "name", "Unassigned")
        dept_counts[dname] = dept_counts.get(dname, 0) + 1

    # HTML (self-contained, inline CSS for PDF reliability)
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    filters_applied = []
    if status: filters_applied.append(f"status={status}")
    if department_id: filters_applied.append(f"dept_id={department_id}")
    if date_from: filters_applied.append(f"from={date_from}")
    if date_to: filters_applied.append(f"to={date_to}")
    filter_text = ", ".join(filters_applied) or "none"

    # summary table
    summary_rows = "".join(
        f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in sorted(status_counts.items())
    )
    dept_rows = "".join(
        f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in sorted(dept_counts.items())
    )

    # main complaints table (truncate long titles)
    complaint_rows = ""
    for c in complaints:
        dname = getattr(getattr(c, "department", None), "name", "-")
        created = c.created_at.strftime("%Y-%m-%d") if c.created_at else "-"
        resolved = c.updated_at.strftime("%Y-%m-%d") if (c.status in (ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED) and c.updated_at) else "-"
        title_short = (c.title or "")[:60] + ("..." if len(c.title or "") > 60 else "")
        complaint_rows += (
            f"<tr>"
            f"<td>{c.id}</td>"
            f"<td>{title_short}</td>"
            f"<td>{dname}</td>"
            f"<td>{c.status}</td>"
            f"<td>{c.priority_level} ({c.priority_score})</td>"
            f"<td>{created}</td>"
            f"<td>{resolved}</td>"
            f"</tr>"
        )

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GIET CCMS Report</title>
<style>
  @page {{ size: A4 landscape; margin: 12mm; }}
  body {{ font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #222; margin: 0; }}
  h1 {{ font-size: 18pt; margin: 0 0 4px; color: #0b3d62; }}
  .meta {{ font-size: 9pt; color: #555; margin-bottom: 12px; }}
  table {{ border-collapse: collapse; width: 100%; margin-bottom: 14px; }}
  th, td {{ border: 1px solid #aaa; padding: 4px 6px; text-align: left; }}
  th {{ background: #f0f4f8; font-weight: 600; }}
  .section {{ margin-top: 10px; }}
  .small {{ font-size: 9pt; }}
</style>
</head>
<body>
  <h1>GIET CCMS Report</h1>
  <div class="meta">Generated: {now_str} &nbsp;|&nbsp; Filters: {filter_text}</div>

  <div class="section">
    <strong>Summary Stats</strong>
    <table class="small">
      <tr><th>Total Complaints</th><td>{total}</td></tr>
      <tr><th>By Status</th><td><table class="small" style="margin:0;width:auto">{summary_rows}</table></td></tr>
      <tr><th>By Department</th><td><table class="small" style="margin:0;width:auto">{dept_rows}</table></td></tr>
    </table>
  </div>

  <div class="section">
    <strong>Complaints</strong>
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Title</th><th>Dept</th><th>Status</th>
          <th>Priority</th><th>Created</th><th>Resolved</th>
        </tr>
      </thead>
      <tbody>
        {complaint_rows or '<tr><td colspan="7">No complaints match the filters.</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="small" style="margin-top:16px;color:#666">
    GIET Complaint Classifier &amp; Management System — Confidential
  </div>
</body>
</html>"""

    # Lazy import so app starts even if WeasyPrint runtime libs missing on host
    try:
        from weasyprint import HTML
    except Exception as exc:
        raise HTTPException(
            status_code=501,
            detail=f"WeasyPrint PDF generation unavailable (install system libraries for pango/cairo/gobject on Windows/Linux as per WeasyPrint docs): {exc}"
        )

    # Write to temp file then FileResponse (per spec). Note: temp files accumulate in /tmp on server; for demo acceptable.
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp_path = Path(tmp.name)
        HTML(string=html).write_pdf(tmp_path)
        return FileResponse(
            path=str(tmp_path),
            media_type="application/pdf",
            filename="ccms_report.pdf",
            headers={"Content-Disposition": 'attachment; filename="ccms_report.pdf"'},
        )
    except Exception as e:
        if tmp_path and tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

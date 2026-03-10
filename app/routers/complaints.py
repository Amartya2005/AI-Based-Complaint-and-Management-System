from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintOut,
    AssignComplaint,
    UpdateComplaintStatus,
)
from app.models.user import User, UserRole
from app.auth.dependencies import get_current_user, require_roles
from app.services.complaint_service import (
    create_complaint,
    get_complaints,
    assign_complaint,
    update_complaint_status,
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post(
    "/",
    response_model=ComplaintOut,
    status_code=201,
    summary="Submit a new complaint (STUDENT only)",
)
def submit_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
):
    """Submit a complaint. Only authenticated students may use this endpoint."""
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

"""
Attachment service for upload, list, download, delete.
Handles storage, validation, DB ops, auth checks delegated from routers.
"""
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import List

import filetype
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.attachment import Attachment
from app.models.complaint import Complaint, ComplaintStatus
from app.models.user import User, UserRole
from app.schemas.attachment import AttachmentCreate, AttachmentResponse

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".docx", ".txt"}
ALLOWED_MIME_PREFIXES = {"application/pdf", "image/", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


def _get_upload_dir(complaint_id: int) -> Path:
    settings = get_settings()
    base = Path(settings.UPLOAD_DIR)
    dir_path = base / str(complaint_id)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def _validate_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="No filename")

    # Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"File type {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Size check (note: UploadFile has .size in some versions, else read and check)
    # We'll check after save or use content length if available, but for safety read header
    # For now, rely on read in save and check size.

    # Mime will be checked after reading bytes with filetype


def _save_file(file: UploadFile, complaint_id: int) -> tuple[str, int, str]:
    """Save file to disk, return (stored_filename, size_bytes, detected_mime)"""
    dir_path = _get_upload_dir(complaint_id)
    orig_name = file.filename or "unnamed"
    ext = Path(orig_name).suffix.lower() or ".bin"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = dir_path / stored_name

    size = 0
    # Read in chunks to check size and detect mime
    first_chunk = b""
    with open(file_path, "wb") as buffer:
        while True:
            chunk = file.file.read(8192)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_SIZE_BYTES:
                buffer.close()
                file_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"File too large. Max {MAX_SIZE_BYTES // (1024*1024)}MB"
                )
            if not first_chunk:
                first_chunk = chunk[:4096]
            buffer.write(chunk)

    # Detect mime with filetype (magic bytes)
    kind = filetype.guess(first_chunk)
    mime = kind.mime if kind else (file.content_type or "application/octet-stream")

    # Validate mime
    if not any(mime.startswith(prefix) for prefix in ALLOWED_MIME_PREFIXES) and not any(ext == e for e in ALLOWED_EXTENSIONS):
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"MIME type {mime} not allowed"
        )

    return stored_name, size, mime


def _check_attachment_permission(complaint: Complaint, current_user: User, require_uploader: bool = False) -> None:
    """Enforce role-based access similar to complaint detail."""
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.STUDENT:
        if complaint.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your complaint")
        if require_uploader and complaint.status not in (ComplaintStatus.PENDING, ComplaintStatus.IN_PROGRESS):
            raise HTTPException(status_code=403, detail="Can only attach to PENDING or IN_PROGRESS complaints")
        # for list/view (no require_uploader) allow resolved/others per complaint detail auth
        return
    if current_user.role == UserRole.STAFF:
        if complaint.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="Not assigned to you")
        return
    raise HTTPException(status_code=403, detail="Forbidden")


def upload_attachment(db: Session, complaint_id: int, file: UploadFile, current_user: User) -> AttachmentResponse:
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    _check_attachment_permission(complaint, current_user, require_uploader=True)

    # Validate and save
    _validate_file(file)
    stored_name, size, mime = _save_file(file, complaint_id)

    # DB record
    att_create = AttachmentCreate(
        filename=stored_name,
        original_name=file.filename or "unnamed",
        size_bytes=size,
        mime_type=mime,
        uploaded_by=current_user.id,
    )

    attachment = Attachment(
        complaint_id=complaint_id,
        filename=att_create.filename,
        original_name=att_create.original_name,
        size_bytes=att_create.size_bytes,
        mime_type=att_create.mime_type,
        uploaded_by=att_create.uploaded_by,
        # file_url for compat: relative path
        file_url=str(Path(get_settings().UPLOAD_DIR) / str(complaint_id) / stored_name),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    # Build response with name
    resp = AttachmentResponse.model_validate(attachment, from_attributes=True)
    resp.uploaded_by_name = current_user.name
    return resp


def list_attachments(db: Session, complaint_id: int, current_user: User) -> List[AttachmentResponse]:
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    _check_attachment_permission(complaint, current_user)

    attachments = (
        db.query(Attachment)
        .filter(Attachment.complaint_id == complaint_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )

    results = []
    for att in attachments:
        r = AttachmentResponse.model_validate(att, from_attributes=True)
        if att.uploaded_by_user:
            r.uploaded_by_name = att.uploaded_by_user.name
        results.append(r)
    return results


def get_attachment_or_404(db: Session, complaint_id: int, attachment_id: int, current_user: User) -> Attachment:
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    _check_attachment_permission(complaint, current_user)

    att = (
        db.query(Attachment)
        .filter(Attachment.id == attachment_id, Attachment.complaint_id == complaint_id)
        .first()
    )
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return att


def delete_attachment(db: Session, complaint_id: int, attachment_id: int, current_user: User) -> None:
    att = get_attachment_or_404(db, complaint_id, attachment_id, current_user)

    # Only uploader or admin
    if current_user.role != UserRole.ADMIN and att.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only uploader or admin can delete")

    # Delete file
    try:
        file_path = Path(get_settings().UPLOAD_DIR) / str(complaint_id) / att.filename
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        logger.warning("Failed to delete file on disk: %s", e)

    db.delete(att)
    db.commit()


def get_file_path(attachment: Attachment) -> Path:
    """Resolve on-disk path for FileResponse."""
    settings = get_settings()
    return Path(settings.UPLOAD_DIR) / str(attachment.complaint_id) / attachment.filename

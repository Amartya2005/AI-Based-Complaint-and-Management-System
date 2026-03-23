from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.complaint_status_history import ComplaintStatusHistory
from app.schemas.complaint import ComplaintCreate, UpdateComplaintStatus
from app.services.notification_service import create_notification
from app.services.ml_service import log_ml_prediction

# ─── Keyword-based ML Classifier ───────────────────────────────────────────────────
_KEYWORD_WEIGHTS = {
    ComplaintCategory.HOSTEL: [
        "hostel", "dorm", "dormitory", "room", "warden", "mess", "food",
        "bed", "bathroom", "toilet", "water", "electricity", "noise", "roommate",
        "accommodation", "curfew", "laundry",
    ],
    ComplaintCategory.ADMINISTRATIVE: [
        "admin", "administration", "office", "fee", "fees", "refund", "scholarship",
        "certificate", "document", "id card", "library", "bus", "transport",
        "registration", "admission", "staff", "management", "portal", "deadline",
    ],
    ComplaintCategory.ACADEMIC: [
        "academic", "exam", "examination", "result", "grade", "marks", "subject",
        "lecture", "professor", "teacher", "syllabus", "attendance", "assignment",
        "project", "lab", "practical", "course", "curriculum", "timetable", "class",
    ],
}


def _classify_complaint(title: str, description: str):
    """
    Lightweight keyword-based classifier.
    Returns (predicted_category: str, confidence_score: float).
    """
    text = (title + " " + description).lower()
    scores = {}
    for category, keywords in _KEYWORD_WEIGHTS.items():
        scores[category] = sum(1 for kw in keywords if kw in text)

    total = sum(scores.values()) or 1  # avoid division by zero
    best_category = max(scores, key=scores.get)
    confidence = round(scores[best_category] / total, 4)
    return best_category.value, confidence


def _get_least_loaded_staff(db: Session, category: str = None) -> User | None:
    """Finds the staff member with the fewest active complaints."""
    # Active status types that contribute to "workload"
    active_statuses = [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]
    
    # Subquery to count active complaints per user
    complaint_counts = (
        db.query(
            Complaint.assigned_to,
            func.count(Complaint.id).label("active_count")
        )
        .filter(Complaint.status.in_(active_statuses))
        .filter(Complaint.assigned_to.isnot(None))
        .group_by(Complaint.assigned_to)
        .subquery()
    )

    # Query all staff users, outer joining the complaint counts, order by count ASC
    least_loaded_staff = (
        db.query(User)
        .outerjoin(complaint_counts, User.id == complaint_counts.c.assigned_to)
        .filter(User.role == UserRole.STAFF)
        .order_by(func.coalesce(complaint_counts.c.active_count, 0).asc())
        .first()
    )

    return least_loaded_staff



def create_complaint(db: Session, data: ComplaintCreate, student_id: int) -> Complaint:
    """Create a new complaint and auto-classify it with the keyword-based ML model."""
    complaint = Complaint(
        title=data.title,
        description=data.description,
        category=data.category,
        status=ComplaintStatus.PENDING,
        student_id=student_id,
        department_id=data.department_id,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # ─ Run keyword classifier and persist prediction ─────────────────────────────
    predicted_category, confidence = _classify_complaint(data.title, data.description)
    log_ml_prediction(
        db=db,
        complaint_id=complaint.id,
        predicted_category=predicted_category,
        confidence_score=confidence,
    )

    # ─ Initialize Priority ─────────────────────────────
    from app.services.ml_service import calculate_severity_score
    from app.services.priority_service import initialize_complaint_priority
    
    severity_score = calculate_severity_score(predicted_category, confidence)
    initialize_complaint_priority(complaint, severity_score, db)
    db.commit()
    db.refresh(complaint)

    # ─ Complaint stays in PENDING status ──────────────────────────────────────────
    # Admin will manually assign to staff members using the assignment endpoint
    # This ensures proper review before assignment

    return complaint


def get_complaints(db: Session, current_user: User) -> List[Complaint]:
    """
    Role-aware complaint retrieval:
    - STUDENT: only their own submitted complaints
    - STAFF: complaints assigned to them
    - ADMIN: all complaints
    """
    if current_user.role == UserRole.STUDENT:
        return db.query(Complaint).filter(Complaint.student_id == current_user.id).all()
    elif current_user.role == UserRole.STAFF:
        return db.query(Complaint).filter(Complaint.assigned_to == current_user.id).all()
    else:  # ADMIN
        return db.query(Complaint).all()


def assign_complaint(
    db: Session, complaint_id: int, staff_id: int, admin_id: int
) -> Complaint:
    """
    Assign a complaint to a staff member (ADMIN only — enforced at router).
    Logs the status change and notifies both the staff member and the student.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found"
        )

    staff = db.query(User).filter(
        User.id == staff_id, User.role == UserRole.STAFF
    ).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff member not found or user is not STAFF",
        )

    old_status = complaint.status
    complaint.assigned_to = staff_id
    complaint.status = ComplaintStatus.ASSIGNED

    # Log status history
    history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        changed_by=admin_id,
        old_status=old_status,
        new_status=ComplaintStatus.ASSIGNED,
        remarks=f"Complaint assigned to staff ID {staff_id}",
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    # Notify assigned staff member
    create_notification(
        db=db,
        user_id=staff_id,
        complaint_id=complaint_id,
        message=f"You have been assigned complaint #{complaint_id}: '{complaint.title}'",
    )

    # Notify the student who submitted
    create_notification(
        db=db,
        user_id=complaint.student_id,
        complaint_id=complaint_id,
        message=f"Your complaint #{complaint_id} has been assigned to a staff member",
    )

    return complaint


def update_complaint_status(
    db: Session,
    complaint_id: int,
    data: UpdateComplaintStatus,
    staff_id: int,
) -> Complaint:
    """
    Update complaint status (STAFF only — enforced at router).
    Logs the status change in complaint_status_history and notifies the student.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found"
        )

    # Ensure the staff member is assigned to this complaint
    if complaint.assigned_to != staff_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this complaint",
        )

    old_status = complaint.status
    complaint.status = data.new_status

    history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        changed_by=staff_id,
        old_status=old_status,
        new_status=data.new_status,
        remarks=data.remarks,
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    # Notify the student about the status change
    create_notification(
        db=db,
        user_id=complaint.student_id,
        complaint_id=complaint_id,
        message=(
            f"Your complaint #{complaint_id} status changed from "
            f"{old_status.value} to {data.new_status.value}"
            + (f". Remarks: {data.remarks}" if data.remarks else "")
        ),
    )

    return complaint

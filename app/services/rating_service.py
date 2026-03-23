"""
Service layer for staff rating operations
Handles business logic:
- Rating submission with validation
- Automatic summary updates
- Duplicate prevention
- Rating retrieval with role-based filtering
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.staff_rating import StaffRating, StaffRatingSummary
from app.models.complaint import Complaint, ComplaintStatus
from app.models.user import User
from app.schemas.rating import StaffRatingCreate


def submit_rating(
    db: Session,
    data: StaffRatingCreate,
    student_id: int,
) -> StaffRating:
    """
    Submit a rating for a staff member on a resolved complaint.
    
    Validations:
    - Complaint must be RESOLVED
    - Student can only rate the staff member assigned to that complaint
    - One rating per student-staff-complaint combination (enforced by DB unique constraint)
    
    Updates:
    - Creates the rating
    - Automatically updates StaffRatingSummary
    """
    
    # Fetch complaint
    complaint = db.query(Complaint).filter(Complaint.id == data.complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    # Verify complaint is resolved
    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only rate resolved complaints. Current status: {complaint.status.value}"
        )
    
    # Verify student owns the complaint
    if complaint.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only rate complaints you submitted"
        )
    
    # Verify staff member is assigned to complaint
    if complaint.assigned_to != data.staff_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only rate the staff member assigned to your complaint"
        )
    
    # Check for duplicate rating
    existing_rating = db.query(StaffRating).filter(
        StaffRating.student_id == student_id,
        StaffRating.staff_id == data.staff_id,
        StaffRating.complaint_id == data.complaint_id
    ).first()
    
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already rated this staff member for this complaint"
        )
    
    # Create rating
    new_rating = StaffRating(
        student_id=student_id,
        staff_id=data.staff_id,
        complaint_id=data.complaint_id,
        rating=data.rating,
        feedback=data.feedback
    )
    
    db.add(new_rating)
    db.flush()  # Get the ID before updating summary
    
    # Update or create staff rating summary
    update_staff_rating_summary(db, data.staff_id)
    
    db.commit()
    db.refresh(new_rating)
    
    return new_rating


def update_staff_rating_summary(db: Session, staff_id: int) -> None:
    """
    Recalculate and update the staff rating summary.
    Called automatically after each rating submission.
    """
    
    # Calculate aggregates
    result = db.query(
        func.count(StaffRating.id).label("total_ratings"),
        func.avg(StaffRating.rating).label("average_rating")
    ).filter(
        StaffRating.staff_id == staff_id
    ).first()
    
    total_ratings = result.total_ratings or 0
    average_rating = float(result.average_rating) if result.average_rating else 0.0
    
    # Get or create summary
    summary = db.query(StaffRatingSummary).filter(
        StaffRatingSummary.staff_id == staff_id
    ).first()
    
    if summary:
        summary.total_ratings = total_ratings
        summary.average_rating = average_rating
        db.add(summary)
    else:
        summary = StaffRatingSummary(
            staff_id=staff_id,
            total_ratings=total_ratings,
            average_rating=average_rating
        )
        db.add(summary)
    
    db.flush()


def get_staff_average_rating(db: Session, staff_id: int) -> StaffRatingSummary:
    """
    Get average rating for a staff member.
    Returns: StaffRatingSummary object with total_ratings and average_rating
    """
    summary = db.query(StaffRatingSummary).filter(
        StaffRatingSummary.staff_id == staff_id
    ).first()
    
    if not summary:
        # If no ratings exist, create a record with 0 values
        summary = StaffRatingSummary(staff_id=staff_id, total_ratings=0, average_rating=0.0)
        db.add(summary)
        db.commit()
        db.refresh(summary)
    
    return summary


def get_all_staff_ratings(db: Session, skip: int = 0, limit: int = 50) -> list:
    """
    Get all staff ratings with student details (Admin only).
    Returns paginated list of ratings with:
    - Student name and email
    - Staff ID
    - Rating details
    - Timestamp
    """
    ratings = db.query(
        StaffRating.id,
        StaffRating.student_id,
        User.name.label("student_name"),
        User.email.label("student_email"),
        StaffRating.staff_id,
        StaffRating.complaint_id,
        StaffRating.rating,
        StaffRating.feedback,
        StaffRating.created_at
    ).join(
        User, User.id == StaffRating.student_id
    ).order_by(
        StaffRating.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Convert Row objects to dicts for easier serialization
    result = []
    for row in ratings:
        result.append({
            "id": row.id,
            "student_id": row.student_id,
            "student_name": row.student_name,
            "student_email": row.student_email,
            "staff_id": row.staff_id,
            "complaint_id": row.complaint_id,
            "rating": row.rating,
            "feedback": row.feedback,
            "created_at": row.created_at,
        })
    
    return result


def get_staff_rating_stats(db: Session, staff_id: int) -> dict:
    """
    Get detailed rating statistics for a staff member.
    Includes:
    - Staff name and email
    - Total ratings and average
    - Breakdown by rating (1-5)
    """
    
    # Get staff info
    staff_user = db.query(User).filter(User.id == staff_id).first()
    if not staff_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    
    # Get summary
    summary = get_staff_average_rating(db, staff_id)
    
    # Get rating breakdown
    breakdown = db.query(
        StaffRating.rating,
        func.count(StaffRating.id).label("count")
    ).filter(
        StaffRating.staff_id == staff_id
    ).group_by(
        StaffRating.rating
    ).all()
    
    rating_breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in breakdown:
        rating_breakdown[rating] = count
    
    return {
        "staff_id": staff_id,
        "staff_name": staff_user.name,
        "staff_email": staff_user.email,
        "total_ratings": summary.total_ratings,
        "average_rating": summary.average_rating,
        "rating_breakdown": rating_breakdown,
        "updated_at": summary.updated_at
    }

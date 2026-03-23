"""
Work Allocation Service
Assigns complaints to staff members based on:
- Rating-based priority tiers
- Lowest current workload
- Balanced distribution
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.models.staff_rating import StaffRatingSummary
from app.services.notification_service import create_notification


# Rating Tier Thresholds
RATING_TIERS = {
    "premium": 4.5,     # 4.5+ stars
    "standard": 3.5,    # 3.5-4.49 stars
    "standard": 2.5,    # 2.5-3.49 stars (standard)
    "basic": 0.0,       # 0-2.49 stars
}


def get_rating_tier(average_rating: float) -> str:
    """
    Categorize staff member based on average rating.
    Returns: 'premium', 'standard', 'basic'
    """
    if average_rating >= 4.5:
        return "premium"
    elif average_rating >= 3.5:
        return "standard"
    elif average_rating >= 2.5:
        return "developing"
    else:
        return "basic"


def get_workload_count(db: Session, staff_id: int) -> int:
    """
    Get count of active complaints assigned to staff member.
    Active statuses: ASSIGNED, IN_PROGRESS
    """
    active_statuses = [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]
    
    count = db.query(func.count(Complaint.id)).filter(
        Complaint.assigned_to == staff_id,
        Complaint.status.in_(active_statuses)
    ).scalar()
    
    return count or 0


def find_best_staff_for_complaint(db: Session, priority_level: str = None) -> User:
    """
    Find the best staff member to assign a complaint based on:
    1. For high-priority complaints: Prefer premium-rated staff
    2. For standard complaints: Balance rating and workload
    3. Prefer staff with lower workload across all priorities
    
    Returns: User object (staff member)
    """
    
    # Get all active staff members with their ratings
    staff_ratings = db.query(
        User.id,
        User.name,
        StaffRatingSummary.average_rating,
    ).join(
        StaffRatingSummary, User.id == StaffRatingSummary.staff_id,
        isouter=True
    ).filter(
        User.role == UserRole.STAFF,
        User.is_active == True
    ).all()
    
    if not staff_ratings:
        return None
    
    # Score each staff member
    staff_scores = []
    
    for staff_id, staff_name, avg_rating in staff_ratings:
        avg_rating = avg_rating or 0.0
        workload = get_workload_count(db, staff_id)
        tier = get_rating_tier(avg_rating)
        
        # Calculate composite score
        # Rating weight (0-100) + Workload weight (0-100, inverted)
        rating_score = (avg_rating / 5.0) * 100  # 0-100
        workload_penalty = workload * 5  # Each complaint = 5 points penalty
        
        # Final score: higher rating + lower workload = higher score
        final_score = rating_score - workload_penalty
        
        staff_scores.append({
            "staff_id": staff_id,
            "staff_name": staff_name,
            "average_rating": avg_rating,
            "tier": tier,
            "workload": workload,
            "score": final_score
        })
    
    # Sort by score (descending) to get best candidate
    staff_scores.sort(key=lambda x: x["score"], reverse=True)
    
    best_candidate = staff_scores[0]
    
    # Get User object
    staff_user = db.query(User).filter(User.id == best_candidate["staff_id"]).first()
    return staff_user


def find_best_staff_for_priority_complaint(
    db: Session, 
    priority_level: str
) -> User:
    """
    Specialized assignment for priority-based complaints.
    
    CRITICAL priority: Assign to premium-rated staff (≥4.5 stars)
    HIGH priority: Assign to standard+ staff (≥3.5 stars)
    MEDIUM/LOW: Assign based on general workload balancing
    
    Returns: User object (staff member)
    """
    
    # Minimum rating thresholds by priority
    min_rating_thresholds = {
        "CRITICAL": 4.5,
        "HIGH": 3.5,
        "MEDIUM": 2.5,
        "LOW": 0.0,
    }
    
    min_rating = min_rating_thresholds.get(priority_level, 0.0)
    
    # Get eligible staff (meets minimum rating)
    eligible_staff = db.query(
        User.id,
        User.name,
        StaffRatingSummary.average_rating,
    ).join(
        StaffRatingSummary, User.id == StaffRatingSummary.staff_id,
        isouter=True
    ).filter(
        User.role == UserRole.STAFF,
        User.is_active == True
    ).all()
    
    # Filter by minimum rating, then filter by workload
    qualified_staff = []
    for staff_id, staff_name, avg_rating in eligible_staff:
        avg_rating = avg_rating or 0.0
        if avg_rating >= min_rating:
            workload = get_workload_count(db, staff_id)
            qualified_staff.append({
                "staff_id": staff_id,
                "staff_name": staff_name,
                "average_rating": avg_rating,
                "workload": workload,
            })
    
    if not qualified_staff:
        # Fallback: use general allocation if no one meets minimum
        return find_best_staff_for_complaint(db, priority_level)
    
    # Sort by workload (ascending) - prefer less busy staff
    qualified_staff.sort(key=lambda x: x["workload"])
    
    # Among equally loaded staff, prefer higher rated
    qualified_staff.sort(key=lambda x: (x["workload"], -x["average_rating"]))
    
    best_candidate = qualified_staff[0]
    
    staff_user = db.query(User).filter(User.id == best_candidate["staff_id"]).first()
    return staff_user


def assign_complaint_to_staff(
    db: Session,
    complaint: Complaint,
    staff_id: int,
) -> None:
    """
    Assign a complaint to a specific staff member.
    Updates complaint status and sends notification.
    """
    staff = db.query(User).filter(User.id == staff_id).first()
    if not staff:
        raise ValueError(f"Staff member {staff_id} not found")
    
    complaint.assigned_to = staff_id
    complaint.status = ComplaintStatus.ASSIGNED
    db.add(complaint)
    
    # Send notification
    create_notification(
        db=db,
        user_id=staff_id,
        complaint_id=complaint.id,
        message=f"New complaint assigned: #{complaint.id} - '{complaint.title}'"
    )
    
    db.commit()


def reassign_complaint(
    db: Session,
    complaint: Complaint,
) -> User:
    """
    Reassign a complaint based on current priority and availability.
    Useful when staff member is unavailable or performance is poor.
    
    Returns: The new staff member assigned
    """
    priority_level = complaint.priority_level
    
    new_staff = find_best_staff_for_priority_complaint(db, priority_level)
    if not new_staff:
        raise ValueError("No available staff to assign complaint")
    
    old_staff_id = complaint.assigned_to
    assign_complaint_to_staff(db, complaint, new_staff.id)
    
    # Notify old staff (if reassigned)
    if old_staff_id and old_staff_id != new_staff.id:
        create_notification(
            db=db,
            user_id=old_staff_id,
            complaint_id=complaint.id,
            message=f"Complaint #{complaint.id} has been reassigned"
        )
    
    return new_staff

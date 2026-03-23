"""
Router for staff rating endpoints
Endpoints:
- POST /rate-staff: Submit a rating (Students only)
- GET /staff/{staff_id}/average-rating: Get staff average rating (Public)
- GET /admin/staff-ratings: Get all ratings with details (Admin only)
- GET /staff/{staff_id}/rating-stats: Get detailed stats (Admin/Staff)
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.rating import (
    StaffRatingCreate,
    StaffRatingOut,
    StaffAverageRatingOut,
    StaffRatingDetailOut,
    StaffRatingStatsOut,
)
from app.services.rating_service import (
    submit_rating,
    get_staff_average_rating,
    get_all_staff_ratings,
    get_staff_rating_stats,
)

router = APIRouter(prefix="/ratings", tags=["Staff Ratings"])


@router.post(
    "/rate-staff",
    response_model=StaffRatingOut,
    status_code=201,
    summary="Submit a staff rating (STUDENT only)"
)
def rate_staff(
    data: StaffRatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
):
    """
    Submit a rating for a staff member on a resolved complaint.
    
    Requirements:
    - Complaint must be RESOLVED
    - You must be the student who submitted the complaint
    - The staff member must be assigned to your complaint
    - You can only rate once per complaint
    
    Returns the created rating object.
    """
    return submit_rating(db, data, student_id=current_user.id)


@router.get(
    "/staff/{staff_id}/average-rating",
    response_model=StaffAverageRatingOut,
    summary="Get average rating for staff member (Public)"
)
def get_staff_average(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the average rating for a staff member.
    Returns total number of ratings and average rating score.
    
    Accessible to: All authenticated users
    """
    summary = get_staff_average_rating(db, staff_id)
    return summary


@router.get(
    "/admin/staff-ratings",
    response_model=List[StaffRatingDetailOut],
    summary="Get all ratings with student details (ADMIN only)"
)
def list_all_ratings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """
    Get all submitted ratings with student details.
    Useful for admin dashboards and reporting.
    
    Returns paginated list with:
    - Student name and email
    - Rating and feedback
    - Timestamp
    
    Accessible to: Admin only
    """
    ratings = get_all_staff_ratings(db, skip=skip, limit=limit)
    
    # Convert dicts to response models
    return [StaffRatingDetailOut(**rating) for rating in ratings]


@router.get(
    "/staff/{staff_id}/rating-stats",
    response_model=StaffRatingStatsOut,
    summary="Get detailed rating statistics (ADMIN/STAFF)"
)
def get_staff_stats(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF)),
):
    """
    Get detailed rating statistics for a staff member.
    Includes:
    - Total ratings count
    - Average rating
    - Breakdown of ratings by score (1-5)
    
    Restrictions:
    - Staff members can only view their own stats
    - Admins can view anyone's stats
    """
    # Staff members can only see their own ratings
    if current_user.role == UserRole.STAFF and current_user.id != staff_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff members can only view their own rating statistics"
        )
    
    stats = get_staff_rating_stats(db, staff_id)
    return stats

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.schemas.notification import NotificationOut
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.notification_service import get_notifications, mark_notification_as_read

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/",
    response_model=List[NotificationOut],
    summary="Get all notifications for the current user",
)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all notifications for the authenticated user, newest first."""
    return get_notifications(db, user_id=current_user.id)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut,
    summary="Mark a notification as read",
)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a specific notification as read. Raises 403 for other users' notifications."""
    return mark_notification_as_read(
        db, notification_id=notification_id, user_id=current_user.id
    )

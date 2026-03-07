from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.notification import Notification


def get_notifications(db: Session, user_id: int) -> List[Notification]:
    """Fetch all notifications for a given user, newest first."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_notification_as_read(
    db: Session, notification_id: int, user_id: int
) -> Notification:
    """
    Mark a notification as read.
    Raises 404 if not found, 403 if notification belongs to another user.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )
    if notification.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot modify another user's notification",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def create_notification(
    db: Session, user_id: int, complaint_id: int, message: str
) -> Notification:
    """
    Internal helper: create a notification record.
    Called automatically by complaint_service on assign / status update.
    """
    notification = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        message=message,
        is_read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

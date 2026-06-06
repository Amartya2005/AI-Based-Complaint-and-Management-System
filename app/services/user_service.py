from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.password import hash_password, verify_password
from app.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.user import UserCreate


def create_user(db: Session, data: UserCreate) -> User:
    """Create a new user. Raises 400 if email or college_id already exists, or on invalid department."""
    if db.query(User).filter(User.email == data.email).first():
        raise BadRequestException(
            "Email already registered",
            "EMAIL_ALREADY_REGISTERED",
        )
    if db.query(User).filter(User.college_id == data.college_id).first():
        raise BadRequestException(
            "College ID already registered",
            "COLLEGE_ID_ALREADY_REGISTERED",
        )
    # Validate department exists before attempting insert
    if data.department_id is not None:
        dept = db.query(Department).filter(Department.id == data.department_id).first()
        if not dept:
            raise BadRequestException(
                f"Department with ID {data.department_id} does not exist. Leave it blank or use a valid department ID.",
                "INVALID_DEPARTMENT_ID",
            )
    user = User(
        college_id=data.college_id,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        department_id=data.department_id,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise BadRequestException(
            "Database constraint failed. If you provided a department ID, ensure the department exists.",
            "DATABASE_CONSTRAINT_FAILED",
        )


def get_users(db: Session, role: Optional[UserRole] = None) -> List[User]:
    """Return all users, optionally filtered by role."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()


def delete_user(db: Session, user_id: int) -> dict:
    """Delete a user by ID.
    Explicitly blocked (409) if the user has associated complaints (as student or assignee).
    Other relations (ratings, notifications, history) are cleaned where possible.
    Always prefer deactivate_user for audit/compliance reasons.
    """
    from app.models.complaint import Complaint
    from app.models.notification import Notification
    from app.models.staff_rating import StaffRating

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException(
            f"User with ID {user_id} not found",
            "USER_NOT_FOUND",
        )

    # Explicit check per requirements (after user lookup so existing tests' mock side_effects
    # for the user query remain the first query call): block if complaints exist.
    has_complaints = (
        db.query(Complaint)
        .filter(
            (Complaint.student_id == user_id) | (Complaint.assigned_to == user_id)
        )
        .first()
        is not None
    )
    if has_complaints:
        raise ConflictException(
            "User has associated complaints. Deactivate instead of delete.",
            "USER_HAS_COMPLAINTS",
        )

    try:
        # Best-effort cleanup of non-complaint relations (notifications, ratings given as staff)
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.query(StaffRating).filter(StaffRating.staff_id == user_id).delete()

        # Note: complaint_status_history and other history rows may still reference via changed_by.
        # We intentionally do not cascade-delete complaints or full history.

        db.delete(user)
        db.commit()
        return {
            "message": f"User {user.name} ({user.college_id}) has been deleted successfully"
        }
    except Exception as e:
        db.rollback()
        # Fallback for any remaining constraint issues (ratings history etc.)
        error_str = str(e).lower()
        if "foreign key" in error_str or "constraint" in error_str or "integrity" in error_str:
            raise ConflictException(
                "User has associated complaints. Deactivate instead of delete.",
                "USER_HAS_COMPLAINTS",
                detail={"error": str(e)},
            )
        raise BadRequestException(
            "Failed to delete user. Try deactivating instead.",
            "USER_DELETE_FAILED",
            detail={"error": str(e)},
        )


def deactivate_user(db: Session, user_id: int) -> User:
    """Deactivate a user by marking them as inactive."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException(
            f"User with ID {user_id} not found",
            "USER_NOT_FOUND",
        )

    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Return a user by email, or None if not found."""
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Verify email and password.
    Returns the User if valid, raises 401 otherwise.
    """
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedException(
            "Invalid email or password",
            "INVALID_LOGIN_CREDENTIALS",
        )
    if not user.is_active:
        raise ForbiddenException(
            "Account is deactivated",
            "ACCOUNT_DEACTIVATED",
        )
    return user

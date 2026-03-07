from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.department import Department
from app.schemas.user import UserCreate
from app.auth.password import hash_password, verify_password


from sqlalchemy.exc import IntegrityError

def create_user(db: Session, data: UserCreate) -> User:
    """Create a new user. Raises 400 if email or college_id already exists, or on invalid department."""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if db.query(User).filter(User.college_id == data.college_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College ID already registered",
        )
    # Validate department exists before attempting insert
    if data.department_id is not None:
        dept = db.query(Department).filter(Department.id == data.department_id).first()
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department with ID {data.department_id} does not exist. Leave it blank or use a valid department ID.",
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database constraint failed. If you provided a department ID, ensure the department exists."
        )


def get_users(db: Session, role: Optional[UserRole] = None) -> List[User]:
    """Return all users, optionally filtered by role."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.schemas.user import UserCreate, UserOut
from app.models.user import User, UserRole
from app.auth.dependencies import require_roles
from app.services.user_service import create_user, get_users, delete_user, deactivate_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    response_model=UserOut,
    status_code=201,
    summary="Create a new user (ADMIN only)",
)
def create_user_endpoint(
    data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Create a STUDENT, STAFF, or ADMIN user. Reserved for administrators."""
    return create_user(db, data)


@router.get(
    "/",
    response_model=List[UserOut],
    summary="List all users (ADMIN only, optional role filter)",
)
def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Return all users, optionally filtered by role (STUDENT / STAFF / ADMIN)."""
    return get_users(db, role=role)


@router.delete(
    "/{user_id}",
    summary="Delete a user (ADMIN only)",
)
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete a user by ID. Returns an error if user has related records (consider deactivation)."""
    return delete_user(db, user_id)


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserOut,
    summary="Deactivate a user (ADMIN only)",
)
def deactivate_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Deactivate a user by marking them as inactive. Preserves all associated data."""
    return deactivate_user(db, user_id)

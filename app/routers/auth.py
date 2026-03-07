from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.schemas.token import Token
from app.services.user_service import authenticate_user
from app.auth.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token, summary="Login and receive a JWT token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authenticate with email (username field) + password.
    Returns a Bearer JWT token with role, user_id, and college_id embedded.
    """
    user = authenticate_user(db, email=form_data.username, password=form_data.password)
    token_data = {
        "sub": str(user.id),
        "role": user.role.value,
        "college_id": user.college_id,
    }
    access_token = create_access_token(data=token_data)
    return Token(access_token=access_token)

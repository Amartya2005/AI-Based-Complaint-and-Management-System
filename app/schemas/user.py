from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    college_id: str
    name: str
    email: EmailStr
    password: str
    role: UserRole
    department_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    college_id: str
    name: str
    email: str
    role: UserRole
    department_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

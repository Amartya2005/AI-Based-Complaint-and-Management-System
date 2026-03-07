from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.department import Department
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/departments", tags=["Departments"])


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DepartmentOut], summary="List all departments")
def list_departments(db: Session = Depends(get_db)):
    """Return all departments. No authentication required — used to populate dropdowns."""
    return db.query(Department).order_by(Department.name).all()

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.complaint import ComplaintCategory, ComplaintStatus


class ComplaintCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1, max_length=10000)
    category: ComplaintCategory
    department_id: Optional[int] = None

    @field_validator("title", "description")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class ComplaintOut(BaseModel):
    id: int
    title: str
    description: str
    category: ComplaintCategory
    status: ComplaintStatus
    student_id: int
    assigned_to: Optional[int] = None
    department_id: Optional[int] = None
    priority_score: int
    severity_score: float
    impact_score: int
    aging_score: int
    priority_level: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssignComplaint(BaseModel):
    staff_id: int


class UpdateComplaintStatus(BaseModel):
    new_status: ComplaintStatus
    remarks: Optional[str] = None

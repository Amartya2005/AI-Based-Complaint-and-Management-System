"""
Pydantic schemas for staff rating endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StaffRatingCreate(BaseModel):
    """Schema for submitting a new rating"""
    complaint_id: int
    staff_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    feedback: Optional[str] = Field(None, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "complaint_id": 1,
                "staff_id": 2,
                "rating": 5,
                "feedback": "Great work handling my complaint!"
            }
        }


class StaffRatingOut(BaseModel):
    """Schema for returning a single rating"""
    id: int
    student_id: int
    staff_id: int
    complaint_id: int
    rating: int
    feedback: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class StaffAverageRatingOut(BaseModel):
    """Schema for returning staff member's average rating"""
    staff_id: int
    total_ratings: int
    average_rating: float
    
    class Config:
        from_attributes = True


class StaffRatingDetailOut(BaseModel):
    """Schema for admin view with student details"""
    id: int
    student_id: int
    student_name: str
    student_email: str
    staff_id: int
    complaint_id: int
    rating: int
    feedback: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class StaffRatingStatsOut(BaseModel):
    """Schema for detailed staff rating statistics"""
    staff_id: int
    staff_name: str
    staff_email: str
    total_ratings: int
    average_rating: float
    rating_breakdown: dict = Field(
        ..., 
        description="Count of each rating (1-5)"
    )
    updated_at: datetime
    
    class Config:
        from_attributes = True

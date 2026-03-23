"""
Staff Rating Models
- staff_ratings: Stores individual ratings from students
- staff_rating_summary: Maintains aggregated rating statistics for each staff
"""
import enum
from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, ForeignKey, 
    Integer, Float, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class StaffRating(Base):
    """
    Individual ratings submitted by students for staff members.
    Constraint: One student can rate one staff member only once per complaint.
    """
    __tablename__ = "staff_ratings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    staff_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    complaint_id = Column(BigInteger, ForeignKey("complaints.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint(
            "student_id", "staff_id", "complaint_id",
            name="uq_student_staff_complaint"
        ),
        Index("idx_staff_id", "staff_id"),
        Index("idx_complaint_id", "complaint_id"),
        Index("idx_student_id", "student_id"),
    )

    # Relationships - explicitly set foreign_keys to avoid ambiguity
    student = relationship(
        "User",
        foreign_keys=[student_id]
    )
    staff = relationship(
        "User",
        foreign_keys=[staff_id]
    )
    complaint = relationship("Complaint")


class StaffRatingSummary(Base):
    """
    Aggregated rating statistics for each staff member.
    Updated automatically when new ratings are submitted.
    """
    __tablename__ = "staff_rating_summary"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    staff_id = Column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)
    total_ratings = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Index
    __table_args__ = (
        Index("idx_staff_summary", "staff_id"),
    )

    # Relationship
    staff = relationship("User", foreign_keys=[staff_id])

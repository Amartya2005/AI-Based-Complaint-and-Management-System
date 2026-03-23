import enum
from sqlalchemy import (
    Column, BigInteger, String, Boolean, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    college_id = Column(String(100), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id])
    submitted_complaints = relationship(
        "Complaint",
        foreign_keys="Complaint.student_id",
        back_populates="student",
        cascade="all, delete-orphan"
    )
    assigned_complaints = relationship(
        "Complaint",
        foreign_keys="Complaint.assigned_to",
        back_populates="assignee",
        cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", 
        back_populates="user",
        cascade="all, delete-orphan"
    )

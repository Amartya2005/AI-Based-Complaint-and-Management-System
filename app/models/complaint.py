import enum
from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, ForeignKey, Enum, Integer, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ComplaintCategory(str, enum.Enum):
    HOSTEL = "HOSTEL"
    ADMINISTRATIVE = "ADMINISTRATIVE"
    ACADEMIC = "ACADEMIC"


class ComplaintStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class PriorityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"  # 80-100
    HIGH = "HIGH"          # 60-79
    MEDIUM = "MEDIUM"      # 40-59
    LOW = "LOW"            # 0-39


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), nullable=False)
    status = Column(
        Enum(ComplaintStatus), nullable=False, default=ComplaintStatus.PENDING
    )
    student_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=True)
    
    # Priority System Fields
    priority_score = Column(Integer, default=0, nullable=False)
    severity_score = Column(Float, default=0.0, nullable=False)
    impact_score = Column(Integer, default=15, nullable=False)
    aging_score = Column(Integer, default=0, nullable=False)
    priority_level = Column(
        Enum(PriorityLevel), nullable=False, default=PriorityLevel.LOW
    )
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    student = relationship(
        "User", foreign_keys=[student_id], back_populates="submitted_complaints"
    )
    assignee = relationship(
        "User", foreign_keys=[assigned_to], back_populates="assigned_complaints"
    )
    department = relationship("Department", foreign_keys=[department_id])
    status_history = relationship(
        "ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan"
    )
    ml_predictions = relationship(
        "MLPrediction", back_populates="complaint", cascade="all, delete-orphan"
    )
    attachments = relationship(
        "Attachment", back_populates="complaint", cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", back_populates="complaint", cascade="all, delete-orphan"
    )

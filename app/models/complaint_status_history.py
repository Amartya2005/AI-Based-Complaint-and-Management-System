from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.complaint import ComplaintStatus


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    complaint_id = Column(BigInteger, ForeignKey("complaints.id"), nullable=False)
    changed_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    old_status = Column(Enum(ComplaintStatus), nullable=True)
    new_status = Column(Enum(ComplaintStatus), nullable=False)
    remarks = Column(Text, nullable=True)
    changed_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    complaint = relationship("Complaint", back_populates="status_history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])

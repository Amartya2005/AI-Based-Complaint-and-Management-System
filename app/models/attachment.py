from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    complaint_id = Column(BigInteger, ForeignKey("complaints.id"), nullable=False)
    file_url = Column(String(1000), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    complaint = relationship("Complaint", back_populates="attachments")

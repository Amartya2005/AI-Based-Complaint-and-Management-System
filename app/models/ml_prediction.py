from sqlalchemy import Column, BigInteger, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    complaint_id = Column(BigInteger, ForeignKey("complaints.id"), nullable=False)
    predicted_category = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    complaint = relationship("Complaint", back_populates="ml_predictions")

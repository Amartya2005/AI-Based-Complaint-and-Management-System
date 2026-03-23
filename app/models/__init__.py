# models package — import all models here so SQLAlchemy registers them
from app.models.department import Department
from app.models.user import User
from app.models.complaint import Complaint
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.ml_prediction import MLPrediction
from app.models.attachment import Attachment
from app.models.notification import Notification
from app.models.staff_rating import StaffRating, StaffRatingSummary

__all__ = [
    "Department",
    "User",
    "Complaint",
    "ComplaintStatusHistory",
    "MLPrediction",
    "Attachment",
    "Notification",
    "StaffRating",
    "StaffRatingSummary",
]

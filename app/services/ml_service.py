from sqlalchemy.orm import Session
from app.models.ml_prediction import MLPrediction


def log_ml_prediction(
    db: Session,
    complaint_id: int,
    predicted_category: str,
    confidence_score: float,
) -> MLPrediction:
    """
    Log an ML model's prediction result for a complaint.
    Does NOT run any ML logic — purely a persistence helper.
    Call this from your ML integration layer after inference.
    """
    prediction = MLPrediction(
        complaint_id=complaint_id,
        predicted_category=predicted_category,
        confidence_score=confidence_score,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction

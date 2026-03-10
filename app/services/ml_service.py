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


def calculate_severity_score(predicted_category: str, confidence: float) -> float:
    """
    Calculate severity score (0-50) based on category and model confidence.
    """
    # Base severity by category
    category_weights = {
        'ACADEMIC': 40,      # High priority
        'HOSTEL': 35,        # Medium-high priority
        'ADMINISTRATIVE': 30 # Medium priority
    }
    
    base_score = category_weights.get(predicted_category, 30)
    # Adjust by confidence (assuming confidence 0.0-1.0 range)
    severity = base_score * (0.5 + (confidence * 0.5))
    return min(severity, 50.0)  # Cap at 50


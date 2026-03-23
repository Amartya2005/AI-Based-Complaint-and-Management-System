# Production-Ready AI-Powered College Complaint Management System
## Implementation Guide

This document provides **direct production-level recommendations** for implementing the enhanced CCMS features.

---

## 1. Priority Recalculation System

### Architecture Decision
Implement a **background scheduler using APScheduler** integrated with FastAPI's lifespan events.

### Implementation Strategy

#### Database Schema Enhancement
Add priority fields to the `Complaint` model:
- `priority_score` (Integer, 0-100)
- `severity_score` (Float, 0-50) - from ML model
- `impact_score` (Integer, 0-30) - manual or derived
- `aging_score` (Integer, 0-20) - calculated from time elapsed
- `priority_level` (Enum: CRITICAL, HIGH, MEDIUM, LOW)

#### Background Job Configuration
- **Scheduler**: APScheduler with AsyncIOScheduler
- **Frequency**: Every 1 hour (configurable via environment variable)
- **Job Logic**:
  1. Query all unresolved complaints (status != RESOLVED, REJECTED)
  2. Calculate aging score based on time elapsed
  3. Recalculate total priority score
  4. Update priority level based on thresholds
  5. Send notifications for escalations to CRITICAL

#### Escalation Policy
```python
def calculate_aging_score(created_at: datetime) -> int:
    hours_elapsed = (datetime.utcnow() - created_at).total_seconds() / 3600
    
    if hours_elapsed >= 72:  # 3 days
        return 20  # Max aging score - auto-escalate to CRITICAL
    elif hours_elapsed >= 48:  # 2 days
        return 15
    elif hours_elapsed >= 24:  # 1 day
        return 10
    else:
        return int(hours_elapsed / 3)  # Gradual increase
```

#### Priority Score Formula
```
Priority Score = Severity Score (0-50) + Impact Score (0-30) + Aging Score (0-20)
```

---

## 2. Machine Learning Model

### Architecture Decision
Use **scikit-learn with TF-IDF vectorization and Logistic Regression** for production deployment.

### Implementation Strategy

#### Model Pipeline
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

# Training pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words='english',
        min_df=2
    )),
    ('classifier', LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    ))
])
```

#### Model Outputs
1. **Category Prediction**: HOSTEL, ADMINISTRATIVE, ACADEMIC
2. **Severity Score**: 0-50 (derived from prediction confidence and category weights)

#### Severity Calculation
```python
def calculate_severity_score(predicted_category: str, confidence: float) -> float:
    # Base severity by category
    category_weights = {
        'ACADEMIC': 40,      # High priority
        'HOSTEL': 35,        # Medium-high priority
        'ADMINISTRATIVE': 30 # Medium priority
    }
    
    base_score = category_weights.get(predicted_category, 30)
    # Adjust by confidence (0.5-1.0 range)
    severity = base_score * (0.5 + (confidence * 0.5))
    return min(severity, 50)  # Cap at 50
```

#### Model Storage
- **Location**: `app/ml_models/complaint_classifier.pkl`
- **Versioning**: Include timestamp in filename for model versioning
- **Fallback**: Keep keyword-based classifier as fallback if model fails

#### Training Data Requirements
- Minimum 100 labeled complaints per category
- Regular retraining schedule (monthly or when 500+ new complaints)
- Training script: `app/ml_models/train_model.py`

---

## 3. UI Sorting Behavior

### Architecture Decision
**Default sort by priority_score descending** on staff dashboard with optional secondary sorts.

### Implementation Strategy

#### Backend API Enhancement
Update `get_complaints()` to accept query parameters:
```python
@router.get("/", response_model=List[ComplaintOut])
def list_complaints(
    sort_by: str = "priority",  # priority, date_new, date_old, category
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaints = get_complaints(db, current_user)
    
    # Default: priority descending
    if sort_by == "priority":
        return sorted(complaints, key=lambda x: x.priority_score, reverse=True)
    elif sort_by == "date_new":
        return sorted(complaints, key=lambda x: x.created_at, reverse=True)
    elif sort_by == "date_old":
        return sorted(complaints, key=lambda x: x.created_at)
    elif sort_by == "category":
        return sorted(complaints, key=lambda x: x.category)
    
    return complaints
```

#### Frontend Implementation
- **Default View**: Priority-sorted (Critical → High → Medium → Low)
- **Visual Indicators**: 
  - Critical: Red badge with pulsing animation
  - High: Orange badge
  - Medium: Yellow badge
  - Low: Gray badge
- **Sort Dropdown**: Allow users to change sort order
- **Persist Preference**: Store sort preference in localStorage

#### Priority Badge Component
```jsx
const PriorityBadge = ({ level, score }) => {
    const styles = {
        CRITICAL: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
        HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
        MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        LOW: 'bg-gray-100 text-gray-600 border-gray-300'
    };
    
    return (
        <span className={`px-2 py-1 rounded border ${styles[level]}`}>
            {level} ({score})
        </span>
    );
};
```

---

## 4. Priority Thresholds

### Architecture Decision
**Fixed thresholds with enum-based priority levels** for consistency across the system.

### Implementation Strategy

#### Priority Level Enum
```python
class PriorityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"  # 80-100
    HIGH = "HIGH"          # 60-79
    MEDIUM = "MEDIUM"      # 40-59
    LOW = "LOW"            # 0-39
```

#### Threshold Function
```python
def calculate_priority_level(priority_score: int) -> PriorityLevel:
    """Convert priority score to priority level."""
    if priority_score >= 80:
        return PriorityLevel.CRITICAL
    elif priority_score >= 60:
        return PriorityLevel.HIGH
    elif priority_score >= 40:
        return PriorityLevel.MEDIUM
    else:
        return PriorityLevel.LOW
```

#### Impact Score Calculation
```python
def calculate_impact_score(complaint: Complaint, db: Session) -> int:
    """
    Calculate impact score based on:
    - Number of similar complaints in last 30 days
    - Department-wide issue indicator
    - Manual override by admin
    """
    # Default impact
    base_impact = 15
    
    # Check for similar complaints (same category + department)
    similar_count = db.query(Complaint).filter(
        Complaint.category == complaint.category,
        Complaint.department_id == complaint.department_id,
        Complaint.created_at >= datetime.utcnow() - timedelta(days=30),
        Complaint.status.in_([ComplaintStatus.PENDING, ComplaintStatus.ASSIGNED])
    ).count()
    
    # Scale impact based on similar complaints
    if similar_count >= 10:
        return 30  # Systemic issue
    elif similar_count >= 5:
        return 25
    elif similar_count >= 3:
        return 20
    else:
        return base_impact
```

---

## 5. System Integration Flow

### Complaint Submission Flow
1. Student submits complaint
2. ML model predicts category and calculates severity score (0-50)
3. System calculates initial impact score (0-30)
4. Aging score starts at 0
5. Priority score = severity + impact + aging
6. Priority level determined by threshold
7. Complaint auto-assigned to least-loaded staff
8. Notification sent to assigned staff

### Background Priority Recalculation Flow
1. Scheduler runs every hour
2. Query all unresolved complaints
3. For each complaint:
   - Recalculate aging score based on time elapsed
   - Recalculate impact score (check for similar complaints)
   - Update priority score and level
   - If escalated to CRITICAL, send notification to admin and assigned staff
4. Commit updates to database

### Staff Dashboard Flow
1. Staff logs in
2. Fetch assigned complaints from API (default: priority sort)
3. Display complaints with priority badges
4. Critical complaints appear at top with visual emphasis
5. Staff can filter by category or change sort order
6. Click complaint to view details and update status

---

## 6. Database Migration

### New Columns for Complaint Table
```sql
ALTER TABLE complaints 
ADD COLUMN priority_score INTEGER DEFAULT 0,
ADD COLUMN severity_score FLOAT DEFAULT 0.0,
ADD COLUMN impact_score INTEGER DEFAULT 15,
ADD COLUMN aging_score INTEGER DEFAULT 0,
ADD COLUMN priority_level VARCHAR(20) DEFAULT 'LOW';
```

### Index Creation for Performance
```sql
CREATE INDEX idx_complaints_priority ON complaints(priority_score DESC);
CREATE INDEX idx_complaints_status_priority ON complaints(status, priority_score DESC);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
```

---

## 7. Configuration

### Environment Variables
```env
# ML Model Configuration
ML_MODEL_PATH=app/ml_models/complaint_classifier.pkl
ML_FALLBACK_ENABLED=true

# Priority Scheduler Configuration
PRIORITY_RECALC_INTERVAL_HOURS=1
CRITICAL_ESCALATION_HOURS=72
HIGH_ESCALATION_HOURS=48
MEDIUM_ESCALATION_HOURS=24

# Priority Thresholds
PRIORITY_CRITICAL_THRESHOLD=80
PRIORITY_HIGH_THRESHOLD=60
PRIORITY_MEDIUM_THRESHOLD=40
```

---

## 8. Deployment Checklist

### Backend
- [ ] Install scikit-learn and APScheduler dependencies
- [ ] Run database migration to add priority columns
- [ ] Train initial ML model with existing complaint data
- [ ] Deploy ML model file to production server
- [ ] Configure environment variables
- [ ] Start FastAPI with scheduler enabled
- [ ] Verify scheduler is running (check logs)

### Frontend
- [ ] Update complaint schema to include priority fields
- [ ] Implement PriorityBadge component
- [ ] Update StaffDashboard with priority sorting
- [ ] Add sort dropdown with options
- [ ] Test priority display and sorting
- [ ] Deploy frontend build

### Testing
- [ ] Test ML model predictions
- [ ] Test priority calculation logic
- [ ] Test background scheduler execution
- [ ] Test priority escalation notifications
- [ ] Test UI sorting and filtering
- [ ] Load test with 1000+ complaints

---

## 9. Monitoring and Maintenance

### Metrics to Track
- Average priority score by category
- Number of complaints escalated to CRITICAL
- Time to resolution by priority level
- ML model accuracy (compare predictions vs actual categories)
- Scheduler execution time and failures

### Maintenance Tasks
- **Weekly**: Review CRITICAL complaints and escalation patterns
- **Monthly**: Retrain ML model with new complaint data
- **Quarterly**: Review and adjust priority thresholds if needed
- **Annually**: Comprehensive system audit and optimization

---

## 10. Production-Ready Best Practices

### Error Handling
- ML model failures should fallback to keyword-based classifier
- Scheduler failures should log errors and retry
- Database connection issues should not crash the scheduler

### Performance Optimization
- Use database indexes for priority sorting
- Cache ML model in memory (don't reload on each prediction)
- Batch process priority recalculations (100 complaints at a time)
- Use async operations for notifications

### Security
- Validate all priority score inputs (prevent manipulation)
- Audit log all priority escalations
- Restrict manual priority override to ADMIN role only

### Scalability
- Scheduler should handle 10,000+ complaints efficiently
- ML model inference should complete in <100ms
- API response time for sorted complaints should be <500ms
- Consider Redis caching for frequently accessed data

---

## Summary

This implementation provides a **production-ready, scalable, and maintainable** College Complaint Management System with:

1. ✅ Automatic priority escalation for aging complaints
2. ✅ ML-powered classification with TF-IDF + Logistic Regression
3. ✅ Priority-first UI sorting with visual indicators
4. ✅ Clear priority thresholds and scoring system
5. ✅ Background job scheduler for automated recalculation
6. ✅ Comprehensive monitoring and maintenance plan

The system is built with **React, FastAPI, Supabase (PostgreSQL), and scikit-learn** as specified, following industry best practices for production deployment.

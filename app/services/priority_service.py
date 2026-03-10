"""
Priority calculation and recalculation service for complaints.
Handles aging score, impact score, and priority level determination.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.complaint import Complaint, ComplaintStatus, PriorityLevel
from app.services.notification_service import create_notification
from app.models.user import UserRole
import logging

logger = logging.getLogger(__name__)


def calculate_aging_score(created_at: datetime) -> int:
    """
    Calculate aging score based on time elapsed since complaint creation.
    
    Returns:
        int: Aging score (0-20)
    """
    hours_elapsed = (datetime.utcnow() - created_at).total_seconds() / 3600
    
    if hours_elapsed >= 72:  # 3 days
        return 20  # Max aging score - auto-escalate to CRITICAL
    elif hours_elapsed >= 48:  # 2 days
        return 15
    elif hours_elapsed >= 24:  # 1 day
        return 10
    else:
        return int(hours_elapsed / 3)  # Gradual increase


def calculate_impact_score(complaint: Complaint, db: Session) -> int:
    """
    Calculate impact score based on:
    - Number of similar complaints in last 30 days
    - Department-wide issue indicator
    
    Returns:
        int: Impact score (0-30)
    """
    # Default impact
    base_impact = 15
    
    # Check for similar complaints (same category + department)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    similar_count = db.query(Complaint).filter(
        and_(
            Complaint.category == complaint.category,
            Complaint.department_id == complaint.department_id,
            Complaint.created_at >= thirty_days_ago,
            Complaint.status.in_([
                ComplaintStatus.PENDING,
                ComplaintStatus.ASSIGNED,
                ComplaintStatus.IN_PROGRESS
            ])
        )
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


def calculate_priority_level(priority_score: int) -> PriorityLevel:
    """
    Convert priority score to priority level based on thresholds.
    
    Thresholds:
    - 80-100: CRITICAL
    - 60-79: HIGH
    - 40-59: MEDIUM
    - 0-39: LOW
    
    Returns:
        PriorityLevel: The priority level enum
    """
    if priority_score >= 80:
        return PriorityLevel.CRITICAL
    elif priority_score >= 60:
        return PriorityLevel.HIGH
    elif priority_score >= 40:
        return PriorityLevel.MEDIUM
    else:
        return PriorityLevel.LOW


def calculate_priority_score(
    severity_score: float,
    impact_score: int,
    aging_score: int
) -> int:
    """
    Calculate total priority score.
    
    Formula: Priority Score = Severity (0-50) + Impact (0-30) + Aging (0-20)
    
    Returns:
        int: Total priority score (0-100)
    """
    total = int(severity_score + impact_score + aging_score)
    return min(max(total, 0), 100)  # Clamp between 0-100


def update_complaint_priority(complaint: Complaint, db: Session) -> bool:
    """
    Recalculate and update priority for a single complaint.
    
    Returns:
        bool: True if priority level changed (escalated), False otherwise
    """
    old_priority_level = complaint.priority_level
    
    # Recalculate scores
    complaint.aging_score = calculate_aging_score(complaint.created_at)
    complaint.impact_score = calculate_impact_score(complaint, db)
    
    # Recalculate total priority score
    complaint.priority_score = calculate_priority_score(
        complaint.severity_score,
        complaint.impact_score,
        complaint.aging_score
    )
    
    # Update priority level
    complaint.priority_level = calculate_priority_level(complaint.priority_score)
    
    # Check if escalated
    priority_order = {
        PriorityLevel.LOW: 0,
        PriorityLevel.MEDIUM: 1,
        PriorityLevel.HIGH: 2,
        PriorityLevel.CRITICAL: 3
    }
    
    escalated = priority_order[complaint.priority_level] > priority_order[old_priority_level]
    
    return escalated


def recalculate_all_priorities(db: Session) -> dict:
    """
    Background job to recalculate priorities for all unresolved complaints.
    
    Returns:
        dict: Statistics about the recalculation
    """
    logger.info("Starting priority recalculation job...")
    
    # Query all unresolved complaints
    unresolved_complaints = db.query(Complaint).filter(
        Complaint.status.in_([
            ComplaintStatus.PENDING,
            ComplaintStatus.ASSIGNED,
            ComplaintStatus.IN_PROGRESS
        ])
    ).all()
    
    total_processed = 0
    escalated_count = 0
    critical_escalations = []
    
    for complaint in unresolved_complaints:
        old_level = complaint.priority_level
        escalated = update_complaint_priority(complaint, db)
        
        total_processed += 1
        
        if escalated:
            escalated_count += 1
            
            # If escalated to CRITICAL, notify admin and assigned staff
            if complaint.priority_level == PriorityLevel.CRITICAL:
                critical_escalations.append(complaint.id)
                
                # Notify assigned staff
                if complaint.assigned_to:
                    create_notification(
                        db=db,
                        user_id=complaint.assigned_to,
                        complaint_id=complaint.id,
                        message=f"🚨 CRITICAL: Complaint #{complaint.id} has been escalated to CRITICAL priority (aging: {complaint.aging_score}/20)"
                    )
                
                # Notify all admins
                from app.models.user import User
                admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
                for admin in admins:
                    create_notification(
                        db=db,
                        user_id=admin.id,
                        complaint_id=complaint.id,
                        message=f"🚨 CRITICAL ESCALATION: Complaint #{complaint.id} - '{complaint.title}' requires immediate attention"
                    )
                
                logger.warning(
                    f"Complaint #{complaint.id} escalated to CRITICAL "
                    f"(was {old_level.value}, score: {complaint.priority_score})"
                )
    
    # Commit all changes
    db.commit()
    
    stats = {
        "total_processed": total_processed,
        "escalated_count": escalated_count,
        "critical_escalations": critical_escalations,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    logger.info(
        f"Priority recalculation completed: {total_processed} complaints processed, "
        f"{escalated_count} escalated, {len(critical_escalations)} now CRITICAL"
    )
    
    return stats


def initialize_complaint_priority(
    complaint: Complaint,
    severity_score: float,
    db: Session
) -> None:
    """
    Initialize priority scores for a newly created complaint.
    
    Args:
        complaint: The complaint object
        severity_score: ML-predicted severity score (0-50)
        db: Database session
    """
    complaint.severity_score = severity_score
    complaint.aging_score = 0  # New complaint
    complaint.impact_score = calculate_impact_score(complaint, db)
    complaint.priority_score = calculate_priority_score(
        complaint.severity_score,
        complaint.impact_score,
        complaint.aging_score
    )
    complaint.priority_level = calculate_priority_level(complaint.priority_score)

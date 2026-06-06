"""
APScheduler jobs for CCMS, including weekly ML retrain.

Scheduler start is guarded against uvicorn --reload (which spawns two processes).
Only the actual worker process (where RUN_MAIN=true) will register/start jobs.
For production use without --reload (recommended), the guard has no effect.
Alternative (more robust for multi-process): configure APScheduler with RedisJobStore.
"""
import logging
import os
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.ml.trainer import train as train_model

logger = logging.getLogger(__name__)


def retrain_model_if_sufficient() -> dict:
    """Weekly job: retrain the department classifier if >=50 complaints with dept.
    Called by APScheduler.
    """
    db: Session = SessionLocal()
    try:
        # Count complaints with dept assigned
        from app.models.complaint import Complaint
        count = db.query(Complaint).filter(Complaint.department_id.isnot(None)).count()
        if count >= 50:
            logger.info("Weekly ML retrain: sufficient data (%s), starting train", count)
            result = train_model(db)
            logger.info("Weekly ML retrain result: %s", result)
            return result
        else:
            logger.info("Weekly ML retrain skipped: only %s samples with department", count)
            return {"status": "skipped", "count": count, "reason": "insufficient_data"}
    except Exception as exc:
        logger.error("Weekly ML retrain failed", exc_info=exc)
        return {"status": "error", "error": str(exc)}
    finally:
        db.close()


def start_scheduler(scheduler: BackgroundScheduler) -> None:
    """Register the weekly Sunday 2am ML retrain job.

    Guard: under `uvicorn --reload` the reloader parent process has RUN_MAIN unset
    (or different); we only start the real background scheduler in the worker
    (RUN_MAIN=true). This prevents duplicate job registration / double execution.
    """
    if os.environ.get("RUN_MAIN") != "true":
        logger.info("Skipping ML retrain scheduler registration (uvicorn reloader parent or RUN_MAIN != true)")
        return

    scheduler.add_job(
        retrain_model_if_sufficient,
        "cron",
        day_of_week="sun",
        hour=2,
        minute=0,
        id="weekly_ml_retrain",
        replace_existing=True,
    )
    logger.info("Registered weekly ML retrain job (Sundays 02:00)")

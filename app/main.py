import json
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from alembic.config import Config as AlembicConfig
from alembic.script import ScriptDirectory
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.redis_client import close_redis, init_redis  # canonical Redis client (see app/core/redis_client.py)
from app.core.connection_manager import manager
from app.core.scheduler import start_scheduler
from app.config import get_settings
from app.database import SessionLocal
from app.exceptions import AppException
from app.auth.jwt_handler import decode_token, is_token_blacklisted
from app.ml.predictor import get_predictor
from app.rate_limiter import limiter
from app.routers import (
    admin_ml,
    auth,
    complaints,
    departments,
    notifications,
    ratings,
    users,
)
# Admin departments router (separate mount for /admin/departments)
from app.routers.departments import admin_router as admin_departments_router
from app.schemas.errors import ErrorDetail, ErrorResponse
from app.services.priority_service import recalculate_all_priorities


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        if isinstance(record.msg, dict):
            payload = dict(record.msg)
        else:
            payload = {"message": record.getMessage()}

        payload.setdefault("timestamp", _utc_timestamp())
        payload.setdefault("level", record.levelname)
        payload.setdefault("logger", record.name)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def configure_logging() -> None:
    root_logger = logging.getLogger()
    if getattr(configure_logging, "_configured", False):
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    configure_logging._configured = True


def _error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorDetail(
            code=code,
            message=message,
            status=status_code,
            path=request.url.path,
            timestamp=_utc_timestamp(),
        )
    )
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json"),
    )


def _http_error_code(status_code: int) -> str:
    return {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
    }.get(status_code, "HTTP_ERROR")


def _build_allowed_origins() -> list[str]:
    settings = get_settings()
    origins = list(dict.fromkeys(settings.ALLOWED_ORIGINS))
    if settings.APP_ENV == "development":
        for origin in [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            # WS endpoints for real-time notifications (browser connects from these origins)
            "ws://localhost:8000",
            "ws://127.0.0.1:8000",
            "wss://localhost:8000",
            "wss://127.0.0.1:8000",
        ]:
            if origin not in origins:
                origins.append(origin)
    return origins


configure_logging()
logger = logging.getLogger(__name__)


def priority_job():
    logger.info({"message": "Running scheduled priority recalculation..."})
    db = SessionLocal()
    try:
        recalculate_all_priorities(db)
    except Exception:
        logger.exception({"message": "Error recalculating priorities"})
    finally:
        db.close()


def log_migration_status() -> None:
    alembic_config = AlembicConfig("alembic.ini")
    script = ScriptDirectory.from_config(alembic_config)
    head_revision = script.get_current_head()

    db = SessionLocal()
    try:
        current_revision = db.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalar()
        if not current_revision:
            logger.warning(
                {
                    "message": "No migrations applied. Run `alembic upgrade head` to initialize the schema.",
                    "head": head_revision,
                }
            )
        elif current_revision != head_revision:
            logger.warning(
                {
                    "message": (
                        "Database migration is not at head. "
                        f"Current: {current_revision}. Head: {head_revision}. "
                        "Run `alembic upgrade head` before deploying."
                    )
                }
            )
    except Exception:
        logger.warning(
            {
                "message": "No migrations applied. Run `alembic upgrade head` to initialize the schema."
            }
        )
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.APP_ENV == "production" and "*" in settings.ALLOWED_ORIGINS:
        raise RuntimeError("Wildcard CORS origins are not allowed in production")

    log_migration_status()
    await init_redis()
    if get_predictor().load():
        logger.info("ML model loaded")
    else:
        logger.warning("ML model not available")

    # Scheduler guard for uvicorn --reload (see app/core/scheduler.py for details).
    # Only start real background work in the actual worker process.
    if os.environ.get("RUN_MAIN") != "true":
        logger.info({"message": "Skipping background schedulers in uvicorn reloader parent (RUN_MAIN != true)"})
        yield
        await close_redis()
        return

    scheduler = BackgroundScheduler()
    scheduler.add_job(priority_job, "interval", hours=1)
    start_scheduler(scheduler)  # adds weekly ML retrain job (also guarded internally)
    scheduler.start()
    logger.info({"message": "Scheduler started."})
    yield
    scheduler.shutdown()
    await close_redis()
    logger.info({"message": "Scheduler shut down."})


app = FastAPI(
    title="College Complaint Management System",
    description=(
        "Production-ready REST API for managing college complaints. "
        "Supports STUDENT, STAFF, and ADMIN roles with JWT authentication."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
app.state.limiter = limiter


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            {
                "method": request.method,
                "path": request.url.path,
                "status": 500,
                "duration_ms": duration_ms,
                "user_agent": request.headers.get("user-agent", ""),
                "ip": request.client.host if request.client else "",
            }
        )
        raise

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    payload = {
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration_ms": duration_ms,
        "user_agent": request.headers.get("user-agent", ""),
        "ip": request.client.host if request.client else "",
    }

    if response.status_code >= 500:
        logger.error(payload)
    elif response.status_code >= 400:
        logger.warning(payload)
    else:
        logger.info(payload)

    return response


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    if exc.status_code >= 500:
        logger.error(
            {
                "message": "Application exception",
                "code": exc.code,
                "path": request.url.path,
                "status": exc.status_code,
                "detail": exc.internal_detail,
            }
        )
    return _error_response(request, exc.status_code, exc.code, exc.message)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    first_error = exc.errors()[0] if exc.errors() else {}
    message = first_error.get("msg", "Invalid request")
    return _error_response(request, 422, "VALIDATION_ERROR", message)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(
        {
            "message": "Database error",
            "path": request.url.path,
            "detail": str(exc),
        }
    )
    return _error_response(request, 500, "DATABASE_ERROR", "A database error occurred")


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(
        {
            "message": "Rate limit exceeded",
            "path": request.url.path,
            "detail": str(exc),
        }
    )
    return _error_response(
        request,
        429,
        "RATE_LIMIT_EXCEEDED",
        "Too many requests. Please slow down.",
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return _error_response(
        request,
        exc.status_code,
        _http_error_code(exc.status_code),
        message,
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(
        {
            "message": "Unhandled exception",
            "path": request.url.path,
        },
        exc_info=exc,
    )
    return _error_response(
        request,
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred",
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(SlowAPIMiddleware)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(complaints.router)
app.include_router(notifications.router)
app.include_router(departments.router)
app.include_router(ratings.router)
app.include_router(admin_ml.router)
app.include_router(admin_departments_router)


@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket, token: str = Query(..., description="JWT access token")):
    """
    WebSocket endpoint for real-time notifications.
    Connect with: ws://localhost:8000/ws/notifications?token=<jwt>
    On valid connect, client receives {"type": "notification", "data": <notification>}
    """
    try:
        # Validate token using same logic as HTTP (decode + blacklist check)
        if not token:
            await websocket.close(code=1008, reason="Missing token")
            return

        try:
            payload = decode_token(token)
        except Exception:
            await websocket.close(code=1008, reason="Invalid token")
            return

        jti = payload.get("jti")
        if jti and is_token_blacklisted(jti):
            await websocket.close(code=1008, reason="Token revoked")
            return

        user_id = int(payload.get("sub"))
        await manager.connect(websocket, user_id)

        try:
            # Keep connection alive; client may send pings or we just wait for disconnect
            while True:
                # Optionally receive messages (e.g. for client pings/acks)
                try:
                    await websocket.receive_text()
                except Exception:
                    # If receive fails, break to disconnect
                    break
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(user_id)
    except Exception as exc:
        logger.exception("WS notifications error: %s", exc)
        try:
            await websocket.close(code=1011, reason="Internal error")
        except Exception:
            pass


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "College Complaint Management System"}

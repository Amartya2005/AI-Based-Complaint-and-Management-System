import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.routers import auth, users, complaints, notifications, departments
from app.database import SessionLocal
from app.services.priority_service import recalculate_all_priorities

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def priority_job():
    logger.info("Running scheduled priority recalculation...")
    db = SessionLocal()
    try:
        recalculate_all_priorities(db)
    except Exception as e:
        logger.error(f"Error recalculating priorities: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    # Run the priority job every hour. Adjust as needed.
    scheduler.add_job(priority_job, "interval", hours=1)
    scheduler.start()
    logger.info("Scheduler started.")
    yield
    scheduler.shutdown()
    logger.info("Scheduler shut down.")

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

# ─── CORS ─────────────────────────────────────────────────────────────────────
# NOTE: allow_origins=["*"] cannot be combined with allow_credentials=True
# (invalid per CORS spec — browsers reject credentialed requests with wildcard).
# List all dev/prod origins explicitly instead.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # alt dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API Routers ──────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(complaints.router)
app.include_router(notifications.router)
app.include_router(departments.router)

# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "College Complaint Management System"}

# ─── Frontend Static Files ────────────────────────────────────────────────────
# NOTE: In development, Vite's dev server (port 5173) proxies all /auth, /users,
# /complaints, /notifications, /api routes to FastAPI (port 8000).
# For production, build the frontend with `npm run build` inside `client/`,
# then serve the resulting `client/dist` directory via a reverse proxy (nginx, etc.).

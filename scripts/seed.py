"""
Seed Script — creates an initial ADMIN user in the database.
Run once before first login:
    python scripts/seed.py

You can change the credentials below before running.
"""
import sys
import os

# Make sure the app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.auth.password import hash_password

# ── Credentials for the initial admin ─────────────────────────────────────────
ADMIN = {
    "college_id": "ADMIN001",
    "name":       "System Admin",
    "email":      "admin@college.edu",
    "password":   "Admin@1234",
    "role":       UserRole.ADMIN,
}

def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN["email"]).first()
        if existing:
            print(f"[seed] Admin already exists: {ADMIN['email']}")
            return

        user = User(
            college_id=ADMIN["college_id"],
            name=ADMIN["name"],
            email=ADMIN["email"],
            password_hash=hash_password(ADMIN["password"]),
            role=ADMIN["role"],
            is_active=True,
        )
        db.add(user)
        db.commit()
        print("------------------------------------------")
        print("[seed] Admin user created successfully!")
        print(f"       Email   : {ADMIN['email']}")
        print(f"       Password: {ADMIN['password']}")
        print("------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"[seed] ERROR: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()

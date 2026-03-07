"""
create_tables.py  -- idempotent schema bootstrap
Run once (or safely multiple times):
    python create_tables.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pymysql
from app.config import get_settings

settings = get_settings()

def ensure_database():
    url = settings.DATABASE_URL
    rest = url.replace("mysql+pymysql://", "")
    userpass, hostpath = rest.split("@", 1)
    user, password = userpass.split(":", 1)
    password = password.replace("%40", "@")
    hostport, dbname = hostpath.split("/", 1)
    host, port = (hostport.split(":") + ["3306"])[:2]

    conn = pymysql.connect(host=host, port=int(port), user=user, password=password)
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.commit()
    cursor.close()
    conn.close()
    print(f"[OK] Database '{dbname}' is ready.")

def create_tables():
    from app.database import engine, Base
    import app.models  # registers all ORM models

    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("[OK] All tables created (or already exist):")
    for table in Base.metadata.sorted_tables:
        print(f"     - {table.name}")

if __name__ == "__main__":
    print("=" * 50)
    print("  Database Bootstrap")
    print("=" * 50)
    ensure_database()
    create_tables()
    print()
    print("Done! Run 'python seed.py' next to create the admin account.")

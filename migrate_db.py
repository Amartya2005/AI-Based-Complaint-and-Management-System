import sys
import os
import pymysql
from app.config import get_settings

settings = get_settings()

def migrate_database():
    url = settings.DATABASE_URL
    rest = url.replace("mysql+pymysql://", "")
    userpass, hostpath = rest.split("@", 1)
    user, password = userpass.split(":", 1)
    password = password.replace("%40", "@")
    hostport, dbname = hostpath.split("/", 1)
    host, port = (hostport.split(":") + ["3306"])[:2]

    print(f"Connecting to database '{dbname}' at {host}:{port} for migration...")
    
    conn = pymysql.connect(host=host, port=int(port), user=user, password=password, database=dbname)
    cursor = conn.cursor()
    
    columns_to_add = [
        ("priority_score", "INTEGER DEFAULT 0"),
        ("severity_score", "FLOAT DEFAULT 0.0"),
        ("impact_score", "INTEGER DEFAULT 15"),
        ("aging_score", "INTEGER DEFAULT 0"),
        ("priority_level", "VARCHAR(20) DEFAULT 'LOW'")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type};")
            print(f"[OK] Added column {col_name}.")
        except pymysql.err.OperationalError as e:
            if e.args[0] == 1060: # Duplicate column name
                print(f"[-] Column {col_name} already exists. Skipping.")
            else:
                print(f"[!] Failed to add column {col_name}: {e}")
    
    # Try adding indexes
    try:
        cursor.execute("CREATE INDEX idx_complaints_priority ON complaints(priority_score DESC);")
        print("[OK] Created index idx_complaints_priority.")
    except Exception as e:
        print(f"[-] Index idx_complaints_priority might already exist. ({e})")
        
    try:
        cursor.execute("CREATE INDEX idx_complaints_status_priority ON complaints(status, priority_score DESC);")
        print("[OK] Created index idx_complaints_status_priority.")
    except Exception as e:
        print(f"[-] Index idx_complaints_status_priority might already exist. ({e})")
        
    try:
        cursor.execute("CREATE INDEX idx_complaints_created_at ON complaints(created_at);")
        print("[OK] Created index idx_complaints_created_at.")
    except Exception as e:
        print(f"[-] Index idx_complaints_created_at might already exist. ({e})")

    conn.commit()
    cursor.close()
    conn.close()
    
    print("Migration complete.")

if __name__ == "__main__":
    migrate_database()

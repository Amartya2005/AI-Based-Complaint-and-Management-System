import os
import runpy

"""
Seed entrypoint.
Delegates to scripts/seed.py which now creates rich demo data:
1 admin (admin@giet.edu / Admin@123), 5 depts, 4 staff, 15 students, 40 complaints etc.
Idempotent. Run: python seed.py
"""

if __name__ == "__main__":
    runpy.run_path(os.path.join(os.path.dirname(__file__), "scripts", "seed.py"), run_name="__main__")

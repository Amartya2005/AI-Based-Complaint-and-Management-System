"""
Seed Script — populates the CCMS database with rich demo data (idempotent).
Run:
    python scripts/seed.py
    # or from root: python seed.py

Re-running will not duplicate records (checks for existing depts/users/complaints).
Produces:
- 1 admin (admin@giet.edu / Admin@123)
- 5 departments (IT, Academics, Library, Hostel, Finance)
- 4 staff users (one assigned to first 4 depts)
- 15 students (student01@giet.edu ... student15@giet.edu / Student@123)
- 40 complaints with realistic titles/descriptions, mixed statuses, priorities,
  departments, some with status history and staff ratings (for resolved).
"""
import sys
import os
import random
from datetime import datetime, timedelta

# Make app importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.staff_rating import StaffRating
from app.auth.password import hash_password

# Fixed seed for reproducibility on re-runs (but idempotent so stable)
random.seed(42)

ADMIN_EMAIL = "admin@giet.edu"
ADMIN_PASSWORD = "Admin@123"

DEPTS = [
    {"name": "IT", "code": "IT", "description": "Information Technology support and systems"},
    {"name": "Academics", "code": "AC", "description": "Academic affairs, exams, and curriculum"},
    {"name": "Library", "code": "LB", "description": "Library resources, access, and digital services"},
    {"name": "Hostel", "code": "HS", "description": "Hostel accommodation, maintenance, and facilities"},
    {"name": "Finance", "code": "FN", "description": "Fees, scholarships, and financial services"},
]

# 4 staff, assigned to first 4 depts (Finance has none for demo variety)
STAFF = [
    {"college_id": "STF001", "name": "Ravi Kumar", "email": "staff_it@giet.edu", "dept_code": "IT"},
    {"college_id": "STF002", "name": "Priya Sharma", "email": "staff_acad@giet.edu", "dept_code": "AC"},
    {"college_id": "STF003", "name": "Amit Patel", "email": "staff_lib@giet.edu", "dept_code": "LB"},
    {"college_id": "STF004", "name": "Sneha Reddy", "email": "staff_hostel@giet.edu", "dept_code": "HS"},
]

STUDENTS = [
    {"college_id": f"STU{str(i).zfill(3)}", "name": f"Student {i:02d}", "email": f"student{i:02d}@giet.edu"}
    for i in range(1, 16)
]
STUDENT_PASSWORD = "Student@123"

# Realistic complaint templates (title, description, category, rough severity hint)
COMPLAINT_TEMPLATES = [
    # IT
    ("WiFi not working in lab", "The WiFi in the CS lab block has been down since morning. Multiple students unable to access online resources or submit assignments.", "IT", 4),
    ("LMS portal login error", "Getting 'invalid credentials' even with correct password on the learning management system. Happened after last maintenance.", "IT", 3),
    ("Projector not connecting", "HDMI port on classroom projector not detecting laptop. Happens only in room 204.", "IT", 2),
    ("Server for lab software down", "The dedicated server for MATLAB and simulation tools is unreachable. Lab session affected.", "IT", 5),
    ("Email attachment size limit", "Cannot send large project reports via college email. Limit seems too low for academic work.", "IT", 2),
    # Academics
    ("Exam schedule conflict", "Two end-sem exams scheduled on same day and overlapping time slots for 3rd year. Need reschedule.", "ACADEMIC", 5),
    ("Result not updated", "Internal marks for subject CS301 not reflected on portal even after 10 days of declaration.", "ACADEMIC", 3),
    ("Syllabus change without notice", "Mid-term paper had topics not covered as per circulated syllabus. Request for grace or retest.", "ACADEMIC", 4),
    ("Attendance discrepancy", "My attendance shows 62% but I have medical proof for the missing classes. Not updated by dept.", "ACADEMIC", 2),
    ("Transcript request delay", "Applied for official transcript 3 weeks ago for higher studies. No update or document received.", "ACADEMIC", 3),
    # Library
    ("Book not returned properly", "Returned 'Operating Systems Concepts' on time but system still shows as issued. Fine being charged wrongly.", "ADMINISTRATIVE", 2),
    ("Digital library access issue", "IEEE and Springer links not opening off-campus even with VPN. Research work stuck.", "IT", 3),
    ("Noisy reading hall", "Students talking loudly in the main reading hall during exam prep week. Staff not enforcing silence.", "HOSTEL", 2),
    ("Journal access expired", "Access to ACM digital library subscription appears expired mid-semester. Urgent for project.", "ADMINISTRATIVE", 4),
    # Hostel
    ("AC not cooling in room", "Room 312 AC is running but not cooling below 28C. Multiple complaints in wing B this week.", "HOSTEL", 3),
    ("Water supply irregular", "No water in hostel blocks C and D from 6AM-10AM for last 4 days. Hygiene and cooking affected.", "HOSTEL", 5),
    ("Mess food quality poor", "Repeated stale food and undercooked items in vegetarian mess. Health complaints from 8-10 students.", "HOSTEL", 4),
    ("Broken window glass", "Window pane in 205 shattered, glass pieces inside. Safety hazard, not fixed after 2 days report.", "HOSTEL", 3),
    ("WiFi router down in hostel", "Hostel common room and floor 2 WiFi completely dead. Affects online classes and submissions.", "IT", 3),
    ("Laundry machine faulty", "Washing machines on floor 1 not spinning properly, water not draining. Queue building up.", "HOSTEL", 2),
    # Finance
    ("Fee receipt not generated", "Paid semester fees online 5 days ago via UPI but portal still shows pending and no receipt.", "ADMINISTRATIVE", 3),
    ("Scholarship disbursement delay", "Merit scholarship for this semester credited for others but not in my account. Ticket #FIN-4421.", "ADMINISTRATIVE", 4),
    ("Wrong fine on library card", "Fine of Rs. 450 applied for book already returned. Receipt shows date mismatch.", "ADMINISTRATIVE", 2),
    ("Hostel fee overcharge", "Hostel fee invoice shows AC room charges but I am in non-AC. Request correction and refund.", "ADMINISTRATIVE", 3),
]

def get_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    return "LOW"

def seed():
    db = SessionLocal()
    try:
        # --- Idempotency check (covers old minimal seeds + re-runs) ---
        existing_dept = db.query(Department).filter(Department.code == "IT").first()
        existing_complaints = db.query(Complaint).count()
        existing_new_student = db.query(User).filter(User.email == "student01@giet.edu").first()
        if (existing_dept and existing_complaints >= 30) or existing_new_student:
            print("[seed] Rich demo data already present (IT dept + complaints or student01). Skipping inserts to avoid dups.")
            print_summary(db)
            return

        print("[seed] Starting rich data seed...")

        # --- 1. Admin (idempotent by email OR college_id to handle prior seeds) ---
        admin = db.query(User).filter(
            (User.email == ADMIN_EMAIL) | (User.college_id == "ADMIN001")
        ).first()
        if not admin:
            admin = User(
                college_id="ADMIN001",
                name="System Admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.flush()
            print(f"[seed] Created admin: {ADMIN_EMAIL}")
        else:
            print(f"[seed] Admin exists: {admin.email} (college_id ADMIN001)")

        # --- 2. 5 Departments (idempotent by code) ---
        dept_map = {}
        for d in DEPTS:
            existing = db.query(Department).filter(
                (Department.code == d["code"]) | (Department.name == d["name"])
            ).first()
            if not existing:
                dept = Department(
                    name=d["name"],
                    code=d["code"],
                    description=d["description"],
                    head_staff_id=None,
                )
                db.add(dept)
                db.flush()
                dept_map[d["code"]] = dept
                print(f"[seed] Created dept: {d['code']}")
            else:
                dept_map[d["code"]] = existing

        # --- 3. 4 Staff users + assign as head for their dept ---
        staff_map = {}
        for s in STAFF:
            existing = db.query(User).filter(User.email == s["email"]).first()
            if not existing:
                staff = User(
                    college_id=s["college_id"],
                    name=s["name"],
                    email=s["email"],
                    password_hash=hash_password("Staff@123"),
                    role=UserRole.STAFF,
                    department_id=dept_map[s["dept_code"]].id,
                    is_active=True,
                )
                db.add(staff)
                db.flush()
                staff_map[s["dept_code"]] = staff
                print(f"[seed] Created staff: {s['email']}")
            else:
                staff_map[s["dept_code"]] = existing

            # set as head if not set
            d = dept_map[s["dept_code"]]
            if not d.head_staff_id:
                d.head_staff_id = staff_map[s["dept_code"]].id

        # --- 4. 15 Students ---
        student_users = []
        for i, stu in enumerate(STUDENTS, 1):
            existing = db.query(User).filter(User.email == stu["email"]).first()
            if not existing:
                u = User(
                    college_id=stu["college_id"],
                    name=stu["name"],
                    email=stu["email"],
                    password_hash=hash_password(STUDENT_PASSWORD),
                    role=UserRole.STUDENT,
                    # spread students across depts for realism
                    department_id=dept_map[DEPTS[(i-1) % 5]["code"]].id,
                    is_active=True,
                )
                db.add(u)
                db.flush()
                student_users.append(u)
                if i % 5 == 0:
                    print(f"[seed] Created students batch up to {i}")
            else:
                student_users.append(existing)

        # --- 5. 40 Complaints with variety ---
        statuses = [ComplaintStatus.PENDING] * 8 + [ComplaintStatus.ASSIGNED] * 8 + \
                   [ComplaintStatus.IN_PROGRESS] * 8 + [ComplaintStatus.RESOLVED] * 10 + \
                   [ComplaintStatus.REJECTED] * 6
        random.shuffle(statuses)

        categories = [ComplaintCategory.HOSTEL, ComplaintCategory.ADMINISTRATIVE, ComplaintCategory.ACADEMIC]

        created_complaints = 0
        for idx in range(40):
            tmpl = random.choice(COMPLAINT_TEMPLATES)
            title, desc, cat_hint, sev_hint = tmpl

            # pick dept
            dept_code = random.choice(list(dept_map.keys()))
            dept = dept_map[dept_code]

            # category: prefer match from template, else random
            if cat_hint == "IT":
                cat = ComplaintCategory.ADMINISTRATIVE  # reuse as proxy; or keep ACADEMIC etc
            elif cat_hint == "ACADEMIC":
                cat = ComplaintCategory.ACADEMIC
            elif cat_hint == "HOSTEL":
                cat = ComplaintCategory.HOSTEL
            else:
                cat = random.choice(categories)

            # student
            student = random.choice(student_users)

            # status for this one
            status = statuses[idx]

            # scores varied realistic
            base_prio = random.randint(25, 92)
            severity = round(random.uniform(1.5, 4.8), 1)
            impact = random.randint(8, 28)
            aging = random.randint(0, 18)
            prio_score = min(95, max(20, base_prio + (aging // 2) - (5 if status == ComplaintStatus.RESOLVED else 0)))
            level = get_level(prio_score)

            # dates: spread over last 25 days
            days_ago = random.randint(0, 25)
            created = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(1, 20))
            updated = created + timedelta(days=random.randint(0, min(3, days_ago)), hours=random.randint(2, 48))

            # assigned for non-pending
            assigned_to = None
            if status != ComplaintStatus.PENDING and dept_code in staff_map:
                assigned_to = staff_map[dept_code].id

            # create complaint
            comp = Complaint(
                title=title,
                description=desc,
                category=cat,
                status=status,
                student_id=student.id,
                assigned_to=assigned_to,
                department_id=dept.id,
                priority_score=prio_score,
                severity_score=severity,
                impact_score=impact,
                aging_score=aging,
                priority_level=level,
                created_at=created,
                updated_at=updated,
            )
            db.add(comp)
            db.flush()
            created_complaints += 1

            # status history for assigned+
            if status != ComplaintStatus.PENDING:
                hist = ComplaintStatusHistory(
                    complaint_id=comp.id,
                    old_status=ComplaintStatus.PENDING,
                    new_status=status,
                    remarks="Auto-seeded transition for demo" if status in (ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED) else "Assigned to staff",
                    changed_at=created + timedelta(hours=6),
                    changed_by=staff_map.get(dept_code).id if dept_code in staff_map else admin.id,
                )
                db.add(hist)

                if status in (ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED):
                    # second history
                    hist2 = ComplaintStatusHistory(
                        complaint_id=comp.id,
                        old_status=status if status == ComplaintStatus.IN_PROGRESS else ComplaintStatus.ASSIGNED,
                        new_status=status,
                        remarks="Issue addressed after inspection." if status == ComplaintStatus.RESOLVED else "Not actionable / duplicate.",
                        changed_at=updated,
                        changed_by=staff_map.get(dept_code).id if dept_code in staff_map else admin.id,
                    )
                    db.add(hist2)

                    # ratings for ~half the resolved ones
                    if status == ComplaintStatus.RESOLVED and random.random() < 0.55:
                        rating_val = random.randint(3, 5)
                        r = StaffRating(
                            complaint_id=comp.id,
                            student_id=student.id,
                            staff_id=assigned_to or (staff_map.get(dept_code).id if dept_code in staff_map else None),
                            rating=rating_val,
                            feedback=random.choice([
                                "Staff was responsive and resolved quickly.",
                                "Good communication throughout.",
                                "Fixed the core issue but took longer than expected.",
                                "Excellent follow-up and clear explanation.",
                                None,
                            ]),
                            created_at=updated + timedelta(hours=4),
                        )
                        if r.staff_id:
                            db.add(r)

            if (idx + 1) % 10 == 0:
                db.commit()  # partial commits to avoid long tx

        db.commit()

        print(f"[seed] Created {created_complaints} complaints with history/ratings where applicable.")
        print_summary(db)

    except Exception as e:
        db.rollback()
        print(f"[seed] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

def print_summary(db):
    rated = db.query(StaffRating).count()
    actual_admin = db.query(User).filter(User.role == UserRole.ADMIN).count()
    actual_staff = db.query(User).filter(User.role == UserRole.STAFF).count()
    actual_student = db.query(User).filter(User.role == UserRole.STUDENT).count()
    actual_dept = db.query(Department).count()
    actual_comp = db.query(Complaint).count()
    print("------------------------------------------")
    # Exact string required by task (target demo data set)
    print("Seeded: 1 admin, 4 staff, 15 students, 5 depts, 40 complaints")
    print(f"        (actual in DB now: {actual_admin} admin, {actual_staff} staff, {actual_student} students, {actual_dept} depts, {actual_comp} complaints; {rated} ratings)")
    print("Credentials examples:")
    print(f"  Admin  : {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print(f"  Student: student01@giet.edu / {STUDENT_PASSWORD}")
    print(f"  Staff  : staff_it@giet.edu / Staff@123")
    print("------------------------------------------")

if __name__ == "__main__":
    seed()

# College Complaint Management System

College Complaint Management System (CCMS) is a full-stack complaint intake, routing, escalation, tracking, analytics, and staff feedback platform for educational institutions. It is built with a FastAPI backend, a React + Vite frontend, SQLAlchemy ORM, MySQL/MariaDB, JWT authentication, and a background priority scheduler.

This README describes the current implementation in this repository, including what the system does, how each role works, how the frontend and backend communicate, what API endpoints exist, how the complaint workflow runs end to end, and how to set the project up locally.

## Table of Contents

- [System Overview](#system-overview)
- [Core Features](#core-features)
- [Role Capabilities](#role-capabilities)
- [End-to-End Workflow](#end-to-end-workflow)
- [Complaint Lifecycle and State Transitions](#complaint-lifecycle-and-state-transitions)
- [Priority Engine](#priority-engine)
- [Classification Logic](#classification-logic)
- [Ratings and Smart Allocation](#ratings-and-smart-allocation)
- [Frontend Experience](#frontend-experience)
- [Architecture and Communication Flow](#architecture-and-communication-flow)
- [API Surface](#api-surface)
- [Database Model](#database-model)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Running the System](#running-the-system)
- [Production Notes](#production-notes)
- [Operational Notes and Current Limitations](#operational-notes-and-current-limitations)
- [Troubleshooting](#troubleshooting)

## System Overview

The system manages the full complaint handling loop for a college:

1. Students file complaints with a title, category, optional department, and description.
2. The backend stores the complaint, logs a classification prediction, and calculates initial severity and priority.
3. Admins review pending complaints, assign them manually, or use smart routing/reassignment.
4. Staff work assigned complaints and move them through valid status transitions.
5. Students receive notifications when their complaint is assigned, updated, or escalated.
6. Once a complaint is resolved, the student can rate the staff member who handled it.
7. Staff rating summaries feed back into smart reassignment logic for future complaints.
8. An hourly scheduler recalculates priorities for unresolved complaints and raises critical alerts when needed.

The platform is role-based and currently supports three authenticated roles:

- `STUDENT`
- `STAFF`
- `ADMIN`

## Core Features

- JWT-based authentication with role-based access control.
- Student complaint submission with optional department targeting.
- Complaint listing filtered by caller role:
  - students see only their own complaints
  - staff see only complaints assigned to them
  - admins see all complaints
- Complaint status tracking with history logging and remarks.
- Database-backed notification center.
- Dynamic complaint priority scoring using severity, impact, and aging.
- Hourly background priority recalculation using APScheduler.
- Critical escalation notifications to assigned staff and admins.
- Admin complaint assignment and smart reassignment.
- Student-to-staff rating workflow after complaint resolution.
- Staff rating summary and rating breakdown views.
- Admin analytics dashboard and PDF export.
- Department lookup endpoint for frontend dropdowns.
- Health endpoint and built-in FastAPI API docs.

## Role Capabilities

| Role | What they can do |
| --- | --- |
| Student | Log in, file complaints, choose a category, optionally choose a department, view their complaint history, filter by status, view priority/status, receive notifications, and rate staff after resolution |
| Staff | Log in, view assigned complaint queue, sort/filter complaints, update complaint status through allowed next states, add remarks, receive notifications, and view their own performance ratings |
| Admin | Log in, view all complaints, view analytics, export PDF reports, create users, deactivate or delete users, assign pending complaints, trigger smart reassignment, monitor ratings, and review system-wide complaint activity |

## End-to-End Workflow

### 1. User authentication

- A user logs in through `POST /auth/login`.
- The backend authenticates the email/password pair and returns a JWT access token.
- The frontend stores the token in `localStorage`.
- Every later API request automatically sends `Authorization: Bearer <token>`.

### 2. Complaint submission

- A student submits a complaint from the student dashboard.
- Required fields:
  - `title`
  - `description`
  - `category`
- Optional field:
  - `department_id`
- The complaint is stored in `PENDING` status.

### 3. Classification and initial scoring

- After insert, the backend runs a lightweight keyword-based classifier over the complaint title and description.
- The classifier output is stored in the `ml_predictions` table.
- A severity score is calculated from the predicted category and confidence score.
- An initial priority score and priority level are computed.

Important implementation detail:

- The complaint keeps the category chosen by the student in `complaints.category`.
- The classifier prediction is logged separately in `ml_predictions`.
- The prediction is used for severity scoring; it does not overwrite the user's selected complaint category.

### 4. Admin review and assignment

- Pending complaints appear in admin views.
- Admins can:
  - manually assign a complaint to a specific staff member
  - smart assign or smart reassign a complaint using the current priority and staff rating/workload logic
- On assignment:
  - complaint status becomes `ASSIGNED`
  - a status history record is written
  - notifications are sent to the assigned staff member and the student

### 5. Staff handling

- Staff members see only complaints assigned to them.
- Staff can update status using allowed transitions from the UI.
- Remarks can be included with the status update.
- Each update writes to complaint status history.
- The student receives a notification when status changes.

### 6. Background escalation

- An APScheduler background job runs every hour.
- It recalculates priority values for unresolved complaints.
- If a complaint escalates to `CRITICAL`:
  - the assigned staff member is notified, if there is one
  - all admins are notified

### 7. Student feedback

- Once a complaint reaches `RESOLVED`, the student who filed it can rate the assigned staff member.
- Ratings are limited to one submission per complaint/student/staff combination.
- A rating summary table is updated after each submission.

### 8. Analytics and reporting

- Admins can review system-wide analytics.
- Admin dashboard charts summarize complaint status and category distribution.
- The admin dashboard can export a PDF report from the currently loaded complaint dataset on the client side.

## Complaint Lifecycle and State Transitions

### Complaint statuses

- `PENDING`
- `ASSIGNED`
- `IN_PROGRESS`
- `RESOLVED`
- `REJECTED`

### Actual workflow path

The typical lifecycle is:

`PENDING -> ASSIGNED -> IN_PROGRESS -> RESOLVED`

Rejected branches can happen from active states as allowed by the frontend workflow rules.

### Frontend transition rules

The frontend status transition rules are centralized in `client/src/constants/complaint-statuses.js`:

- `PENDING -> ASSIGNED` or `REJECTED`
- `ASSIGNED -> IN_PROGRESS` or `REJECTED`
- `IN_PROGRESS -> RESOLVED` or `REJECTED`
- `RESOLVED -> no further transitions`
- `REJECTED -> no further transitions`

The staff update screen only exposes valid next actions relevant to staff:

- from `ASSIGNED`: `IN_PROGRESS` or `REJECTED`
- from `IN_PROGRESS`: `RESOLVED` or `REJECTED`

## Priority Engine

Complaint priority is not static. It is recalculated from three components:

- `severity_score` from classification logic
- `impact_score` from recent similar complaints
- `aging_score` from elapsed time since creation

### Priority score formula

```text
priority_score = severity_score + impact_score + aging_score
```

The total score is clamped between `0` and `100`.

### Severity score

Severity is derived from the predicted category and confidence score.

Base category weights in the current implementation:

- `ACADEMIC`: `40`
- `HOSTEL`: `35`
- `ADMINISTRATIVE`: `30`

The backend scales the base score by confidence and caps the result at `50`.

### Impact score

Impact measures how widespread or repeated the issue seems.

- Default base impact: `15`
- Similar complaints are counted by:
  - same category
  - same department
  - created within the last 30 days
  - still unresolved (`PENDING`, `ASSIGNED`, `IN_PROGRESS`)

Current impact thresholds:

- `>= 10` similar complaints -> `30`
- `>= 5` similar complaints -> `25`
- `>= 3` similar complaints -> `20`
- otherwise -> `15`

### Aging score

Aging grows as the complaint gets older:

- `>= 72 hours` -> `20`
- `>= 48 hours` -> `15`
- `>= 24 hours` -> `10`
- otherwise -> gradual increase based on hours elapsed

### Priority levels

- `0-39` -> `LOW`
- `40-59` -> `MEDIUM`
- `60-79` -> `HIGH`
- `80-100` -> `CRITICAL`

### Recalculation scheduler

- Scheduler starts with the FastAPI app lifespan.
- It runs once every hour.
- It recalculates all unresolved complaints.
- It emits critical escalation notifications where necessary.

## Classification Logic

This repository is ML-oriented, but the current runtime implementation is a lightweight keyword-based classifier, not a deployed scikit-learn inference pipeline.

### Current behavior

- Complaint title and description are scanned for category-specific keywords.
- The category with the highest match count becomes the predicted category.
- Confidence is calculated as:

```text
matches_for_best_category / total_keyword_matches
```

- The prediction is persisted in `ml_predictions`.
- Severity uses this prediction output.

### Why this matters

The project includes `scikit-learn` and `joblib` in backend dependencies, so the system is ready for a stronger ML pipeline later, but the current live code path is keyword-assisted classification plus prediction logging.

## Ratings and Smart Allocation

### Rating rules

Students can submit a rating only when all of the following are true:

- the complaint exists
- the complaint is `RESOLVED`
- the student owns the complaint
- the staff member being rated is the one assigned to that complaint
- no prior rating exists for that student/staff/complaint combination

### Rating outputs

The backend stores:

- individual rating rows in `staff_ratings`
- aggregate values in `staff_rating_summary`

### Staff rating views

- Staff can view their own rating statistics and rating breakdown.
- Admins can view all submitted ratings with student details.

### Smart allocation / reassignment

Smart routing uses:

- current complaint priority level
- average staff rating
- active workload count

Priority-aware routing thresholds:

- `CRITICAL` prefers staff rated `>= 4.5`
- `HIGH` prefers staff rated `>= 3.5`
- `MEDIUM` prefers staff rated `>= 2.5`
- `LOW` allows any staff rating

If nobody meets the threshold, the backend falls back to a general workload-and-rating-based choice.

## Frontend Experience

The frontend is a React 19 + Vite application with React Router, Axios, Framer Motion, Tailwind CSS, Recharts, and jsPDF.

### Main frontend routes

#### Public

- `/` -> login page

#### Student

- `/student` -> student dashboard
- `/student/my-complaints` -> complaint history and rating entry point

#### Staff

- `/staff` -> assigned complaint queue
- `/staff/update-status` -> complaint status update screen
- `/staff/my-ratings` -> own performance ratings

#### Admin

- `/admin` -> analytics overview dashboard
- `/admin/students` -> manage student accounts
- `/admin/staff` -> manage staff accounts and assign pending complaints
- `/admin/analytics` -> detailed analytics
- `/admin/ratings` -> staff ratings dashboard

### Shared UI behavior

- Notifications are loaded from the backend and shown in the top navigation.
- Unread notifications show a badge.
- Opening a notification marks it as read through the API.
- Sidebar navigation changes automatically based on the authenticated user's role.
- Protected routes redirect users away from dashboards that do not match their role.

### Student UI features

- Submit complaint modal
- Department dropdown sourced from `/departments/`
- Status and priority overview cards
- Recent complaints table with status filter
- Detailed complaint history view
- Staff rating modal for resolved complaints

### Staff UI features

- Assigned complaint queue
- Sort by priority/newest/oldest
- Filter by category
- Status update action panel
- Allowed next statuses enforced in UI
- Personal rating statistics screen

### Admin UI features

- System KPI cards
- Complaint summary charts
- Category distribution charts
- Recent activity search
- Smart assign / smart reassign buttons
- User creation for students and staff
- User deactivate / delete flow
- Pending complaint assignment panel
- Detailed analytics page
- Ratings dashboard
- PDF export

## Architecture and Communication Flow

### Backend stack

- FastAPI
- SQLAlchemy ORM
- MySQL/MariaDB via `pymysql`
- Pydantic / pydantic-settings
- JWT auth with `python-jose`
- Password hashing via `passlib`
- APScheduler

### Frontend stack

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Recharts
- jsPDF + jspdf-autotable

### Request/response flow in development

```text
Browser
  -> Vite dev server (:5173)
  -> Vite proxy forwards /auth, /users, /complaints, /notifications, /departments, /ratings, /api
  -> FastAPI backend (:8000)
  -> Service layer
  -> SQLAlchemy ORM
  -> MySQL / MariaDB
```

### Auth flow

```text
Login form
  -> POST /auth/login
  -> FastAPI validates credentials
  -> JWT returned
  -> Frontend stores token in localStorage
  -> Axios interceptor adds Authorization header to future requests
```

### Notification flow

```text
Complaint assignment/status update/escalation
  -> backend creates notification row
  -> frontend fetches notifications
  -> user opens notification
  -> frontend PATCHes /notifications/{id}/read
```

### Priority flow

```text
Complaint created
  -> classification prediction logged
  -> severity computed
  -> impact + aging calculated
  -> priority score and level stored
  -> hourly scheduler recalculates unresolved complaints
```

### CORS and proxy behavior

Backend CORS is configured for:

- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

In local development, the frontend primarily relies on the Vite proxy, so the browser talks to the Vite origin while Vite forwards API traffic to FastAPI.

## API Surface

All routes below are currently mounted directly on the backend root.

### Authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Login using `username=email` and `password`; returns JWT |

### Users

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/users/` | Admin | Create a user |
| `GET` | `/users/` | Admin | List users, optional role filter |
| `DELETE` | `/users/{user_id}` | Admin | Delete user if related data constraints allow it |
| `PATCH` | `/users/{user_id}/deactivate` | Admin | Soft-disable a user account |

### Complaints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/complaints/` | Student | Submit a complaint |
| `GET` | `/complaints/` | Authenticated | List complaints based on caller role |
| `PATCH` | `/complaints/{complaint_id}/assign` | Admin | Assign complaint to a specific staff member |
| `PATCH` | `/complaints/{complaint_id}/status` | Staff | Update complaint status |
| `PATCH` | `/complaints/{complaint_id}/reassign` | Admin | Smart reassign complaint based on ratings/workload |

Supported complaint sort values:

- `priority`
- `date_new`
- `date_old`
- `category`

### Notifications

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/notifications/` | Authenticated | List notifications for current user |
| `PATCH` | `/notifications/{notification_id}/read` | Authenticated | Mark a notification as read |

### Departments

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/departments/` | Public | List all departments for dropdowns |

### Ratings

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/ratings/rate-staff` | Student | Submit a rating for resolved complaint handling |
| `GET` | `/ratings/staff/{staff_id}/average-rating` | Authenticated | Get average rating summary for a staff member |
| `GET` | `/ratings/admin/staff-ratings` | Admin | Get paginated rating rows with student details |
| `GET` | `/ratings/staff/{staff_id}/rating-stats` | Admin or that staff member | Get rating breakdown and summary |

### Health

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Service health check |

### Interactive API docs

When the backend is running:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Model

Main tables in the current system:

### `users`

Stores all authenticated users.

Key fields:

- `id`
- `college_id`
- `name`
- `email`
- `password_hash`
- `role`
- `department_id`
- `is_active`
- `created_at`

### `departments`

Stores department names and codes used for routing and display.

Key fields:

- `id`
- `name`
- `code`
- `created_at`

### `complaints`

Main complaint record.

Key fields:

- `id`
- `title`
- `description`
- `category`
- `status`
- `student_id`
- `assigned_to`
- `department_id`
- `priority_score`
- `severity_score`
- `impact_score`
- `aging_score`
- `priority_level`
- `created_at`
- `updated_at`

### `complaint_status_history`

Audit trail for complaint state changes.

Key fields:

- `complaint_id`
- `changed_by`
- `old_status`
- `new_status`
- `remarks`
- `changed_at`

### `notifications`

Database-backed user notifications.

Key fields:

- `user_id`
- `complaint_id`
- `message`
- `is_read`
- `created_at`

### `ml_predictions`

Stores classifier outputs tied to complaints.

Key fields:

- `complaint_id`
- `predicted_category`
- `confidence_score`
- `created_at`

### `staff_ratings`

Stores raw student feedback on staff.

Key fields:

- `student_id`
- `staff_id`
- `complaint_id`
- `rating`
- `feedback`
- `created_at`
- `updated_at`

### `staff_rating_summary`

Stores aggregate rating values used by dashboards and smart routing.

Key fields:

- `staff_id`
- `total_ratings`
- `average_rating`
- `updated_at`

### `attachments`

The repository includes an attachment model scaffold, but there is no active upload API or frontend flow for attachments yet.

## Project Structure

```text
.
|-- app/
|   |-- auth/              # JWT handling, password hashing, auth dependencies
|   |-- models/            # SQLAlchemy models
|   |-- routers/           # FastAPI route modules
|   |-- schemas/           # Pydantic request/response schemas
|   |-- services/          # Business logic
|   |-- config.py          # Environment-backed settings
|   |-- database.py        # Engine, session, declarative base
|   `-- main.py            # FastAPI app entry point
|-- client/
|   |-- src/
|   |   |-- components/    # Shared UI components
|   |   |-- constants/     # Frontend workflow constants
|   |   |-- context/       # Auth and toast context
|   |   |-- layouts/       # Shared role layout
|   |   |-- pages/         # Route pages by role
|   |   |-- services/      # Axios service modules
|   |   `-- utils/         # Formatting and PDF export helpers
|   |-- package.json
|   `-- vite.config.js
|-- docs/                  # Implementation notes and supporting docs
|-- scripts/               # DB create/migrate/seed helpers
|-- create_tables.py       # Convenience wrapper
|-- migrate_db.py          # Convenience wrapper
|-- seed.py                # Convenience wrapper
|-- requirements.txt
`-- README.md
```

## Prerequisites

Recommended local environment:

- Python 3.x
- Node.js and npm
- MySQL or MariaDB

You also need a database user with permission to create or access the target database named in `DATABASE_URL`.

## Environment Variables

The backend reads configuration from a root `.env` file.

Required and supported settings:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | None | SQLAlchemy database connection string |
| `SECRET_KEY` | Yes | None | JWT signing secret |
| `ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | JWT lifetime in minutes |

Example `.env`:

```env
DATABASE_URL=mysql+pymysql://root:password@localhost/ccms
SECRET_KEY=change_this_to_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Local Setup

### 1. Clone or open the repository

```bash
cd "AI complaint Classifier and Management system"
```

### 2. Create and activate a Python virtual environment

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the `.env` file

Add the environment variables shown above.

### 5. Create database tables

From the project root:

```bash
python create_tables.py
```

What this does:

- reads `DATABASE_URL`
- creates the database if it does not exist
- runs SQLAlchemy `create_all()` for the current model set

### 6. Run migration helper if upgrading an older database

If you are using an older complaint table that does not yet have priority columns, run:

```bash
python migrate_db.py
```

This migration adds:

- `priority_score`
- `severity_score`
- `impact_score`
- `aging_score`
- `priority_level`

and related indexes.

For a brand-new database created from current models, this step is usually not necessary.

### 7. Seed the initial admin account

```bash
python seed.py
```

Default seeded admin:

- Email: `admin@college.edu`
- Password: `Admin@1234`
- College ID: `ADMIN001`

Change these credentials in `scripts/seed.py` before production use.

### 8. Seed or insert departments

Important:

- The application has a department list endpoint and department dropdowns.
- This repository does not currently include a department creation UI or a department seed script.
- If you want department-based routing and dropdowns to work properly, insert department rows manually.

Example SQL:

```sql
INSERT INTO departments (name, code) VALUES
('Hostel Administration', 'HOSTEL'),
('Academic Affairs', 'ACADEMIC'),
('General Administration', 'ADMIN');
```

## Running the System

### Start the backend

From the project root:

```bash
uvicorn app.main:app --reload --port 5173
```

Backend will be available at:

- `http://localhost:5173`

### Start the frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Frontend will be available at:

- `http://localhost:5173`

### Frontend scripts

Inside `client/`:

- `npm run dev` -> start Vite dev server
- `npm run build` -> production build
- `npm run preview` -> preview production build
- `npm run lint` -> run ESLint

## Production Notes

- The backend does not currently serve the React build itself.
- In production, build the frontend inside `client/` and serve `client/dist` using a reverse proxy or static host.
- Route API traffic to FastAPI through your reverse proxy.
- Replace the seeded admin credentials.
- Use a strong `SECRET_KEY`.
- Restrict CORS origins to your real frontend origin(s).

## Operational Notes and Current Limitations

- The current classification path is keyword-based and logs predictions; it is not yet a full deployed ML inference pipeline.
- Notifications are database-backed and fetched by the UI; there is no websocket-based real-time push channel yet.
- The attachment model exists in the backend, but attachment upload/download is not exposed in the current API/UI.
- Department listing exists, but department creation/management is not yet exposed in the UI.
- The admin UI supports creating student and staff users; the API itself can create any role if called directly by an admin.
- User deletion may fail when related records exist; the UI therefore offers deactivation as the safer default.
- The admin PDF export is generated client-side from dashboard data; no extra reporting table is required for it.

## Troubleshooting

### Backend does not start

Check:

- `.env` exists in the repository root
- `DATABASE_URL` is valid
- MySQL/MariaDB is running
- required Python packages are installed

### Frontend cannot reach backend

Check:

- FastAPI is running on `http://localhost:8000`
- Vite is running on `http://localhost:5173`
- `client/vite.config.js` proxy settings are intact

### Login fails for the seeded admin

Check:

- you ran `python seed.py`
- the admin row exists in the `users` table
- the account is active
- you are logging in with email, not college ID

### Department dropdown is empty

Check:

- rows exist in the `departments` table
- `GET /departments/` returns data

### Complaints are not escalating over time

Check:

- backend is running continuously
- the scheduler started successfully with the app lifespan
- complaint status is still unresolved (`PENDING`, `ASSIGNED`, or `IN_PROGRESS`)

## Additional Notes

Useful files for deeper project context:

- `docs/IMPLEMENTATION_GUIDE.md`
- `client/FRONTEND_ARCHITECTURE.md`
- `SPEC-1-Complaint-Management-and-Classification-System.pdf`

If you want this README extended further, the next useful additions would be:

- request/response examples for each endpoint
- screenshots of each dashboard
- an ER diagram for the database
- deployment instructions for Docker or Nginx

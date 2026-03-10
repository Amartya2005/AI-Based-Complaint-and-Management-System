# College Complaint Management System (CCMS)

An AI-powered Complaint Classifier and Management System designed for colleges. This system automates the process of categorizing, assigning, evaluating priority, and tracking student complaints using FastAPI, React, and Machine Learning.

## 🚀 Features

- **Multi-Role System**:
  - **Student**: Submit complaints, track status, and receive notifications.
  - **Staff**: Manage assigned complaints, update progress, and resolve issues.
  - **Admin**: Dashboard overview, cross-department analytics, and staff assignment.
- **AI Classification**: Automatically suggests or classifies complaint categories and departments using ML (Machine Learning).
- **Dynamic Priority Engine & Scheduling**: Uses APScheduler to automatically escalate complaint priorities based on aging, severity (derived from ML), and impact parameters.
- **Real-time Notifications**: Keeps users updated on status changes and priority escalations.
- **Secure Authentication**: JWT-based authentication with role-based access control (RBAC).

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: MySQL / MariaDB (via SQLAlchemy ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Pydantic v2
- **Environment**: Python-dotenv
- **Background Tasks**: APScheduler
- **Machine Learning**: Scikit-Learn

### Frontend
- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: Lucide React
- **Routing**: React Router
- **State/API**: Axios

## 📂 Project Structure

```bash
.
├── app/               # FastAPI Backend
│   ├── auth/          # Authentication logic (JWT, Password hashing)
│   ├── models/        # SQLAlchemy Models (User, Complaint, MLPrediction, etc.)
│   ├── routers/       # API Route Handlers (Complaints, Users, etc.)
│   ├── schemas/       # Pydantic Schemas (Data validation)
│   ├── services/      # Business logic (Complaint handling, ML integration, Priorities)
│   ├── config.py      # App configuration
│   └── main.py        # Entry point
├── client/            # React Frontend
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/      # Route pages (Student/Staff Dashboards)
│       └── App.jsx     # Main React component
├── .env               # Environment variables
├── requirements.txt   # Backend dependencies
└── create_tables.py   # Database initialization script
```

## ⚙️ Setup Instructions

### Backend Setup

1. **Clone the repository**:
   ```bash
   cd "AI complaint Classifier and Management system"
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example` if available):
   ```env
   DATABASE_URL=mysql+pymysql://user:password@localhost/dbname
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ```

5. **Initialize Database**:
   ```bash
   python create_tables.py
   python migrate_db.py  # Run DB migrations for priority fields if upgrading from older versions
   ```

6. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. **Navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```

## 📋 API Documentation

Once the backend is running, you can access the interactive API documentation at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 🤖 AI Classification & Dynamic Priority

- **Classification Model**: Uses scikit-learn Logistic Regression pipeline with TF-IDF Vectorization for complaint categorization logic (`app/services/ml_service.py`). Predictions are logged in the `ml_predictions` table.
- **Priority System**:
  - `priority_score` dynamically generated via Severity + Aging + Impact (`app/services/priority_service.py`).
  - **Background Scheduler** recalculates valid priorities hourly. Auto-escalated tickets alert the Admin and Assigned staff member instantly.

## 🤝 Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import StudentDashboard from './pages/student/Dashboard';
import MyComplaints from './pages/student/MyComplaints';
import StaffDashboard from './pages/staff/Dashboard';
import UpdateStatus from './pages/staff/UpdateStatus';
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import Analytics from './pages/admin/Analytics';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route path="/student" element={<MainLayout allowedRole="student" />}>
              <Route index element={<StudentDashboard />} />
              <Route path="file-complaint" element={<Navigate to="/student" replace />} />
              <Route path="my-complaints" element={<MyComplaints />} />
            </Route>

            <Route path="/staff" element={<MainLayout allowedRole="staff" />}>
              <Route index element={<StaffDashboard />} />
              <Route path="update-status" element={<UpdateStatus />} />
            </Route>

            <Route path="/admin" element={<MainLayout allowedRole="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<ManageUsers type="student" />} />
              <Route path="staff" element={<ManageUsers type="staff" />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

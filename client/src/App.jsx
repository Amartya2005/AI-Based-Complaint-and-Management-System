import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import StudentDashboard from './pages/student/Dashboard';
import MyComplaints from './pages/student/MyComplaints';
import StaffDashboard from './pages/staff/Dashboard';
import UpdateStatus from './pages/staff/UpdateStatus';
import MyRatings from './pages/staff/MyRatings';
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import Analytics from './pages/admin/Analytics';
import Ratings from './pages/admin/Ratings';
import LoaderDemo from './pages/LoaderDemo';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/loader-demo" element={<PageTransition><LoaderDemo /></PageTransition>} />

        <Route path="/student" element={<MainLayout allowedRole="student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="file-complaint" element={<Navigate to="/student" replace />} />
          <Route path="my-complaints" element={<MyComplaints />} />
        </Route>

        <Route path="/staff" element={<MainLayout allowedRole="staff" />}>
          <Route index element={<StaffDashboard />} />
          <Route path="update-status" element={<UpdateStatus />} />
          <Route path="my-ratings" element={<MyRatings />} />
        </Route>

        <Route path="/admin" element={<MainLayout allowedRole="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<ManageUsers type="student" />} />
          <Route path="staff" element={<ManageUsers type="staff" />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ratings" element={<Ratings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

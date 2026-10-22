import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../components/common/DashboardLayout';

// Auth Pages
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage';

// Nurse Pages
import { NurseDashboard } from '../pages/nurse/NurseDashboard';
import { NurseQueuePage } from '../pages/nurse/NurseQueuePage';
import { NewTriagePage } from '../pages/nurse/NewTriagePage';
import { NurseAssessmentsPage } from '../pages/nurse/NurseAssessmentsPage';
import { NurseDepartmentsPage } from '../pages/nurse/NurseDepartmentsPage';

// Doctor Pages
import { DoctorDashboard } from '../pages/doctor/DoctorDashboard';
import { DoctorIncomingPage } from '../pages/doctor/DoctorIncomingPage';
import { DoctorPatientHistoryPage } from '../pages/doctor/DoctorPatientHistoryPage';
import { DoctorCompletedPage } from '../pages/doctor/DoctorCompletedPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { QueueAnalyticsPage } from '../pages/admin/QueueAnalyticsPage';
import { DepartmentManagementPage } from '../pages/admin/DepartmentManagementPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { TriagePredictorPage } from '../pages/admin/TriagePredictorPage';
import { SystemActivityPage } from '../pages/admin/SystemActivityPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

export const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();

  // Root redirect logic
  const getRootRedirect = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'Nurse') return '/nurse';
    if (role === 'Doctor') return '/doctor';
    if (role === 'Admin') return '/admin';
    return '/login';
  };

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root Path Redirect */}
      <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />

      {/* Nurse Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Nurse']} />}>
        <Route path="/nurse" element={<DashboardLayout />}>
          <Route index element={<NurseDashboard />} />
          <Route path="queue" element={<NurseQueuePage />} />
          <Route path="triage/new" element={<NewTriagePage />} />
          <Route path="assessments" element={<NurseAssessmentsPage />} />
          <Route path="departments" element={<NurseDepartmentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Doctor Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Doctor']} />}>
        <Route path="/doctor" element={<DashboardLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="incoming" element={<DoctorIncomingPage />} />
          <Route path="history" element={<DoctorPatientHistoryPage />} />
          <Route path="completed" element={<DoctorCompletedPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<QueueAnalyticsPage />} />
          <Route path="departments" element={<DepartmentManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="triage-predictor" element={<TriagePredictorPage />} />
          <Route path="activity" element={<SystemActivityPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};


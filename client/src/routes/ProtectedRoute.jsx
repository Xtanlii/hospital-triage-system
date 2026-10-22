import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { currentUser, isAuthenticated, role } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If role is not permitted, redirect to the user's appropriate portal
    if (role === 'Nurse') return <Navigate to="/nurse" replace />;
    if (role === 'Doctor') return <Navigate to="/doctor" replace />;
    if (role === 'Admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};


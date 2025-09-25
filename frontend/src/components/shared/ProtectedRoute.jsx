import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole, requireApproval = true }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!userProfile) {
    return <LoadingSpinner />;
  }

  // Check if user needs approval (backend uses isApproved boolean field)
  if (requireApproval && !userProfile.isApproved) {
    return <Navigate to="/approval-pending" replace />;
  }

  // Check role access
  if (requiredRole && userProfile.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
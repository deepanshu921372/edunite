import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import LoadingSpinner from './components/shared/LoadingSpinner';

// Pages
import LandingPage from './pages/landing/LandingPage';
import ApprovalPending from './pages/auth/ApprovalPending';
import Unauthorized from './pages/auth/Unauthorized';

// Dashboards (to be created)
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

const AppRoutes = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="xl" message="Loading Edunite..." />;
  }

  // Redirect authenticated users to their appropriate dashboard
  const getDashboardRoute = () => {
    if (!userProfile) return '/';

    switch (userProfile.role) {
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student';
      default:
        return '/unauthorized';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          userProfile && userProfile.isApproved ? (
            <Navigate to={getDashboardRoute()} replace />
          ) : userProfile && !userProfile.isApproved ? (
            <Navigate to="/approval-pending" replace />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Auth Routes */}
      <Route path="/approval-pending" element={<ApprovalPending />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

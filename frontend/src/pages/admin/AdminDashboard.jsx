import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  UserCheck,
  GraduationCap,
  Home,
  Settings
} from 'lucide-react';
import DashboardLayout from '../../components/shared/DashboardLayout';

// Admin Components
import AdminOverview from '../../components/admin/AdminOverview';
import RequestsManagement from '../../components/admin/RequestsManagement';
import TeachersManagement from '../../components/admin/TeachersManagement';
import StudentsManagement from '../../components/admin/StudentsManagement';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '');
    return path || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());

  // Update activeTab when URL changes
  useEffect(() => {
    setActiveTab(getCurrentTab());
  }, [location.pathname]);

  const navigation = [
    {
      name: 'Dashboard',
      icon: Home,
      active: activeTab === 'dashboard',
      onClick: () => navigate('/admin/dashboard')
    },
    {
      name: 'User Requests',
      icon: UserCheck,
      active: activeTab === 'requests',
      onClick: () => navigate('/admin/requests')
    },
    {
      name: 'Teachers',
      icon: Users,
      active: activeTab === 'teachers',
      onClick: () => navigate('/admin/teachers')
    },
    {
      name: 'Students',
      icon: GraduationCap,
      active: activeTab === 'students',
      onClick: () => navigate('/admin/students')
    }
  ];

  // Memoize components to prevent unnecessary re-mounting and duplicate API calls
  const components = useMemo(() => ({
    dashboard: <AdminOverview />,
    requests: <RequestsManagement />,
    teachers: <TeachersManagement />,
    students: <StudentsManagement />
  }), []);

  return (
    <DashboardLayout
      navigation={navigation}
      title="Admin Dashboard"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={components.dashboard} />
          <Route path="/requests" element={components.requests} />
          <Route path="/teachers" element={components.teachers} />
          <Route path="/students" element={components.students} />
        </Routes>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
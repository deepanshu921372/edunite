import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Users,
  FileText,
  BarChart3,
  BookOpen,
  User
} from 'lucide-react';
import DashboardLayout from '../../components/shared/DashboardLayout';

// Teacher Components
import TeacherOverview from '../../components/teacher/TeacherOverview';
import TeacherProfile from '../../components/teacher/TeacherProfile';
import TimetableManagement from '../../components/teacher/TimetableManagement';
import AttendanceManagement from '../../components/teacher/AttendanceManagement';
import MaterialsManagement from '../../components/teacher/MaterialsManagement';

const TeacherDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/timetable')) return 'timetable';
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/materials')) return 'materials';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getCurrentTab());
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL to maintain state on refresh
    const basePath = '/teacher';
    const newPath = tab === 'dashboard' ? basePath : `${basePath}/${tab}`;
    navigate(newPath, { replace: true });
  };

  const navigation = [
    {
      name: 'Dashboard',
      icon: Home,
      active: activeTab === 'dashboard',
      onClick: () => handleTabChange('dashboard')
    },
    {
      name: 'Profile',
      icon: User,
      active: activeTab === 'profile',
      onClick: () => handleTabChange('profile')
    },
    {
      name: 'Timetable',
      icon: Calendar,
      active: activeTab === 'timetable',
      onClick: () => handleTabChange('timetable')
    },
    {
      name: 'Attendance',
      icon: Users,
      active: activeTab === 'attendance',
      onClick: () => handleTabChange('attendance')
    },
    {
      name: 'Materials',
      icon: BookOpen,
      active: activeTab === 'materials',
      onClick: () => handleTabChange('materials')
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherOverview />;
      case 'profile':
        return <TeacherProfile />;
      case 'timetable':
        return <TimetableManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'materials':
        return <MaterialsManagement />;
      default:
        return <TeacherOverview />;
    }
  };

  return (
    <DashboardLayout
      navigation={navigation}
      title="Teacher Dashboard"
    >
      {/* Content based on active tab for SPA behavior */}
      <div className="px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
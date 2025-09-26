import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  BookOpen,
  BarChart3,
  Calendar
} from 'lucide-react';
import DashboardLayout from '../../components/shared/DashboardLayout';

// Student Components
import StudentOverview from '../../components/student/StudentOverview';
import StudentProfile from '../../components/student/StudentProfile';
import StudyMaterials from '../../components/student/StudyMaterials';
import AttendanceView from '../../components/student/AttendanceView';

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get active tab from URL
  const getActiveTabFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromURL());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromURL());
  }, [location.search]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/student?tab=${tab}`, { replace: true });
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
      name: 'Study Materials',
      icon: BookOpen,
      active: activeTab === 'materials',
      onClick: () => handleTabChange('materials')
    },
    {
      name: 'My Attendance',
      icon: BarChart3,
      active: activeTab === 'attendance',
      onClick: () => handleTabChange('attendance')
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentOverview />;
      case 'profile':
        return <StudentProfile />;
      case 'materials':
        return <StudyMaterials />;
      case 'attendance':
        return <AttendanceView />;
      default:
        return <StudentOverview />;
    }
  };

  return (
    <DashboardLayout
      navigation={navigation}
      title="Student Dashboard"
    >
      {/* Content based on active tab for SPA behavior */}
      <div className="px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
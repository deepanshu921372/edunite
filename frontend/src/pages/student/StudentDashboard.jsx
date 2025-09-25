import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    {
      name: 'Dashboard',
      icon: Home,
      active: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard')
    },
    {
      name: 'Profile',
      icon: User,
      active: activeTab === 'profile',
      onClick: () => setActiveTab('profile')
    },
    {
      name: 'Study Materials',
      icon: BookOpen,
      active: activeTab === 'materials',
      onClick: () => setActiveTab('materials')
    },
    {
      name: 'My Attendance',
      icon: BarChart3,
      active: activeTab === 'attendance',
      onClick: () => setActiveTab('attendance')
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
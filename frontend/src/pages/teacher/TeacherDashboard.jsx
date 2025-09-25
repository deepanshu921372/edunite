import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Users,
  FileText,
  BarChart3,
  BookOpen
} from 'lucide-react';
import DashboardLayout from '../../components/shared/DashboardLayout';

// Teacher Components
import TeacherOverview from '../../components/teacher/TeacherOverview';
import TimetableManagement from '../../components/teacher/TimetableManagement';
import AttendanceManagement from '../../components/teacher/AttendanceManagement';
import MaterialsManagement from '../../components/teacher/MaterialsManagement';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    {
      name: 'Dashboard',
      icon: Home,
      active: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard')
    },
    {
      name: 'Timetable',
      icon: Calendar,
      active: activeTab === 'timetable',
      onClick: () => setActiveTab('timetable')
    },
    {
      name: 'Attendance',
      icon: Users,
      active: activeTab === 'attendance',
      onClick: () => setActiveTab('attendance')
    },
    {
      name: 'Materials',
      icon: BookOpen,
      active: activeTab === 'materials',
      onClick: () => setActiveTab('materials')
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherOverview />;
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
      <Routes>
        <Route path="/" element={renderContent()} />
        <Route path="/dashboard" element={<TeacherOverview />} />
        <Route path="/timetable" element={<TimetableManagement />} />
        <Route path="/attendance" element={<AttendanceManagement />} />
        <Route path="/materials" element={<MaterialsManagement />} />
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>

      {/* Content based on active tab for SPA behavior */}
      <div className="px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
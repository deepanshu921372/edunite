import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const TeacherOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
    setError(null);
    try {
      const response = await teacherAPI.getTeacherStats();
      setStats(response.data || response);
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Please ensure your account is approved.');
      } else {
        setError('Failed to load statistics');
      }
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchTeacherStats}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  const quickStats = [
    {
      name: 'My Classes',
      value: stats?.totalClasses || 0,
      icon: <BookOpen className="w-7 h-7" />,
      bgColor: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-200',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      growth: '+15%'
    },
    {
      name: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: <Users className="w-7 h-7" />,
      bgColor: 'from-green-500 to-green-600',
      shadowColor: 'shadow-green-200',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      growth: '+8%'
    },
    {
      name: 'Today\'s Classes',
      value: stats?.todayClasses || 0,
      icon: <Calendar className="w-7 h-7" />,
      bgColor: 'from-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-200',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      growth: stats?.todayClasses > 0 ? 'Today!' : ''
    },
    {
      name: 'Materials Uploaded',
      value: stats?.materialsCount || 0,
      icon: <FileText className="w-7 h-7" />,
      bgColor: 'from-orange-500 to-orange-600',
      shadowColor: 'shadow-orange-200',
      textColor: 'text-orange-700',
      bgLight: 'bg-orange-50',
      growth: '+12%'
    }
  ];

  // Only show charts if we have meaningful data
  const hasData = stats && (stats.totalClasses > 0 || stats.totalStudents > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's an overview of your tuition classes and student progress.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              y: -5,
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            className={`bg-white rounded-2xl shadow-lg hover:shadow-xl ${stat.shadowColor} transition-all duration-300 cursor-pointer group overflow-hidden relative`}
          >
            {/* Gradient Background Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgLight} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
                  <div className={stat.textColor}>
                    {stat.icon}
                  </div>
                </div>
                {stat.growth && (
                  <div className={`px-2 py-1 ${stat.bgLight} ${stat.textColor} text-xs font-semibold rounded-full flex items-center space-x-1`}>
                    <TrendingUp className="w-3 h-3" />
                    <span>{stat.growth}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.name}
                </h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show welcome message if no data */}
      {!hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
        >
          <div className="px-6 py-12 text-center">
            <div className="bg-blue-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to your teaching dashboard!</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Once you're assigned classes, your teaching activities and student data will appear here.
            </p>
          </div>
        </motion.div>
      )}

      {/* Today's Schedule - Show message instead of hardcoded data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
        </div>
        <div className="px-6 py-8">
          <div className="text-center">
            <div className="bg-purple-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">No classes scheduled</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your class schedule will appear here when classes are scheduled.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity - Show message instead of hardcoded data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="px-6 py-8">
          <div className="text-center">
            <div className="bg-orange-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">No recent activity</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your teaching activities will be logged here as you interact with the system.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherOverview;
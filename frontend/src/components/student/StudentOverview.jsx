import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Award,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const StudentOverview = () => {
  const { userProfile, currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Only fetch if user is authenticated and approved
    if (userProfile && userProfile.isApproved && currentUser && !fetchingRef.current) {
      fetchStudentStats();
    } else if (userProfile && !userProfile.isApproved) {
      setLoading(false);
      setError('Account approval required to access dashboard');
    } else if (!currentUser) {
      setLoading(false);
      setError('Please sign in to access dashboard');
    }
  }, [userProfile, currentUser]);

  const fetchStudentStats = async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setError(null);

    try {
      const response = await studentAPI.getStudentStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching student stats:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Please ensure your account is approved.');
      } else {
        setError('Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
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
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchStudentStats();
          }}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  const quickStats = [
    {
      name: 'Enrolled Classes',
      value: stats?.totalClasses || 0,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      name: 'Overall Attendance',
      value: `${stats?.overallAttendance || 0}%`,
      icon: <Calendar className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      name: 'Materials Downloaded',
      value: stats?.materialsDownloaded || 0,
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      name: 'Academic Score',
      value: `${stats?.academicScore || 0}%`,
      icon: <Award className="w-8 h-8" />,
      color: 'bg-orange-500'
    }
  ];

  // Only show data if we have meaningful information
  const hasData = stats && (stats.totalClasses > 0 || stats.overallAttendance > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's an overview of your academic progress and activities.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} text-white p-3 rounded-lg`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
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
          className="bg-white overflow-hidden shadow-md rounded-lg"
        >
          <div className="px-6 py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Welcome to your dashboard!</h3>
            <p className="mt-1 text-sm text-gray-500">
              Once you're enrolled in classes, your academic progress and activities will appear here.
            </p>
          </div>
        </motion.div>
      )}

      {/* Today's Schedule - Show message instead of hardcoded data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white overflow-hidden shadow-md rounded-lg"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
        </div>
        <div className="px-6 py-8">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your class schedule will appear here when classes are scheduled.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recent Study Materials - Show message instead of hardcoded data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white overflow-hidden shadow-md rounded-lg"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Study Materials</h3>
        </div>
        <div className="px-6 py-8">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No study materials yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Study materials uploaded by your teachers will appear here.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentOverview;
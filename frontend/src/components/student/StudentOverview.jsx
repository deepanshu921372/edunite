import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  FileText,
  Users,
  CheckCircle,
  Download,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
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
      color: 'bg-blue-500',
      change: '+1',
      changeType: 'increase'
    },
    {
      name: 'Overall Attendance',
      value: `${stats?.overallAttendance || 0}%`,
      icon: <Calendar className="w-8 h-8" />,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      name: 'Materials Downloaded',
      value: stats?.materialsDownloaded || 0,
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-purple-500',
      change: '+8',
      changeType: 'increase'
    },
    {
      name: 'Academic Score',
      value: `${stats?.academicScore || 0}%`,
      icon: <Award className="w-8 h-8" />,
      color: 'bg-orange-500',
      change: '+3%',
      changeType: 'increase'
    }
  ];

  // Sample data for charts
  const attendanceData = [
    { month: 'Jan', attendance: 85 },
    { month: 'Feb', attendance: 88 },
    { month: 'Mar', attendance: 82 },
    { month: 'Apr', attendance: 90 },
    { month: 'May', attendance: 87 },
    { month: 'Jun', attendance: 92 }
  ];

  const subjectPerformance = [
    { subject: 'Mathematics', attendance: 92, assignments: 88 },
    { subject: 'Physics', attendance: 87, assignments: 85 },
    { subject: 'Chemistry', attendance: 89, assignments: 92 },
    { subject: 'Biology', attendance: 91, assignments: 87 }
  ];

  const weeklyAttendance = [
    { name: 'Present', value: 18, color: '#10b981' },
    { name: 'Absent', value: 2, color: '#ef4444' },
    { name: 'Late', value: 1, color: '#f59e0b' }
  ];

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
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                        <span className="ml-1">{stat.change}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[70, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Attendance Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">This Week's Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={weeklyAttendance}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {weeklyAttendance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {weeklyAttendance.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Subject Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Subject-wise Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="attendance" fill="#3b82f6" name="Attendance %" />
            <Bar dataKey="assignments" fill="#10b981" name="Assignment Score %" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Today's Schedule & Recent Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white overflow-hidden shadow-md rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {[
                {
                  time: '09:00 AM - 10:30 AM',
                  subject: 'Advanced Mathematics',
                  teacher: 'Prof. Smith',
                  room: 'Room A-101',
                  status: 'upcoming'
                },
                {
                  time: '11:00 AM - 12:30 PM',
                  subject: 'Physics Lab',
                  teacher: 'Dr. Johnson',
                  room: 'Lab B-201',
                  status: 'current'
                },
                {
                  time: '02:00 PM - 03:30 PM',
                  subject: 'Chemistry Theory',
                  teacher: 'Prof. Davis',
                  room: 'Room C-102',
                  status: 'upcoming'
                }
              ].map((schedule, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                    schedule.status === 'current' ? 'bg-green-500' :
                    schedule.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {schedule.subject}
                      </h4>
                      {schedule.status === 'current' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Live
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{schedule.time}</p>
                    <p className="text-xs text-gray-500">
                      {schedule.teacher} • {schedule.room}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Materials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white overflow-hidden shadow-md rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Study Materials</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {[
                {
                  title: 'Quantum Physics - Chapter 5',
                  subject: 'Physics',
                  teacher: 'Dr. Johnson',
                  uploadedAt: '2 hours ago',
                  fileType: 'PDF',
                  size: '2.4 MB'
                },
                {
                  title: 'Calculus Problem Set 3',
                  subject: 'Mathematics',
                  teacher: 'Prof. Smith',
                  uploadedAt: '1 day ago',
                  fileType: 'PDF',
                  size: '1.8 MB'
                },
                {
                  title: 'Organic Chemistry Lab Manual',
                  subject: 'Chemistry',
                  teacher: 'Prof. Davis',
                  uploadedAt: '2 days ago',
                  fileType: 'PDF',
                  size: '3.2 MB'
                }
              ].map((material, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex-shrink-0">
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {material.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {material.subject} • {material.teacher}
                    </p>
                    <p className="text-xs text-gray-500">
                      {material.uploadedAt} • {material.fileType} • {material.size}
                    </p>
                  </div>
                  <button className="ml-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Academic Progress Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg overflow-hidden"
      >
        <div className="px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Great Progress!</h3>
              <p className="text-blue-100 mb-4">
                You're doing exceptionally well this semester. Keep up the excellent work!
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm text-blue-200">Avg Attendance</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">A-</div>
                  <div className="text-sm text-blue-200">Current Grade</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">15</div>
                  <div className="text-sm text-blue-200">Assignments Done</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">4</div>
                  <div className="text-sm text-blue-200">Subjects</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <Award className="w-24 h-24 text-yellow-300 opacity-50" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentOverview;
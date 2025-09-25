import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  UserPlus,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import { showToast } from '../../utils/toast';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    // Only fetch stats if not already loaded
    if (!statsLoaded) {
      fetchStats();
    }
  }, [statsLoaded]);

  const fetchStats = async () => {
    // Prevent duplicate calls if already loading or loaded
    if (loading && statsLoaded) return;

    setLoading(true);
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
      setStatsLoaded(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const quickStats = [
    {
      name: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: <GraduationCap className="w-8 h-8" />,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: <Users className="w-8 h-8" />,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Active Classes',
      value: stats?.totalClasses || 0,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'increase'
    },
    {
      name: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: <UserPlus className="w-8 h-8" />,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'decrease'
    }
  ];

  // Sample data for charts
  const monthlyData = [
    { month: 'Jan', students: 45, teachers: 8 },
    { month: 'Feb', students: 52, teachers: 10 },
    { month: 'Mar', students: 58, teachers: 12 },
    { month: 'Apr', students: 65, teachers: 14 },
    { month: 'May', students: 72, teachers: 16 },
    { month: 'Jun', students: 78, teachers: 18 }
  ];

  const roleData = [
    { name: 'Students', value: stats?.totalStudents || 0, color: '#3b82f6' },
    { name: 'Teachers', value: stats?.totalTeachers || 0, color: '#10b981' },
    { name: 'Admins', value: stats?.totalAdmins || 1, color: '#8b5cf6' }
  ];

  const attendanceData = [
    { day: 'Mon', attendance: 85 },
    { day: 'Tue', attendance: 88 },
    { day: 'Wed', attendance: 82 },
    { day: 'Thu', attendance: 90 },
    { day: 'Fri', attendance: 86 },
    { day: 'Sat', attendance: 92 },
    { day: 'Sun', attendance: 78 }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your tuition management system.
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
        {/* Monthly Growth Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#3b82f6" name="Students" />
              <Bar dataKey="teachers" fill="#10b981" name="Teachers" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Roles Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {roleData.map((entry, index) => (
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

      {/* Weekly Attendance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
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

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white overflow-hidden shadow-md rounded-lg"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="px-6 py-4">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {[
                {
                  id: 1,
                  event: 'New teacher John Smith joined',
                  time: '2 hours ago',
                  icon: <Users className="w-5 h-5 text-green-500" />
                },
                {
                  id: 2,
                  event: 'Class "Advanced Mathematics" was created',
                  time: '4 hours ago',
                  icon: <BookOpen className="w-5 h-5 text-blue-500" />
                },
                {
                  id: 3,
                  event: 'Student approval request from Sarah Wilson',
                  time: '6 hours ago',
                  icon: <UserPlus className="w-5 h-5 text-yellow-500" />
                },
                {
                  id: 4,
                  event: 'Monthly attendance report generated',
                  time: '1 day ago',
                  icon: <Calendar className="w-5 h-5 text-purple-500" />
                }
              ].map((activity) => (
                <li key={activity.id} className="py-5">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.event}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOverview;
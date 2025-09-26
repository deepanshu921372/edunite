import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  BookOpen,
  UserPlus,
  Calendar
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
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
      color: 'bg-blue-500'
    },
    {
      name: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: <Users className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      name: 'Active Classes',
      value: stats?.totalClasses || 0,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      name: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: <UserPlus className="w-8 h-8" />,
      color: 'bg-yellow-500'
    }
  ];

  // Only show charts if we have meaningful data
  const hasData = stats && (stats.totalStudents > 0 || stats.totalTeachers > 0 || stats.totalClasses > 0);

  const roleData = [
    { name: 'Students', value: stats?.totalStudents || 0, color: '#3b82f6' },
    { name: 'Teachers', value: stats?.totalTeachers || 0, color: '#10b981' },
    { name: 'Admins', value: stats?.totalAdmins || 1, color: '#8b5cf6' }
  ].filter(item => item.value > 0); // Only show roles that have users

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your tuition center management.
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

      {/* User Distribution Chart - Only show if we have data */}
      {hasData && roleData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
      )}

      {/* Recent Activity - Show message instead of hardcoded data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white overflow-hidden shadow-md rounded-lg"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="px-6 py-8">
          <div className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Activity logs will appear here as users interact with the system.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOverview;
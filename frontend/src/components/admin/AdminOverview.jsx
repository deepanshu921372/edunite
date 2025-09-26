import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GraduationCap,
  BookOpen,
  UserPlus,
  Calendar,
  TrendingUp,
  Activity,
  BarChart3,
  Sparkles
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingSpinner message="Loading dashboard..." />
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-4 text-lg text-gray-600 font-medium"
          >
            Preparing your admin dashboard
          </motion.p>
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      name: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: <GraduationCap className="w-7 h-7" />,
      bgColor: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-200',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      growth: '+12%'
    },
    {
      name: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: <Users className="w-7 h-7" />,
      bgColor: 'from-green-500 to-green-600',
      shadowColor: 'shadow-green-200',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      growth: '+8%'
    },
    {
      name: 'Active Classes',
      value: stats?.totalClasses || 0,
      icon: <BookOpen className="w-7 h-7" />,
      bgColor: 'from-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-200',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      growth: '+15%'
    },
    {
      name: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: <UserPlus className="w-7 h-7" />,
      bgColor: 'from-amber-500 to-amber-600',
      shadowColor: 'shadow-amber-200',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
      growth: stats?.pendingRequests > 0 ? 'New!' : ''
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center md:text-left"
        >
          <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <div className="flex items-center justify-center md:justify-start space-x-2 mt-1">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <p className="text-gray-600 font-medium">
                  Here's what's happening with your tuition center management
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Decorative dot pattern */}
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${stat.textColor.replace('text-', 'bg-')}`} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* User Distribution Chart - Only show if we have data */}
        <AnimatePresence>
          {hasData && roleData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500"
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">User Distribution</h3>
                    <p className="text-sm text-gray-600 mt-1">Overview of your platform users</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={roleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={140}
                          paddingAngle={8}
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {roleData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              className="hover:opacity-80 transition-opacity duration-200"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {roleData.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                            {entry.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {entry.value}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({((entry.value / roleData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Activity - Show message instead of hardcoded data */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500"
        >
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600 mt-1">Latest system activities and updates</p>
              </div>
            </div>
          </div>

          <div className="p-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-2xl inline-block mb-6">
                <Calendar className="mx-auto h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No recent activity</h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Activity logs will appear here as users interact with the system. This includes user registrations, class enrollments, and administrative actions.
              </p>
              <motion.div
                className="mt-6 flex justify-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOverview;
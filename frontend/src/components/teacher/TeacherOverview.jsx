import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const TeacherOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
    try {
      const response = await teacherAPI.getTeacherStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const quickStats = [
    {
      name: 'My Classes',
      value: stats?.totalClasses || 0,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'increase'
    },
    {
      name: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: <Users className="w-8 h-8" />,
      color: 'bg-green-500',
      change: '+5',
      changeType: 'increase'
    },
    {
      name: 'Today\'s Classes',
      value: stats?.todayClasses || 0,
      icon: <Calendar className="w-8 h-8" />,
      color: 'bg-purple-500',
      change: '0',
      changeType: 'neutral'
    },
    {
      name: 'Materials Uploaded',
      value: stats?.materialsCount || 0,
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-orange-500',
      change: '+3',
      changeType: 'increase'
    }
  ];

  // Sample data for charts
  const attendanceData = [
    { week: 'Week 1', attendance: 85 },
    { week: 'Week 2', attendance: 88 },
    { week: 'Week 3', attendance: 82 },
    { week: 'Week 4', attendance: 90 },
    { week: 'Week 5', attendance: 86 },
    { week: 'Week 6', attendance: 92 }
  ];

  const classPerformanceData = [
    { class: 'Math-A', avgScore: 85, attendance: 90 },
    { class: 'Math-B', avgScore: 78, attendance: 85 },
    { class: 'Physics', avgScore: 82, attendance: 88 },
    { class: 'Chemistry', avgScore: 88, attendance: 92 }
  ];

  const studentDistribution = [
    { name: 'Present Today', value: 45, color: '#10b981' },
    { name: 'Absent Today', value: 8, color: '#ef4444' },
    { name: 'Late Today', value: 3, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's an overview of your classes and student progress.
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
                        stat.changeType === 'increase' ? 'text-green-600' :
                        stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.changeType !== 'neutral' && (
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {stat.changeType !== 'neutral' && '+'}
                          {stat.change}
                        </span>
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
        {/* Weekly Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
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

        {/* Today's Student Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Student Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={studentDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {studentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {studentDistribution.map((entry, index) => (
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

      {/* Class Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Class Performance Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="class" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgScore" fill="#3b82f6" name="Avg Score %" />
            <Bar dataKey="attendance" fill="#10b981" name="Attendance %" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Today's Schedule & Recent Activity */}
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
                  class: 'Advanced Mathematics',
                  room: 'Room A-101',
                  status: 'upcoming',
                  students: 28
                },
                {
                  time: '11:00 AM - 12:30 PM',
                  class: 'Physics Lab',
                  room: 'Lab B-201',
                  status: 'current',
                  students: 25
                },
                {
                  time: '02:00 PM - 03:30 PM',
                  class: 'Chemistry Theory',
                  room: 'Room C-102',
                  status: 'upcoming',
                  students: 30
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
                        {schedule.class}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {schedule.students} students
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{schedule.time}</p>
                    <p className="text-xs text-gray-500">{schedule.room}</p>
                  </div>
                  {schedule.status === 'current' && (
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Live
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
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
                    event: 'Attendance marked for Advanced Mathematics',
                    time: '2 hours ago',
                    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                    details: '26 out of 28 students present'
                  },
                  {
                    id: 2,
                    event: 'New material uploaded for Physics Lab',
                    time: '4 hours ago',
                    icon: <FileText className="w-5 h-5 text-blue-500" />,
                    details: 'Lab Manual Chapter 5.pdf'
                  },
                  {
                    id: 3,
                    event: 'Student Sarah asked a question',
                    time: '6 hours ago',
                    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
                    details: 'About quantum mechanics concepts'
                  },
                  {
                    id: 4,
                    event: 'Timetable updated for next week',
                    time: '1 day ago',
                    icon: <Calendar className="w-5 h-5 text-purple-500" />,
                    details: 'Chemistry class moved to Lab A-101'
                  }
                ].map((activity) => (
                  <li key={activity.id} className="py-5">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.event}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.details}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
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
    </div>
  );
};

export default TeacherOverview;
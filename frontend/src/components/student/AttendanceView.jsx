import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  BarChart3,
  AlertTriangle,
  Award,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { studentAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const AttendanceView = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const periodOptions = [
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'thisSemester', label: 'This Semester' },
    { value: 'thisYear', label: 'This Year' }
  ];

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedPeriod]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      let startDate;

      switch (selectedPeriod) {
        case 'thisWeek':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'thisMonth':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'thisQuarter':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'thisSemester':
          startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'thisYear':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const response = await studentAPI.getMyAttendance(startDate, endDate);
      setAttendanceData(response.data?.attendanceRecords || []);
      setStats(response.data?.statistics || null);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const processAttendanceData = () => {
    if (!attendanceData.length) return [];

    const grouped = attendanceData.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { date, present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[date][record.status]++;
      acc[date].total++;
      return acc;
    }, {});

    return Object.values(grouped).map(day => ({
      ...day,
      attendance: ((day.present + day.late) / day.total * 100).toFixed(1)
    }));
  };

  const subjectWiseData = () => {
    if (!attendanceData.length) return [];

    const subjects = attendanceData.reduce((acc, record) => {
      if (!acc[record.subject]) {
        acc[record.subject] = { subject: record.subject, present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[record.subject][record.status]++;
      acc[record.subject].total++;
      return acc;
    }, {});

    return Object.values(subjects).map(subject => ({
      ...subject,
      attendance: ((subject.present + subject.late) / subject.total * 100).toFixed(1)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-100';
      case 'absent':
        return 'text-red-600 bg-red-100';
      case 'late':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const chartData = processAttendanceData();
  const subjectData = subjectWiseData();

  const overallStats = stats || {
    totalClasses: attendanceData.length,
    present: attendanceData.filter(r => r.status === 'present').length,
    absent: attendanceData.filter(r => r.status === 'absent').length,
    late: attendanceData.filter(r => r.status === 'late').length,
    overallPercentage: 0
  };

  if (overallStats.totalClasses > 0) {
    overallStats.overallPercentage = ((overallStats.present + overallStats.late) / overallStats.totalClasses * 100).toFixed(1);
  }

  const pieData = [
    { name: 'Present', value: overallStats.present, color: '#10b981' },
    { name: 'Absent', value: overallStats.absent, color: '#ef4444' },
    { name: 'Late', value: overallStats.late, color: '#f59e0b' }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading attendance data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Attendance</h2>
          <p className="mt-2 text-gray-600">
            Track your attendance record and analyze your participation patterns.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            name: 'Total Classes',
            value: overallStats.totalClasses,
            icon: <Calendar className="w-8 h-8" />,
            color: 'bg-blue-500',
          },
          {
            name: 'Present',
            value: overallStats.present,
            icon: <CheckCircle className="w-8 h-8" />,
            color: 'bg-green-500',
            percentage: overallStats.totalClasses > 0 ? (overallStats.present / overallStats.totalClasses * 100).toFixed(1) : 0
          },
          {
            name: 'Absent',
            value: overallStats.absent,
            icon: <XCircle className="w-8 h-8" />,
            color: 'bg-red-500',
            percentage: overallStats.totalClasses > 0 ? (overallStats.absent / overallStats.totalClasses * 100).toFixed(1) : 0
          },
          {
            name: 'Late',
            value: overallStats.late,
            icon: <Clock className="w-8 h-8" />,
            color: 'bg-yellow-500',
            percentage: overallStats.totalClasses > 0 ? (overallStats.late / overallStats.totalClasses * 100).toFixed(1) : 0
          }
        ].map((stat, index) => (
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
                      {stat.percentage && (
                        <div className="ml-2 text-sm text-gray-600">
                          ({stat.percentage}%)
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Attendance Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`rounded-lg shadow-lg overflow-hidden ${
          overallStats.overallPercentage >= 90
            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
            : overallStats.overallPercentage >= 75
            ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
            : 'bg-gradient-to-r from-red-500 to-pink-600'
        }`}
      >
        <div className="px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Overall Attendance: {overallStats.overallPercentage}%
              </h3>
              <p className="text-white opacity-90 mb-4">
                {overallStats.overallPercentage >= 90
                  ? 'Excellent! You have outstanding attendance.'
                  : overallStats.overallPercentage >= 75
                  ? 'Good attendance! Keep it up.'
                  : 'Your attendance needs improvement. Consider attending more classes.'
                }
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  <span>Target: 90%</span>
                </div>
                {overallStats.overallPercentage >= 90 && (
                  <div className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    <span>Goal Achieved!</span>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              {overallStats.overallPercentage >= 90 ? (
                <Award className="w-24 h-24 text-white opacity-20" />
              ) : (
                <TrendingUp className="w-24 h-24 text-white opacity-20" />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      {chartData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Attendance Trend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [`${value}%`, 'Attendance']}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Status Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                {pieData.map((entry, index) => (
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

          {/* Subject-wise Performance */}
          {subjectData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subject-wise Attendance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                  <Bar dataKey="attendance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Recent Attendance Records */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white shadow-md rounded-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Attendance Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.slice(0, 10).map((record, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.teacherName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.markedAt ? new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance data</h3>
          <p className="mt-1 text-sm text-gray-500">
            No attendance records found for the selected period.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
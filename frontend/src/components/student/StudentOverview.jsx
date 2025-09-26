import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Award,
  FileText,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  User
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
  const [todayClasses, setTodayClasses] = useState([]);
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
      // Fetch stats and today's schedule in parallel
      const [statsResponse] = await Promise.all([
        studentAPI.getStudentStats(),
        fetchTodaySchedule()
      ]);
      setStats(statsResponse);
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

  const fetchTodaySchedule = async () => {
    try {
      // Get student's grade from profile
      const studentGrade = userProfile?.profile?.grade;
      if (!studentGrade) {
        console.log('No grade found for student');
        setTodayClasses([]);
        return;
      }

      // Get today's day name
      const today = new Date();
      const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

      // Fetch timetable data for the student's grade
      const response = await studentAPI.getTimetable();

      // Process timetable data to find today's classes
      const timetableData = Array.isArray(response) ? response : response?.data || [];
      const todaysClasses = [];
      const now = new Date();

      timetableData.forEach(timetableEntry => {
        // Check if this timetable entry matches the student's grade
        if (timetableEntry.grade === studentGrade && timetableEntry.schedule) {
          timetableEntry.schedule.forEach(scheduleItem => {
            if (scheduleItem.day === dayName) {
              scheduleItem.timeSlots.forEach(timeSlot => {
                // Check if the class is upcoming (not already over)
                const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
                const classStartTime = new Date();
                classStartTime.setHours(hours, minutes, 0, 0);

                // Only include classes that haven't started yet or are currently ongoing
                if (classStartTime >= now ||
                    (classStartTime <= now && now <= (() => {
                      const [endHours, endMinutes] = timeSlot.endTime.split(':').map(Number);
                      const endTime = new Date();
                      endTime.setHours(endHours, endMinutes, 0, 0);
                      return endTime;
                    })())) {

                  todaysClasses.push({
                    id: `${timetableEntry._id}-${scheduleItem.day}-${timeSlot.startTime}`,
                    subject: timeSlot.subject || timetableEntry.subject || 'Subject',
                    teacher: timetableEntry.teacher || 'Teacher',
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime,
                    location: timetableEntry.location || 'Online',
                    status: classStartTime <= now ? 'Ongoing' : 'Scheduled'
                  });
                }
              });
            }
          });
        }
      });

      // Sort classes by start time
      todaysClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setTodayClasses(todaysClasses);

    } catch (error) {
      console.error('Error fetching today\'s schedule:', error);
      // Don't throw error here, just set empty schedule
      setTodayClasses([]);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="px-4 sm:px-0">
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Unable to load dashboard</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchStudentStats();
            }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      name: 'Enrolled Classes',
      value: stats?.totalClasses || 0,
      icon: <BookOpen className="w-7 h-7" />,
      bgColor: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-200',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50'
    },
    {
      name: 'Overall Attendance',
      value: `${stats?.overallAttendance || 0}%`,
      icon: <Calendar className="w-7 h-7" />,
      bgColor: 'from-green-500 to-green-600',
      shadowColor: 'shadow-green-200',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50'
    },
    {
      name: 'Materials Downloaded',
      value: stats?.materialsDownloaded || 0,
      icon: <FileText className="w-7 h-7" />,
      bgColor: 'from-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-200',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50'
    },
    {
      name: 'Academic Score',
      value: `${stats?.academicScore || 0}%`,
      icon: <Award className="w-7 h-7" />,
      bgColor: 'from-orange-500 to-orange-600',
      shadowColor: 'shadow-orange-200',
      textColor: 'text-orange-700',
      bgLight: 'bg-orange-50'
    }
  ];

  // Only show data if we have meaningful information
  const hasData = stats && (stats.totalClasses > 0 || stats.overallAttendance > 0);

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Welcome back! Here's an overview of your tuition progress and activities.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgLight} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
                  <div className={stat.textColor}>
                    {stat.icon}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.name}
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
      >
        <div className="px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Today's Schedule</h3>
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              {todayClasses.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {todayClasses.length} class{todayClasses.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {todayClasses.length > 0 ? (
            <div className="space-y-3">
              {todayClasses.map((classItem, index) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    classItem.status === 'Ongoing'
                      ? 'border-green-500 bg-green-50'
                      : 'border-blue-500 bg-blue-50'
                  } hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{classItem.subject}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          classItem.status === 'Ongoing'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {classItem.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{classItem.startTime} - {classItem.endTime}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <User className="w-3 h-3 mr-1" />
                          <span>{classItem.teacher}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{classItem.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">No classes scheduled</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Your class schedule will appear here when classes are scheduled.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Study Materials - Show message instead of hardcoded data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
      >
        <div className="px-4 sm:px-6 py-4 sm:py-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Study Materials</h3>
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">No study materials yet</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Study materials uploaded by your teachers will appear here.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentOverview;
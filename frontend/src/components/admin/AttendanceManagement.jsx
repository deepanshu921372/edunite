import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Clock,
  User,
  UserCheck,
  UserX
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import { showToast } from '../../utils/toast';

const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
  });
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, teachers
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (classes.length > 0 || teachers.length > 0) {
      fetchAttendanceData();
    }
  }, [selectedDateRange, selectedClass, selectedTeacher]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch all necessary data in parallel
      const [usersResponse, classesResponse] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getClasses()
      ]);

      const allUsers = usersResponse.data || usersResponse;
      const allClasses = classesResponse.data || classesResponse;

      // Separate students and teachers
      const studentsList = allUsers.filter(user => user.role === 'student' && user.isApproved);
      const teachersList = allUsers.filter(user => user.role === 'teacher' && user.isApproved);

      setStudents(studentsList);
      setTeachers(teachersList);
      setClasses(allClasses);

      console.log('Loaded data:', {
        students: studentsList.length,
        teachers: teachersList.length,
        classes: allClasses.length
      });
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showToast('Failed to load initial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const params = {
        startDate: selectedDateRange.startDate,
        endDate: selectedDateRange.endDate,
        limit: 100 // Get more records for admin
      };

      if (selectedClass) params.classId = selectedClass;
      if (selectedTeacher) params.teacherId = selectedTeacher;

      console.log('Fetching attendance with params:', params);

      // Try to get attendance data - if admin endpoint fails, try general endpoint
      let response;
      try {
        response = await adminAPI.getAttendance(params);
      } catch (adminError) {
        console.log('Admin endpoint failed, trying general attendance endpoint:', adminError);
        // Fallback to general attendance endpoint
        const { api } = await import('../../services/api');
        response = await api.get('/attendance', { params });
      }

      console.log('Raw attendance response:', response);

      // Handle different response formats
      let attendanceArray = [];

      if (response.attendance) {
        attendanceArray = response.attendance;
      } else if (response.data?.attendance) {
        attendanceArray = response.data.attendance;
      } else if (Array.isArray(response)) {
        attendanceArray = response;
      } else if (Array.isArray(response.data)) {
        attendanceArray = response.data;
      }

      console.log('Processed attendance data:', attendanceArray);
      console.log('Attendance count:', attendanceArray.length);

      setAttendanceData(attendanceArray);

      if (attendanceArray.length === 0) {
        console.log('No attendance data found - this might be normal if no attendance has been marked yet');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      console.error('Error details:', error.response?.data || error.message);
      showToast('Failed to load attendance data', 'error');
      // Set empty array on error to show "no data" message
      setAttendanceData([]);
    }
  };

  // Calculate attendance statistics
  const calculateAttendanceStats = () => {
    if (!attendanceData.length) return { totalSessions: 0, averageAttendance: 0, totalStudents: 0, totalTeachers: 0 };

    const totalSessions = attendanceData.length;
    let totalStudentAttendances = 0;
    let totalPossibleAttendances = 0;

    attendanceData.forEach(session => {
      const presentStudents = session.students.filter(s => s.status === 'present').length;
      totalStudentAttendances += presentStudents;
      totalPossibleAttendances += session.students.length;
    });

    const averageAttendance = totalPossibleAttendances > 0
      ? Math.round((totalStudentAttendances / totalPossibleAttendances) * 100)
      : 0;

    const uniqueStudents = new Set();
    const uniqueTeachers = new Set();

    attendanceData.forEach(session => {
      session.students.forEach(s => uniqueStudents.add(s.student._id));
      uniqueTeachers.add(session.teacher._id);
    });

    return {
      totalSessions,
      averageAttendance,
      totalStudents: uniqueStudents.size,
      totalTeachers: uniqueTeachers.size
    };
  };

  // Calculate individual student attendance
  const calculateStudentAttendance = () => {
    const studentAttendanceMap = new Map();

    attendanceData.forEach(session => {
      if (session.students && Array.isArray(session.students)) {
        session.students.forEach(studentRecord => {
          if (studentRecord.student && studentRecord.student._id) {
            const studentId = studentRecord.student._id;
            const student = studentRecord.student;

            if (!studentAttendanceMap.has(studentId)) {
              studentAttendanceMap.set(studentId, {
                student,
                totalClasses: 0,
                presentClasses: 0,
                absentClasses: 0,
                attendancePercentage: 0
              });
            }

            const record = studentAttendanceMap.get(studentId);
            record.totalClasses++;

            if (studentRecord.status === 'present') {
              record.presentClasses++;
            } else {
              record.absentClasses++;
            }

            record.attendancePercentage = record.totalClasses > 0
              ? Math.round((record.presentClasses / record.totalClasses) * 100)
              : 0;
          }
        });
      }
    });

    return Array.from(studentAttendanceMap.values())
      .filter(record =>
        !searchTerm ||
        (record.student.name && record.student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.student.email && record.student.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  };

  // Calculate individual teacher attendance
  const calculateTeacherAttendance = () => {
    const teacherAttendanceMap = new Map();

    attendanceData.forEach(session => {
      if (session.teacher && session.teacher._id) {
        const teacherId = session.teacher._id;
        const teacher = session.teacher;

        if (!teacherAttendanceMap.has(teacherId)) {
          teacherAttendanceMap.set(teacherId, {
            teacher,
            totalClasses: 0,
            presentClasses: 0,
            absentClasses: 0,
            attendancePercentage: 0
          });
        }

        const record = teacherAttendanceMap.get(teacherId);
        record.totalClasses++;

        if (session.teacherAttendance && session.teacherAttendance.status === 'present') {
          record.presentClasses++;
        } else {
          record.absentClasses++;
        }

        record.attendancePercentage = record.totalClasses > 0
          ? Math.round((record.presentClasses / record.totalClasses) * 100)
          : 0;
      }
    });

    return Array.from(teacherAttendanceMap.values())
      .filter(record =>
        !searchTerm ||
        (record.teacher.name && record.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.teacher.email && record.teacher.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  };

  const stats = calculateAttendanceStats();
  const studentAttendanceList = calculateStudentAttendance();
  const teacherAttendanceList = calculateTeacherAttendance();

  const quickStats = [
    {
      name: 'Total Sessions',
      value: stats.totalSessions,
      icon: <Calendar className="w-7 h-7" />,
      bgColor: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-200',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      growth: stats.totalSessions > 0 ? `${stats.totalSessions} recorded` : 'No data'
    },
    {
      name: 'Average Attendance',
      value: `${stats.averageAttendance}%`,
      icon: <BarChart3 className="w-7 h-7" />,
      bgColor: 'from-green-500 to-green-600',
      shadowColor: 'shadow-green-200',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      growth: stats.averageAttendance >= 80 ? 'Good' : stats.averageAttendance >= 60 ? 'Average' : 'Needs attention'
    },
    {
      name: 'Active Students',
      value: stats.totalStudents,
      icon: <GraduationCap className="w-7 h-7" />,
      bgColor: 'from-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-200',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      growth: `${stats.totalStudents} students`
    },
    {
      name: 'Active Teachers',
      value: stats.totalTeachers,
      icon: <Users className="w-7 h-7" />,
      bgColor: 'from-amber-500 to-amber-600',
      shadowColor: 'shadow-amber-200',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
      growth: `${stats.totalTeachers} teachers`
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingSpinner message="Loading attendance data..." />
          </motion.div>
        </div>
      </div>
    );
  }

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
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Attendance Management
              </h1>
              <p className="text-gray-600 font-medium mt-1">
                Monitor and analyze attendance for all students and teachers
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={selectedDateRange.startDate}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={selectedDateRange.endDate}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Class Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option key="all-classes" value="">All Classes</option>
                  {classes.map((cls, idx) => (
                    <option
                      key={cls._id || cls.id || idx}
                      value={cls._id || cls.id}
                    >
                      {cls.name} - {cls.subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Teacher</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option key="all-teachers" value="">All Teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Debug Info - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
          >
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>Students loaded: {students.length}</p>
              <p>Teachers loaded: {teachers.length}</p>
              <p>Classes loaded: {classes.length}</p>
              <p>Attendance records: {attendanceData.length}</p>
              <p>Date range: {selectedDateRange.startDate} to {selectedDateRange.endDate}</p>
              <p>Selected class: {selectedClass || 'All'}</p>
              <p>Selected teacher: {selectedTeacher || 'All'}</p>
              <button
                onClick={fetchAttendanceData}
                className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300"
              >
                Refresh Attendance Data
              </button>
            </div>
          </motion.div>
        )}

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
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              <div className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgLight} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
                    <div className={stat.textColor}>
                      {stat.icon}
                    </div>
                  </div>
                  {stat.growth && (
                    <div className={`px-2 py-1 ${stat.bgLight} ${stat.textColor} text-xs font-semibold rounded-full`}>
                      {stat.growth}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.name}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'students', name: 'Student Attendance', icon: GraduationCap },
                { id: 'teachers', name: 'Teacher Attendance', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {attendanceData.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No attendance data found</h3>
                    <p className="text-gray-600 mb-4">No attendance records found for the selected filters.</p>
                    <div className="text-sm text-gray-500 space-y-2">
                      <p>This could be because:</p>
                      <ul className="list-disc text-left inline-block space-y-1">
                        <li>No attendance has been marked yet by any teachers</li>
                        <li>The selected date range contains no records</li>
                        <li>The selected filters are too restrictive</li>
                        <li>There may be a connectivity issue</li>
                      </ul>
                      <p className="mt-4">
                        <strong>To get attendance data:</strong><br/>
                        1. Teachers need to mark attendance for their classes<br/>
                        2. Try expanding the date range (currently set to 1 year)<br/>
                        3. Remove any class/teacher filters<br/>
                        4. Check the Network tab for API errors
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Attendance Sessions</h3>
                    <div className="grid gap-4">
                      {attendanceData.slice(0, 10).map((session, index) => {
                        const presentCount = session.students ? session.students.filter(s => s.status === 'present').length : 0;
                        const totalCount = session.students ? session.students.length : 0;
                        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

                        return (
                          <motion.div
                            key={session._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {session.class?.name || 'Unknown Class'} - {session.class?.subject || 'Unknown Subject'}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Teacher: {session.teacher?.name || 'Unknown Teacher'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(session.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    {presentCount}
                                  </span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-gray-600">{totalCount}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {percentage}% present
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'students' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid gap-4">
                  {studentAttendanceList.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No student attendance data</h3>
                      <p className="text-gray-600">No student attendance records found for the selected filters.</p>
                    </div>
                  ) : (
                    studentAttendanceList.map((record, index) => (
                      <motion.div
                        key={record.student._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${
                              record.attendancePercentage >= 80 ? 'bg-green-100' :
                              record.attendancePercentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <User className={`w-5 h-5 ${
                                record.attendancePercentage >= 80 ? 'text-green-600' :
                                record.attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{record.student.name}</h4>
                              <p className="text-sm text-gray-600">{record.student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              record.attendancePercentage >= 80 ? 'text-green-600' :
                              record.attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {record.attendancePercentage}%
                            </div>
                            <p className="text-xs text-gray-500">
                              {record.presentClasses}/{record.totalClasses} classes
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'teachers' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid gap-4">
                  {teacherAttendanceList.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No teacher attendance data</h3>
                      <p className="text-gray-600">No teacher attendance records found for the selected filters.</p>
                    </div>
                  ) : (
                    teacherAttendanceList.map((record, index) => (
                      <motion.div
                        key={record.teacher._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${
                              record.attendancePercentage >= 80 ? 'bg-green-100' :
                              record.attendancePercentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <User className={`w-5 h-5 ${
                                record.attendancePercentage >= 80 ? 'text-green-600' :
                                record.attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{record.teacher.name}</h4>
                              <p className="text-sm text-gray-600">{record.teacher.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              record.attendancePercentage >= 80 ? 'text-green-600' :
                              record.attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {record.attendancePercentage}%
                            </div>
                            <p className="text-xs text-gray-500">
                              {record.presentClasses}/{record.totalClasses} classes
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
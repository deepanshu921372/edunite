import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  History,
  Search,
  Filter
} from 'lucide-react';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const AttendanceManagement = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [attendance, setAttendance] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    class: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchClasses();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudentsForAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await teacherAPI.getMyClasses();
      console.log('Classes response:', response);
      setClasses(response.data || response || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchStudentsForAttendance = async () => {
    setLoading(true);
    try {
      const response = await teacherAPI.getStudentsForAttendance(selectedClass, selectedDate);
      setStudents(response.data?.students || []);

      // Initialize attendance state
      const initialAttendance = {};
      response.data?.students.forEach(student => {
        initialAttendance[student.id] = student.attendanceStatus || 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students for attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!historyFilters.class) {
      toast.error('Please select a class to view history');
      return;
    }

    setLoading(true);
    try {
      const response = await teacherAPI.getAttendanceHistory(
        historyFilters.class,
        historyFilters.startDate,
        historyFilters.endDate
      );
      setAttendanceHistory(response.data || []);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        },
        (error) => {
          console.warn('Error getting location:', error);
          toast.error('Unable to get current location');
        }
      );
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast.error('Please select class and date');
      return;
    }

    if (Object.keys(attendance).length === 0) {
      toast.error('No students to mark attendance for');
      return;
    }

    setSaving(true);
    try {
      const attendanceData = {
        classId: selectedClass,
        date: selectedDate,
        location: location,
        coordinates: currentLocation,
        attendance: Object.entries(attendance).map(([studentId, status]) => ({
          studentId,
          status
        }))
      };

      await teacherAPI.markAttendance(attendanceData);
      toast.success('Attendance marked successfully');

      // Reset form
      setAttendance({});
      setStudents([]);

    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const totalStudents = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;

    return { totalStudents, present, absent, late };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="mt-2 text-gray-600">
            Mark and track student attendance for your classes.
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <History className="w-4 h-4 mr-2" />
          {showHistory ? 'Mark Attendance' : 'View History'}
        </button>
      </div>

      {!showHistory ? (
        <>
          {/* Class and Date Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Class & Date</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location or use GPS"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          {students.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Students',
                  value: stats.totalStudents,
                  color: 'bg-blue-500',
                  icon: <Users className="w-5 h-5" />
                },
                {
                  label: 'Present',
                  value: stats.present,
                  color: 'bg-green-500',
                  icon: <CheckCircle className="w-5 h-5" />
                },
                {
                  label: 'Absent',
                  value: stats.absent,
                  color: 'bg-red-500',
                  icon: <XCircle className="w-5 h-5" />
                },
                {
                  label: 'Late',
                  value: stats.late,
                  color: 'bg-yellow-500',
                  icon: <Clock className="w-5 h-5" />
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <div className={`${stat.color} text-white p-2 rounded-lg`}>
                      {stat.icon}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Students List */}
          {loading ? (
            <LoadingSpinner message="Loading students..." />
          ) : students.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Mark Attendance</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select attendance status for each student
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.rollNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {['present', 'absent', 'late'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(student.id, status)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-200 ${
                                  attendance[student.id] === status
                                    ? status === 'present'
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : status === 'absent'
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={saving || Object.keys(attendance).length === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" message="" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Mark Attendance
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : selectedClass && selectedDate ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-500">
                No students are enrolled in this class or available for the selected date.
              </p>
            </div>
          ) : null}
        </>
      ) : (
        /* Attendance History */
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance History Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={historyFilters.class}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, class: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={historyFilters.startDate}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={historyFilters.endDate}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchAttendanceHistory}
                  disabled={loading || !historyFilters.class}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" message="" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {attendanceHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceHistory.map((record, index) => (
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
                          {record.totalStudents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {record.present}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {record.absent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {record.late}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.attendancePercentage >= 90
                              ? 'bg-green-100 text-green-800'
                              : record.attendancePercentage >= 75
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.attendancePercentage.toFixed(1)}%
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceManagement;
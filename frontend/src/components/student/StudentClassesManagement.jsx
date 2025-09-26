import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  User,
  Calendar,
  GraduationCap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { studentAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import { showToast } from '../../utils/toast';

const StudentClassesManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentGrade, setStudentGrade] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getClasses();

      // Handle different response structures
      let data;
      if (response.data && response.data.success) {
        // If response is wrapped in success format
        data = response.data;
      } else if (response.success) {
        // If response is direct success format
        data = response;
      } else {
        // Direct data
        data = response.data || response;
      }


      const classesData = data.data || [];
      const grade = data.studentGrade || '';


      setClasses(classesData);
      setStudentGrade(grade);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showToast("Failed to load classes", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule)) return 'No schedule available';

    return schedule.map(daySchedule => {
      const times = daySchedule.timeSlots.map(slot =>
        `${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`
      ).join(', ');
      return `${daySchedule.day}: ${times}`;
    }).join(' | ');
  };

  const getDaysFromSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule)) return [];
    return schedule.map(daySchedule => daySchedule.day);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your classes..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
          <p className="mt-2 text-gray-600">
            View all classes scheduled for your grade ({studentGrade}) and their timetables.
          </p>
        </div>
        <button
          onClick={fetchClasses}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Your Grade</p>
              <p className="text-2xl font-bold text-gray-900">{studentGrade}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(classes.map(cls => cls.subject)).size}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Classes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {classes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No classes have been scheduled for your grade yet. Check back later.
            </p>
          </div>
        ) : (
          classes.map((classItem, index) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {classItem.subject}
                      </h3>
                      <p className="text-sm text-gray-500">{classItem.className}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {classItem.grade}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">Teacher:</span>
                    <span className="ml-1">{classItem.teacher.name}</span>
                  </div>

                  {classItem.teacher.specialization && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Specialization:</span>
                      <span className="ml-1">{classItem.teacher.specialization}</span>
                    </div>
                  )}

                  <div className="flex items-start text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Schedule:</span>
                      <div className="mt-1">
                        {getDaysFromSchedule(classItem.schedule).map(day => (
                          <span key={day} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Timings:</span>
                      <p className="mt-1 text-xs">{formatSchedule(classItem.schedule)}</p>
                    </div>
                  </div>

                  {classItem.description && (
                    <div className="flex items-start text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="mt-1">{classItem.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default StudentClassesManagement;
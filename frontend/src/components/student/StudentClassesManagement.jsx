import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  User,
  Calendar,
  GraduationCap,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { studentAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import { showToast } from "../../utils/toast";

const StudentClassesManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentGrade, setStudentGrade] = useState("");

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
      const grade = data.studentGrade || "";

      setClasses(classesData);
      setStudentGrade(grade);
    } catch (error) {
      console.error("Error fetching classes:", error);
      showToast("Failed to load classes", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule)) return "No schedule available";

    return schedule
      .map((daySchedule) => {
        const times = daySchedule.timeSlots
          .map(
            (slot) =>
              `${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`
          )
          .join(", ");
        return `${daySchedule.day}: ${times}`;
      })
      .join(" | ");
  };

  const getDaysFromSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule)) return [];
    return schedule.map((daySchedule) => daySchedule.day);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your classes..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Classes
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            View all classes scheduled for your grade ({studentGrade}) and their
            timetables.
          </p>
        </div>
        <button
          onClick={fetchClasses}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 100,
          }}
          whileHover={{
            y: -5,
            scale: 1.02,
            transition: { duration: 0.2 },
          }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-blue-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

          <div className="p-4 sm:p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <div className="text-blue-700">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Total Classes
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {classes.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.1,
            type: "spring",
            stiffness: 100,
          }}
          whileHover={{
            y: -5,
            scale: 1.02,
            transition: { duration: 0.2 },
          }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-green-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

          <div className="p-4 sm:p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <div className="text-green-700">
                  <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Your Grade
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {studentGrade}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            type: "spring",
            stiffness: 100,
          }}
          whileHover={{
            y: -5,
            scale: 1.02,
            transition: { duration: 0.2 },
          }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-purple-200 transition-all duration-300 cursor-pointer group overflow-hidden relative sm:col-span-2 lg:col-span-1"
        >
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

          <div className="p-4 sm:p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <div className="text-purple-700">
                  <User className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Subjects
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {new Set(classes.map((cls) => cls.subject)).size}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Classes Table */}
      {classes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="px-4 sm:px-8 py-12 sm:py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              No classes found
            </h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              No classes have been scheduled for your grade yet. Check back
              later or contact your administrator.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">My Classes</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {classes.length} class{classes.length !== 1 ? 'es' : ''} found
                </p>
              </div>
              <div className="flex gap-4 items-center justify-center bg-blue-50/50 rounded-lg px-4 py-2 min-w-[90px]">
                <BookOpen className="w-8 h-8 text-blue-600 mb-1" />
                <span className="text-xl font-semibold text-gray-900 leading-tight">{classes.length} Total</span>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Class Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Timings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {classes.map((classItem, index) => (
                  <motion.tr
                    key={classItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="hover:bg-blue-50/30 transition-colors duration-200 group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 hidden sm:block">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                            {classItem.subject}
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {classItem.className}
                          </div>
                          {classItem.description && (
                            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                              {classItem.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{classItem.teacher.name}</div>
                        {classItem.teacher.specialization && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {classItem.teacher.specialization}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2 max-w-sm">
                        {getDaysFromSchedule(classItem.schedule).map((day) => (
                          <span
                            key={day}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200 mr-1 mb-1"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatSchedule(classItem.schedule)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200">
                        {classItem.grade}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {classes.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-4 sm:p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        {classItem.subject}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {classItem.className}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                    {classItem.grade}
                  </span>
                </div>

                <div className="space-y-2">
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {getDaysFromSchedule(classItem.schedule).map((day) => (
                          <span
                            key={day}
                            className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                          >
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
                        <p className="mt-1 text-xs">{classItem.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentClassesManagement;

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
  Filter,
  AlertTriangle,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { teacherAPI, studentAPI, adminAPI, api } from '../../services/api';
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
  const [error, setError] = useState(null);
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
    } else {
      setStudents([]);
      setAttendance({});
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      setError(null);
      const response = await teacherAPI.getMyClasses();

      // Handle different response structures
      let classesData = [];
      if (response?.data) {
        classesData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        classesData = response;
      } else if (response?.classes) {
        classesData = Array.isArray(response.classes) ? response.classes : [response.classes];
      }

      setClasses(classesData);

      if (classesData.length === 0) {
        toast.error('No classes found. Please create a class first.');
      }
    } catch (error) {
      setError('Failed to load classes. Please try again.');
      toast.error('Failed to load classes');
    }
  };

  const fetchStudentsForAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
  
    setLoading(true);
    setError(null);
  
    try {
      // Get the selected class info to understand grade and subject
      const selectedClassInfo = classes.find(c => (c.id || c._id) === selectedClass);
  
      if (!selectedClassInfo) {
        throw new Error('Selected class not found');
      }
  
      // Extract grade and subject from class info
      let grade = selectedClassInfo?.grade;
      let subject = selectedClassInfo?.subject;
  
      // If not found in direct properties, extract from class name
      if (selectedClassInfo?.name) {
  
        // Extract grade (handles formats like "11th", "12th", etc.)
        if (!grade) {
          const gradeMatch = selectedClassInfo.name.match(/(\d+)(?:th|st|nd|rd)?/i);
          if (gradeMatch) {
            grade = gradeMatch[1] + 'th';
          }
        }
  
        // Extract subject (handles multiple formats)
        if (!subject) {
          // Format 1: "11th Mathematics (Mathematics)" - extract first subject
          let subjectMatch = selectedClassInfo.name.match(/\d+(?:th|st|nd|rd)?\s+([^(]+)/i);
          if (subjectMatch) {
            subject = subjectMatch[1].trim();
          } else {
            // Format 2: "(Mathematics)" - extract from parentheses
            subjectMatch = selectedClassInfo.name.match(/\(([^)]+)\)/);
            if (subjectMatch) {
              subject = subjectMatch[1].trim();
            } else {
              // Format 3: Try to get everything after grade
              subjectMatch = selectedClassInfo.name.match(/\d+(?:th|st|nd|rd)?\s+(.+)/i);
              if (subjectMatch) {
                subject = subjectMatch[1].trim();
              }
            }
          }
        }
      }
  
      // Handle specific cases from your data structure
      if (selectedClassInfo?.subjects && Array.isArray(selectedClassInfo.subjects) && selectedClassInfo.subjects.length > 0) {
        subject = selectedClassInfo.subjects[0]; // Take first subject
      }

  
  
      let studentsData = [];
  
      // IMPROVED APPROACH: Try backend endpoints that likely exist in your system
      try {
        
        let allUsersResponse;
        let endpointUsed = '';
        
        // Method 1: Try to get students from class directly
        try {
          allUsersResponse = await teacherAPI.getClassStudents(selectedClass);
          endpointUsed = 'class students';
        } catch (classStudentsError) {
          
          // Method 2: Try the teacher's existing getAllStudents endpoint but make sure it returns users, not classes
          try {
            allUsersResponse = await teacherAPI.getAllStudents();
            endpointUsed = 'teacher/students';
          } catch (teacherStudentsError) {
            
            // Method 3: Try admin endpoint with proper error handling
            try {
              allUsersResponse = await adminAPI.getAllUsers();
              endpointUsed = 'admin/users';
            } catch (adminError) {
              
              // Method 4: Create a new endpoint call that should work
              try {
                // This calls your backend to get all users from MongoDB users collection
                allUsersResponse = await api.get('/auth/all-users', {
                  params: { role: 'student' }
                });
                endpointUsed = 'auth/all-users';
              } catch (authUsersError) {
                
                // Method 5: Try a general user listing endpoint
                try {
                  allUsersResponse = await api.get('/user/list', {
                    params: { type: 'student', grade: grade }
                  });
                  endpointUsed = 'user/list';
                } catch (userListError) {
                  
                  // Method 6: Backend might need a custom endpoint - suggest it to user
                  throw new Error(`No working user endpoints found. Your backend needs one of these endpoints:
                    - GET /admin/users (returns all users)
                    - GET /teacher/students (returns actual student users, not classes)
                    - GET /auth/all-users?role=student
                    - GET /user/list?type=student
                    
                    Currently all endpoints return 404 or class objects instead of user objects.
                    Please check your backend routes and ensure they return user documents from your MongoDB users collection.`);
                }
              }
            }
          }
        }
  
  
        // Process the response to extract users array
        let allUsers = [];
        if (allUsersResponse?.data) {
          allUsers = Array.isArray(allUsersResponse.data) ? allUsersResponse.data : [allUsersResponse.data];
        } else if (Array.isArray(allUsersResponse)) {
          allUsers = allUsersResponse;
        } else if (allUsersResponse?.users) {
          allUsers = Array.isArray(allUsersResponse.users) ? allUsersResponse.users : [allUsersResponse.users];
        } else if (allUsersResponse?.students) {
          allUsers = Array.isArray(allUsersResponse.students) ? allUsersResponse.students : [allUsersResponse.students];
        }
  
  
        // Validate that we have actual user objects, not class objects
        const validUsers = allUsers.filter(user => {
          // Check if this looks like a user object
          const hasUserProperties = (
            user.hasOwnProperty('email') || 
            user.hasOwnProperty('role') || 
            (user.hasOwnProperty('name') && user.hasOwnProperty('_id'))
          );
          
          // Check if this is NOT a class object
          const isNotClass = (
            !user.hasOwnProperty('schedule') && 
            !user.hasOwnProperty('className') &&
            !user.hasOwnProperty('classCode')
          );
          
          return hasUserProperties && isNotClass;
        });
  
  
        if (validUsers.length === 0) {        

          // Show user what the backend is actually returning
          setError(`Backend is not returning user objects. Instead got: ${Object.keys(allUsers[0] || {}).join(', ')}.
                    Please check your backend ${endpointUsed} endpoint to ensure it returns user documents from your users collection.`);

          // Reset students and attendance when no valid users found
          setStudents([]);
          setAttendance({});

          toast.error('No Student found for this Class');
          return;
        }
  
        // Filter for students with matching criteria
        const filteredStudents = validUsers.filter(user => {
  
          // Step 1: Check if user is a student
          if (user.role !== 'student') {
            return false;
          }
  
          // Step 2: Check if grade matches
          const studentGrade = user.profile?.grade || user.grade;
  
          // Normalize grade strings for comparison
          const normalizeGrade = (g) => {
            if (!g) return '';
            const str = String(g).toLowerCase().trim();
            // Remove 'th', 'st', 'nd', 'rd' suffixes and extract number
            const match = str.match(/(\d+)/);
            return match ? match[1] : str;
          };
  
          const normalizedStudentGrade = normalizeGrade(studentGrade);
          const normalizedTargetGrade = normalizeGrade(grade);
  
          const gradeMatch = normalizedStudentGrade === normalizedTargetGrade ||
                            studentGrade === grade ||
                            studentGrade === `${grade}th` ||
                            studentGrade === `${grade}` ||
                            String(studentGrade).toLowerCase() === String(grade).toLowerCase();
  
          if (!gradeMatch) {
            return false;
          }
  
          // Step 3: Check if subject exists in student's subjects array
          if (subject) {
            const subjects = user.profile?.subjects || user.subjects || [];
  
            const subjectMatch = subjects.some(sub => {
              const subjectName = typeof sub === 'string' ? sub : (sub.name || sub.subject || sub);
              const normalizedSubject = String(subjectName).toLowerCase().trim();
              const normalizedTargetSubject = String(subject).toLowerCase().trim();
  
              const match = normalizedSubject.includes(normalizedTargetSubject) ||
                           normalizedTargetSubject.includes(normalizedSubject) ||
                           normalizedSubject === normalizedTargetSubject;  
              return match;
            });
  
            if (!subjectMatch) {
              return false;
            }
          }
  
          return true;
        });
  
  
        // Map to consistent structure
        studentsData = filteredStudents.map(student => ({
          id: student._id || student.id,
          name: student.name || student.profile?.name || 'Student',
          email: student.email,
          rollNumber: student.profile?.rollNumber || student.rollNumber || '',
          grade: student.profile?.grade || student.grade,
          subjects: student.profile?.subjects || student.subjects || [],
          attendanceStatus: 'present'
        }));
  
        if (studentsData.length > 0) {
          toast.success(`Found ${studentsData.length} students for ${grade} grade in ${subject}`);  
        } else {
          toast(`No students found for ${grade} grade studying ${subject}. 
                 Make sure students in your database have:
                 - role: "student"
                 - grade: "${grade}" 
                 - subjects array containing "${subject}"`, {
            icon: 'ℹ️',
            duration: 8000,
            style: {
              borderRadius: '10px',
              background: '#3b82f6',
              color: '#fff',
            },
          });
        }
  
      } catch (error) {

        // Reset students and attendance when there's an error
        setStudents([]);
        setAttendance({});

        // Show appropriate error message based on the specific error
        if (error.message.includes('No working user endpoints')) {
          setError(error.message);
          toast.error('No Student found for this Class');
        } else if (error.response?.status === 403) {
          setError('Access denied. Please ensure your teacher account has permission to view students, or contact your administrator.');
          toast.error('Permission denied. Contact your administrator to access student data.');
        } else if (error.response?.status === 404) {
          setError('Student data endpoints not found. Please check your backend configuration and ensure user endpoints exist.');
          toast.error('Backend endpoints missing. Please configure user data APIs.');
        } else {
          setError('Unable to fetch students. Please check your backend configuration and network connection.');
          toast.error('Failed to load students from database');
        }
      }
  
      // Ensure studentsData is an array
      if (!Array.isArray(studentsData)) {
        studentsData = [];
      }
  
      // Process students data to ensure consistent structure
      const processedStudents = studentsData.map((student, index) => ({
        id: student._id || student.id || `student_${index}`,
        name: student.name || student.fullName || `Student ${index + 1}`,
        email: student.email || '',
        rollNumber: student.rollNumber || student.studentId || '',
        grade: student.grade,
        attendanceStatus: student.attendanceStatus || 'present'
      }));
  
      setStudents(processedStudents);
  
      // Initialize attendance state
      const initialAttendance = {};
      processedStudents.forEach(student => {
        initialAttendance[student.id] = student.attendanceStatus;
      });
      setAttendance(initialAttendance);
  
      if (processedStudents.length === 0) {
        // Explicitly reset attendance when no students found
        setAttendance({});
        toast('No students found for this class and grade. Make sure students are enrolled with the correct grade and subjects.', {
          icon: 'ℹ️',
          style: {
            borderRadius: '10px',
            background: '#3b82f6',
            color: '#fff',
          },
        });
      }
  
    } catch (error) {
      setError(`Failed to load students: ${error.message}`);
      toast.error('Failed to load students for attendance');
      setStudents([]);
      setAttendance({});
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
    setError(null);

    try {
      const response = await teacherAPI.getAttendanceHistory(
        historyFilters.class,
        historyFilters.startDate,
        historyFilters.endDate
      );

      let historyData = [];
      if (response?.data) {
        historyData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        historyData = response;
      }

      setAttendanceHistory(historyData);
      setShowHistory(true);

      if (historyData.length === 0) {
        toast('No attendance history found for the selected criteria.', {
          icon: 'ℹ️',
          style: {
            borderRadius: '10px',
            background: '#3b82f6',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      setError('Failed to load attendance history');
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
          setLocation('Location not available');
        }
      );
    } else {
      setLocation('Geolocation not supported');
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllAs = (status) => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
    toast.success(`Marked all students as ${status}`);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast.error('Please select class and date');
      return;
    }
  
    if (Object.keys(attendance).length === 0 || students.length === 0) {
      toast.error('No students to mark attendance for');
      return;
    }
  
    setSaving(true);
    setError(null);
  
    try {
      // Format attendance data according to your backend schema
      const attendanceData = {
        classId: selectedClass,
        date: selectedDate,
        location: location || 'Not specified',
        students: Object.entries(attendance).map(([studentId, status]) => ({
          student: studentId,  // Changed from 'studentId' to 'student' to match your backend schema
          status: status
        }))
      };
  
      // Add coordinates if available
      if (currentLocation) {
        attendanceData.coordinates = currentLocation;
      }
  
      const response = await teacherAPI.markAttendance(attendanceData);
      
      toast.success('Attendance marked successfully!');
  
      // Don't reset the form, just show success
      // This allows teachers to modify if needed
  
    } catch (error) {
      
      // Show specific error message from backend if available
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to mark attendance';
      setError(`Failed to mark attendance: ${errorMessage}`);
      toast.error(errorMessage);
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
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance Management</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Mark and track student attendance for your classes.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchClasses}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? 'Mark Attendance' : 'View History'}
          </button>
        </div>
      </div>

      

      {!showHistory ? (
        <>
          {/* Class and Date Selection */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Class & Date</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id || cls._id} value={cls.id || cls._id}>
                      {cls.name || cls.className} {cls.subject ? `(${cls.subject})` : ''}
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                  />
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'bg-blue-50',
                  textColor: 'text-blue-700',
                  icon: <Users className="w-6 h-6" />
                },
                {
                  label: 'Present',
                  value: stats.present,
                  color: 'from-green-500 to-green-600',
                  bgColor: 'bg-green-50',
                  textColor: 'text-green-700',
                  icon: <CheckCircle className="w-6 h-6" />
                },
                {
                  label: 'Absent',
                  value: stats.absent,
                  color: 'from-red-500 to-red-600',
                  bgColor: 'bg-red-50',
                  textColor: 'text-red-700',
                  icon: <XCircle className="w-6 h-6" />
                },
                {
                  label: 'Late',
                  value: stats.late,
                  color: 'from-yellow-500 to-yellow-600',
                  bgColor: 'bg-yellow-50',
                  textColor: 'text-yellow-700',
                  icon: <Clock className="w-6 h-6" />
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className="p-4 sm:p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.bgColor} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300`}>
                        <div className={stat.textColor}>
                          {stat.icon}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        {stat.label}
                      </h3>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
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
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Mark Attendance</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedClassName} - {new Date(selectedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAllAs('present')}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
                    >
                      All Present
                    </button>
                    <button
                      onClick={() => markAllAs('absent')}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200"
                    >
                      All Absent
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Attendance Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {students.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="hover:bg-blue-50/30 transition-colors duration-200 group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {student.name?.charAt(0)?.toUpperCase() || 'S'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200">
                            {student.rollNumber || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {['present', 'absent', 'late'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(student.id, status)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 ${
                                  attendance[student.id] === status
                                    ? status === 'present'
                                      ? 'bg-green-100 text-green-800 border-green-200 shadow-sm'
                                      : status === 'absent'
                                      ? 'bg-red-100 text-red-800 border-red-200 shadow-sm'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm'
                                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:scale-105'
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

              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {stats.present} present, {stats.absent} absent, {stats.late} late out of {stats.totalStudents} students
                  </div>
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={saving || Object.keys(attendance).length === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" message="" />
                        <span className="ml-2">Saving...</span>
                      </>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="px-4 sm:px-8 py-12 sm:py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">No Student found for this Class</h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
                  No students are enrolled in this class or available for the selected date.
                  Please check if students are properly enrolled.
                </p>
                <button
                  onClick={fetchStudentsForAttendance}
                  className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="px-4 sm:px-8 py-12 sm:py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Select Class and Date</h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                  Choose a class and date to start marking attendance for your students.
                </p>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        /* Attendance History */
        <>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={historyFilters.class}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, class: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id || cls._id} value={cls.id || cls._id}>
                      {cls.name || cls.className} {cls.subject ? `(${cls.subject})` : ''}
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchAttendanceHistory}
                  disabled={loading || !historyFilters.class}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
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
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">Attendance History</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {attendanceHistory.length} record{attendanceHistory.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Students
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Present
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Absent
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Late
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Attendance %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {attendanceHistory.map((record, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="hover:bg-blue-50/30 transition-colors duration-200"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200">
                            {record.totalStudents}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200">
                            {record.present}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200">
                            {record.absent}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200">
                            {record.late}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                            record.attendancePercentage >= 90
                              ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200'
                              : record.attendancePercentage >= 75
                              ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200'
                              : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200'
                          }`}>
                            {record.attendancePercentage?.toFixed(1) || '0'}%
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
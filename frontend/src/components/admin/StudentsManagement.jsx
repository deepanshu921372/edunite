import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Trash2,
  User,
  Calendar,
  GraduationCap,
  AlertTriangle,
  BookOpen,
  Phone,
  MapPin,
  Filter,
  TrendingUp
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import { showToast } from '../../utils/toast';
import toast from 'react-hot-toast';

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!studentsLoaded) {
      fetchStudents();
    }
  }, [studentsLoaded]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter, gradeFilter]);

  const fetchStudents = async () => {
    if (loading && studentsLoaded) return;

    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      const studentsData = response.data?.filter(user => user.role === 'student') || [];
      setStudents(studentsData);
      setStudentsLoaded(true);
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.profile?.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.profile?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        filtered = filtered.filter(student => student.isApproved === true);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(student => student.isApproved === false || student.isApproved === undefined);
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(student => student.approvalStatus === 'rejected');
      }
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter(student => student.profile?.grade === gradeFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    setProcessingId(studentId);
    try {
      await adminAPI.deleteUser(studentId);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (isApproved) => {
    if (isApproved === true) {
      return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm';
    } else if (isApproved === false || isApproved === undefined) {
      return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 shadow-sm';
    } else {
      return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm';
    }
  };

  const getStatusText = (isApproved) => {
    if (isApproved === true) {
      return 'Approved';
    } else if (isApproved === false || isApproved === undefined) {
      return 'Pending';
    } else {
      return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate stats
  const approvedStudents = students.filter(s => s.isApproved === true).length;
  const pendingStudents = students.filter(s => s.isApproved === false || s.isApproved === undefined).length;
  const totalStudents = students.length;

  // Get unique grades for filter
  const uniqueGrades = [...new Set(students
    .map(s => s.profile?.grade)
    .filter(grade => grade)
  )].sort();

  if (loading) {
    return <LoadingSpinner message="Loading students..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
          <p className="mt-2 text-gray-600">
            Manage student accounts, view profiles, and monitor academic information.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-blue-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <GraduationCap className="w-7 h-7 text-blue-700" />
              </div>
              <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Students</h3>
              <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-green-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <User className="w-7 h-7 text-green-700" />
              </div>
              <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Approved</h3>
              <p className="text-3xl font-bold text-gray-900">{approvedStudents}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-yellow-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <AlertTriangle className="w-7 h-7 text-amber-700" />
              </div>
              {pendingStudents > 0 && (
                <div className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>New!</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</h3>
              <p className="text-3xl font-bold text-gray-900">{pendingStudents}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, grade, or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm cursor-text"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border cursor-pointer border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="border cursor-pointer border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100"
      >
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No students in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade & Stream
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.uid || student._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                            <span className="text-white text-sm font-medium">
                              {(student.displayName || student.name || 'S').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                            {student.displayName || student.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {(student.uid || student._id || '').slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 shadow-sm">
                        {student.profile?.rollNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {student.profile?.grade && (
                          <div className="mb-1">
                            <span className="font-medium text-gray-700">Grade:</span> {student.profile.grade}
                          </div>
                        )}
                        {student.profile?.stream && (
                          <div>
                            <span className="font-medium text-gray-700">Stream:</span> {student.profile.stream}
                          </div>
                        )}
                        {!student.profile?.grade && !student.profile?.stream && (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.profile?.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {student.profile?.parentName && (
                          <div className="mb-1">
                            <span className="font-medium text-gray-700">Name:</span> {student.profile.parentName}
                          </div>
                        )}
                        {student.profile?.parentPhone && (
                          <div>
                            <span className="font-medium text-gray-700">Phone:</span> {student.profile.parentPhone}
                          </div>
                        )}
                        {!student.profile?.parentName && !student.profile?.parentPhone && (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.profile?.dateOfBirth ? formatDate(student.profile.dateOfBirth) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(student.isApproved)}`}>
                        {getStatusText(student.isApproved)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteStudent(student.uid, student.displayName || student.name)}
                        disabled={processingId === student.uid}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer transition-all duration-200"
                      >
                        {processingId === student.uid ? (
                          <LoadingSpinner size="sm" message="" />
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentsManagement;
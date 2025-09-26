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
  MapPin
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
      return 'bg-green-100 text-green-800';
    } else if (isApproved === false || isApproved === undefined) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-gray-100 text-gray-800';
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
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
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedStudents}</p>
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
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingStudents}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, grade, or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {filteredStudents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No students in the system yet.'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student, index) => (
            <motion.div
              key={student.uid || student._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {student.displayName || student.name}
                      </h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.isApproved)}`}>
                      {getStatusText(student.isApproved)}
                    </span>
                    <button
                      onClick={() => handleDeleteStudent(student.uid, student.displayName || student.name)}
                      disabled={processingId === student.uid}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors duration-200"
                    >
                      {processingId === student.uid ? (
                        <LoadingSpinner size="sm" message="" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {student.profile?.rollNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Roll Number:</span>
                      <span className="ml-1">{student.profile.rollNumber}</span>
                    </div>
                  )}

                  {student.profile?.grade && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Grade:</span>
                      <span className="ml-1">{student.profile.grade}</span>
                    </div>
                  )}

                  {student.profile?.stream && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Stream:</span>
                      <span className="ml-1">{student.profile.stream}</span>
                    </div>
                  )}

                  {student.profile?.phoneNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Phone:</span>
                      <span className="ml-1">{student.profile.phoneNumber}</span>
                    </div>
                  )}

                  {student.profile?.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Address:</span>
                      <span className="ml-1 truncate">{student.profile.address}</span>
                    </div>
                  )}

                  {student.profile?.parentName && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Parent:</span>
                      <span className="ml-1">{student.profile.parentName}</span>
                    </div>
                  )}

                  {student.profile?.parentPhone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Parent Phone:</span>
                      <span className="ml-1">{student.profile.parentPhone}</span>
                    </div>
                  )}

                  {student.profile?.dateOfBirth && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Date of Birth:</span>
                      <span className="ml-1">{formatDate(student.profile.dateOfBirth)}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">Joined:</span>
                    <span className="ml-1">{formatDate(student.createdAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default StudentsManagement;
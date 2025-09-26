import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Trash2,
  User,
  Calendar,
  Users,
  AlertTriangle,
  BookOpen,
  Phone
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import { showToast } from '../../utils/toast';
import toast from 'react-hot-toast';

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachersLoaded, setTeachersLoaded] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!teachersLoaded || dataVersion > 0) {
      fetchTeachers();
    }
  }, [teachersLoaded, dataVersion]);

  useEffect(() => {
    filterTeachers();
  }, [teachers, searchTerm, statusFilter]);

  const fetchTeachers = async (force = false) => {
    if (loading && teachersLoaded && !force) return;

    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      const teachersData = response.data?.filter(user => user.role === 'teacher') || [];
      setTeachers(teachersData);
      setTeachersLoaded(true);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      showToast('Failed to load teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh data (can be called from outside)
  const refreshTeachers = () => {
    setTeachersLoaded(false);
    setDataVersion(prev => prev + 1);
  };

  const filterTeachers = () => {
    let filtered = teachers;

    if (searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.profile?.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        filtered = filtered.filter(teacher => teacher.isApproved === true);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(teacher => teacher.isApproved === false || teacher.isApproved === undefined);
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(teacher => teacher.approvalStatus === 'rejected');
      }
    }

    setFilteredTeachers(filtered);
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you sure you want to delete ${teacherName}? This action cannot be undone.`)) {
      return;
    }

    setProcessingId(teacherId);
    try {
      await adminAPI.deleteUser(teacherId);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error('Failed to delete teacher');
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
  const approvedTeachers = teachers.filter(t => t.isApproved === true).length;
  const pendingTeachers = teachers.filter(t => t.isApproved === false || t.isApproved === undefined).length;
  const totalTeachers = teachers.length;

  if (loading) {
    return <LoadingSpinner message="Loading teachers..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teachers Management</h2>
          <p className="mt-2 text-gray-600">
            Manage teacher accounts, view profiles, and monitor teaching information.
          </p>
        </div>
        <button
          onClick={refreshTeachers}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Refresh Data
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
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
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
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedTeachers}</p>
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
              <p className="text-2xl font-bold text-gray-900">{pendingTeachers}</p>
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
                placeholder="Search by name, email, or specialization..."
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
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No teachers in the system yet.'}
            </p>
          </div>
        ) : (
          filteredTeachers.map((teacher, index) => (
            <motion.div
              key={teacher.uid || teacher._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {teacher.displayName || teacher.name}
                      </h3>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teacher.isApproved)}`}>
                      {getStatusText(teacher.isApproved)}
                    </span>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.uid, teacher.displayName || teacher.name)}
                      disabled={processingId === teacher.uid}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors duration-200"
                    >
                      {processingId === teacher.uid ? (
                        <LoadingSpinner size="sm" message="" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {teacher.profile?.specialization && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Specialization:</span>
                      <span className="ml-1">{teacher.profile.specialization}</span>
                    </div>
                  )}

                  {teacher.profile?.teachingGrades && teacher.profile.teachingGrades.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Grades:</span>
                      <span className="ml-1">{teacher.profile.teachingGrades.join(', ')}</span>
                    </div>
                  )}

                  {teacher.profile?.teachingSubjects && teacher.profile.teachingSubjects.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Subjects:</span>
                      <span className="ml-1">{teacher.profile.teachingSubjects.join(', ')}</span>
                    </div>
                  )}

                  {teacher.profile?.phoneNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Phone:</span>
                      <span className="ml-1">{teacher.profile.phoneNumber}</span>
                    </div>
                  )}

                  {teacher.profile?.experience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Experience:</span>
                      <span className="ml-1">{teacher.profile.experience}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">Joined:</span>
                    <span className="ml-1">{formatDate(teacher.createdAt)}</span>
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

export default TeachersManagement;
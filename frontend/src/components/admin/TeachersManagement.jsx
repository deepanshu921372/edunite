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
  Phone,
  Filter
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
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
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
          className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-green-600" />
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
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-blue-600" />
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
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingTeachers}</p>
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
                placeholder="Search by name, email, or specialization..."
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
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100"
      >
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No teachers in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grades & Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
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
                {filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.uid || teacher._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                            <span className="text-white text-sm font-medium">
                              {(teacher.displayName || teacher.name || 'T').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                            {teacher.displayName || teacher.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {(teacher.uid || teacher._id || '').slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize shadow-sm">
                        {teacher.profile?.specialization || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {teacher.profile?.teachingGrades && teacher.profile.teachingGrades.length > 0 && (
                          <div className="mb-1">
                            <span className="font-medium text-gray-700">Grades:</span> {teacher.profile.teachingGrades.join(', ')}
                          </div>
                        )}
                        {teacher.profile?.teachingSubjects && teacher.profile.teachingSubjects.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Subjects:</span> {teacher.profile.teachingSubjects.join(', ')}
                          </div>
                        )}
                        {(!teacher.profile?.teachingGrades || teacher.profile.teachingGrades.length === 0) &&
                         (!teacher.profile?.teachingSubjects || teacher.profile.teachingSubjects.length === 0) && (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.profile?.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.profile?.experience || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(teacher.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(teacher.isApproved)}`}>
                        {getStatusText(teacher.isApproved)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTeacher(teacher.uid, teacher.displayName || teacher.name)}
                        disabled={processingId === teacher.uid}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer transition-all duration-200"
                      >
                        {processingId === teacher.uid ? (
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

export default TeachersManagement;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  BookOpen,
  User,
  Calendar,
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import { showToast } from '../../utils/toast';

const ClassesManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    schedule: '',
    teacherId: ''
  });

  useEffect(() => {
    // Only fetch data if not already loaded
    if (!dataLoaded) {
      fetchData();
    }
  }, [dataLoaded]);

  useEffect(() => {
    filterClasses();
  }, [classes, searchTerm]);

  const fetchData = async () => {
    // Prevent duplicate calls if already loading or loaded
    if (loading && dataLoaded) return;

    setLoading(true);
    try {
      const [classesResponse, teachersResponse] = await Promise.all([
        adminAPI.getClasses(),
        adminAPI.getAllUsers()
      ]);

      setClasses(classesResponse.data || []);
      setTeachers(teachersResponse.data?.filter(user => user.role === 'teacher') || []);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load classes data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = classes;

    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClasses(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.subject) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setProcessingId('form');
    try {
      if (editingClass) {
        await adminAPI.updateClass(editingClass.id, formData);
        showToast('Class updated successfully', 'success');
      } else {
        await adminAPI.createClass(formData);
        showToast('Class created successfully', 'success');
      }

      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving class:', error);
      showToast('Failed to save class', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      return;
    }

    setProcessingId(classId);
    try {
      await adminAPI.deleteClass(classId);
      showToast('Class deleted successfully', 'success');
      await fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      showToast('Failed to delete class', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignTeacher = async (classId, teacherId) => {
    setProcessingId(classId);
    try {
      await adminAPI.assignTeacher(classId, teacherId);
      showToast('Teacher assigned successfully', 'success');
      await fetchData();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      showToast('Failed to assign teacher', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (classData) => {
    setEditingClass(classData);
    setFormData({
      name: classData.name,
      subject: classData.subject,
      description: classData.description || '',
      schedule: classData.schedule || '',
      teacherId: classData.teacherId || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({
      name: '',
      subject: '',
      description: '',
      schedule: '',
      teacherId: ''
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading classes..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classes Management</h2>
          <p className="mt-2 text-gray-600">
            Create and manage classes, assign teachers, and organize curriculum.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search classes by name, subject, or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Classes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredClasses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first class.'}
            </p>
          </div>
        ) : (
          filteredClasses.map((classData, index) => (
            <motion.div
              key={classData.id}
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
                        {classData.name}
                      </h3>
                      <p className="text-sm text-gray-500">{classData.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(classData)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(classData.id, classData.name)}
                      disabled={processingId === classData.id}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      {processingId === classData.id ? (
                        <LoadingSpinner size="sm" message="" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {classData.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {classData.description}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  {classData.schedule && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      {classData.schedule}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      {classData.teacherName ? (
                        classData.teacherName
                      ) : (
                        <span className="text-yellow-600">No teacher assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    {classData.studentCount || 0} students enrolled
                  </div>
                </div>

                {!classData.teacherId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignTeacher(classData.id, e.target.value);
                          }
                        }}
                        disabled={processingId === classData.id}
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Assign Teacher</option>
                        {teachers.map(teacher => (
                          <option key={teacher.uid} value={teacher.uid}>
                            {teacher.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingClass ? 'Edit Class' : 'Create New Class'}
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Class Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Advanced Mathematics"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Mathematics"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Brief description of the class..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Schedule
                          </label>
                          <input
                            type="text"
                            value={formData.schedule}
                            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Mon/Wed/Fri 10:00 AM - 11:30 AM"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign Teacher
                          </label>
                          <select
                            value={formData.teacherId}
                            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select a teacher (optional)</option>
                            {teachers.map(teacher => (
                              <option key={teacher.uid} value={teacher.uid}>
                                {teacher.displayName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={processingId === 'form'}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {processingId === 'form' ? (
                      <LoadingSpinner size="sm" message="" />
                    ) : (
                      editingClass ? 'Update Class' : 'Create Class'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesManagement;
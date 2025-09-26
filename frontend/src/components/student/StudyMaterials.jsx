import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  FileText,
  Image,
  Video,
  File,
  BookOpen,
  Calendar,
  User,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const StudyMaterials = () => {
  const { userProfile, currentUser } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English'];

  useEffect(() => {
    // Only fetch if user is authenticated and approved
    if (userProfile && userProfile.isApproved && currentUser && !fetchingRef.current) {
      fetchMaterials();
    } else if (userProfile && !userProfile.isApproved) {
      setLoading(false);
      setError('Account approval required to access study materials');
    } else if (!currentUser) {
      setLoading(false);
      setError('Please sign in to access study materials');
    }
  }, [userProfile, currentUser]);

  useEffect(() => {
    filterAndSortMaterials();
  }, [materials, searchTerm, selectedSubject, sortBy]);

  const fetchMaterials = async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setError(null);

    try {
      const response = await studentAPI.getMaterialsBySubject('');
      setMaterials(response.studyMaterials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Please ensure your account is approved.');
      } else {
        setError('Failed to load study materials');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const filterAndSortMaterials = () => {
    let filtered = [...materials];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(material =>
        material.subject.toLowerCase() === selectedSubject.toLowerCase()
      );
    }

    // Sort materials
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        case 'oldest':
          return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        default:
          return 0;
      }
    });

    setFilteredMaterials(filtered);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="w-5 h-5 text-green-500" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension)) {
      return <Video className="w-5 h-5 text-red-500" />;
    }
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (materialId, fileName) => {
    setDownloading(materialId);
    try {
      const response = await studentAPI.downloadMaterial(materialId);

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading study materials..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load materials</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchMaterials();
          }}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Study Materials</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Access and download study materials shared by your teachers.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search materials by title, description, subject, or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-row sm:flex-row items-center sm:items-center space-x-3 w-full sm:w-auto">
              <span className="items-center hidden sm:flex">
                <Filter className="text-gray-500 w-5 h-5 flex-shrink-0" />
              </span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border cursor-pointer border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-sm min-w-[140px] w-full sm:w-auto"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border cursor-pointer border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-sm min-w-[140px] w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="subject">Subject A-Z</option>
            </select>
          </div>
        </div>
      </div>


      {/* Materials Table */}
      {filteredMaterials.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="px-4 sm:px-8 py-12 sm:py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || selectedSubject !== 'all'
                ? "No materials match your criteria"
                : "No materials yet"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              {searchTerm || selectedSubject !== 'all'
                ? "Try adjusting your search or filter criteria to find the materials you're looking for."
                : "Your teachers haven't uploaded any materials yet. Check back later for new study materials."}
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
                <h3 className="text-xl font-semibold text-gray-900">Study Materials</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="flex gap-4 items-center justify-center bg-blue-50/50 rounded-lg px-4 py-2 min-w-[90px]">
                <BookOpen className="w-8 h-8 text-blue-600 mb-1" />
                <span className="text-xl font-semibold text-gray-900 leading-tight">{filteredMaterials.length} Total</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Material Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Subject & Teacher
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Upload Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredMaterials.map((material, index) => (
                  <motion.tr
                    key={material._id || material.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="hover:bg-blue-50/30 transition-colors duration-200 group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 hidden sm:block">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                            {material.title}
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {material.description || 'No description provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col space-y-2">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200">
                          {material.subject}
                        </span>
                        {material.teacherName && (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200">
                            {material.teacherName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2 max-w-sm">
                        {material.files && material.files.length > 0 ? (
                          material.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200"
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getFileIcon(file.name)}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              {file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-3 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                                  title="View online"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-xs text-gray-500 italic">No files available</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(material.uploadedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(material.uploadedAt).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default StudyMaterials;
import React, { useState, useEffect } from 'react';
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
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English'];

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterAndSortMaterials();
  }, [materials, searchTerm, selectedSubject, sortBy]);

  const fetchMaterials = async () => {
    try {
      // If subject filtering is needed, we can fetch by subject
      const response = await studentAPI.getMaterialsBySubject('');
      setMaterials(response.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
        <p className="mt-2 text-gray-600">
          Access and download study materials shared by your teachers.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search materials by title, description, subject, or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="subject">Subject A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Materials List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No materials found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedSubject !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Your teachers haven\'t uploaded any materials yet.'}
            </p>
          </div>
        ) : (
          filteredMaterials.map((material, index) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {material.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {material.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {material.subject}
                        </span>
                      </div>
                      {material.teacherName && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>{material.teacherName}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {new Date(material.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Files ({material.files?.length || 0})
                  </h4>
                  {material.files && material.files.length > 0 ? (
                    material.files.map((file, fileIndex) => (
                      <div
                        key={fileIndex}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {getFileIcon(file.name)}
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="View online"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDownload(material.id, file.name)}
                            disabled={downloading === material.id}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download file"
                          >
                            {downloading === material.id ? (
                              <LoadingSpinner size="sm" message="" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No files available</p>
                    </div>
                  )}
                </div>

                {/* Material Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                  </span>
                  {material.className && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {material.className}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Quick Subject Filter Buttons */}
      {filteredMaterials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filter by Subject</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-200 ${
                selectedSubject === 'all'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              All ({materials.length})
            </button>
            {subjects.map(subject => {
              const count = materials.filter(m => m.subject === subject).length;
              if (count === 0) return null;

              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-200 ${
                    selectedSubject === subject
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {subject} ({count})
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudyMaterials;
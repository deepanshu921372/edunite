import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Image,
  Video,
  File,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  X,
  BookOpen,
} from "lucide-react";
import { teacherAPI, commonAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import toast from "react-hot-toast";

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const fileInputRef = useRef(null);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    classId: "",
    subject: "",
    files: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, filterClass, filterType]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && showUploadModal) {
        handleCloseModal();
      }
    };

    if (showUploadModal) {
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscKey);
        document.body.style.overflow = "unset";
      };
    }
  }, [showUploadModal]);

  const fetchData = async () => {
    try {
      const [materialsResponse, classesResponse, profileResponse] =
        await Promise.all([
          teacherAPI.getMaterials(),
          teacherAPI.getMyClasses(),
          teacherAPI.getProfile(),
        ]);

      console.log("Materials response:", materialsResponse);
      console.log("Materials data:", materialsResponse.studyMaterials);
      setMaterials(materialsResponse.studyMaterials || materialsResponse.data || materialsResponse || []);
      setClasses(classesResponse.data || classesResponse || []);
      setTeacherProfile(profileResponse.data || profileResponse || null);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    // Ensure materials is always an array
    const materialsList = Array.isArray(materials) ? materials : [];
    let filtered = materialsList;

    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          material.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterClass !== "all") {
      filtered = filtered.filter(
        (material) => material.classId === filterClass
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(
        (material) =>
          Array.isArray(material.files) &&
          material.files.some((file) => getFileType(file.name) === filterType)
      );
    }

    setFilteredMaterials(Array.isArray(filtered) ? filtered : []);
  };

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension))
      return "image";
    if (["mp4", "avi", "mov", "wmv", "webm"].includes(extension))
      return "video";
    if (["pdf"].includes(extension)) return "pdf";
    if (["doc", "docx"].includes(extension)) return "document";
    if (["ppt", "pptx"].includes(extension)) return "presentation";
    if (["xls", "xlsx"].includes(extension)) return "spreadsheet";

    return "file";
  };

  const getFileIcon = (fileName) => {
    const type = getFileType(fileName);

    switch (type) {
      case "image":
        return <Image className="w-5 h-5 text-green-500" />;
      case "video":
        return <Video className="w-5 h-5 text-red-500" />;
      case "pdf":
      case "document":
      case "presentation":
      case "spreadsheet":
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploadForm((prev) => ({
      ...prev,
      files: [...prev.files, ...selectedFiles],
    }));
  };

  const handleRemoveFile = (index) => {
    setUploadForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleCloseModal = useCallback(() => {
    setShowUploadModal(false);
    setUploadForm({
      title: "",
      description: "",
      classId: "",
      subject: "",
      files: [],
    });
  }, []);

  const handleOpenModal = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (
      !uploadForm.title ||
      !uploadForm.classId ||
      uploadForm.files.length === 0
    ) {
      toast.error(
        "Please fill in all required fields and select at least one file"
      );
      return;
    }

    setUploading(true);
    try {
      // Upload each file
      const uploadedFiles = [];
      for (let i = 0; i < uploadForm.files.length; i++) {
        const file = uploadForm.files[i];
        console.log(`Uploading file ${i + 1}/${uploadForm.files.length}: ${file.name}`);

        const uploadResponse = await commonAPI.uploadFile(file, "material");
        console.log('Upload response:', uploadResponse);

        uploadedFiles.push({
          name: file.name,
          size: file.size,
          url: uploadResponse.file.url,
          type: getFileType(file.name),
        });
      }

      // Create material record
      const materialData = {
        title: uploadForm.title,
        description: uploadForm.description,
        classId: uploadForm.classId,
        subject: uploadForm.subject,
        files: uploadedFiles,
      };

      await teacherAPI.uploadMaterial(materialData);
      toast.success("Materials uploaded successfully");

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error uploading materials:", error);

      // More specific error handling
      if (error.code === 'ECONNABORTED') {
        toast.error("Upload timeout - file may be too large or connection is slow");
      } else if (error.response?.status === 413) {
        toast.error("File too large - maximum size is 50MB");
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || "Invalid file or missing data");
      } else if (error.response?.status === 500) {
        toast.error("Server error - please try again");
      } else {
        toast.error("Failed to upload materials");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setProcessingId(materialId);
    try {
      await teacherAPI.deleteMaterial(materialId);
      toast.success("Material deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading materials..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
          <p className="mt-2 text-gray-600">
            Upload and manage study materials for your classes.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Materials
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search materials by title, description, or subject..."
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
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Classes</option>
                {(classes || []).map((cls, index) => (
                  <option key={cls.id || index} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="document">Documents</option>
              <option value="presentation">Presentations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {!Array.isArray(filteredMaterials) || filteredMaterials.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No materials found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterClass !== "all" || filterType !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by uploading your first study material."}
            </p>
          </div>
        ) : (
          (Array.isArray(filteredMaterials) ? filteredMaterials : []).map(
            (material, index) => (
              <motion.div
                key={material._id || material.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {material.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {material.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
                          {material.grade ||
                           classes.find((c) => c.id === material.classId)?.name ||
                           material.class?.name ||
                           "Unknown Class"}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          {material.subject}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(material.id, material.title)}
                      disabled={processingId === material.id}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      {processingId === material.id ? (
                        <LoadingSpinner size="sm" message="" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Files List */}
                  <div className="space-y-2">
                    {(material.files || []).map((file, fileIndex) => (
                      <div
                        key={fileIndex}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {getFileIcon(file.name || file.fileName)}
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name || file.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size || file.fileSize)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.url || file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                    {/* Handle single file legacy format */}
                    {!material.files && material.fileUrl && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center flex-1 min-w-0">
                          {getFileIcon(material.fileName)}
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {material.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(material.fileSize)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Uploaded on{" "}
                    {new Date(material.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            )
          )
        )}
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-gray-500 bg-opacity-75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
              />

              {/* Center modal */}
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative"
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleUpload}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex items-center justify-between mb-4 pr-8">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Upload Study Materials
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={uploadForm.title}
                            onChange={(e) =>
                              setUploadForm({
                                ...uploadForm,
                                title: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Chapter 5 - Quantum Physics"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject
                          </label>
                          <select
                            value={uploadForm.subject}
                            onChange={(e) =>
                              setUploadForm({
                                ...uploadForm,
                                subject: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select a subject</option>
                            {(teacherProfile?.profile?.teachingSubjects || []).map(
                              (subject, index) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Class *
                        </label>
                        <select
                          required
                          value={uploadForm.classId}
                          onChange={(e) =>
                            setUploadForm({
                              ...uploadForm,
                              classId: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a class</option>
                          {(teacherProfile?.profile?.teachingGrades || []).map(
                            (grade, index) => (
                              <option key={grade || index} value={grade}>
                                {grade}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={uploadForm.description}
                          onChange={(e) =>
                            setUploadForm({
                              ...uploadForm,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Brief description of the material..."
                        />
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Files *
                        </label>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors duration-200"
                        >
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">
                            Click to upload files or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, Images, Videos, Documents (Max 10MB each)
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                          />
                        </div>
                      </div>

                      {/* Selected Files */}
                      {uploadForm.files.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Selected Files ({uploadForm.files.length})
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {uploadForm.files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
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
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index)}
                                  className="ml-2 p-1 text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={uploading || uploadForm.files.length === 0}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <LoadingSpinner size="sm" message="" />
                          <span className="ml-2">Uploading...</span>
                        </>
                      ) : (
                        "Upload Materials"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={uploading}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialsManagement;

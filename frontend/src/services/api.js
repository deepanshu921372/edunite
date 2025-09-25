import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';

    if (error.response?.status === 401) {
      localStorage.removeItem('firebaseToken');
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (userData) => api.post('/auth/login', userData),
  getUserProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Admin API
export const adminAPI = {
  // Dashboard stats
  getStats: () => api.get('/admin/dashboard-stats'),

  // User requests
  getUserRequests: (status = 'all') => api.get('/admin/requests', { params: { status } }),
  approveUser: (requestId, role, adminNotes = '') => api.post('/admin/approve-user', { requestId, role, adminNotes }),
  rejectUser: (requestId, adminNotes = '') => api.post('/admin/reject-user', { requestId, adminNotes }),

  // User management
  getAllUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Class management
  getClasses: () => api.get('/admin/classes'),
  createClass: (classData) => api.post('/admin/classes', classData),
  updateClass: (classId, classData) => api.put(`/admin/classes/${classId}`, classData),
  deleteClass: (classId) => api.delete(`/admin/classes/${classId}`),
  assignTeacher: (classId, teacherId) => api.post(`/admin/classes/${classId}/assign-teacher`, { teacherId }),
};

// Teacher API
export const teacherAPI = {
  // Dashboard
  getTeacherStats: () => api.get('/teacher/stats'),
  getMyClasses: () => api.get('/teacher/classes'),

  // Timetable
  getTimetable: () => api.get('/teacher/timetable'),
  createTimetableEntry: (entryData) => api.post('/teacher/timetable', entryData),
  updateTimetableEntry: (entryId, entryData) => api.put(`/teacher/timetable/${entryId}`, entryData),
  deleteTimetableEntry: (entryId) => api.delete(`/teacher/timetable/${entryId}`),

  // Attendance
  getStudentsForAttendance: (classId, date) => api.get(`/teacher/attendance/students`, { params: { classId, date } }),
  markAttendance: (attendanceData) => api.post('/teacher/attendance', attendanceData),
  getAttendanceHistory: (classId, startDate, endDate) => api.get(`/teacher/attendance/history`, {
    params: { classId, startDate, endDate }
  }),

  // Materials
  uploadMaterial: (materialData) => api.post('/teacher/materials', materialData),
  getMaterials: () => api.get('/teacher/materials'),
  deleteMaterial: (materialId) => api.delete(`/teacher/materials/${materialId}`),
};

// Student API
export const studentAPI = {
  // Dashboard
  getStudentStats: () => api.get('/student/stats'),

  // Attendance
  getMyAttendance: (startDate, endDate) => api.get('/student/attendance', {
    params: { startDate, endDate }
  }),

  // Materials
  getMaterialsBySubject: (subject) => api.get('/student/materials', { params: { subject } }),
  downloadMaterial: (materialId) => api.get(`/student/materials/${materialId}/download`, {
    responseType: 'blob'
  }),

  // Profile
  updateProfile: (profileData) => api.put('/student/profile', profileData),
};

// Common API
export const commonAPI = {
  uploadFile: (file, type = 'material') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
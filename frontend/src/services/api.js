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
  async (config) => {
    try {
      const token = localStorage.getItem('firebaseToken');
      if (token) {
        // Check if we have Firebase auth available to refresh token if needed
        const { auth } = await import('../services/firebase');
        if (auth.currentUser) {
          // Get a fresh token (Firebase will handle caching and refresh automatically)
          const freshToken = await auth.currentUser.getIdToken();
          localStorage.setItem('firebaseToken', freshToken);
          config.headers.Authorization = `Bearer ${freshToken}`;
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // If token refresh fails, use the stored token
      const token = localStorage.getItem('firebaseToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
  async (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isStudentRoute = error.config?.url?.includes('/student/');

    if (error.response?.status === 401) {
      // Check if the error is due to expired token
      const errorMessage = error.response?.data?.error || '';
      if (errorMessage.includes('expired') || errorMessage.includes('token')) {
        try {
          // Try to refresh the token
          const { auth } = await import('../services/firebase');
          if (auth.currentUser) {
            const freshToken = await auth.currentUser.getIdToken(true); 
            localStorage.setItem('firebaseToken', freshToken);
            // Retry the original request
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      // If refresh failed or other 401 error, redirect to login
      localStorage.removeItem('firebaseToken');
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      // Don't show toast for login requests or student routes with pending approval
      // Let components handle these errors appropriately
      if (!isLoginRequest && !isStudentRoute) {
        toast.error('Access denied');
      }
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (!isStudentRoute) {
      // Don't show generic toasts for student route errors - let components handle them
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
  blockUser: (requestId, adminNotes = '') => api.post('/admin/block-user', { requestId, adminNotes }),

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

  // Profile
  getProfile: () => api.get('/teacher/profile'),
  updateProfile: (profileData) => api.put('/teacher/profile', profileData),
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
  getProfile: () => api.get('/student/profile'),
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
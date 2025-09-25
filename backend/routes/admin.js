const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const UserRequest = require('../models/UserRequest');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const { sendApprovalEmail } = require('../utils/emailService');

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student', isApproved: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isApproved: true });
    const totalAdmins = await User.countDocuments({ role: 'admin', isApproved: true });
    const pendingRequests = await UserRequest.countDocuments({ status: 'pending' });
    const totalClasses = await Class.countDocuments();

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalAdmins,
        pendingRequests,
        totalClasses
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get user requests with filtering and stats
router.get('/requests', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    // Build filter
    const filter = {};
    if (status !== 'all') {
      filter.status = status;
    }

    // Get requests with user data
    const requests = await UserRequest.find(filter)
      .populate('userId', 'name email profile')
      .populate('processedBy', 'name')
      .sort({ requestedAt: -1 });

    // Get stats
    const stats = {
      pending: await UserRequest.countDocuments({ status: 'pending' }),
      approved: await UserRequest.countDocuments({ status: 'approved' }),
      rejected: await UserRequest.countDocuments({ status: 'rejected' })
    };

    res.json({
      requests,
      stats
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve user request
router.post('/approve-user', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { requestId, role, adminNotes } = req.body;

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Find and update the user request
    const userRequest = await UserRequest.findById(requestId).populate('userId');

    if (!userRequest) {
      return res.status(404).json({ error: 'User request not found' });
    }

    if (userRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update user to approved
    const user = await User.findByIdAndUpdate(
      userRequest.userId._id,
      {
        isApproved: true,
        role: role
      },
      { new: true }
    );

    // Update user request
    userRequest.status = 'approved';
    userRequest.processedBy = req.user._id;
    userRequest.adminNotes = adminNotes;
    await userRequest.save();

    // Send approval email if email service is available
    try {
      await sendApprovalEmail(user);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    res.json({
      user,
      userRequest,
      message: 'User approved successfully'
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject user request
router.post('/reject-user', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { requestId, adminNotes } = req.body;

    // Find and update the user request
    const userRequest = await UserRequest.findById(requestId).populate('userId');

    if (!userRequest) {
      return res.status(404).json({ error: 'User request not found' });
    }

    if (userRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update user request
    userRequest.status = 'rejected';
    userRequest.processedBy = req.user._id;
    userRequest.adminNotes = adminNotes;
    await userRequest.save();

    res.json({
      userRequest,
      message: 'User request rejected'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { isApproved: true };

    if (role && ['student', 'teacher'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('name email role profile createdAt displayName uid')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch users'
    });
  }
});

// Get all classes
router.get('/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    // Transform the data to match frontend expectations
    const transformedClasses = classes.map(classDoc => ({
      id: classDoc._id,
      name: classDoc.name,
      subject: classDoc.subject,
      description: classDoc.description,
      schedule: classDoc.schedule,
      teacherId: classDoc.teacher?._id,
      teacherName: classDoc.teacher?.name,
      studentCount: classDoc.students?.length || 0,
      students: classDoc.students,
      createdAt: classDoc.createdAt
    }));

    res.json({
      success: true,
      data: transformedClasses
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch classes'
    });
  }
});

// Get teacher-class assignments
router.get('/teacher-assignments', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.json(classes);
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new class
router.post('/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, subject, teacherId, studentIds, description } = req.body;

    const newClass = new Class({
      name,
      subject,
      teacher: teacherId,
      students: studentIds || [],
      description
    });

    await newClass.save();
    await newClass.populate('teacher', 'name email');
    await newClass.populate('students', 'name email');

    res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class
router.put('/classes/:classId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const updateData = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true }
    ).populate('teacher', 'name email').populate('students', 'name email');

    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(updatedClass);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class
router.delete('/classes/:classId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { classId } = req.params;

    const deletedClass = await Class.findByIdAndDelete(classId);

    if (!deletedClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign teacher to class
router.post('/classes/:classId/assign-teacher', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    // Verify teacher exists and has teacher role
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher', isApproved: true });
    if (!teacher) {
      return res.status(400).json({ error: 'Invalid teacher ID or teacher not approved' });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { teacher: teacherId },
      { new: true }
    ).populate('teacher', 'name email').populate('students', 'name email');

    if (!updatedClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      success: true,
      message: 'Teacher assigned successfully',
      data: updatedClass
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance reports
router.get('/attendance-reports', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, classId, studentId } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (classId) filter.class = classId;

    const attendance = await Attendance.find(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .populate('students.student', 'name email')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
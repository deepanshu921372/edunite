const express = require('express');
const router = express.Router();
const { authenticateToken, requireApproval } = require('../middleware/auth');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-firebaseUid')
      .populate('profile');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, requireApproval, async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated through this endpoint
    delete updateData.firebaseUid;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isApproved;

    // If profile data is provided, merge it
    if (updateData.profile) {
      const user = await User.findById(userId);
      updateData.profile = { ...user.profile, ...updateData.profile };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-firebaseUid');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get user's classes (both as student and teacher)
router.get('/classes', authenticateToken, requireApproval, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let classes = [];

    if (userRole === 'teacher') {
      // Get classes where user is teacher
      classes = await Class.find({ teacher: userId })
        .populate('students', 'name email profile')
        .sort({ createdAt: -1 });
    } else if (userRole === 'student') {
      // Get classes where user is student
      classes = await Class.find({ students: userId })
        .populate('teacher', 'name email profile')
        .sort({ createdAt: -1 });
    }

    res.json(classes);
  } catch (error) {
    console.error('Get user classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's attendance summary
router.get('/attendance-summary', authenticateToken, requireApproval, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { startDate, endDate, classId } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let attendanceSummary = {};

    if (userRole === 'student') {
      const filter = {
        ...dateFilter,
        'students.student': userId
      };
      if (classId) filter.class = classId;

      const attendanceRecords = await Attendance.find(filter)
        .populate('class', 'name subject')
        .sort({ date: -1 });

      const totalClasses = attendanceRecords.length;
      const presentClasses = attendanceRecords.filter(record => {
        const studentAttendance = record.students.find(s => s.student.toString() === userId.toString());
        return studentAttendance && studentAttendance.status === 'present';
      }).length;

      attendanceSummary = {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0,
        records: attendanceRecords
      };
    } else if (userRole === 'teacher') {
      const filter = {
        ...dateFilter,
        teacher: userId
      };
      if (classId) filter.class = classId;

      const attendanceRecords = await Attendance.find(filter)
        .populate('class', 'name subject')
        .sort({ date: -1 });

      const totalClasses = attendanceRecords.length;
      const classesTaken = attendanceRecords.filter(record =>
        record.teacherAttendance && record.teacherAttendance.status === 'present'
      ).length;

      attendanceSummary = {
        totalClasses,
        classesTaken,
        classesSkipped: totalClasses - classesTaken,
        attendancePercentage: totalClasses > 0 ? Math.round((classesTaken / totalClasses) * 100) : 0,
        records: attendanceRecords
      };
    }

    res.json(attendanceSummary);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password (through Firebase - this endpoint notifies about password change)
router.post('/change-password', authenticateToken, requireApproval, async (req, res) => {
  try {
    // Since we're using Firebase Auth, password changes happen on the frontend
    // This endpoint can be used for logging or additional verification
    const user = req.user;

    // Log the password change attempt

    res.json({
      message: 'Password change request processed. Please complete the process through Firebase Auth.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account (soft delete - mark as inactive)
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Instead of deleting, we could mark as inactive
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      message: 'Account deactivated successfully. Contact admin to reactivate.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user notifications/announcements (placeholder for future implementation)
router.get('/notifications', authenticateToken, requireApproval, async (req, res) => {
  try {
    // Placeholder for notifications system
    // This could be expanded to include announcements, reminders, etc.
    const notifications = [];

    res.json({
      notifications,
      message: 'Notifications feature coming soon'
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
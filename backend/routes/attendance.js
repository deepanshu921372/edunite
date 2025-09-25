const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireApproval } = require('../middleware/auth');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

// Get attendance records (accessible by teachers and admins)
router.get('/', authenticateToken, requireRole(['teacher', 'admin']), requireApproval, async (req, res) => {
  try {
    const { startDate, endDate, classId, teacherId, studentId, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Build filter based on user role and query parameters
    const filter = {};

    // If user is teacher, only show their classes
    if (userRole === 'teacher') {
      filter.teacher = userId;
    }

    // Apply additional filters
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (classId) {
      filter.class = classId;
    }

    if (teacherId && userRole === 'admin') {
      filter.teacher = teacherId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let attendance = await Attendance.find(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name email')
      .populate('students.student', 'name email profile')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by student if specified
    if (studentId) {
      attendance = attendance.filter(record =>
        record.students.some(s => s.student._id.toString() === studentId)
      );
    }

    const total = await Attendance.countDocuments(filter);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance record by ID
router.get('/:attendanceId', authenticateToken, requireRole(['teacher', 'admin']), requireApproval, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const userRole = req.user.role;
    const userId = req.user._id;

    const filter = { _id: attendanceId };

    // If user is teacher, only show their records
    if (userRole === 'teacher') {
      filter.teacher = userId;
    }

    const attendance = await Attendance.findOne(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name email')
      .populate('students.student', 'name email profile');

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update attendance (teachers only)
router.post('/', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, date, students, location } = req.body;

    if (!classId || !date || !students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Class ID, date, and students attendance are required' });
    }

    // Verify teacher owns this class
    const classDoc = await Class.findOne({ _id: classId, teacher: teacherId });
    if (!classDoc) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    // Validate students belong to the class
    const classStudentIds = classDoc.students.map(id => id.toString());
    const invalidStudents = students.filter(s => !classStudentIds.includes(s.student));

    if (invalidStudents.length > 0) {
      return res.status(400).json({
        error: 'Some students are not enrolled in this class',
        invalidStudents
      });
    }

    const attendanceDate = new Date(date);

    // Check if attendance already exists for this date and class
    let attendance = await Attendance.findOne({
      class: classId,
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
      }
    });

    const teacherAttendance = {
      status: 'present',
      timestamp: new Date()
    };

    // Add location if provided
    if (location && location.latitude && location.longitude) {
      teacherAttendance.location = {
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude)
      };
    }

    if (attendance) {
      // Update existing attendance
      attendance.students = students;
      attendance.teacherAttendance = teacherAttendance;
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = new Attendance({
        class: classId,
        teacher: teacherId,
        date: new Date(date),
        students,
        teacherAttendance
      });
      await attendance.save();
    }

    await attendance.populate('class', 'name subject');
    await attendance.populate('teacher', 'name email');
    await attendance.populate('students.student', 'name email');

    res.json({
      attendance,
      message: 'Attendance recorded successfully'
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update attendance (teachers only)
router.put('/:attendanceId', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { attendanceId } = req.params;
    const { students, location } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Students attendance is required' });
    }

    // Find attendance record and verify ownership
    const attendance = await Attendance.findOne({
      _id: attendanceId,
      teacher: teacherId
    }).populate('class');

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found or not authorized' });
    }

    // Validate students belong to the class
    const classStudentIds = attendance.class.students.map(id => id.toString());
    const invalidStudents = students.filter(s => !classStudentIds.includes(s.student));

    if (invalidStudents.length > 0) {
      return res.status(400).json({
        error: 'Some students are not enrolled in this class',
        invalidStudents
      });
    }

    // Update attendance
    attendance.students = students;

    // Update teacher attendance location if provided
    if (location && location.latitude && location.longitude) {
      attendance.teacherAttendance.location = {
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude)
      };
    }

    await attendance.save();

    await attendance.populate('teacher', 'name email');
    await attendance.populate('students.student', 'name email');

    res.json({
      attendance,
      message: 'Attendance updated successfully'
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete attendance record (teachers only)
router.delete('/:attendanceId', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { attendanceId } = req.params;

    const attendance = await Attendance.findOne({
      _id: attendanceId,
      teacher: teacherId
    });

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found or not authorized' });
    }

    await Attendance.findByIdAndDelete(attendanceId);

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance statistics for a class
router.get('/class/:classId/stats', authenticateToken, requireRole(['teacher', 'admin']), requireApproval, async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Verify access to class
    const classFilter = { _id: classId };
    if (userRole === 'teacher') {
      classFilter.teacher = userId;
    }

    const classDoc = await Class.findOne(classFilter)
      .populate('students', 'name email')
      .populate('teacher', 'name email');

    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found or not authorized' });
    }

    // Build date filter
    const dateFilter = { class: classId };
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find(dateFilter)
      .populate('students.student', 'name email')
      .sort({ date: -1 });

    // Calculate statistics for each student
    const studentStats = classDoc.students.map(student => {
      const studentAttendance = attendanceRecords.reduce((acc, record) => {
        const studentRecord = record.students.find(s =>
          s.student._id.toString() === student._id.toString()
        );
        if (studentRecord) {
          acc.total++;
          if (studentRecord.status === 'present') {
            acc.present++;
          }
        }
        return acc;
      }, { total: 0, present: 0 });

      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email
        },
        totalClasses: studentAttendance.total,
        presentClasses: studentAttendance.present,
        absentClasses: studentAttendance.total - studentAttendance.present,
        attendancePercentage: studentAttendance.total > 0 ?
          Math.round((studentAttendance.present / studentAttendance.total) * 100) : 0
      };
    });

    // Overall class statistics
    const overallStats = {
      totalSessions: attendanceRecords.length,
      totalStudents: classDoc.students.length,
      averageAttendance: studentStats.length > 0 ?
        Math.round(studentStats.reduce((sum, s) => sum + s.attendancePercentage, 0) / studentStats.length) : 0
    };

    res.json({
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        subject: classDoc.subject,
        teacher: classDoc.teacher
      },
      overallStats,
      studentStats,
      attendanceRecords: attendanceRecords.slice(0, 10) // Recent 10 records
    });
  } catch (error) {
    console.error('Get class attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student attendance history
router.get('/student/:studentId', authenticateToken, requireRole(['teacher', 'admin', 'student']), requireApproval, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, classId, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Authorization checks
    if (userRole === 'student' && studentId !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this student\'s attendance' });
    }

    // Build filter
    const filter = { 'students.student': studentId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (classId) {
      filter.class = classId;
    }

    // If teacher, only show their classes
    if (userRole === 'teacher') {
      filter.teacher = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    // Transform to show only student's attendance status
    const studentAttendance = attendance.map(record => {
      const studentRecord = record.students.find(s =>
        s.student.toString() === studentId
      );

      return {
        _id: record._id,
        class: record.class,
        teacher: record.teacher,
        date: record.date,
        status: studentRecord ? studentRecord.status : 'not_marked',
        createdAt: record.createdAt
      };
    });

    res.json({
      attendance: studentAttendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance summary by date range
router.get('/summary/date-range', authenticateToken, requireRole(['teacher', 'admin']), requireApproval, async (req, res) => {
  try {
    const { startDate, endDate, classId, teacherId } = req.query;
    const userRole = req.user.role;
    const userId = req.user._id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Build filter
    const filter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // If user is teacher, only show their records
    if (userRole === 'teacher') {
      filter.teacher = userId;
    } else if (teacherId) {
      filter.teacher = teacherId;
    }

    if (classId) {
      filter.class = classId;
    }

    const attendance = await Attendance.find(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name email')
      .populate('students.student', 'name email');

    // Group by date
    const dailySummary = {};

    attendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];

      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          classes: [],
          totalSessions: 0,
          totalStudents: 0,
          totalPresent: 0,
          attendancePercentage: 0
        };
      }

      const presentCount = record.students.filter(s => s.status === 'present').length;
      const totalCount = record.students.length;

      dailySummary[dateKey].classes.push({
        class: record.class,
        teacher: record.teacher,
        presentCount,
        totalCount,
        attendancePercentage: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
      });

      dailySummary[dateKey].totalSessions++;
      dailySummary[dateKey].totalStudents += totalCount;
      dailySummary[dateKey].totalPresent += presentCount;
    });

    // Calculate daily percentages
    Object.keys(dailySummary).forEach(date => {
      const summary = dailySummary[date];
      summary.attendancePercentage = summary.totalStudents > 0 ?
        Math.round((summary.totalPresent / summary.totalStudents) * 100) : 0;
    });

    const sortedSummary = Object.values(dailySummary).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    res.json({
      dateRange: { startDate, endDate },
      dailySummary: sortedSummary,
      overallStats: {
        totalDays: sortedSummary.length,
        totalSessions: sortedSummary.reduce((sum, day) => sum + day.totalSessions, 0),
        averageAttendance: sortedSummary.length > 0 ?
          Math.round(sortedSummary.reduce((sum, day) => sum + day.attendancePercentage, 0) / sortedSummary.length) : 0
      }
    });
  } catch (error) {
    console.error('Get attendance date range summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
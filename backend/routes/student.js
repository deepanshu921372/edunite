const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireApproval } = require('../middleware/auth');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const StudyMaterial = require('../models/StudyMaterial');

// Get student dashboard stats
router.get('/dashboard', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get classes where student is enrolled
    const classes = await Class.find({ students: studentId })
      .populate('teacher', 'name email profile');

    const classIds = classes.map(cls => cls._id);

    // Get current month date range
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Get attendance records for current month
    const monthlyAttendance = await Attendance.find({
      class: { $in: classIds },
      date: { $gte: startOfMonth, $lte: endOfMonth },
      'students.student': studentId
    });

    // Calculate attendance statistics
    let totalClasses = 0;
    let presentClasses = 0;

    monthlyAttendance.forEach(record => {
      const studentAttendance = record.students.find(s =>
        s.student.toString() === studentId.toString()
      );
      if (studentAttendance) {
        totalClasses++;
        if (studentAttendance.status === 'present') {
          presentClasses++;
        }
      }
    });

    // Get recent study materials
    const recentStudyMaterials = await StudyMaterial.find({
      class: { $in: classIds }
    })
      .populate('teacher', 'name')
      .populate('class', 'name subject')
      .sort({ uploadedAt: -1 })
      .limit(5);

    // Get upcoming classes from timetable
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    const todayTimetable = await Timetable.find({
      class: { $in: classIds },
      'schedule.day': dayName
    })
      .populate('class', 'name subject')
      .populate('teacher', 'name');

    // Extract today's schedule
    const todayClasses = todayTimetable.flatMap(timetable => {
      const todaySchedule = timetable.schedule.find(s => s.day === dayName);
      return todaySchedule ? todaySchedule.timeSlots.map(slot => ({
        class: timetable.class,
        teacher: timetable.teacher,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject
      })) : [];
    });

    res.json({
      totalClasses: classes.length,
      monthlyAttendance: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
      },
      recentStudyMaterials: recentStudyMaterials.map(material => ({
        _id: material._id,
        title: material.title,
        subject: material.subject,
        class: material.class,
        teacher: material.teacher,
        uploadedAt: material.uploadedAt,
        fileType: material.fileType
      })),
      todayClasses: todayClasses.sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      }),
      enrolledClasses: classes.map(cls => ({
        _id: cls._id,
        name: cls.name,
        subject: cls.subject,
        teacher: cls.teacher
      }))
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's attendance record
router.get('/attendance', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { startDate, endDate, classId, page = 1, limit = 10 } = req.query;

    // Get classes where student is enrolled
    const classFilter = { students: studentId };
    if (classId) {
      classFilter._id = classId;
    }

    const classes = await Class.find(classFilter);
    const classIds = classes.map(cls => cls._id);

    // Build attendance filter
    const filter = {
      class: { $in: classIds },
      'students.student': studentId
    };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    // Transform attendance data to show only student's status
    const studentAttendance = attendance.map(record => {
      const studentRecord = record.students.find(s =>
        s.student.toString() === studentId.toString()
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

// Get student's attendance summary by class
router.get('/attendance-summary', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { startDate, endDate } = req.query;

    // Get classes where student is enrolled
    const classes = await Class.find({ students: studentId })
      .populate('teacher', 'name email');

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get attendance summary for each class
    const classSummary = await Promise.all(classes.map(async (cls) => {
      const filter = {
        class: cls._id,
        'students.student': studentId,
        ...dateFilter
      };

      const attendanceRecords = await Attendance.find(filter);

      let totalClasses = 0;
      let presentClasses = 0;

      attendanceRecords.forEach(record => {
        const studentAttendance = record.students.find(s =>
          s.student.toString() === studentId.toString()
        );
        if (studentAttendance) {
          totalClasses++;
          if (studentAttendance.status === 'present') {
            presentClasses++;
          }
        }
      });

      return {
        class: {
          _id: cls._id,
          name: cls.name,
          subject: cls.subject,
          teacher: cls.teacher
        },
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
      };
    }));

    // Calculate overall summary
    const overallSummary = classSummary.reduce((acc, cls) => {
      acc.totalClasses += cls.totalClasses;
      acc.presentClasses += cls.presentClasses;
      acc.absentClasses += cls.absentClasses;
      return acc;
    }, { totalClasses: 0, presentClasses: 0, absentClasses: 0 });

    overallSummary.attendancePercentage = overallSummary.totalClasses > 0 ?
      Math.round((overallSummary.presentClasses / overallSummary.totalClasses) * 100) : 0;

    res.json({
      overallSummary,
      classSummary
    });
  } catch (error) {
    console.error('Get student attendance summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's timetable
router.get('/timetable', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get classes where student is enrolled
    const classes = await Class.find({ students: studentId });
    const classIds = classes.map(cls => cls._id);

    // Get timetables for these classes
    const timetables = await Timetable.find({
      class: { $in: classIds }
    })
      .populate('class', 'name subject')
      .populate('teacher', 'name email');

    // Organize timetable by days
    const weeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    timetables.forEach(timetable => {
      timetable.schedule.forEach(daySchedule => {
        daySchedule.timeSlots.forEach(slot => {
          weeklySchedule[daySchedule.day].push({
            class: timetable.class,
            teacher: timetable.teacher,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject
          });
        });
      });
    });

    // Sort time slots for each day
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json({
      weeklySchedule,
      enrolledClasses: classes.map(cls => ({
        _id: cls._id,
        name: cls.name,
        subject: cls.subject
      }))
    });
  } catch (error) {
    console.error('Get student timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get study materials for student's classes (alias: /materials)
router.get('/materials', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { classId, subject, page = 1, limit = 10 } = req.query;

    // Get classes where student is enrolled
    const classFilter = { students: studentId };
    if (classId) {
      classFilter._id = classId;
    }

    const classes = await Class.find(classFilter);
    const classIds = classes.map(cls => cls._id);

    // Build study materials filter
    const filter = { class: { $in: classIds } };
    if (subject) {
      filter.subject = subject;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const studyMaterials = await StudyMaterial.find(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name email')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyMaterial.countDocuments(filter);

    res.json({
      studyMaterials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get student study materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get study materials for student's classes
router.get('/study-materials', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { classId, subject, page = 1, limit = 10 } = req.query;

    // Get classes where student is enrolled
    const classFilter = { students: studentId };
    if (classId) {
      classFilter._id = classId;
    }

    const classes = await Class.find(classFilter);
    const classIds = classes.map(cls => cls._id);

    // Build study materials filter
    const filter = { class: { $in: classIds } };
    if (subject) {
      filter.subject = subject;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const studyMaterials = await StudyMaterial.find(filter)
      .populate('class', 'name subject')
      .populate('teacher', 'name email')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyMaterial.countDocuments(filter);

    res.json({
      studyMaterials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get student study materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download study material (alias: /materials/:materialId/download)
router.get('/materials/:materialId/download', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { materialId } = req.params;

    // Get classes where student is enrolled
    const classes = await Class.find({ students: studentId });
    const classIds = classes.map(cls => cls._id);

    // Find study material and verify access
    const studyMaterial = await StudyMaterial.findOne({
      _id: materialId,
      class: { $in: classIds }
    })
      .populate('class', 'name subject')
      .populate('teacher', 'name');

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found or access denied' });
    }

    // Log download (optional - for analytics)
    console.log(`Student ${req.user.name} downloaded: ${studyMaterial.title}`);

    res.json({
      studyMaterial: {
        _id: studyMaterial._id,
        title: studyMaterial.title,
        description: studyMaterial.description,
        subject: studyMaterial.subject,
        class: studyMaterial.class,
        teacher: studyMaterial.teacher,
        fileUrl: studyMaterial.fileUrl,
        fileName: studyMaterial.fileName,
        fileType: studyMaterial.fileType,
        uploadedAt: studyMaterial.uploadedAt
      }
    });
  } catch (error) {
    console.error('Download study material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download study material (track download if needed)
router.get('/study-materials/:materialId/download', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { materialId } = req.params;

    // Get classes where student is enrolled
    const classes = await Class.find({ students: studentId });
    const classIds = classes.map(cls => cls._id);

    // Find study material and verify access
    const studyMaterial = await StudyMaterial.findOne({
      _id: materialId,
      class: { $in: classIds }
    })
      .populate('class', 'name subject')
      .populate('teacher', 'name');

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found or access denied' });
    }

    // Log download (optional - for analytics)
    console.log(`Student ${req.user.name} downloaded: ${studyMaterial.title}`);

    res.json({
      studyMaterial: {
        _id: studyMaterial._id,
        title: studyMaterial.title,
        description: studyMaterial.description,
        subject: studyMaterial.subject,
        class: studyMaterial.class,
        teacher: studyMaterial.teacher,
        fileUrl: studyMaterial.fileUrl,
        fileName: studyMaterial.fileName,
        fileType: studyMaterial.fileType,
        uploadedAt: studyMaterial.uploadedAt
      }
    });
  } catch (error) {
    console.error('Download study material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's class details
router.get('/classes/:classId', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const { classId } = req.params;

    // Verify student is enrolled in this class
    const classDoc = await Class.findOne({
      _id: classId,
      students: studentId
    })
      .populate('teacher', 'name email profile')
      .populate('students', 'name email profile');

    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Get recent attendance for this class
    const recentAttendance = await Attendance.find({
      class: classId,
      'students.student': studentId
    })
      .sort({ date: -1 })
      .limit(10);

    // Get student's attendance status for each record
    const attendanceHistory = recentAttendance.map(record => {
      const studentRecord = record.students.find(s =>
        s.student.toString() === studentId.toString()
      );

      return {
        date: record.date,
        status: studentRecord ? studentRecord.status : 'not_marked'
      };
    });

    // Get study materials for this class
    const studyMaterials = await StudyMaterial.find({ class: classId })
      .populate('teacher', 'name')
      .sort({ uploadedAt: -1 })
      .limit(5);

    // Get timetable for this class
    const timetable = await Timetable.findOne({ class: classId })
      .populate('teacher', 'name');

    res.json({
      class: classDoc,
      attendanceHistory,
      recentStudyMaterials: studyMaterials,
      timetable: timetable ? timetable.schedule : []
    });
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subjects for student's classes
router.get('/subjects', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get classes where student is enrolled
    const classes = await Class.find({ students: studentId })
      .select('subject');

    const subjects = [...new Set(classes.map(cls => cls.subject))];

    res.json({ subjects });
  } catch (error) {
    console.error('Get student subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student profile
router.get('/profile', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = await User.findById(studentId).select('-password');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student profile
router.put('/profile', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.role;
    delete updates.status;
    delete updates.email; // Email updates might need special verification

    const updatedStudent = await User.findByIdAndUpdate(
      studentId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student stats (alias for dashboard)
router.get('/stats', authenticateToken, requireRole(['student']), requireApproval, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get classes where student is enrolled
    const classes = await Class.find({ students: studentId })
      .populate('teacher', 'name email profile');

    const classIds = classes.map(cls => cls._id);

    // Get current month date range
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Get attendance records for current month
    const monthlyAttendance = await Attendance.find({
      class: { $in: classIds },
      date: { $gte: startOfMonth, $lte: endOfMonth },
      'students.student': studentId
    });

    // Calculate attendance statistics
    let totalClasses = 0;
    let presentClasses = 0;

    monthlyAttendance.forEach(record => {
      const studentAttendance = record.students.find(s =>
        s.student.toString() === studentId.toString()
      );
      if (studentAttendance) {
        totalClasses++;
        if (studentAttendance.status === 'present') {
          presentClasses++;
        }
      }
    });

    // Get recent study materials
    const recentStudyMaterials = await StudyMaterial.find({
      class: { $in: classIds }
    })
      .populate('teacher', 'name')
      .populate('class', 'name subject')
      .sort({ uploadedAt: -1 })
      .limit(5);

    // Get upcoming classes from timetable
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    const todayTimetable = await Timetable.find({
      class: { $in: classIds },
      'schedule.day': dayName
    })
      .populate('class', 'name subject')
      .populate('teacher', 'name');

    // Extract today's schedule
    const todayClasses = todayTimetable.flatMap(timetable => {
      const todaySchedule = timetable.schedule.find(s => s.day === dayName);
      return todaySchedule ? todaySchedule.timeSlots.map(slot => ({
        class: timetable.class,
        teacher: timetable.teacher,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject
      })) : [];
    });

    res.json({
      totalClasses: classes.length,
      monthlyAttendance: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
      },
      recentStudyMaterials: recentStudyMaterials.map(material => ({
        _id: material._id,
        title: material.title,
        subject: material.subject,
        class: material.class,
        teacher: material.teacher,
        uploadedAt: material.uploadedAt,
        fileType: material.fileType
      })),
      todayClasses: todayClasses.sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      }),
      enrolledClasses: classes.map(cls => ({
        _id: cls._id,
        name: cls.name,
        subject: cls.subject,
        teacher: cls.teacher
      }))
    });
  } catch (error) {
    console.error('Student stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
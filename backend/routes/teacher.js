const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireApproval } = require('../middleware/auth');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const StudyMaterial = require('../models/StudyMaterial');
const { uploadToCloudinary } = require('../config/cloudinary');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for study materials
  },
  fileFilter: (req, file, cb) => {
    // Allow documents, images, and common educational file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// Get teacher profile
router.get('/profile', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).select('-password');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update teacher profile
router.put('/profile', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const {
      name,
      profile
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (profile) updateData.profile = { ...req.user.profile, ...profile };

    const updatedTeacher = await User.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({
      success: true,
      data: updatedTeacher,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update teacher profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher dashboard stats
router.get('/stats', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get classes taught by teacher
    const classes = await Class.find({ teacher: teacherId });
    const classIds = classes.map(cls => cls._id);

    // Get total students across all classes
    const totalStudents = await User.countDocuments({
      _id: { $in: classes.flatMap(cls => cls.students) }
    });

    // Get attendance statistics for this month
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyAttendance = await Attendance.find({
      teacher: teacherId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const classesThisMonth = monthlyAttendance.length;
    const classesTaken = monthlyAttendance.filter(record =>
      record.teacherAttendance && record.teacherAttendance.status === 'present'
    ).length;

    // Get study materials count
    const studyMaterialsCount = await StudyMaterial.countDocuments({
      teacher: teacherId
    });

    // Get recent attendance records
    const recentAttendance = await Attendance.find({
      teacher: teacherId
    })
      .populate('class', 'name subject')
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalClasses: classes.length,
        totalStudents,
        classesThisMonth,
        classesTaken,
        attendancePercentage: classesThisMonth > 0 ? Math.round((classesTaken / classesThisMonth) * 100) : 0,
        studyMaterialsCount,
        recentAttendance: recentAttendance.map(record => ({
          _id: record._id,
          class: record.class,
          date: record.date,
          studentsPresent: record.students ? record.students.filter(s => s.status === 'present').length : 0,
          totalStudents: record.students ? record.students.length : 0
        }))
      }
    });
  } catch (error) {
    console.error('Teacher dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher's assigned classes
router.get('/classes', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;

    const classes = await Class.find({ teacher: teacherId })
      .populate('students', 'name email profile')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher's timetable
router.get('/timetable', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;

    const timetable = await Timetable.find({ teacher: teacherId })
      .populate('class', 'name subject')
      .sort({ createdAt: -1 });

    res.json(timetable);
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update timetable
router.post('/timetable', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, schedule } = req.body;

    if (!classId || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Class ID and schedule are required' });
    }

    // Verify teacher owns this class
    const classDoc = await Class.findOne({ _id: classId, teacher: teacherId });
    if (!classDoc) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    // Check if timetable exists for this class
    let timetable = await Timetable.findOne({ class: classId, teacher: teacherId });

    if (timetable) {
      // Update existing timetable
      timetable.schedule = schedule;
      timetable.updatedAt = new Date();
      await timetable.save();
    } else {
      // Create new timetable
      timetable = new Timetable({
        class: classId,
        teacher: teacherId,
        schedule
      });
      await timetable.save();
    }

    await timetable.populate('class', 'name subject');

    res.json({
      timetable,
      message: 'Timetable saved successfully'
    });
  } catch (error) {
    console.error('Save timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students for attendance marking
router.get('/attendance/students', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, date } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Verify teacher owns this class
    const classDoc = await Class.findOne({ _id: classId, teacher: teacherId })
      .populate('students', 'name email profile');

    if (!classDoc) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    // If date is provided, check if attendance already exists
    let existingAttendance = null;
    if (date) {
      const attendanceDate = new Date(date);
      existingAttendance = await Attendance.findOne({
        class: classId,
        teacher: teacherId,
        date: {
          $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
          $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
        }
      });
    }

    res.json({
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        subject: classDoc.subject
      },
      students: classDoc.students,
      existingAttendance
    });
  } catch (error) {
    console.error('Get students for attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance history for a specific class
router.get('/attendance/history', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, startDate, endDate } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Verify teacher owns this class
    const classDoc = await Class.findOne({ _id: classId, teacher: teacherId });
    if (!classDoc) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    const filter = {
      class: classId,
      teacher: teacherId
    };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceHistory = await Attendance.find(filter)
      .populate('students.student', 'name email')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendanceHistory
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance with location tracking
router.post('/attendance', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
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
        latitude: location.latitude,
        longitude: location.longitude
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
    await attendance.populate('students.student', 'name email');

    res.json({
      attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance records for teacher's classes
router.get('/attendance', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { startDate, endDate, classId, page = 1, limit = 10 } = req.query;

    const filter = { teacher: teacherId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (classId) {
      filter.class = classId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(filter)
      .populate('class', 'name subject')
      .populate('students.student', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Get teacher attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload study material
router.post('/materials', authenticateToken, requireRole(['teacher']), requireApproval, upload.single('file'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { title, description, classId, subject } = req.body;

    if (!req.file || !title || !classId || !subject) {
      return res.status(400).json({ error: 'File, title, class ID, and subject are required' });
    }

    // Verify teacher owns this class
    const classDoc = await Class.findOne({ _id: classId, teacher: teacherId });
    if (!classDoc) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'edunite/study-materials'
    );

    // Create study material record
    const studyMaterial = new StudyMaterial({
      title,
      description,
      class: classId,
      teacher: teacherId,
      subject,
      fileUrl: uploadResult.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });

    await studyMaterial.save();
    await studyMaterial.populate('class', 'name subject');
    await studyMaterial.populate('teacher', 'name email');

    res.status(201).json({
      studyMaterial,
      message: 'Study material uploaded successfully'
    });
  } catch (error) {
    console.error('Upload study material error:', error);
    res.status(500).json({ error: 'Failed to upload study material' });
  }
});

// Get study materials uploaded by teacher
router.get('/materials', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId, subject, page = 1, limit = 10 } = req.query;

    const filter = { teacher: teacherId };

    if (classId) {
      filter.class = classId;
    }

    if (subject) {
      filter.subject = subject;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const studyMaterials = await StudyMaterial.find(filter)
      .populate('class', 'name subject')
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
    console.error('Get teacher study materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete study material
router.delete('/materials/:materialId', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { materialId } = req.params;

    const studyMaterial = await StudyMaterial.findOne({
      _id: materialId,
      teacher: teacherId
    });

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found or not authorized' });
    }

    await StudyMaterial.findByIdAndDelete(materialId);

    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    console.error('Delete study material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get class-wise attendance summary
router.get('/attendance-summary/:classId', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify teacher owns this class
    const classDoc = await Class.findOne({ _id: classId, teacher: teacherId })
      .populate('students', 'name email');

    if (!classDoc) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    const filter = {
      class: classId,
      teacher: teacherId
    };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('students.student', 'name email')
      .sort({ date: -1 });

    // Calculate summary for each student
    const studentSummary = classDoc.students.map(student => {
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

    res.json({
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        subject: classDoc.subject
      },
      totalSessions: attendanceRecords.length,
      studentSummary,
      attendanceRecords: attendanceRecords.slice(0, 10) // Recent 10 records
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students in teacher's classes
router.get('/students', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { classId } = req.query;

    const filter = { teacher: teacherId };
    if (classId) {
      filter._id = classId;
    }

    const classes = await Class.find(filter)
      .populate('students', 'name email profile')
      .select('name subject students');

    res.json(classes);
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
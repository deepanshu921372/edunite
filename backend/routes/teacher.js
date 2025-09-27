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

// Create a new class (teacher can create their own classes)
router.post('/classes', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const { name, grade, subject, description, stream } = req.body;
    const teacherId = req.user._id;

    // Validate required fields
    if (!name || !grade || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Name, grade, and subject are required'
      });
    }

    // Check if class already exists for this teacher with same grade and subject
    const existingClass = await Class.findOne({
      teacher: teacherId,
      grade: grade,
      subject: subject
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        error: 'You already have a class for this grade and subject'
      });
    }

    // Create new class
    const newClass = new Class({
      name,
      grade,
      subject,
      description: description || `${subject} class for ${grade} students`,
      stream: stream || null,
      teacher: teacherId,
      students: []
    });

    await newClass.save();

    // Populate teacher info for response
    await newClass.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      data: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
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
    const { classId, grade, subject, schedule } = req.body;

    if (!classId || !schedule || !Array.isArray(schedule) || !grade || !subject) {
      return res.status(400).json({ error: 'Class ID, grade, subject, and schedule are required' });
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
      timetable.grade = grade;
      timetable.subject = subject;
      timetable.updatedAt = new Date();
      await timetable.save();
    } else {
      // Create new timetable
      timetable = new Timetable({
        class: classId,
        teacher: teacherId,
        grade: grade,
        subject: subject,
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

// Create study material with uploaded files (for multi-file uploads)
router.post('/materials/create', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { title, description, classId, subject, files } = req.body;

    console.log('Received data:', { title, description, classId, subject, files });
    console.log('Files type:', typeof files);
    console.log('Files content:', JSON.stringify(files, null, 2));

    if (!title || !subject || !files || files.length === 0) {
      return res.status(400).json({ error: 'Title, subject, and files are required' });
    }

    // Parse files if they're sent as string
    let parsedFiles;
    try {
      parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
      console.log('Parsed files:', parsedFiles);
      console.log('Parsed files type:', typeof parsedFiles);
    } catch (parseError) {
      console.log('Parse error:', parseError);
      return res.status(400).json({ error: 'Invalid files format' });
    }

    // Create material data
    const materialData = {
      title,
      description,
      teacher: teacherId,
      subject,
      files: parsedFiles.map(file => ({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type
      }))
    };

    // Handle classId - could be ObjectId or grade string
    if (classId) {
      // Check if it's a valid ObjectId (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(classId)) {
        materialData.class = classId;
      } else {
        // It's a grade string like "11th", "12th"
        materialData.grade = classId;
      }
    }

    console.log('Final material data:', JSON.stringify(materialData, null, 2));

    const studyMaterial = new StudyMaterial(materialData);
    console.log('StudyMaterial object before save:', studyMaterial);

    await studyMaterial.save();
    console.log('StudyMaterial saved successfully');

    // Only populate class if it exists
    if (materialData.class) {
      await studyMaterial.populate('class', 'name subject');
    }
    await studyMaterial.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      data: studyMaterial,
      message: 'Study material created successfully'
    });
  } catch (error) {
    console.error('Create study material error:', error);
    res.status(500).json({ error: 'Failed to create study material' });
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

    console.log('Deleting material:', materialId, 'for teacher:', teacherId);

    const studyMaterial = await StudyMaterial.findOne({
      _id: materialId,
      teacher: teacherId
    });

    if (!studyMaterial) {
      return res.status(404).json({ error: 'Study material not found or not authorized' });
    }

    console.log('Found material:', studyMaterial);

    // Delete files from Cloudinary
    const cloudinary = require('cloudinary').v2;
    const filesToDelete = [];

    // Handle multiple files format
    if (studyMaterial.files && studyMaterial.files.length > 0) {
      studyMaterial.files.forEach(file => {
        if (file.url) {
          const publicId = extractPublicIdFromUrl(file.url);
          if (publicId) filesToDelete.push(publicId);
        }
      });
    }

    // Handle single file format (backward compatibility)
    if (studyMaterial.fileUrl) {
      const publicId = extractPublicIdFromUrl(studyMaterial.fileUrl);
      if (publicId) filesToDelete.push(publicId);
    }

    console.log('Files to delete from Cloudinary:', filesToDelete);

    // Delete files from Cloudinary
    for (const publicId of filesToDelete) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        console.log('Deleted from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', publicId, cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await StudyMaterial.findByIdAndDelete(materialId);

    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    console.error('Delete study material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    // Extract public ID from URLs like:
    // https://res.cloudinary.com/cloud/image/upload/v123/folder/file.pdf
    // https://res.cloudinary.com/cloud/raw/upload/v123/folder/file.pdf
    const regex = /\/(?:image|raw)\/upload\/(?:v\d+\/)?(.+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

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

// CORRECTED STUDENT ENDPOINTS - Fixed duplicate routes and middleware

// Get students in teacher's classes (UPDATED - Returns actual users, not classes)
router.get('/students', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get all students, not classes
    const students = await User.find({ role: 'student' })
      .select('-password')
      .lean(); // Use lean() for better performance

    console.log('Debug - Total students found:', students.length);
    if (students.length > 0) {
      console.log('Sample student structure:', students[0]);
      console.log('Student fields:', Object.keys(students[0]));
    }

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get all students (alternative endpoint)
router.get('/all-students', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    // Get all users with role 'student' from your MongoDB users collection
    const students = await User.find({ role: 'student' }).select('-password');
    
    console.log('Returning students:', students.length);
    console.log('Sample student:', students[0]); // Should have name, email, role, grade, subjects
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch students' 
    });
  }
});

// Get students by class
router.get('/classes/:classId/students', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user._id;
    
    // Get the class first to understand its grade and subjects
    const classInfo = await Class.findOne({ 
      _id: classId, 
      teacher: teacherId // Ensure teacher owns this class
    });
    
    if (!classInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found or not authorized' 
      });
    }
    
    // Find students matching this class's grade and subjects
    const students = await User.find({
      role: 'student',
      $or: [
        { grade: classInfo.grade },
        { 'profile.grade': classInfo.grade }
      ]
    }).select('-password');
    
    // Further filter by subjects if needed
    const filteredStudents = students.filter(student => {
      const studentSubjects = student.subjects || student.profile?.subjects || [];
      const classSubjects = classInfo.subjects || [classInfo.subject];
      
      return classSubjects.some(classSubject => 
        studentSubjects.some(studentSubject => 
          typeof studentSubject === 'string' 
            ? studentSubject.toLowerCase().includes(classSubject.toLowerCase())
            : (studentSubject.name || studentSubject.subject || '').toLowerCase().includes(classSubject.toLowerCase())
        )
      );
    });
    
    res.json({
      success: true,
      data: filteredStudents
    });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch class students' 
    });
  }
});

// Alternative route to get all users with role filter
router.get('/all-users', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = {};
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query).select('-password');
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
});

// Debugging endpoint to check what your current endpoints return
router.get('/debug/students', authenticateToken, requireRole(['teacher']), requireApproval, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).limit(5);
    console.log('Debug - Found students:', students);
    
    res.json({
      success: true,
      message: 'Debug info',
      totalStudents: await User.countDocuments({ role: 'student' }),
      sampleStudent: students[0],
      studentFields: students[0] ? Object.keys(students[0].toObject()) : [],
      allUsers: await User.find({}).limit(3).select('name email role') // Check all users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
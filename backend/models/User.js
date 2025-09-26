const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: {
    type: Date
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  profile: {
    phoneNumber: String,
    address: String,
    dateOfBirth: Date,
    // Student-specific fields
    parentName: String,
    parentPhoneNumber: String,
    grade: String, // e.g., "Nursery", "LKG", "UKG", "1st", "2nd", ..., "12th"
    stream: String, // For 11th and 12th: "Science", "Commerce", "Arts"
    schoolName: String,
    previousTuitionExperience: String,
    // Teacher-specific fields
    qualifications: String,
    experience: String, // Years of teaching experience
    specialization: String, // e.g., "Mathematics", "Science"
    teachingGrades: [String], // Grades they can teach: ["9th", "10th", "11th", "12th"]
    teachingSubjects: [String], // Subjects they can teach
    joinedDate: Date,
    emergencyContactName: String,
    emergencyContactPhone: String,
    emergencyContactRelation: String
  },
  admissionNumber: String, // Instead of rollNumber - more appropriate for tuition
  subjects: [String], // Array of subjects student is enrolled for
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
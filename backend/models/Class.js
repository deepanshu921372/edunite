const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true // e.g., "10th", "11th", "12th", etc.
  },
  stream: {
    type: String // For 11th and 12th: "Science", "Commerce", "Arts"
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  description: String,
  schedule: {
    days: [String], // e.g., ["Monday", "Wednesday", "Friday"]
    time: String, // e.g., "10:00 AM - 11:30 AM"
  },
  maxStudents: {
    type: Number,
    default: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Class', classSchema);
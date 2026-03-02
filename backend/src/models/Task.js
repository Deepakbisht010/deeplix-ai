// Task Schema - Deeplix AI
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed', 'cancelled'],
    default: 'todo',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'General',
    maxlength: 50
  },
  tags: [{ type: String, maxlength: 30 }],
  dueDate: Date,
  completedAt: Date,
  aiGenerated: { type: Boolean, default: false }, // Was this task suggested by AI?
  aiNotes: String, // AI analysis or suggestions for this task
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  estimatedMinutes: Number,
  actualMinutes: Number
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ user: 1, status: 1, createdAt: -1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, priority: 1 });

// Auto-set completedAt
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);

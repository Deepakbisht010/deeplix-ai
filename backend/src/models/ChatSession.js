// AI Interaction History Schema - Deeplix AI
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  tokens: { type: Number, default: 0 },
  metadata: {
    model: String,
    processingTime: Number, // milliseconds
    intent: String, // detected intent: task, question, analysis, etc.
    sentiment: String // positive, neutral, negative
  }
}, { _id: true, timestamps: true });

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: 100
  },
  messages: [messageSchema],
  summary: String, // AI-generated summary of the conversation
  tags: [String],
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  model: { type: String, default: 'claude-sonnet-4-6' },
  totalTokens: { type: Number, default: 0 },
  lastMessageAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
chatSessionSchema.index({ user: 1, lastMessageAt: -1 });
chatSessionSchema.index({ user: 1, isArchived: 1 });
chatSessionSchema.index({ user: 1, isPinned: -1 });

// Auto-update lastMessageAt
chatSessionSchema.pre('save', function(next) {
  if (this.messages.length > 0) {
    this.lastMessageAt = new Date();
    // Update token count
    this.totalTokens = this.messages.reduce((sum, m) => sum + (m.tokens || 0), 0);
  }
  next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);

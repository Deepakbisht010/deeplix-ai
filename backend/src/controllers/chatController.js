// Chat Controller - AI Interaction Handler
const ChatSession = require('../models/ChatSession');
const Task = require('../models/Task');
const User = require('../models/User');
const aiAgent = require('../services/aiAgent');

// POST /api/chat/message - Send message and get AI response
const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 characters).' });
    }

    // Get user context
    const taskCount = await Task.countDocuments({
      user: req.user._id,
      status: { $in: ['todo', 'in-progress'] }
    });

    let session;

    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
      if (!session) {
        return res.status(404).json({ error: 'Chat session not found.' });
      }
    } else {
      // Create new session
      session = new ChatSession({
        user: req.user._id,
        messages: []
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message
    });

    // Prepare context for AI
    const context = {
      taskCount,
      recentTopics: session.messages
        .filter(m => m.metadata?.intent)
        .slice(-3)
        .map(m => m.metadata.intent)
    };

    // Call AI agent
    const aiResponse = await aiAgent.chat(
      session.messages.map(m => ({ role: m.role, content: m.content })),
      req.user,
      context
    );

    // Add AI response to session
    session.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      tokens: aiResponse.outputTokens,
      metadata: {
        model: aiResponse.model,
        processingTime: aiResponse.processingTime,
        intent: aiResponse.intent
      }
    });

    // Auto-generate title for new sessions
    if (!sessionId && session.messages.length === 2) {
      session.title = await aiAgent.generateTitle(message);
    }

    await session.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalChats': 1 }
    });

    // If AI suggested tasks, create them automatically
    let createdTasks = [];
    if (aiResponse.suggestedTasks.length > 0) {
      const taskPromises = aiResponse.suggestedTasks.map(t =>
        Task.create({
          user: req.user._id,
          title: t.title,
          priority: t.priority || 'medium',
          category: t.category || 'AI Suggested',
          aiGenerated: true,
          aiNotes: `Suggested during chat: "${message.substring(0, 100)}"`
        })
      );
      createdTasks = await Promise.allSettled(taskPromises);
    }

    res.json({
      sessionId: session._id,
      message: {
        role: 'assistant',
        content: aiResponse.content,
        createdAt: new Date(),
        metadata: {
          processingTime: aiResponse.processingTime,
          intent: aiResponse.intent
        }
      },
      suggestedTasks: aiResponse.suggestedTasks,
      tasksCreated: createdTasks.filter(r => r.status === 'fulfilled').length
    });
  } catch (err) {
    if (err.message?.includes('API key') || err.message?.includes('not configured')) {
      return res.status(503).json({
        error: 'AI service unavailable. Add GEMINI_API_KEY or ANTHROPIC_API_KEY to backend/.env',
        demo: true
      });
    }
    next(err);
  }
};

// GET /api/chat/sessions - List user's chat sessions
const getSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, archived = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await ChatSession.find({
      user: req.user._id,
      isArchived: archived === 'true'
    })
      .select('title lastMessageAt isPinned totalTokens messages')
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatSession.countDocuments({
      user: req.user._id,
      isArchived: archived === 'true'
    });

    // Add message count & preview to each session
    const sessionsWithPreview = sessions.map(s => ({
      _id: s._id,
      title: s.title,
      lastMessageAt: s.lastMessageAt,
      isPinned: s.isPinned,
      messageCount: s.messages.length,
      preview: s.messages[s.messages.length - 1]?.content?.substring(0, 100) || ''
    }));

    res.json({ sessions: sessionsWithPreview, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/sessions/:id - Get a specific session with all messages
const getSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/chat/sessions/:id
const deleteSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.json({ message: 'Session deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/analyze - Get productivity analysis
const analyzeProductivity = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).limit(100);
    const analysis = await aiAgent.analyzeProductivity(tasks, req.user);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getSessions, getSession, deleteSession, analyzeProductivity };

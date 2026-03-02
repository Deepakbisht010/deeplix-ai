// Task Controller
const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, category, sort = '-createdAt', page = 1, limit = 50 } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tasks = await Task.find(filter)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({ tasks, total });
  } catch (err) { next(err); }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const task = await Task.create({ ...req.body, user: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalTasks': 1 } });

    res.status(201).json({ task });
  } catch (err) { next(err); }
};

// PATCH /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Update user stats if completing a task
    if (req.body.status === 'completed') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.completedTasks': 1 } });
    }

    res.json({ task });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch (err) { next(err); }
};

// GET /api/tasks/stats
const getStats = async (req, res, next) => {
  try {
    const [total, completed, inProgress, overdue] = await Promise.all([
      Task.countDocuments({ user: req.user._id }),
      Task.countDocuments({ user: req.user._id, status: 'completed' }),
      Task.countDocuments({ user: req.user._id, status: 'in-progress' }),
      Task.countDocuments({
        user: req.user._id,
        dueDate: { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled'] }
      })
    ]);

    const byPriority = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({ total, completed, inProgress, overdue, byPriority });
  } catch (err) { next(err); }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getStats };

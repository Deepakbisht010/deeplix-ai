const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask, getStats } = require('../controllers/taskController');

const router = express.Router();

router.use(auth);

router.get('/', getTasks);
router.get('/stats', getStats);
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)')
], createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;

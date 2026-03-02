const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(auth);

// PATCH /api/users/preferences
router.patch('/preferences', async (req, res, next) => {
  try {
    const allowed = ['theme', 'aiPersonality', 'notifications'];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[`preferences.${key}`] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) { next(err); }
});

// PATCH /api/users/profile
router.patch('/profile', async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sendMessage, getSessions, getSession, deleteSession, analyzeProductivity } = require('../controllers/chatController');

/* GET sessions list */
router.get('/sessions', auth, getSessions);

/* GET single session */
router.get('/sessions/:id', auth, getSession);

/* POST message - real AI response via chatController */
router.post('/message', auth, sendMessage);

/* DELETE session */
router.delete('/sessions/:id', auth, deleteSession);

/* POST analyze productivity */
router.post('/analyze', auth, analyzeProductivity);

module.exports = router;
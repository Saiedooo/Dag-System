const express = require('express');
const router = express.Router();
const {
  createFeedbackTask,
} = require('../Services/dailyFeedbackTaskController');

router.post('/feedback-tasks', createFeedbackTask);

module.exports = router;

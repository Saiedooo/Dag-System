const express = require('express');
const router = express.Router();

let appState = {};

router.get('/', (req, res) => {
  res.json(appState);
});

router.post('/', (req, res) => {
  appState = req.body;
  res.json({ message: 'State updated' });
});

module.exports = router;

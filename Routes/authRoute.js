const express = require('express');

const router = express.Router();

// const {
//   uploadUserImages,
//   processAndUpload,
// } = require('../middleware/uploadImageMiddleware');

const { login, signup } = require('../Services/authServices');

router.post('/login', login);
router.post('/signup', signup);
module.exports = router;

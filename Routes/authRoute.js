const express = require('express');

const router = express.Router();

// const {
//   uploadUserImages,
//   processAndUpload,
// } = require('../middleware/uploadImageMiddleware');

const { login } = require('../Services/authServices');

router.post('/login', login);

module.exports = router;

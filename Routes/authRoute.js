const express = require('express');
const ensureDbConnection = require('../middleware/dbConnectionMiddleware');

const router = express.Router();

// const {
//   uploadUserImages,
//   processAndUpload,
// } = require('../middleware/uploadImageMiddleware');

const { login, signup } = require('../Services/authServices');

// Ensure database connection before handling auth requests
router.use(ensureDbConnection);

router.post('/login', login);
router.post('/signup', signup);
module.exports = router;

const crypto = require('crypto');
require('dotenv').config();
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
// const sendEmail = require('../utils/sendEmail');
// const multer = require('multer');
// const { put } = require('@vercel/blob');
// const sharp = require('sharp');
const createToken = require('../utils/createToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// const { v4: uuidv4 } = require('uuid');
// const { uploadSingleImage } = require('../middleware/uploadImageMiddleware');

const User = require('../Models/UserModel.js');

exports.signup = asyncHandler(async (req, res, next) => {
  // create User
  const user = await User.create(req.body);
  // generate Token
  const token = createToken(user._id);

  res.status(201).json({ data: user, token });
});

exports.login = asyncHandler(async (req, res, next) => {
  // Check if user exists & check if password is correct
  const user = await User.findOne({ userName: req.body.userName });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError('Incorrect userName Or password', 401));
  }

  // Check if the account is active

  // Generate Token
  const token = createToken(user._id);

  // Send Response
  res.status(200).json({ data: user, token });
});

exports.protect = asyncHandler(async (req, res, next) => {
  // 1) cheeck if token exist if exist hold it
  //console.log(req.headers);  // headers in hidden postman
  let token;
  if (req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
    // console.log(token);
  }
  if (!token) {
    return next(
      new ApiError(
        'you are not login , Please login to get access this route  ',
        401
      )
    );
  }

  // 2)verify token (no change happen ,expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); //return decoded cl decded
  //   console.log(decoded);

  // 3)check if user exists

  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new ApiError('the user that belong to token does not longer Exist', 401)
    );
  }

  // 4)check if user change his password after token created
  if (currentUser.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getDate() / 1000,
      10
    );
    if (passwordChangedTimestamp > decoded.iat) {
      return next(
        new ApiError('User recently changed password plz login again', 401)
      );
    }
  }
  req.user = currentUser;
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: No user found' });
  }
  next();
});

// @desc authorization
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new ApiError('You are not allowed to access this route', 403));
    }
    next();
  });

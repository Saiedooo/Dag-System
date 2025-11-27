const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, 'username required'],
    },
    lastName: {
      type: String,
      // required: [true, 'last name Required'],
    },
    email: {
      type: String,
      // required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    age: {
      type: Number,
      // required: [true, 'age required'],
    },
    phoneNumber: String, //phone

    password: {
      type: String,
      required: [true, 'Password required'],
      minlength: [6, 'too Short password'],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,

    role: {
      type: String,
      enum: ['moderator', 'clientService', 'admin', 'customer'],
      default: 'customer',
    },
    points: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      // required: [true, 'must be add your address'],
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },

    // relation create Problems

    //Relation   last purg]hsed number mail , history of appointments , name  , price
  },

  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;

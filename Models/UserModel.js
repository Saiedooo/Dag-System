const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, 'username required'],
    },

    // email: {
    //   type: String,
    //   // required: [true, 'email required'],
    //   unique: true,
    //   lowercase: true,
    // },
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
      //   minlength: [6, 'too Short password'],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,

    role: {
      type: String,
      enum: [
        'Staff ',
        'Moderator ',
        'TeamLeader ',
        'AccountsManager ',
        'GeneralManager ',
        'Admin',
      ],
      default: 'Staff',
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

userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }

  // Hash password with cost of 12
  // In Mongoose 9, async hooks don't need next() - errors are automatically handled
  this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model('User', userSchema);
module.exports = User;

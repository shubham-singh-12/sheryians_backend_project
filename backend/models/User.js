const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never return password by default
    },
    refreshToken: {
      type: String,
      default: null,
      select: false, // never return refresh token by default
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

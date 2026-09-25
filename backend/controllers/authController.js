const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateTokens');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

// A small, non-sensitive, readable-by-JS cookie that only signals
// "a session might exist" so the frontend can skip calling
// /refresh-token on app load when the user was never logged in.
// It carries no token value and grants no access by itself.
const SESSION_HINT_COOKIE_NAME = 'hasSession';
const sessionHintCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
    res.cookie(SESSION_HINT_COOKIE_NAME, 'true', sessionHintCookieOptions);

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies ? req.cookies[REFRESH_COOKIE_NAME] : undefined;
    const tokenFromBody = req.body ? req.body.refreshToken : undefined;
    const incomingToken = tokenFromCookie || tokenFromBody;

    if (!incomingToken) {
      return res.status(401).json({ message: 'Refresh token missing, please login again' });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
      res.clearCookie(SESSION_HINT_COOKIE_NAME, sessionHintCookieOptions);
      return res.status(403).json({ message: 'Invalid or expired refresh token, please login again' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.refreshToken || user.refreshToken !== incomingToken) {
      if (user) {
        // token reuse / mismatch detected - revoke stored token for safety
        user.refreshToken = null;
        await user.save();
      }
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
      res.clearCookie(SESSION_HINT_COOKIE_NAME, sessionHintCookieOptions);
      return res.status(403).json({ message: 'Refresh token is no longer valid, please login again' });
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);
    res.cookie(SESSION_HINT_COOKIE_NAME, 'true', sessionHintCookieOptions);

    return res.status(200).json({
      message: 'Access token refreshed',
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during token refresh', error: error.message });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    res.clearCookie(SESSION_HINT_COOKIE_NAME, sessionHintCookieOptions);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching profile', error: error.message });
  }
};

module.exports = { register, login, refreshToken, logout, getMe };

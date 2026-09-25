const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} = require('../controllers/authController');

const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  registerValidation,
  loginValidation,
} = require('../validations/authValidation');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;

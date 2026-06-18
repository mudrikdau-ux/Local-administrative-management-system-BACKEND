const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../utils/validators');

// Public Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/login/verify-otp', authController.verifyLoginOTP);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected Routes
router.get('/profile', verifyToken, authController.getProfile);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
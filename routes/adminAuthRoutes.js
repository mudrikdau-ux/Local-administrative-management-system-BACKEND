const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');

// Public Routes (No token required)
router.post('/login', adminAuthController.login);
router.post('/verify-otp', adminAuthController.verifyOTP);
router.post('/resend-otp', adminAuthController.resendOTP);
router.post('/forgot-password', adminAuthController.forgotPassword);
router.post('/reset-password', adminAuthController.resetPassword);

// Protected Routes (Token required)
router.get('/profile', verifyAdminToken, adminAuthController.getProfile);
router.post('/logout', verifyAdminToken, adminAuthController.logout);

module.exports = router;
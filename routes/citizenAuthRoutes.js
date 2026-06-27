const express = require('express');
const router = express.Router();
const citizenAuthController = require('../controllers/citizenAuthController');
const { verifyCitizenToken } = require('../middleware/citizenAuthMiddleware');

// Public Routes (No token required)
router.post('/login', citizenAuthController.login);
router.post('/verify-otp', citizenAuthController.verifyOTP);
router.post('/resend-otp', citizenAuthController.resendOTP);
router.post('/forgot-password', citizenAuthController.forgotPassword);
router.post('/verify-reset-otp', citizenAuthController.verifyResetOTP);
router.post('/reset-password', citizenAuthController.resetPassword);

// Protected Routes (Token required)
router.get('/profile', verifyCitizenToken, citizenAuthController.getProfile);
router.post('/logout', verifyCitizenToken, citizenAuthController.logout);

module.exports = router;
const rateLimit = require('express-rate-limit');

const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const adminOTPLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 OTP attempts
    message: { message: 'Too many OTP attempts. Please login again to request a new code.' }
});

module.exports = { adminLoginLimiter, adminOTPLimiter };
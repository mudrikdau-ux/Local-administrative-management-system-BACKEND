const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const rateLimit = require('express-rate-limit');

// Rate limiter for contact form (5 requests per 15 minutes per IP)
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many messages sent. Please try again later.' }
});

// ====================================
// HOME & ABOUT STATISTICS
// ====================================
router.get('/home/statistics', publicController.getHomeStatistics);
router.get('/about/statistics', publicController.getAboutStatistics);

// ====================================
// PUBLIC ANNOUNCEMENTS
// ====================================
router.get('/announcements', publicController.getAnnouncements);
router.get('/announcements/:id', publicController.getAnnouncementById);

// ====================================
// CONTACT US (Rate Limited)
// ====================================
router.post('/contact/send-message', contactLimiter, publicController.sendContactMessage);

// ====================================
// DOCUMENT VERIFICATION (Public)
// ====================================
router.get('/verify-document/:verificationCode', publicController.verifyDocument);

module.exports = router;
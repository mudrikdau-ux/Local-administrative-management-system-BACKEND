const PublicModel = require('../models/PublicModel');
const { body, validationResult } = require('express-validator');
const { sendContactAcknowledgment, sendAdminNotification } = require('../services/emailService');
const SystemSetting = require('../models/SystemSetting');
const docVerifyService = require('../services/documentVerificationService');

const publicController = {
    // ====================================
    // HOME PAGE STATISTICS
    // ====================================
    getHomeStatistics: async (req, res) => {
        try {
            const stats = await PublicModel.getHomeStatistics();
            res.json({ success: true, ...stats });
        } catch (error) {
            console.error('Home Stats Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // ABOUT PAGE STATISTICS
    // ====================================
    getAboutStatistics: async (req, res) => {
        try {
            const stats = await PublicModel.getAboutStatistics();
            res.json({ success: true, ...stats });
        } catch (error) {
            console.error('About Stats Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET ALL PUBLIC ANNOUNCEMENTS
    // ====================================
    getAnnouncements: async (req, res) => {
        try {
            const { page, limit, search, category } = req.query;
            const result = await PublicModel.getAnnouncements({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 12,
                search: search || null,
                category: category || null
            });

            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Announcements Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET ANNOUNCEMENT DETAILS
    // ====================================
    getAnnouncementById: async (req, res) => {
        try {
            const announcement = await PublicModel.getAnnouncementById(req.params.id);
            if (!announcement) {
                return res.status(404).json({ success: false, message: 'Announcement not found.' });
            }

            // Increment view count
            await PublicModel.incrementView(req.params.id, req.ip);

            const viewCount = await PublicModel.getViewCount(req.params.id);

            res.json({ success: true, announcement: { ...announcement, total_views: viewCount } });
        } catch (error) {
            console.error('Announcement Detail Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // SEND CONTACT MESSAGE
    // ====================================
    sendContactMessage: [
        body('full_name').trim().notEmpty().withMessage('Full name is required.'),
        body('email').trim().isEmail().withMessage('Valid email is required.'),
        body('phone').trim().notEmpty().withMessage('Phone number is required.'),
        body('subject').trim().notEmpty().withMessage('Subject is required.'),
        body('message').trim().notEmpty().withMessage('Message is required.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                const { full_name, email, phone, subject, message } = req.body;

                // Save to database
                const messageId = await PublicModel.createContactMessage({
                    full_name,
                    email,
                    phone,
                    subject,
                    message,
                    ip_address: req.ip
                });

                // Get system settings for admin email
                let adminEmail = 'info@lams.go.tz';
                try {
                    const settings = await SystemSetting.getSettings();
                    if (settings && settings.contact_email) {
                        adminEmail = settings.contact_email;
                    }
                } catch (e) {}

                // Send acknowledgment email to sender
                try {
                    await sendContactAcknowledgment(email, full_name, subject);
                } catch (emailError) {
                    console.log('Acknowledgment email not sent:', emailError.message);
                }

                // Send notification to admin
                try {
                    await sendAdminNotification(adminEmail, full_name, email, phone, subject, message);
                } catch (emailError) {
                    console.log('Admin notification not sent:', emailError.message);
                }

                res.status(201).json({
                    success: true,
                    message: 'Your message has been sent successfully. We will get back to you soon.',
                    message_id: messageId
                });
            } catch (error) {
                console.error('Contact Message Error:', error);
                res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
            }
        }
    ],

    // ====================================
    // VERIFY DOCUMENT (Public)
    // ====================================
    verifyDocument: async (req, res) => {
        try {
            const { verificationCode } = req.params;
            const result = await docVerifyService.verifyDocument(verificationCode);
            
            if (!result.valid) {
                return res.status(404).json({ success: false, message: result.message });
            }

            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Verify Document Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = publicController;
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const CitizenProfile = require('../models/CitizenProfile');
const CitizenSupport = require('../models/CitizenSupport');
const AuditLogModel = require('../models/AuditLogModel');
const notificationService = require('../services/notificationService');
const { sendPasswordResetNotification } = require('../services/emailService');
const fs = require('fs');
const path = require('path');

const citizenProfileController = {
    // ====================================
    // VIEW PROFILE
    // ====================================
    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const profile = await CitizenProfile.getProfile(userId);

            if (!profile) {
                return res.status(404).json({ success: false, message: 'Profile not found.' });
            }

            delete profile.password;

            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'PROFILE_VIEWED',
                type: 'citizen', status: 'success', description: 'Profile viewed',
                performed_by: userId, ip_address: req.ip
            });

            res.json({ success: true, profile: {
                id: profile.citizen_id,
                user_id: profile.user_id,
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
                ward: profile.ward_name,
                national_id: profile.national_id,
                gender: profile.gender,
                date_of_birth: profile.date_of_birth,
                occupation: profile.occupation,
                account_status: profile.account_status,
                registration_date: profile.registration_date,
                last_login: profile.last_login,
                profile_photo: profile.profile_photo || profile.citizen_photo,
                password_changed: profile.password_changed
            }});
        } catch (error) {
            console.error('Get Profile Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UPDATE PROFILE
    // ====================================
    updateProfile: [
        body('full_name').trim().notEmpty().withMessage('Full name is required.'),
        body('email').trim().isEmail().withMessage('Valid email is required.'),
        body('phone').trim().notEmpty().withMessage('Phone number is required.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                const userId = req.user.id;
                const { full_name, email, phone, address, national_id, gender, date_of_birth, occupation } = req.body;

                const current = await CitizenProfile.getProfile(userId);
                if (!current) return res.status(404).json({ success: false, message: 'Profile not found.' });

                // Check unique email
                if (email !== current.email) {
                    const exists = await CitizenProfile.getByEmail(email, userId);
                    if (exists) return res.status(400).json({ success: false, message: 'Email already in use.' });
                }

                await CitizenProfile.updateProfile(userId, {
                    full_name, email, phone, address, national_id, gender, date_of_birth, occupation
                });

                await AuditLogModel.create({
                    email: req.user.email, role: 'citizen', action: 'PROFILE_UPDATED',
                    type: 'citizen', status: 'success', description: 'Profile updated',
                    performed_by: userId, ip_address: req.ip
                });

                res.json({ success: true, message: 'Profile updated successfully.' });
            } catch (error) {
                console.error('Update Profile Error:', error);
                res.status(500).json({ success: false, message: 'Server error.' });
            }
        }
    ],

    // ====================================
    // UPDATE PROFILE PHOTO
    // ====================================
    updatePhoto: async (req, res) => {
        try {
            const userId = req.user.id;
            if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded.' });

            const current = await CitizenProfile.getProfile(userId);
            if (current?.profile_photo) {
                const oldPath = path.join(__dirname, '..', current.profile_photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            const photoPath = `/uploads/profiles/${req.file.filename}`;
            await CitizenProfile.updatePhoto(userId, photoPath);

            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'PROFILE_PHOTO_UPDATED',
                type: 'citizen', status: 'success', description: 'Profile photo updated',
                performed_by: userId, ip_address: req.ip
            });

            res.json({ success: true, message: 'Profile photo updated.', profile_photo: photoPath });
        } catch (error) {
            console.error('Photo Error:', error);
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // CHANGE PASSWORD
    // ====================================
    changePassword: [
        body('current_password').notEmpty().withMessage('Current password required.'),
        body('new_password').isLength({ min: 6 }).withMessage('Minimum 6 characters.'),
        body('confirm_password').custom((v, { req }) => {
            if (v !== req.body.new_password) throw new Error('Passwords do not match.');
            return true;
        }),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

            try {
                const userId = req.user.id;
                const { current_password, new_password } = req.body;

                const hash = await CitizenProfile.getPasswordHash(userId);
                if (!hash) return res.status(404).json({ success: false, message: 'User not found.' });

                const match = await bcrypt.compare(current_password, hash);
                if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

                const same = await bcrypt.compare(new_password, hash);
                if (same) return res.status(400).json({ success: false, message: 'New password must be different.' });

                const salt = await bcrypt.genSalt(12);
                const hashed = await bcrypt.hash(new_password, salt);
                await CitizenProfile.updatePassword(userId, hashed);

                // Send confirmation email
                try {
                    await sendPasswordResetNotification(req.user.email, req.user.full_name, '********');
                } catch (e) {}

                await AuditLogModel.create({
                    email: req.user.email, role: 'citizen', action: 'PASSWORD_CHANGED',
                    type: 'security', status: 'success', description: 'Password changed',
                    performed_by: userId, ip_address: req.ip
                });

                res.json({ success: true, message: 'Password changed successfully.' });
            } catch (error) {
                console.error('Password Error:', error);
                res.status(500).json({ success: false, message: 'Server error.' });
            }
        }
    ],

    // ====================================
    // CONTACT ADMIN
    // ====================================
    contactAdmin: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const wardId = req.user.ward_id;
            const { subject, message } = req.body;

            if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message required.' });

            const admin = await CitizenSupport.getWardAdmin(wardId);
            const requestId = await CitizenSupport.createRequest({
                citizen_id: citizenId,
                admin_id: admin?.id || null,
                subject,
                message
            });

            // Notify admin
            try {
                await notificationService.notifySuperAdmin(
                    'New Support Request',
                    `${req.user.full_name}: ${subject}`,
                    'support', 'info', 'support', requestId
                );
            } catch (e) {}

            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'SUPPORT_REQUEST',
                type: 'support', status: 'success', description: `Support request: ${subject}`,
                performed_by: req.user.id, ip_address: req.ip
            });

            res.status(201).json({ success: true, message: 'Support request submitted.', request_id: requestId });
        } catch (error) {
            console.error('Contact Admin Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET FAQS
    // ====================================
    getFAQs: async (req, res) => {
        try {
            const category = req.query.category || null;
            const faqs = await CitizenSupport.getFAQs(category);

            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'FAQ_VIEWED',
                type: 'support', status: 'success', description: 'FAQs viewed',
                performed_by: req.user.id, ip_address: req.ip
            });

            res.json({ success: true, faqs, total: faqs.length });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // REPORT ISSUE
    // ====================================
    reportIssue: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const { issue_title, issue_description, priority } = req.body;

            if (!issue_title || !issue_description) return res.status(400).json({ success: false, message: 'Title and description required.' });

            const issueId = await CitizenSupport.reportIssue({
                citizen_id: citizenId,
                issue_title,
                issue_description,
                priority: priority || 'medium'
            });

            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'ISSUE_REPORTED',
                type: 'support', status: 'success', description: `Issue: ${issue_title}`,
                performed_by: req.user.id, ip_address: req.ip
            });

            res.status(201).json({ success: true, message: 'Issue reported.', issue_id: issueId });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET GUIDES
    // ====================================
    getGuides: async (req, res) => {
        try {
            const category = req.query.category || null;
            const guides = await CitizenSupport.getGuides(category);

            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'GUIDES_VIEWED',
                type: 'support', status: 'success', description: 'Guides viewed',
                performed_by: req.user.id, ip_address: req.ip
            });

            res.json({ success: true, guides, total: guides.length });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = citizenProfileController;
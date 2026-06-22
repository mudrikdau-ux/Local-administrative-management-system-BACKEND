const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const AdminProfile = require('../models/AdminProfile');
const AuditLogModel = require('../models/AuditLogModel');
const Security = require('../models/Security');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const adminProfileController = {
    // ====================================
    // VIEW PROFILE
    // ====================================
    getProfile: async (req, res) => {
        try {
            let userId = req.user.id;

            // Try finding by user ID first
            let profile = await AdminProfile.getByUserId(userId);

            // If not found, try by admin_id from token
            if (!profile && req.user.admin_id) {
                const [rows] = await pool.execute(
                    'SELECT user_id FROM admins WHERE id = ?',
                    [req.user.admin_id]
                );
                if (rows[0] && rows[0].user_id) {
                    userId = rows[0].user_id;
                    profile = await AdminProfile.getByUserId(userId);
                }
            }

            // If still not found, try by email
            if (!profile && req.user.email) {
                const [rows] = await pool.execute(
                    "SELECT id FROM users WHERE email = ? AND role = 'admin'",
                    [req.user.email]
                );
                if (rows[0]) {
                    profile = await AdminProfile.getByUserId(rows[0].id);
                }
            }

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin profile not found. Ensure admin account is properly linked.',
                    debug: { user_id: req.user.id, admin_id: req.user.admin_id, email: req.user.email }
                });
            }

            // Don't expose password
            delete profile.password;

            // Audit log
            await AuditLogModel.create({
                email: profile.email,
                role: 'admin',
                action: 'PROFILE_VIEWED',
                type: 'citizen',
                status: 'success',
                description: 'Admin viewed their profile',
                performed_by: userId,
                ip_address: req.ip
            });

            res.json({
                success: true,
                data: {
                    user_id: profile.id,
                    admin_id: profile.admin_id,
                    profile_photo: profile.profile_photo,
                    full_name: profile.full_name,
                    email: profile.email,
                    phone: profile.phone,
                    role: 'Administrator',
                    ward: profile.ward_name || 'Not Assigned',
                    ward_id: profile.ward_id,
                    position: profile.position_name || 'Not Assigned',
                    position_id: profile.position_id,
                    account_status: profile.status,
                    last_login: profile.last_login,
                    created_at: profile.created_at
                }
            });
        } catch (error) {
            console.error('Get Profile Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UPDATE PROFILE
    // ====================================
    updateProfile: [
        body('full_name').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters.'),
        body('email').trim().isEmail().withMessage('Valid email is required.'),
        body('phone').trim().notEmpty().withMessage('Phone number is required.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                let userId = req.user.id;
                const { full_name, email, phone } = req.body;

                // Get current profile (with flexible lookup)
                let currentProfile = await AdminProfile.getByUserId(userId);
                if (!currentProfile && req.user.admin_id) {
                    const [rows] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.user.admin_id]);
                    if (rows[0] && rows[0].user_id) {
                        userId = rows[0].user_id;
                        currentProfile = await AdminProfile.getByUserId(userId);
                    }
                }

                if (!currentProfile) {
                    return res.status(404).json({ success: false, message: 'Profile not found.' });
                }

                // Check unique email
                if (email !== currentProfile.email) {
                    const emailExists = await AdminProfile.getByEmail(email, userId);
                    if (emailExists) {
                        return res.status(400).json({ success: false, message: 'Email is already in use.' });
                    }
                }

                // Check unique phone
                if (phone !== currentProfile.phone) {
                    const phoneExists = await AdminProfile.getByPhone(phone, userId);
                    if (phoneExists) {
                        return res.status(400).json({ success: false, message: 'Phone number is already in use.' });
                    }
                }

                // Update profile
                const updated = await AdminProfile.updateProfile(userId, { full_name, email, phone });

                if (!updated) {
                    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
                }

                // Track changes
                const changes = [];
                if (full_name !== currentProfile.full_name) changes.push(`Name updated`);
                if (email !== currentProfile.email) changes.push(`Email updated`);
                if (phone !== currentProfile.phone) changes.push(`Phone updated`);

                // Audit log
                await AuditLogModel.create({
                    email: email,
                    role: 'admin',
                    action: 'PROFILE_UPDATED',
                    type: 'citizen',
                    status: 'success',
                    description: `Profile updated. Changes: ${changes.join(', ') || 'No changes'}`,
                    old_values: { full_name: currentProfile.full_name, email: currentProfile.email, phone: currentProfile.phone },
                    new_values: { full_name, email, phone },
                    performed_by: userId,
                    ip_address: req.ip
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
    updateProfilePhoto: async (req, res) => {
        try {
            let userId = req.user.id;

            // Check if file uploaded
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No image file uploaded.' });
            }

            // Flexible user lookup
            let currentProfile = await AdminProfile.getByUserId(userId);
            if (!currentProfile && req.user.admin_id) {
                const [rows] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.user.admin_id]);
                if (rows[0] && rows[0].user_id) {
                    userId = rows[0].user_id;
                    currentProfile = await AdminProfile.getByUserId(userId);
                }
            }

            // Get current profile to delete old photo
            if (currentProfile && currentProfile.profile_photo) {
                const oldPhotoPath = path.join(__dirname, '..', currentProfile.profile_photo);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }

            // Save new photo path
            const photoPath = `/uploads/profiles/${req.file.filename}`;
            await AdminProfile.updatePhoto(userId, photoPath);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'PROFILE_PHOTO_UPDATED',
                type: 'citizen',
                status: 'success',
                description: 'Profile photo updated',
                performed_by: userId,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Profile photo updated successfully.',
                profile_photo: photoPath
            });
        } catch (error) {
            console.error('Update Photo Error:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // REMOVE PROFILE PHOTO
    // ====================================
    removeProfilePhoto: async (req, res) => {
        try {
            let userId = req.user.id;

            let currentProfile = await AdminProfile.getByUserId(userId);
            if (!currentProfile && req.user.admin_id) {
                const [rows] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.user.admin_id]);
                if (rows[0] && rows[0].user_id) {
                    userId = rows[0].user_id;
                    currentProfile = await AdminProfile.getByUserId(userId);
                }
            }

            if (currentProfile && currentProfile.profile_photo) {
                const photoPath = path.join(__dirname, '..', currentProfile.profile_photo);
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                }
            }

            await AdminProfile.removePhoto(userId);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'PROFILE_PHOTO_REMOVED',
                type: 'citizen',
                status: 'success',
                description: 'Profile photo removed',
                performed_by: userId,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Profile photo removed.' });
        } catch (error) {
            console.error('Remove Photo Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // CHANGE PASSWORD
    // ====================================
    changePassword: [
        body('current_password').notEmpty().withMessage('Current password is required.'),
        body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
        body('confirm_new_password').custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('New passwords do not match.');
            }
            return true;
        }),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
            }

            try {
                let userId = req.user.id;

                // Get current password hash
                let passwordHash = await AdminProfile.getPasswordHash(userId);

                // Flexible lookup
                if (!passwordHash && req.user.admin_id) {
                    const [rows] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.user.admin_id]);
                    if (rows[0] && rows[0].user_id) {
                        userId = rows[0].user_id;
                        passwordHash = await AdminProfile.getPasswordHash(userId);
                    }
                }

                if (!passwordHash) {
                    return res.status(404).json({ success: false, message: 'User account not found.' });
                }

                const { current_password, new_password } = req.body;

                // Verify current password
                const isMatch = await bcrypt.compare(current_password, passwordHash);
                if (!isMatch) {
                    await AuditLogModel.create({
                        email: req.user.email,
                        role: 'admin',
                        action: 'PASSWORD_CHANGE_FAILED',
                        type: 'security',
                        status: 'error',
                        description: 'Failed password change attempt - incorrect current password',
                        performed_by: userId,
                        ip_address: req.ip
                    });

                    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
                }

                // Check new password is different
                const isSamePassword = await bcrypt.compare(new_password, passwordHash);
                if (isSamePassword) {
                    return res.status(400).json({ success: false, message: 'New password must be different from current password.' });
                }

                // Hash new password
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(new_password, salt);

                // Update password
                await AdminProfile.updatePassword(userId, hashedPassword);

                // Record security log
                try {
                    await Security.recordLogin({
                        user_id: userId,
                        email: req.user.email,
                        role: 'admin',
                        action: 'PASSWORD_CHANGED',
                        status: 'success',
                        ip_address: req.ip,
                        browser: req.headers['user-agent']
                    });
                } catch (e) {
                    // Security log optional
                }

                // Audit log
                await AuditLogModel.create({
                    email: req.user.email,
                    role: 'admin',
                    action: 'PASSWORD_CHANGED',
                    type: 'security',
                    status: 'success',
                    description: 'Admin changed their password',
                    performed_by: userId,
                    ip_address: req.ip
                });

                res.json({ success: true, message: 'Password changed successfully.' });
            } catch (error) {
                console.error('Change Password Error:', error);
                res.status(500).json({ success: false, message: 'Server error.' });
            }
        }
    ]
};

module.exports = adminProfileController;
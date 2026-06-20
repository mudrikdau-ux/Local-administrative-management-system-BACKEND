const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Profile = require('../models/Profile');
const AuditLogModel = require('../models/AuditLogModel');
const path = require('path');
const fs = require('fs');

const profileController = {
    // ====================================
    // GET PROFILE
    // ====================================
    getProfile: async (req, res) => {
        try {
            const userId = req.query.user_id || 1; // Default to Super Admin ID 1
            const profile = await Profile.getById(userId);

            if (!profile) {
                return res.status(404).json({ message: 'Profile not found.' });
            }

            // Don't expose password
            delete profile.password;

            res.json({ profile });
        } catch (error) {
            console.error('Get Profile Error:', error);
            res.status(500).json({ message: 'Server error fetching profile.' });
        }
    },

    // ====================================
    // UPDATE PROFILE (Name, Email, Phone)
    // ====================================
    updateProfile: [
        // Validation
        body('full_name').trim().notEmpty().withMessage('Full name is required.'),
        body('email').trim().isEmail().withMessage('Valid email is required.'),
        body('phone').trim().notEmpty().withMessage('Phone number is required.'),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            try {
                const { full_name, email, phone, updated_by, performed_by_name } = req.body;
                const userId = req.body.user_id || 1;

                // Get current profile for comparison
                const currentProfile = await Profile.getById(userId);
                if (!currentProfile) {
                    return res.status(404).json({ message: 'Profile not found.' });
                }

                // Check if email is already taken by another user
                const emailExists = await Profile.getByEmail(email, userId);
                if (emailExists) {
                    return res.status(400).json({ message: 'Email is already in use by another account.' });
                }

                // Check if phone is already taken by another user
                const phoneExists = await Profile.getByPhone(phone, userId);
                if (phoneExists) {
                    return res.status(400).json({ message: 'Phone number is already in use by another account.' });
                }

                // Update profile
                const updated = await Profile.updateProfile(userId, {
                    full_name,
                    email,
                    phone,
                    updated_by: updated_by || userId
                });

                if (!updated) {
                    return res.status(500).json({ message: 'Failed to update profile.' });
                }

                // Track changes
                const changes = [];
                if (full_name !== currentProfile.full_name) changes.push(`Name: "${currentProfile.full_name}" → "${full_name}"`);
                if (email !== currentProfile.email) changes.push(`Email updated`);
                if (phone !== currentProfile.phone) changes.push(`Phone updated`);

                // Audit log
                await AuditLogModel.create({
                    email: email,
                    role: 'super_admin',
                    action: 'PROFILE_UPDATED',
                    type: 'citizen',
                    status: 'success',
                    description: `Profile updated. Changes: ${changes.join(', ') || 'No changes detected'}`,
                    old_values: { full_name: currentProfile.full_name, email: currentProfile.email, phone: currentProfile.phone },
                    new_values: { full_name, email, phone },
                    performed_by: updated_by || userId,
                    ip_address: req.ip,
                    browser: req.headers['user-agent']
                });

                // Get updated profile
                const updatedProfile = await Profile.getById(userId);
                delete updatedProfile.password;

                res.json({
                    message: 'Profile updated successfully.',
                    profile: updatedProfile
                });
            } catch (error) {
                console.error('Update Profile Error:', error);
                res.status(500).json({ message: 'Server error updating profile.' });
            }
        }
    ],

    // ====================================
    // UPDATE PROFILE IMAGE
    // ====================================
    updateProfileImage: async (req, res) => {
        try {
            const userId = req.body.user_id || 1;
            const performed_by_name = req.body.performed_by_name || 'Super Admin';

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: 'No image file uploaded.' });
            }

            const currentProfile = await Profile.getById(userId);
            if (!currentProfile) {
                return res.status(404).json({ message: 'Profile not found.' });
            }

            // Delete old profile photo if exists
            if (currentProfile.profile_photo) {
                const oldPhotoPath = path.join(__dirname, '..', currentProfile.profile_photo);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }

            // Save new photo path
            const photoPath = `/uploads/profiles/${req.file.filename}`;
            await Profile.updatePhoto(userId, photoPath);

            // Audit log
            await AuditLogModel.create({
                email: currentProfile.email,
                role: 'super_admin',
                action: 'PROFILE_IMAGE_CHANGED',
                type: 'citizen',
                status: 'success',
                description: 'Profile photo updated',
                performed_by: userId,
                ip_address: req.ip,
                browser: req.headers['user-agent']
            });

            res.json({
                message: 'Profile photo updated successfully.',
                profile_photo: photoPath
            });
        } catch (error) {
            console.error('Update Profile Image Error:', error);
            res.status(500).json({ message: 'Server error updating profile image.' });
        }
    },

    // ====================================
    // CHANGE PASSWORD
    // ====================================
    changePassword: [
        // Validation
        body('current_password').notEmpty().withMessage('Current password is required.'),
        body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
        body('confirm_password').custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('Confirm password does not match new password.');
            }
            return true;
        }),

        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            try {
                const { current_password, new_password } = req.body;
                const userId = req.body.user_id || 1;

                // Get current password hash
                const passwordHash = await Profile.getPasswordHash(userId);
                if (!passwordHash) {
                    return res.status(404).json({ message: 'User not found.' });
                }

                // Verify current password
                const isMatch = await bcrypt.compare(current_password, passwordHash);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Current password is incorrect.' });
                }

                // Check if new password is same as current
                const isSamePassword = await bcrypt.compare(new_password, passwordHash);
                if (isSamePassword) {
                    return res.status(400).json({ message: 'New password must be different from current password.' });
                }

                // Hash new password
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(new_password, salt);

                // Update password
                await Profile.updatePassword(userId, hashedPassword);

                // Get user email for audit log
                const profile = await Profile.getById(userId);

                // Audit log
                await AuditLogModel.create({
                    email: profile ? profile.email : 'unknown',
                    role: 'super_admin',
                    action: 'PASSWORD_CHANGED',
                    type: 'security',
                    status: 'success',
                    description: 'Super Admin changed their password',
                    performed_by: userId,
                    ip_address: req.ip,
                    browser: req.headers['user-agent']
                });

                res.json({ message: 'Password changed successfully. Please log in again with your new password.' });
            } catch (error) {
                console.error('Change Password Error:', error);
                res.status(500).json({ message: 'Server error changing password.' });
            }
        }
    ],

    // ====================================
    // REMOVE PROFILE PHOTO
    // ====================================
    removeProfileImage: async (req, res) => {
        try {
            const userId = req.body.user_id || 1;
            const currentProfile = await Profile.getById(userId);

            if (!currentProfile) {
                return res.status(404).json({ message: 'Profile not found.' });
            }

            // Delete photo file if exists
            if (currentProfile.profile_photo) {
                const photoPath = path.join(__dirname, '..', currentProfile.profile_photo);
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                }
            }

            // Clear photo path in database
            await Profile.updatePhoto(userId, null);

            // Audit log
            await AuditLogModel.create({
                email: currentProfile.email,
                role: 'super_admin',
                action: 'PROFILE_IMAGE_REMOVED',
                type: 'citizen',
                status: 'success',
                description: 'Profile photo removed',
                performed_by: userId,
                ip_address: req.ip
            });

            res.json({ message: 'Profile photo removed successfully.' });
        } catch (error) {
            console.error('Remove Photo Error:', error);
            res.status(500).json({ message: 'Server error removing photo.' });
        }
    }
};

module.exports = profileController;
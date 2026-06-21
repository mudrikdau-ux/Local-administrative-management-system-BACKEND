const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminAuth = require('../models/AdminAuth');
const Security = require('../models/Security');
const AuditLogModel = require('../models/AuditLogModel');
const TokenBlacklist = require('../models/TokenBlacklist');
const { sendOTPEmail } = require('../services/emailService');
const { generateOTP } = require('../utils/helpers');
require('dotenv').config();

const adminAuthController = {
    // ====================================
    // STEP 1: LOGIN (Validate + Send OTP)
    // ====================================
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find admin
            const admin = await AdminAuth.findByEmail(email);
            if (!admin) {
                return res.status(400).json({ message: 'Invalid email or password.' });
            }

            // Check account status
            if (admin.status === 'suspended') {
                return res.status(403).json({ message: 'Your account has been suspended. Contact Super Admin.' });
            }

            if (admin.status === 'locked' || admin.is_locked) {
                return res.status(403).json({ message: 'Your account is locked. Contact Super Admin.' });
            }

            if (admin.status === 'inactive') {
                return res.status(403).json({ message: 'Your account is inactive. Contact Super Admin.' });
            }

            if (admin.status !== 'active') {
                return res.status(403).json({ message: `Account is ${admin.status}. Cannot login.` });
            }

            // Check login attempts
            if (admin.login_attempts >= 5) {
                await AdminAuth.lockAccount(admin.id);
                
                // Record security alert
                await Security.createAlert({
                    user_id: admin.id,
                    email: admin.email,
                    role: 'admin',
                    action: 'ACCOUNT_LOCKED',
                    type: 'account_locked',
                    description: `Account locked due to excessive login attempts: ${admin.email}`,
                    severity: 'high',
                    performed_by_name: 'System',
                    ip_address: req.ip
                });

                return res.status(403).json({ message: 'Account locked due to too many failed attempts. Contact Super Admin.' });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                await AdminAuth.incrementLoginAttempts(admin.id);

                // Record failed login
                await Security.recordLogin({
                    user_id: admin.id,
                    email: admin.email,
                    full_name: admin.full_name,
                    role: 'admin',
                    action: 'LOGIN',
                    status: 'failed',
                    failure_reason: 'Invalid password',
                    ip_address: req.ip,
                    browser: req.headers['user-agent']
                });

                // Audit log
                await AuditLogModel.create({
                    email: admin.email,
                    role: 'admin',
                    action: 'LOGIN_FAILED',
                    type: 'authentication',
                    status: 'error',
                    description: `Failed login attempt for admin: ${admin.email}`,
                    ip_address: req.ip
                });

                return res.status(400).json({ message: 'Invalid email or password.' });
            }

            // Reset login attempts on successful password
            await AdminAuth.resetLoginAttempts(admin.id);

            // Generate OTP
            const otp = generateOTP();
            await AdminAuth.storeOTP(admin.id, otp);

            // Send OTP email
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log('Email not sent, OTP in console:', otp);
                console.log(`========================================`);
                console.log(`Admin OTP for ${email}: ${otp}`);
                console.log(`========================================`);
            }

            // Audit log
            await AuditLogModel.create({
                email: admin.email,
                role: 'admin',
                action: 'OTP_SENT',
                type: 'authentication',
                status: 'success',
                description: `OTP sent to admin: ${admin.email}`,
                ip_address: req.ip
            });

            res.json({
                message: 'Credentials verified. OTP sent to your email.',
                email: email,
                step: 'otp_required',
                admin_name: admin.full_name
            });
        } catch (error) {
            console.error('Admin Login Error:', error);
            res.status(500).json({ message: 'Server error during login.' });
        }
    },

    // ====================================
    // STEP 2: VERIFY OTP
    // ====================================
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            // Find admin
            const admin = await AdminAuth.findByEmail(email);
            if (!admin) {
                return res.status(400).json({ message: 'Invalid request.' });
            }

            // Check OTP attempts
            if (admin.otp_attempts >= 5) {
                await AdminAuth.clearOTP(admin.id);
                return res.status(400).json({ message: 'Too many failed OTP attempts. Please login again to request a new code.' });
            }

            // Verify OTP
            const verified = await AdminAuth.verifyOTP(email, otp);
            if (!verified) {
                await AdminAuth.incrementOTPAttempts(admin.id);

                // Audit log
                await AuditLogModel.create({
                    email: admin.email,
                    role: 'admin',
                    action: 'OTP_FAILED',
                    type: 'authentication',
                    status: 'error',
                    description: `Invalid OTP attempt for admin: ${admin.email}`,
                    ip_address: req.ip
                });

                return res.status(400).json({ message: 'Invalid or expired verification code.' });
            }

            // Clear OTP after successful verification
            await AdminAuth.clearOTP(admin.id);

            // Update last login
            await AdminAuth.updateLastLogin(admin.id);

            // Generate JWT
            const token = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    role: 'admin',
                    admin_id: admin.admin_id,
                    ward_id: admin.ward_id,
                    ward_name: admin.ward_name
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Record successful login
            await Security.recordLogin({
                user_id: admin.id,
                email: admin.email,
                full_name: admin.full_name,
                role: 'admin',
                action: 'LOGIN',
                status: 'success',
                ip_address: req.ip,
                browser: req.headers['user-agent'],
                device: req.headers['sec-ch-ua-platform'] || 'Unknown',
                operating_system: req.headers['sec-ch-ua-platform'] || 'Unknown'
            });

            // Audit log
            await AuditLogModel.create({
                email: admin.email,
                role: 'admin',
                action: 'LOGIN_SUCCESS',
                type: 'authentication',
                status: 'success',
                description: `Admin logged in successfully: ${admin.email}`,
                ip_address: req.ip
            });

            res.json({
                message: 'Login successful.',
                token,
                admin: {
                    id: admin.id,
                    admin_id: admin.admin_id,
                    full_name: admin.full_name,
                    email: admin.email,
                    phone: admin.phone,
                    role: 'admin',
                    ward_id: admin.ward_id,
                    ward_name: admin.ward_name,
                    position_id: admin.position_id,
                    position_name: admin.position_name,
                    profile_photo: admin.admin_photo,
                    status: admin.status
                }
            });
        } catch (error) {
            console.error('Verify OTP Error:', error);
            res.status(500).json({ message: 'Server error during verification.' });
        }
    },

    // ====================================
    // RESEND OTP
    // ====================================
    resendOTP: async (req, res) => {
        try {
            const { email } = req.body;

            const admin = await AdminAuth.findByEmail(email);
            if (!admin) {
                return res.status(400).json({ message: 'Invalid request.' });
            }

            // Generate new OTP
            const otp = generateOTP();
            await AdminAuth.storeOTP(admin.id, otp);

            // Send OTP
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log(`========================================`);
                console.log(`Admin OTP Resent for ${email}: ${otp}`);
                console.log(`========================================`);
            }

            // Audit log
            await AuditLogModel.create({
                email: admin.email,
                role: 'admin',
                action: 'OTP_RESENT',
                type: 'authentication',
                status: 'success',
                description: `OTP resent to admin: ${admin.email}`,
                ip_address: req.ip
            });

            res.json({ message: 'New verification code sent to your email.' });
        } catch (error) {
            console.error('Resend OTP Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // FORGOT PASSWORD
    // ====================================
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            const admin = await AdminAuth.findByEmail(email);
            if (!admin) {
                // Don't reveal if email exists
                return res.json({ message: 'If the email is registered, a reset code has been sent.' });
            }

            // Generate OTP for password reset
            const otp = generateOTP();
            await AdminAuth.storeOTP(admin.id, otp);

            // Send reset email
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log(`========================================`);
                console.log(`Admin Password Reset OTP for ${email}: ${otp}`);
                console.log(`========================================`);
            }

            // Audit log
            await AuditLogModel.create({
                email: admin.email,
                role: 'admin',
                action: 'PASSWORD_RESET_REQUESTED',
                type: 'authentication',
                status: 'success',
                description: `Password reset requested for admin: ${admin.email}`,
                ip_address: req.ip
            });

            res.json({ message: 'If the email is registered, a reset code has been sent.' });
        } catch (error) {
            console.error('Forgot Password Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // RESET PASSWORD
    // ====================================
    resetPassword: async (req, res) => {
        try {
            const { email, otp, new_password } = req.body;

            if (!new_password || new_password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters.' });
            }

            // Verify OTP
            const verified = await AdminAuth.verifyOTP(email, otp);
            if (!verified) {
                return res.status(400).json({ message: 'Invalid or expired verification code.' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(new_password, salt);

            // Update password
            await AdminAuth.updatePassword(verified.id, hashedPassword);
            await AdminAuth.clearOTP(verified.id);

            // Audit log
            await AuditLogModel.create({
                email: email,
                role: 'admin',
                action: 'PASSWORD_RESET',
                type: 'authentication',
                status: 'success',
                description: `Password reset completed for admin: ${email}`,
                ip_address: req.ip
            });

            res.json({ message: 'Password reset successful. You can now login with your new password.' });
        } catch (error) {
            console.error('Reset Password Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // GET PROFILE
    // ====================================
    getProfile: async (req, res) => {
        try {
            const admin = await AdminAuth.findById(req.user.id);
            if (!admin) {
                return res.status(404).json({ message: 'Admin not found.' });
            }

            // Don't expose password
            delete admin.password;
            delete admin.otp_code;
            delete admin.otp_expires_at;
            delete admin.otp_attempts;

            res.json({
                admin: {
                    id: admin.id,
                    admin_id: admin.admin_id,
                    full_name: admin.full_name,
                    email: admin.email,
                    phone: admin.phone,
                    role: 'admin',
                    ward_id: admin.ward_id,
                    ward_name: admin.ward_name,
                    position_id: admin.position_id,
                    position_name: admin.position_name,
                    profile_photo: admin.admin_photo,
                    status: admin.status,
                    last_login: admin.last_login
                }
            });
        } catch (error) {
            console.error('Profile Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // LOGOUT
    // ====================================
    logout: async (req, res) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const user = req.user;

            if (token) {
                await TokenBlacklist.blacklist({
                    token: token,
                    user_id: user.id,
                    email: user.email,
                    role: 'admin'
                });
            }

            // Record logout
            await Security.recordLogin({
                user_id: user.id,
                email: user.email,
                role: 'admin',
                action: 'LOGOUT',
                status: 'success',
                ip_address: req.ip
            });

            // Audit log
            await AuditLogModel.create({
                email: user.email,
                role: 'admin',
                action: 'LOGOUT',
                type: 'authentication',
                status: 'success',
                description: `Admin logged out: ${user.email}`,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Logged out successfully.' });
        } catch (error) {
            console.error('Logout Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    }
};

module.exports = adminAuthController;
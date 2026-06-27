const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CitizenAuth = require('../models/CitizenAuth');
const Security = require('../models/Security');
const AuditLogModel = require('../models/AuditLogModel');
const TokenBlacklist = require('../models/TokenBlacklist');
const { sendOTPEmail } = require('../services/emailService');
const { generateOTP } = require('../utils/helpers');
require('dotenv').config();

const citizenAuthController = {
    // ====================================
    // STEP 1: LOGIN (Validate + Send OTP)
    // ====================================
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required.' });
            }

            // Find citizen user
            const user = await CitizenAuth.findByEmail(email);
            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid email or password.' });
            }

            // Check user account status
            if (user.status === 'suspended') {
                return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact your ward administration.' });
            }

            if (user.status === 'locked') {
                return res.status(403).json({ success: false, message: 'Your account is locked. Contact your ward administration.' });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ success: false, message: `Account is ${user.status}. Cannot login.` });
            }

            // Check citizen record status
            if (user.citizen_id) {
                const citizenStatus = await CitizenAuth.getCitizenStatus(user.citizen_id);
                if (citizenStatus && citizenStatus.is_deleted) {
                    return res.status(403).json({ success: false, message: 'Account not found.' });
                }
                if (citizenStatus && citizenStatus.status === 'deceased') {
                    return res.status(403).json({ success: false, message: 'Account access denied.' });
                }
            }

            // Check login attempts (max 5)
            if (user.login_attempts >= 5) {
                return res.status(403).json({ success: false, message: 'Account temporarily locked. Please try again later or contact your ward administration.' });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                await CitizenAuth.incrementLoginAttempts(user.id);

                // Record failed login
                await AuditLogModel.create({
                    email: user.email,
                    role: 'citizen',
                    action: 'LOGIN_FAILED',
                    type: 'authentication',
                    status: 'error',
                    description: `Failed login attempt for citizen: ${user.email}`,
                    ip_address: req.ip
                });

                return res.status(400).json({ success: false, message: 'Invalid email or password.' });
            }

            // Reset login attempts on successful password
            await CitizenAuth.resetLoginAttempts(user.id);

            // Generate OTP
            const otp = generateOTP();
            await CitizenAuth.storeOTP(user.id, otp);

            // Send OTP email
            let emailSent = false;
            try {
                await sendOTPEmail(email, otp);
                emailSent = true;
            } catch (emailError) {
                console.log('OTP email not sent:', emailError.message);
                console.log(`========================================`);
                console.log(`Citizen OTP for ${email}: ${otp}`);
                console.log(`========================================`);
            }

            // Audit log
            await AuditLogModel.create({
                email: user.email,
                role: 'citizen',
                action: 'OTP_SENT',
                type: 'authentication',
                status: 'success',
                description: `OTP sent to citizen: ${user.email}`,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'OTP sent to your email. Please verify your identity.',
                email: email,
                step: 'otp_required',
                citizen_name: user.full_name,
                email_sent: emailSent
            });
        } catch (error) {
            console.error('Citizen Login Error:', error);
            res.status(500).json({ success: false, message: 'Server error during login.' });
        }
    },

    // ====================================
    // STEP 2: VERIFY OTP
    // ====================================
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
            }

            // Find citizen
            const user = await CitizenAuth.findByEmail(email);
            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid request.' });
            }

            // Check OTP attempts (max 5)
            if (user.otp_attempts >= 5) {
                await CitizenAuth.clearOTP(user.id);
                return res.status(400).json({ success: false, message: 'Too many failed OTP attempts. Please login again to request a new code.' });
            }

            // Verify OTP
            const verified = await CitizenAuth.verifyOTP(email, otp);
            if (!verified) {
                await CitizenAuth.incrementOTPAttempts(user.id);

                await AuditLogModel.create({
                    email: user.email,
                    role: 'citizen',
                    action: 'OTP_FAILED',
                    type: 'authentication',
                    status: 'error',
                    description: `Invalid OTP attempt for citizen: ${user.email}`,
                    ip_address: req.ip
                });

                return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
            }

            // Clear OTP after successful verification
            await CitizenAuth.clearOTP(user.id);

            // Update last login
            await CitizenAuth.updateLastLogin(user.id);

            // Generate JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: 'citizen',
                    citizen_id: user.citizen_id,
                    ward_id: user.ward_id,
                    ward_name: user.ward_name
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Record successful login
            try {
                await Security.recordLogin({
                    user_id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: 'citizen',
                    action: 'LOGIN',
                    status: 'success',
                    ip_address: req.ip,
                    browser: req.headers['user-agent']
                });
            } catch (e) {}

            // Audit log
            await AuditLogModel.create({
                email: user.email,
                role: 'citizen',
                action: 'LOGIN_SUCCESS',
                type: 'authentication',
                status: 'success',
                description: `Citizen logged in: ${user.email}`,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Login successful.',
                token,
                user: {
                    id: user.id,
                    citizen_id: user.citizen_id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: 'citizen',
                    ward_id: user.ward_id,
                    ward_name: user.ward_name,
                    address: user.address,
                    profile_photo: user.citizen_photo,
                    status: user.status,
                    password_changed: user.password_changed
                }
            });
        } catch (error) {
            console.error('Verify OTP Error:', error);
            res.status(500).json({ success: false, message: 'Server error during verification.' });
        }
    },

    // ====================================
    // RESEND OTP
    // ====================================
    resendOTP: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await CitizenAuth.findByEmail(email);
            if (!user) {
                return res.json({ success: true, message: 'If the email is registered, a new code has been sent.' });
            }

            // Generate new OTP
            const otp = generateOTP();
            await CitizenAuth.storeOTP(user.id, otp);

            // Send OTP
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log(`========================================`);
                console.log(`Citizen OTP Resent for ${email}: ${otp}`);
                console.log(`========================================`);
            }

            // Audit log
            await AuditLogModel.create({
                email: user.email,
                role: 'citizen',
                action: 'OTP_RESENT',
                type: 'authentication',
                status: 'success',
                description: `OTP resent to citizen: ${user.email}`,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'A new verification code has been sent to your email.' });
        } catch (error) {
            console.error('Resend OTP Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // FORGOT PASSWORD
    // ====================================
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await CitizenAuth.findByEmail(email);
            if (!user) {
                return res.json({ success: true, message: 'If the email is registered, a reset code has been sent.' });
            }

            // Generate OTP for password reset
            const otp = generateOTP();
            await CitizenAuth.storeOTP(user.id, otp);

            // Send reset email
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log(`========================================`);
                console.log(`Password Reset OTP for ${email}: ${otp}`);
                console.log(`========================================`);
            }

            // Audit log
            await AuditLogModel.create({
                email: user.email,
                role: 'citizen',
                action: 'PASSWORD_RESET_REQUESTED',
                type: 'authentication',
                status: 'success',
                description: `Password reset requested by citizen: ${user.email}`,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'If the email is registered, a reset code has been sent.' });
        } catch (error) {
            console.error('Forgot Password Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // VERIFY RESET OTP
    // ====================================
    verifyResetOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
            }

            const verified = await CitizenAuth.verifyOTP(email, otp);
            if (!verified) {
                return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
            }

            res.json({ success: true, message: 'OTP verified successfully. You may now reset your password.' });
        } catch (error) {
            console.error('Verify Reset OTP Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // RESET PASSWORD
    // ====================================
    resetPassword: async (req, res) => {
        try {
            const { email, otp, new_password, confirm_password } = req.body;

            if (!email || !otp || !new_password) {
                return res.status(400).json({ success: false, message: 'All fields are required.' });
            }

            if (new_password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
            }

            if (new_password !== confirm_password) {
                return res.status(400).json({ success: false, message: 'Passwords do not match.' });
            }

            // Verify OTP
            const verified = await CitizenAuth.verifyOTP(email, otp);
            if (!verified) {
                return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(new_password, salt);

            // Update password
            await CitizenAuth.updatePassword(verified.id, hashedPassword);
            await CitizenAuth.clearOTP(verified.id);

            // Audit log
            await AuditLogModel.create({
                email: email,
                role: 'citizen',
                action: 'PASSWORD_RESET_COMPLETED',
                type: 'authentication',
                status: 'success',
                description: `Password reset completed for citizen: ${email}`,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
        } catch (error) {
            console.error('Reset Password Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET PROFILE
    // ====================================
    getProfile: async (req, res) => {
        try {
            const user = await CitizenAuth.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Profile not found.' });
            }

            delete user.password;
            delete user.otp_code;
            delete user.otp_expires_at;
            delete user.otp_attempts;

            res.json({
                success: true,
                user: {
                    id: user.id,
                    citizen_id: user.citizen_id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: 'citizen',
                    ward_id: user.ward_id,
                    ward_name: user.ward_name,
                    address: user.address,
                    profile_photo: user.citizen_photo,
                    status: user.status,
                    last_login: user.last_login,
                    password_changed: user.password_changed
                }
            });
        } catch (error) {
            console.error('Profile Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
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
                    role: 'citizen'
                });
            }

            // Record logout
            try {
                await Security.recordLogin({
                    user_id: user.id,
                    email: user.email,
                    role: 'citizen',
                    action: 'LOGOUT',
                    status: 'success',
                    ip_address: req.ip
                });
            } catch (e) {}

            // Audit log
            await AuditLogModel.create({
                email: user.email,
                role: 'citizen',
                action: 'LOGOUT',
                type: 'authentication',
                status: 'success',
                description: `Citizen logged out: ${user.email}`,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Logged out successfully.' });
        } catch (error) {
            console.error('Logout Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = citizenAuthController;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
const otpService = require('../services/otpService');
const { sendOTPEmail, sendResetPasswordEmail } = require('../services/emailService');
const TokenBlacklist = require('../models/TokenBlacklist');
const AuditLogModel = require('../models/AuditLogModel');
const Security = require('../models/Security');
const authController = {
    // ====================================
    // REGISTER
    // ====================================
    register: async (req, res) => {
        try {
            const { full_name, email, phone, password, role } = req.body;

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered.' });
            }

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userId = await User.create({
                full_name,
                email,
                phone,
                password: hashedPassword,
                role: role || 'citizen'
            });

            const otp = await otpService.storeOTP(userId, email);
            
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log('Email not sent (check email config):', emailError.message);
            }

            // Record registration in security logs
            await Security.recordLogin({
                user_id: userId,
                email: email,
                full_name: full_name,
                role: role || 'citizen',
                action: 'REGISTER',
                status: 'success',
                ip_address: req.ip,
                browser: req.headers['user-agent'],
                device: req.headers['sec-ch-ua-platform'] || 'Unknown',
                operating_system: req.headers['sec-ch-ua-platform'] || 'Unknown'
            });

            res.status(201).json({
                message: 'Registration successful. Please verify your email with OTP.',
                userId
            });
        } catch (error) {
            console.error('Register Error:', error);
            res.status(500).json({ message: 'Server error during registration.' });
        }
    },

    // ====================================
    // LOGIN - STEP 1: VALIDATE CREDENTIALS & SEND OTP
    // ====================================
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findByEmail(email);
            if (!user) {
                // Record failed login attempt
                await Security.recordLogin({
                    email: email,
                    action: 'LOGIN',
                    status: 'failed',
                    failure_reason: 'Account not found',
                    ip_address: req.ip,
                    browser: req.headers['user-agent'],
                    device: req.headers['sec-ch-ua-platform'] || 'Unknown',
                    operating_system: req.headers['sec-ch-ua-platform'] || 'Unknown'
                });

                return res.status(400).json({ message: 'Invalid email or password.' });
            }

            // Check account status
            if (user.status === 'suspended') {
                return res.status(403).json({ message: 'Account is suspended. Contact admin.' });
            }

            if (user.status === 'locked') {
                // Record blocked attempt
                await Security.recordLogin({
                    user_id: user.id,
                    email: email,
                    full_name: user.full_name,
                    role: user.role,
                    action: 'LOGIN',
                    status: 'failed',
                    failure_reason: 'Account locked',
                    ip_address: req.ip,
                    browser: req.headers['user-agent'],
                    device: req.headers['sec-ch-ua-platform'] || 'Unknown',
                    operating_system: req.headers['sec-ch-ua-platform'] || 'Unknown'
                });

                return res.status(403).json({ message: 'Account is locked. Contact Super Admin.' });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ message: `Account is ${user.status}. Contact admin.` });
            }

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                // Record failed login
                await Security.recordLogin({
                    user_id: user.id,
                    email: email,
                    full_name: user.full_name,
                    role: user.role,
                    action: 'LOGIN',
                    status: 'failed',
                    failure_reason: 'Invalid password',
                    ip_address: req.ip,
                    browser: req.headers['user-agent'],
                    device: req.headers['sec-ch-ua-platform'] || 'Unknown',
                    operating_system: req.headers['sec-ch-ua-platform'] || 'Unknown'
                });

                return res.status(400).json({ message: 'Invalid email or password.' });
            }

            // Generate OTP
            const otp = await otpService.storeOTP(user.id, email);
            
            // Try to send email
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log('Email not sent (check email config):', emailError.message);
            }

            res.json({
                message: 'Credentials verified. OTP sent to your email. Check console for OTP.',
                email: email,
                step: 'otp_required'
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ message: 'Server error during login.' });
        }
    },

    // ====================================
    // LOGIN - STEP 2: VERIFY OTP & RETURN TOKEN
    // ====================================
    verifyLoginOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            const verification = await otpService.verifyOTP(email, otp);
            if (!verification) {
                return res.status(400).json({ message: 'Invalid or expired OTP.' });
            }

            const user = await User.findById(verification.user_id);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Generate token
            const token = generateToken(user.id, user.role);

            // Record successful login
            await Security.recordLogin({
                user_id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                action: 'LOGIN',
                status: 'success',
                ip_address: req.ip,
                browser: req.headers['user-agent'],
                device: req.headers['sec-ch-ua-platform'] || 'Unknown',
                operating_system: req.headers['sec-ch-ua-platform'] || 'Unknown'
            });

            // Audit log
            await AuditLogModel.create({
                email: user.email,
                role: user.role,
                action: 'LOGIN_SUCCESS',
                type: 'authentication',
                status: 'success',
                description: `${user.role} logged in successfully`,
                performed_by: user.id,
                ip_address: req.ip,
                browser: req.headers['user-agent']
            });

            res.json({
                message: 'Login successful.',
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status
                }
            });
        } catch (error) {
            console.error('Verify Login OTP Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // SEND OTP
    // ====================================
    sendOTP: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const otp = await otpService.storeOTP(user.id, email);
            
            try {
                await sendOTPEmail(email, otp);
            } catch (emailError) {
                console.log('Email not sent (check email config):', emailError.message);
            }

            res.json({ message: 'OTP sent to your email. Check console.' });
        } catch (error) {
            console.error('Send OTP Error:', error);
            res.status(500).json({ message: 'Server error sending OTP.' });
        }
    },

    // ====================================
    // VERIFY OTP (Account Activation)
    // ====================================
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            const verification = await otpService.verifyOTP(email, otp);
            if (!verification) {
                return res.status(400).json({ message: 'Invalid or expired OTP.' });
            }

            await User.updateStatus(verification.user_id, 'active');

            res.json({ message: 'Account verified successfully.' });
        } catch (error) {
            console.error('Verify OTP Error:', error);
            res.status(500).json({ message: 'Server error verifying OTP.' });
        }
    },

    // ====================================
    // FORGOT PASSWORD
    // ====================================
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const otp = await otpService.storeOTP(user.id, email);
            
            try {
                await sendResetPasswordEmail(email, otp);
            } catch (emailError) {
                console.log('Email not sent (check email config):', emailError.message);
            }

            res.json({ message: 'Password reset OTP sent to your email. Check console.' });
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

            const verification = await otpService.verifyOTP(email, otp);
            if (!verification) {
                return res.status(400).json({ message: 'Invalid or expired OTP.' });
            }

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(new_password, salt);

            await User.updatePassword(verification.user_id, hashedPassword);

            res.json({ message: 'Password reset successful.' });
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
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            res.json({ user });
        } catch (error) {
            console.error('Profile Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // LOGOUT (Secure - Blacklist Token)
    // ====================================
    logout: async (req, res) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const user = req.user;

            if (!token) {
                return res.status(400).json({ message: 'No token provided.' });
            }

            // Add token to blacklist
            await TokenBlacklist.blacklist({
                token: token,
                user_id: user.id,
                email: user.email || `${user.role}@lams.com`,
                role: user.role
            });

            // Record logout in security logs
            await Security.recordLogin({
                user_id: user.id,
                email: user.email || `${user.role}@lams.com`,
                role: user.role,
                action: 'LOGOUT',
                status: 'success',
                ip_address: req.ip,
                browser: req.headers['user-agent'],
                device: req.headers['sec-ch-ua-platform'] || 'Unknown',
                operating_system: req.headers['sec-ch-ua-platform'] || 'Unknown'
            });

            // Audit log
            await AuditLogModel.create({
                email: user.email || `${user.role}@lams.com`,
                role: user.role,
                action: 'LOGOUT',
                type: 'authentication',
                status: 'success',
                description: `${user.role} logged out successfully`,
                performed_by: user.id,
                ip_address: req.ip,
                browser: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Logged out successfully. Token invalidated.'
            });
        } catch (error) {
            console.error('Logout Error:', error);
            res.status(500).json({ message: 'Server error during logout.' });
        }
    }
};

module.exports = authController;


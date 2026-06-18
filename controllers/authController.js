const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
const otpService = require('../services/otpService');
const { sendOTPEmail, sendResetPasswordEmail } = require('../services/emailService');

const authController = {
    // Register
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

            res.status(201).json({
                message: 'Registration successful. Please verify your email with OTP.',
                userId
            });
        } catch (error) {
            console.error('Register Error:', error);
            res.status(500).json({ message: 'Server error during registration.' });
        }
    },

    // Login - Step 1: Validate credentials and send OTP
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check if user exists
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(400).json({ message: 'Invalid email or password.' });
            }

            // Check if account is active
            if (user.status !== 'active') {
                return res.status(403).json({ message: `Account is ${user.status}. Contact admin.` });
            }

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid email or password.' });
            }

            // Generate OTP and log to console
            const otp = await otpService.storeOTP(user.id, email);
            
            // Try to send email, but don't fail if email config is missing
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

    // Login - Step 2: Verify OTP and return token
    verifyLoginOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            // Verify OTP
            const verification = await otpService.verifyOTP(email, otp);
            if (!verification) {
                return res.status(400).json({ message: 'Invalid or expired OTP.' });
            }

            // Get user
            const user = await User.findById(verification.user_id);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Generate token
            const token = generateToken(user.id, user.role);

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

    // Send OTP
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

    // Verify OTP
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

    // Forgot Password
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

    // Reset Password
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

    // Get Profile
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

    // Logout
    logout: async (req, res) => {
        res.json({ message: 'Logout successful.' });
    }
};

module.exports = authController;
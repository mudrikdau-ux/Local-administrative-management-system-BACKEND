const pool = require('../config/db');

const AdminAuth = {
    // Find admin by email (only admin role)
    findByEmail: async (email) => {
        const [rows] = await pool.execute(
            "SELECT u.*, a.id as admin_id, a.ward_id, w.ward_name, a.position_id, p.position_name, a.profile_photo as admin_photo FROM users u LEFT JOIN admins a ON u.id = a.user_id LEFT JOIN wards w ON a.ward_id = w.id LEFT JOIN positions p ON a.position_id = p.id WHERE u.email = ? AND u.role = 'admin'",
            [email]
        );
        return rows[0];
    },

    // Find admin by user ID
    findById: async (id) => {
        const [rows] = await pool.execute(
            "SELECT u.*, a.id as admin_id, a.ward_id, w.ward_name, a.position_id, p.position_name, a.profile_photo as admin_photo FROM users u LEFT JOIN admins a ON u.id = a.user_id LEFT JOIN wards w ON a.ward_id = w.id LEFT JOIN positions p ON a.position_id = p.id WHERE u.id = ? AND u.role = 'admin'",
            [id]
        );
        return rows[0];
    },

    // Store OTP
    storeOTP: async (userId, otp) => {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0 WHERE id = ?',
            [otp, expiresAt, userId]
        );
    },

    // Verify OTP
    verifyOTP: async (email, otp) => {
        const [rows] = await pool.execute(
            "SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW() AND role = 'admin'",
            [email, otp]
        );
        return rows[0];
    },

    // Increment OTP attempts
    incrementOTPAttempts: async (userId) => {
        await pool.execute(
            'UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = ?',
            [userId]
        );
    },

    // Clear OTP
    clearOTP: async (userId) => {
        await pool.execute(
            'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = ?',
            [userId]
        );
    },

    // Increment login attempts
    incrementLoginAttempts: async (userId) => {
        await pool.execute(
            'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?',
            [userId]
        );
    },

    // Reset login attempts
    resetLoginAttempts: async (userId) => {
        await pool.execute(
            'UPDATE users SET login_attempts = 0, is_locked = FALSE WHERE id = ?',
            [userId]
        );
    },

    // Lock account
    lockAccount: async (userId) => {
        await pool.execute(
            "UPDATE users SET is_locked = TRUE, status = 'locked' WHERE id = ?",
            [userId]
        );
    },

    // Update last login
    updateLastLogin: async (userId) => {
        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [userId]
        );
    },

    // Update password
    updatePassword: async (userId, hashedPassword) => {
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );
    },

    // Get all admins with details (for super admin use)
    getAllAdmins: async () => {
        const [rows] = await pool.execute(
            "SELECT u.id, u.full_name, u.email, u.phone, u.status, u.last_login, a.ward_id, w.ward_name, a.position_id, p.position_name FROM users u LEFT JOIN admins a ON u.id = a.user_id LEFT JOIN wards w ON a.ward_id = w.id LEFT JOIN positions p ON a.position_id = p.id WHERE u.role = 'admin' ORDER BY u.created_at DESC"
        );
        return rows;
    }
};

module.exports = AdminAuth;
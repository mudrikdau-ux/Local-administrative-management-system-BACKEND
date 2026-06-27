const pool = require('../config/db');

const CitizenAuth = {
    // Find citizen user by email
    findByEmail: async (email) => {
        const [rows] = await pool.execute(
            `SELECT u.*, c.id as citizen_id, c.ward_id, c.address, c.citizen_photo,
                    w.ward_name
             FROM users u
             LEFT JOIN citizens c ON u.id = c.user_id
             LEFT JOIN wards w ON c.ward_id = w.id
             WHERE u.email = ? AND u.role = 'citizen'`,
            [email]
        );
        return rows[0];
    },

    // Find citizen by user ID
    findById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT u.*, c.id as citizen_id, c.ward_id, c.address, c.citizen_photo,
                    w.ward_name
             FROM users u
             LEFT JOIN citizens c ON u.id = c.user_id
             LEFT JOIN wards w ON c.ward_id = w.id
             WHERE u.id = ? AND u.role = 'citizen'`,
            [id]
        );
        return rows[0];
    },

    // Check citizen record status
    getCitizenStatus: async (citizenId) => {
        const [rows] = await pool.execute(
            'SELECT status, is_deleted FROM citizens WHERE id = ?',
            [citizenId]
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
            "SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW() AND role = 'citizen'",
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
            'UPDATE users SET login_attempts = 0 WHERE id = ?',
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
            'UPDATE users SET password = ?, password_changed = TRUE, temp_password = NULL WHERE id = ?',
            [hashedPassword, userId]
        );
    },

    // Get password hash
    getPasswordHash: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );
        return rows[0] ? rows[0].password : null;
    }
};

module.exports = CitizenAuth;
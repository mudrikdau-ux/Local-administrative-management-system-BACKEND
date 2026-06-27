const pool = require('../config/db');

const TokenBlacklist = {
    // Add token to blacklist
    blacklist: async (data) => {
        const { token, user_id, email, role } = data;
        const [result] = await pool.execute(
            'INSERT INTO token_blacklist (token, user_id, email, role) VALUES (?, ?, ?, ?)',
            [token, user_id || null, email || null, role || null]
        );
        return result.insertId;
    },

    // Check if token is blacklisted
    isBlacklisted: async (token) => {
        const [rows] = await pool.execute(
            'SELECT id FROM token_blacklist WHERE token = ?',
            [token]
        );
        return rows.length > 0;
    },

    // Clean expired tokens (run periodically)
    cleanExpired: async () => {
        await pool.execute(
            'DELETE FROM token_blacklist WHERE blacklisted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
    },

    // Remove all tokens for a user (force logout all sessions)
    removeAllForUser: async (userId) => {
        await pool.execute(
            'DELETE FROM token_blacklist WHERE user_id = ?',
            [userId]
        );
    }
};

module.exports = TokenBlacklist;
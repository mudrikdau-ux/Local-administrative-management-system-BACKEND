const pool = require('../config/db');

const TokenBlacklist = {
    blacklist: async (data) => {
        const { token, user_id, email, role } = data;
        const [result] = await pool.execute(
            'INSERT INTO token_blacklist (token, user_id, email, role) VALUES (?, ?, ?, ?)',
            [token, user_id || null, email || null, role || null]
        );
        return result.insertId;
    },

    isBlacklisted: async (token) => {
        const [rows] = await pool.execute(
            'SELECT id FROM token_blacklist WHERE token = ?',
            [token]
        );
        return rows.length > 0;
    },

    removeAllForUser: async (userId) => {
        await pool.execute(
            'DELETE FROM token_blacklist WHERE user_id = ?',
            [userId]
        );
    }
};

module.exports = TokenBlacklist;

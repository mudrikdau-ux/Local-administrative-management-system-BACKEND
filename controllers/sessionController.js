const pool = require('../config/db');
const TokenBlacklist = require('../models/TokenBlacklist');

const sessionController = {
    // Get active sessions for user
    getSessions: async (req, res) => {
        try {
            const [rows] = await pool.execute(
                "SELECT * FROM user_sessions WHERE user_id = ? AND status = 'active' ORDER BY login_time DESC",
                [req.user.id]
            );
            res.json({ success: true, sessions: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // Logout specific session
    logoutSession: async (req, res) => {
        try {
            const { sessionId } = req.params;
            const [rows] = await pool.execute(
                'SELECT * FROM user_sessions WHERE id = ? AND user_id = ?',
                [sessionId, req.user.id]
            );

            if (rows.length > 0 && rows[0].token) {
                await TokenBlacklist.blacklist({
                    token: rows[0].token,
                    user_id: req.user.id,
                    email: req.user.email,
                    role: req.user.role
                });
            }

            await pool.execute(
                "UPDATE user_sessions SET status = 'logged_out' WHERE id = ? AND user_id = ?",
                [sessionId, req.user.id]
            );

            res.json({ success: true, message: 'Session terminated.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // Logout all other sessions
    logoutAllSessions: async (req, res) => {
        try {
            const [sessions] = await pool.execute(
                "SELECT * FROM user_sessions WHERE user_id = ? AND status = 'active'",
                [req.user.id]
            );

            for (const session of sessions) {
                if (session.token) {
                    await TokenBlacklist.blacklist({
                        token: session.token,
                        user_id: req.user.id,
                        email: req.user.email,
                        role: req.user.role
                    });
                }
            }

            await pool.execute(
                "UPDATE user_sessions SET status = 'logged_out' WHERE user_id = ?",
                [req.user.id]
            );

            res.json({ success: true, message: 'All sessions terminated.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // Record new session (called on login)
    recordSession: async (userId, token, device, browser, ip) => {
        await pool.execute(
            'INSERT INTO user_sessions (user_id, token, device, browser, ip_address) VALUES (?, ?, ?, ?, ?)',
            [userId, token, device || 'Unknown', browser || 'Unknown', ip || null]
        );
    }
};

module.exports = sessionController;
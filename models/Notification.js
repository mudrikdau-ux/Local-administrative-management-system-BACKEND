const pool = require('../config/db');

const Notification = {
    // Create notification
    create: async (data) => {
        const { user_id, title, message, type, severity, reference_id, reference_module, icon } = data;
        const [result] = await pool.execute(
            `INSERT INTO notifications (user_id, title, message, type, severity, reference_id, reference_module, icon) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id || null, title, message, type || 'system', severity || 'info', 
             reference_id || null, reference_module || null, icon || 'bell']
        );
        return result.insertId;
    },

    // Get all notifications for a user (paginated)
    getAll: async (userId, page = 1, limit = 20) => {
        const offset = (page - 1) * limit;
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, limit.toString(), offset.toString()]
        );
        const [total] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? OR user_id IS NULL',
            [userId]
        );
        return {
            notifications: rows,
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },

    // Get unread notifications
    getUnread: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    // Get unread count
    getUnreadCount: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE',
            [userId]
        );
        return rows[0].count;
    },

    // Mark single notification as read
    markAsRead: async (id) => {
        await pool.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]
        );
    },

    // Mark all notifications as read for a user
    markAllAsRead: async (userId) => {
        await pool.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? OR user_id IS NULL',
            [userId]
        );
    },

    // Delete single notification
    delete: async (id) => {
        await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);
    },

    // Clear all notifications for a user
    clearAll: async (userId) => {
        await pool.execute(
            'DELETE FROM notifications WHERE user_id = ? OR user_id IS NULL',
            [userId]
        );
    },

    // Get notification by ID
    getById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [id]);
        return rows[0];
    },

    // Get notifications by type
    getByType: async (userId, type, page = 1, limit = 20) => {
        const offset = (page - 1) * limit;
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, type, limit.toString(), offset.toString()]
        );
        const [total] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND type = ?',
            [userId, type]
        );
        return {
            notifications: rows,
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },

    // Get latest notifications (for SSE)
    getLatest: async (userId, sinceId = 0) => {
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND id > ? ORDER BY created_at DESC LIMIT 10',
            [userId, sinceId.toString()]
        );
        return rows;
    }
};

module.exports = Notification;
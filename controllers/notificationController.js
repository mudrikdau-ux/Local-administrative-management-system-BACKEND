const Notification = require('../models/Notification');

const notificationController = {
    // ====================================
    // GET ALL NOTIFICATIONS (Paginated)
    // ====================================
    getNotifications: async (req, res) => {
        try {
            const userId = req.query.user_id || 1;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const type = req.query.type || null;

            let data;
            if (type) {
                data = await Notification.getByType(userId, type, page, limit);
            } else {
                data = await Notification.getAll(userId, page, limit);
            }

            res.json(data);
        } catch (error) {
            console.error('Get Notifications Error:', error.message);
            console.error('Full Error:', error);
            res.status(500).json({ message: 'Server error fetching notifications.', error: error.message });
        }
    },

    // ====================================
    // GET UNREAD NOTIFICATIONS
    // ====================================
    getUnread: async (req, res) => {
        try {
            const userId = req.query.user_id || 1;
            const notifications = await Notification.getUnread(userId);
            res.json({ notifications, total: notifications.length });
        } catch (error) {
            console.error('Get Unread Error:', error.message);
            res.status(500).json({ message: 'Server error.', error: error.message });
        }
    },

    // ====================================
    // GET UNREAD COUNT
    // ====================================
    getUnreadCount: async (req, res) => {
        try {
            const userId = req.query.user_id || 1;
            const count = await Notification.getUnreadCount(userId);
            res.json({ unread_count: count });
        } catch (error) {
            console.error('Unread Count Error:', error.message);
            res.status(500).json({ message: 'Server error.', error: error.message });
        }
    },

    // ====================================
    // MARK SINGLE AS READ
    // ====================================
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await Notification.getById(id);

            if (!notification) {
                return res.status(404).json({ message: 'Notification not found.' });
            }

            await Notification.markAsRead(id);
            res.json({ message: 'Notification marked as read.' });
        } catch (error) {
            console.error('Mark As Read Error:', error.message);
            res.status(500).json({ message: 'Server error.', error: error.message });
        }
    },

    // ====================================
    // MARK ALL AS READ
    // ====================================
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.body.user_id || 1;
            await Notification.markAllAsRead(userId);
            res.json({ message: 'All notifications marked as read.' });
        } catch (error) {
            console.error('Mark All Read Error:', error.message);
            res.status(500).json({ message: 'Server error.', error: error.message });
        }
    },

    // ====================================
    // DELETE SINGLE NOTIFICATION
    // ====================================
    deleteNotification: async (req, res) => {
        try {
            const { id } = req.params;
            await Notification.delete(id);
            res.json({ message: 'Notification deleted.' });
        } catch (error) {
            console.error('Delete Error:', error.message);
            res.status(500).json({ message: 'Server error.', error: error.message });
        }
    },

    // ====================================
    // CLEAR ALL NOTIFICATIONS
    // ====================================
    clearAll: async (req, res) => {
        try {
            const userId = req.body.user_id || 1;
            await Notification.clearAll(userId);
            res.json({ message: 'All notifications cleared.' });
        } catch (error) {
            console.error('Clear All Error:', error.message);
            res.status(500).json({ message: 'Server error.', error: error.message });
        }
    },

    // ====================================
    // SSE STREAM (Real-Time Notifications)
    // ====================================
    streamNotifications: async (req, res) => {
        const userId = req.query.user_id || 1;

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Send initial unread count
        const initialCount = await Notification.getUnreadCount(userId);
        res.write(`data: ${JSON.stringify({ type: 'unread_count', count: initialCount })}\n\n`);

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
            res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
        }, 30000);

        // Poll for new notifications every 5 seconds
        let lastId = 0;
        const pollInterval = setInterval(async () => {
            try {
                const latestNotifications = await Notification.getLatest(userId, lastId);
                const unreadCount = await Notification.getUnreadCount(userId);

                if (latestNotifications.length > 0) {
                    lastId = latestNotifications[0].id;
                    res.write(`data: ${JSON.stringify({ 
                        type: 'new_notifications', 
                        notifications: latestNotifications,
                        unread_count: unreadCount
                    })}\n\n`);
                }

                // Send unread count update
                res.write(`data: ${JSON.stringify({ type: 'unread_count', count: unreadCount })}\n\n`);
            } catch (err) {
                // Silently handle polling errors
            }
        }, 5000);

        // Clean up on client disconnect
        req.on('close', () => {
            clearInterval(heartbeat);
            clearInterval(pollInterval);
        });
    }
};

module.exports = notificationController;
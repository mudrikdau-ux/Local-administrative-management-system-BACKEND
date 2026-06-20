const Notification = require('../models/Notification');

const notificationController = {
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
            res.status(500).json({ message: 'Server error.' });
        }
    },
    getUnread: async (req, res) => {
        try {
            const userId = req.query.user_id || 1;
            const notifications = await Notification.getUnread(userId);
            res.json({ notifications, total: notifications.length });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },
    getUnreadCount: async (req, res) => {
        try {
            const userId = req.query.user_id || 1;
            const count = await Notification.getUnreadCount(userId);
            res.json({ unread_count: count });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },
    markAsRead: async (req, res) => {
        try {
            await Notification.markAsRead(req.params.id);
            res.json({ message: 'Marked as read.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.body.user_id || 1;
            await Notification.markAllAsRead(userId);
            res.json({ message: 'All marked as read.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },
    deleteNotification: async (req, res) => {
        try {
            await Notification.delete(req.params.id);
            res.json({ message: 'Notification deleted.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },
    clearAll: async (req, res) => {
        try {
            const userId = req.body.user_id || 1;
            await Notification.clearAll(userId);
            res.json({ message: 'All cleared.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },
    streamNotifications: async (req, res) => {
        const userId = req.query.user_id || 1;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const initialCount = await Notification.getUnreadCount(userId);
        res.write('data: ' + JSON.stringify({ type: 'unread_count', count: initialCount }) + '\n\n');
        const heartbeat = setInterval(() => {
            res.write(': heartbeat\n\n');
        }, 30000);
        let lastId = 0;
        const poll = setInterval(async () => {
            try {
                const latest = await Notification.getLatest(userId, lastId);
                const count = await Notification.getUnreadCount(userId);
                if (latest.length > 0) {
                    lastId = latest[0].id;
                    res.write('data: ' + JSON.stringify({ type: 'new_notifications', notifications: latest, unread_count: count }) + '\n\n');
                }
                res.write('data: ' + JSON.stringify({ type: 'unread_count', count: count }) + '\n\n');
            } catch (err) {}
        }, 5000);
        req.on('close', () => {
            clearInterval(heartbeat);
            clearInterval(poll);
        });
    }
};

module.exports = notificationController;

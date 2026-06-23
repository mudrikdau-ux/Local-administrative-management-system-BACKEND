const AdminDashboard = require('../models/AdminDashboard');
const Notification = require('../models/Notification');
const AuditLogModel = require('../models/AuditLogModel');

const adminDashboardController = {
    // ====================================
    // WELCOME DATA
    // ====================================
    getWelcome: async (req, res) => {
        try {
            const userId = req.user.id;
            const welcomeData = await AdminDashboard.getWelcome(userId);

            res.json({ success: true, data: welcomeData });
        } catch (error) {
            console.error('Welcome Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // OVERVIEW CARDS
    // ====================================
    getOverview: async (req, res) => {
        try {
            const wardId = req.user.ward_id;

            if (!wardId) {
                return res.status(400).json({ success: false, message: 'Ward not assigned to this admin.' });
            }

            const overview = await AdminDashboard.getOverview(wardId);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'DASHBOARD_VIEWED',
                type: 'system',
                status: 'success',
                description: 'Admin viewed dashboard overview',
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, data: overview });
        } catch (error) {
            console.error('Overview Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // RECENT ACTIVITIES
    // ====================================
    getRecentActivities: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const adminEmail = req.user.email;
            const limit = parseInt(req.query.limit) || 10;

            const activities = await AdminDashboard.getRecentActivities(wardId, adminEmail, limit);

            res.json({ success: true, ...activities });
        } catch (error) {
            console.error('Recent Activities Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // QUICK ACTIONS
    // ====================================
    getQuickActions: async (req, res) => {
        try {
            const actions = await AdminDashboard.getQuickActions();
            res.json({ success: true, data: actions });
        } catch (error) {
            console.error('Quick Actions Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // NOTIFICATIONS
    // ====================================
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const data = await Notification.getAll(userId, page, limit);

            res.json({ success: true, ...data });
        } catch (error) {
            console.error('Notifications Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UNREAD NOTIFICATION COUNT
    // ====================================
    getUnreadNotificationCount: async (req, res) => {
        try {
            const userId = req.user.id;
            const count = await Notification.getUnreadCount(userId);

            res.json({ success: true, unread_count: count });
        } catch (error) {
            console.error('Unread Count Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MARK NOTIFICATION AS READ
    // ====================================
    markNotificationRead: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await Notification.getById(id);

            if (!notification) {
                return res.status(404).json({ success: false, message: 'Notification not found.' });
            }

            await Notification.markAsRead(id);

            res.json({ success: true, message: 'Notification marked as read.' });
        } catch (error) {
            console.error('Mark Read Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MARK ALL NOTIFICATIONS AS READ
    // ====================================
    markAllNotificationsRead: async (req, res) => {
        try {
            const userId = req.user.id;
            await Notification.markAllAsRead(userId);

            res.json({ success: true, message: 'All notifications marked as read.' });
        } catch (error) {
            console.error('Mark All Read Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UNREAD MESSAGES COUNT
    // ====================================
    getUnreadMessagesCount: async (req, res) => {
        try {
            const adminId = req.user.admin_id || req.user.id;
            const AdminMessage = require('../models/AdminMessage');
            const count = await AdminMessage.getUnreadCount(adminId);

            res.json({ success: true, unread_messages: count });
        } catch (error) {
            console.error('Unread Messages Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GLOBAL SEARCH
    // ====================================
    globalSearch: async (req, res) => {
        try {
            const { query } = req.query;
            const wardId = req.user.ward_id;

            if (!query || query.trim().length < 2) {
                return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters.' });
            }

            const results = await AdminDashboard.globalSearch(wardId, query.trim());

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'SEARCH_PERFORMED',
                type: 'system',
                status: 'success',
                description: `Global search performed: "${query}"`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, query, results });
        } catch (error) {
            console.error('Global Search Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // FULL DASHBOARD DATA (All in One)
    // ====================================
    getFullDashboard: async (req, res) => {
        try {
            const userId = req.user.id;
            const wardId = req.user.ward_id;
            const adminEmail = req.user.email;

            const [welcome, overview, quickActions, recentActivities, notifications, unreadMessages] = await Promise.all([
                AdminDashboard.getWelcome(userId),
                AdminDashboard.getOverview(wardId),
                AdminDashboard.getQuickActions(),
                AdminDashboard.getRecentActivities(wardId, adminEmail, 10),
                Notification.getAll(userId, 1, 5),
                new Promise(async (resolve) => {
                    const AdminMessage = require('../models/AdminMessage');
                    const count = await AdminMessage.getUnreadCount(req.user.admin_id || userId);
                    resolve(count);
                })
            ]);

            res.json({
                success: true,
                welcome: welcome,
                overview: overview,
                quick_actions: quickActions,
                recent_activities: recentActivities,
                notifications: notifications,
                unread_messages: unreadMessages
            });
        } catch (error) {
            console.error('Full Dashboard Error:', error);
            res.status(500).json({ success: false, message: 'Server error loading dashboard.' });
        }
    }
};

module.exports = adminDashboardController;
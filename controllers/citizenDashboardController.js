const CitizenDashboard = require('../models/CitizenDashboard');
const AuditLogModel = require('../models/AuditLogModel');

const citizenDashboardController = {
    // ====================================
    // GET FULL DASHBOARD (All in One)
    // ====================================
    getFullDashboard: async (req, res) => {
        try {
            const userId = req.user.id;
            const citizenId = req.user.citizen_id;

            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not linked.' });
            }

            const dashboard = await CitizenDashboard.getFullDashboard(userId, citizenId);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'DASHBOARD_VIEWED',
                type: 'system',
                status: 'success',
                description: 'Citizen dashboard viewed',
                performed_by: userId,
                ip_address: req.ip
            });

            res.json({ success: true, ...dashboard });
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).json({ success: false, message: 'Server error loading dashboard.' });
        }
    },

    // ====================================
    // WELCOME
    // ====================================
    getWelcome: async (req, res) => {
        try {
            const userId = req.user.id;
            const welcome = await CitizenDashboard.getWelcome(userId);
            res.json({ success: true, ...welcome });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // CURRENT TIME
    // ====================================
    getCurrentTime: async (req, res) => {
        try {
            const time = CitizenDashboard.getCurrentTime();
            res.json({ success: true, ...time });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // SUMMARY CARDS
    // ====================================
    getSummary: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const summary = await CitizenDashboard.getSummary(citizenId);
            res.json({ success: true, summary });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // QUICK ACTIONS
    // ====================================
    getQuickActions: async (req, res) => {
        try {
            const actions = CitizenDashboard.getQuickActions();
            res.json({ success: true, quick_actions: actions });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // RECENT ACTIVITIES
    // ====================================
    getRecentActivities: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const limit = parseInt(req.query.limit) || 10;
            const activities = await CitizenDashboard.getRecentActivities(citizenId, limit);
            res.json({ success: true, activities, total: activities.length });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // NOTIFICATIONS
    // ====================================
    getNotifications: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const limit = parseInt(req.query.limit) || 10;
            const notifications = await CitizenDashboard.getNotifications(citizenId, limit);
            const unreadCount = await CitizenDashboard.getUnreadNotificationCount(citizenId);

            res.json({
                success: true,
                notifications,
                total: notifications.length,
                unread_count: unreadCount
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MARK NOTIFICATION AS READ
    // ====================================
    markNotificationRead: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            await CitizenDashboard.markNotificationRead(req.params.id, citizenId);

            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'NOTIFICATION_READ',
                type: 'system', status: 'success', description: 'Notification marked as read',
                performed_by: req.user.id, ip_address: req.ip
            });

            res.json({ success: true, message: 'Notification marked as read.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MARK ALL NOTIFICATIONS READ
    // ====================================
    markAllNotificationsRead: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            await CitizenDashboard.markAllNotificationsRead(citizenId);

            res.json({ success: true, message: 'All notifications marked as read.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UNREAD MESSAGES COUNT
    // ====================================
    getUnreadMessages: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const result = await CitizenDashboard.getUnreadMessages(citizenId);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = citizenDashboardController;
const pool = require('../config/db');

const CitizenDashboard = {
    // ====================================
    // WELCOME DATA
    // ====================================
    getWelcome: async (userId) => {
        const [rows] = await pool.execute(
            `SELECT u.full_name, u.status, c.id as citizen_id, w.ward_name
             FROM users u
             LEFT JOIN citizens c ON u.id = c.user_id
             LEFT JOIN wards w ON c.ward_id = w.id
             WHERE u.id = ? AND u.role = 'citizen'`,
            [userId]
        );
        const user = rows[0] || {};
        return {
            full_name: user.full_name || 'Citizen',
            message: 'Access your services, applications, payments, and community updates in one place.',
            account_status: user.status || 'Active',
            ward: user.ward_name || 'Not Assigned'
        };
    },

    // ====================================
    // CURRENT DATE & TIME
    // ====================================
    getCurrentTime: () => {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
            date: now.toISOString().split('T')[0],
            day: days[now.getDay()],
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        };
    },

    // ====================================
    // SUMMARY CARDS
    // ====================================
    getSummary: async (citizenId) => {
        if (!citizenId) {
            return {
                total_applications: 0,
                pending_applications: 0,
                approved_applications: 0,
                total_payments_made: 0,
                unread_messages: 0,
                total_notifications: 0
            };
        }

        const [totalApps] = await pool.execute(
            'SELECT COUNT(*) as count FROM citizen_applications WHERE citizen_id = ?', [citizenId]
        );
        const [pendingApps] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizen_applications WHERE citizen_id = ? AND status IN ('pending', 'processing')", [citizenId]
        );
        const [approvedApps] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizen_applications WHERE citizen_id = ? AND status IN ('approved', 'completed')", [citizenId]
        );
        const [totalPayments] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments WHERE citizen_id = ? AND payment_status = 'paid'", [citizenId]
        );
        const [unreadMessages] = await pool.execute(
            `SELECT COUNT(*) as count FROM messages m
             JOIN conversations c ON m.conversation_id = c.id
             WHERE c.citizen_id = ? AND m.sender_role != 'citizen' AND m.is_read = FALSE`,
            [citizenId]
        );
        const [totalNotifications] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE citizen_id = ? AND is_read = FALSE', [citizenId]
        );

        return {
            total_applications: totalApps[0].count,
            pending_applications: pendingApps[0].count,
            approved_applications: approvedApps[0].count,
            total_payments_made: totalPayments[0].count,
            unread_messages: unreadMessages[0].count,
            total_notifications: totalNotifications[0].count
        };
    },

    // ====================================
    // QUICK ACTIONS
    // ====================================
    getQuickActions: () => {
        return [
            { title: 'New Application', description: 'Apply for documents', route: '/citizen/applications', icon: 'file-plus' },
            { title: 'Make Payment', description: 'Pay service fees', route: '/citizen/payments', icon: 'credit-card' },
            { title: 'Messages', description: 'Chat with admin', route: '/citizen/messages', icon: 'message-circle' },
            { title: 'Announcements', description: 'Community updates', route: '/citizen/announcements', icon: 'megaphone' },
            { title: 'My Documents', description: 'Download files', route: '/citizen/documents', icon: 'folder' },
            { title: 'Update Profile', description: 'Edit information', route: '/citizen/profile', icon: 'user' }
        ];
    },

    // ====================================
    // RECENT ACTIVITIES
    // ====================================
    getRecentActivities: async (citizenId, limit = 10) => {
        if (!citizenId) return [];

        // Get from dashboard_activities table
        const [activities] = await pool.execute(
            'SELECT activity, activity_type, created_at FROM dashboard_activities WHERE citizen_id = ? ORDER BY created_at DESC LIMIT ?',
            [citizenId, limit.toString()]
        );

        return activities;
    },

    // ====================================
    // NOTIFICATIONS
    // ====================================
    getNotifications: async (citizenId, limit = 10) => {
        if (!citizenId) return [];

        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE citizen_id = ? ORDER BY created_at DESC LIMIT ?',
            [citizenId, limit.toString()]
        );
        return rows;
    },

    getUnreadNotificationCount: async (citizenId) => {
        if (!citizenId) return 0;

        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE citizen_id = ? AND is_read = FALSE',
            [citizenId]
        );
        return rows[0].count;
    },

    markNotificationRead: async (id, citizenId) => {
        await pool.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND citizen_id = ?',
            [id, citizenId]
        );
    },

    markAllNotificationsRead: async (citizenId) => {
        await pool.execute(
            'UPDATE notifications SET is_read = TRUE WHERE citizen_id = ?',
            [citizenId]
        );
    },

    // ====================================
    // ADD ACTIVITY (called by other modules)
    // ====================================
    addActivity: async (citizenId, activity, type, referenceId = null) => {
        if (!citizenId) return;

        await pool.execute(
            'INSERT INTO dashboard_activities (citizen_id, activity, activity_type, reference_id) VALUES (?, ?, ?, ?)',
            [citizenId, activity, type, referenceId]
        );
    },

    // ====================================
    // ADD NOTIFICATION (called by other modules)
    // ====================================
    addNotification: async (citizenId, title, message, type, referenceId = null) => {
        if (!citizenId) return;

        await pool.execute(
            'INSERT INTO notifications (citizen_id, title, message, type, reference_id) VALUES (?, ?, ?, ?, ?)',
            [citizenId, title, message, type, referenceId]
        );
    },

    // ====================================
    // UNREAD MESSAGES
    // ====================================
    getUnreadMessages: async (citizenId) => {
        if (!citizenId) return { unread_messages: 0 };

        const [rows] = await pool.execute(
            `SELECT COUNT(*) as count FROM messages m
             JOIN conversations c ON m.conversation_id = c.id
             WHERE c.citizen_id = ? AND m.sender_role != 'citizen' AND m.is_read = FALSE`,
            [citizenId]
        );
        return { unread_messages: rows[0].count };
    },

    // ====================================
    // FULL DASHBOARD (All in One)
    // ====================================
    getFullDashboard: async (userId, citizenId) => {
        const safeCitizenId = citizenId || null;

        const [welcome, summary, quickActions, recentActivities, notifications, unreadMessages] = await Promise.all([
            CitizenDashboard.getWelcome(userId),
            CitizenDashboard.getSummary(safeCitizenId),
            Promise.resolve(CitizenDashboard.getQuickActions()),
            CitizenDashboard.getRecentActivities(safeCitizenId, 10),
            CitizenDashboard.getNotifications(safeCitizenId, 5),
            CitizenDashboard.getUnreadMessages(safeCitizenId)
        ]);

        return {
            welcome,
            current_time: CitizenDashboard.getCurrentTime(),
            summary,
            quick_actions: quickActions,
            recent_activities: recentActivities,
            notifications,
            unread_messages: unreadMessages.unread_messages
        };
    }
};

module.exports = CitizenDashboard;
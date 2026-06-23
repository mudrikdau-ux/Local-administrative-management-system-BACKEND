const pool = require('../config/db');

const AdminDashboard = {
    // ====================================
    // GET WELCOME DATA
    // ====================================
    getWelcome: async (adminId) => {
        const [rows] = await pool.execute(
            `SELECT u.full_name, w.ward_name, p.position_name
             FROM users u
             LEFT JOIN admins a ON u.id = a.user_id
             LEFT JOIN wards w ON a.ward_id = w.id
             LEFT JOIN positions p ON a.position_id = p.id
             WHERE u.id = ? AND u.role = 'admin'`,
            [adminId]
        );

        const admin = rows[0];
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        return {
            admin_name: admin?.full_name || 'Administrator',
            role: 'Local Administrator',
            ward: admin?.ward_name || 'Not Assigned',
            position: admin?.position_name || 'Administrator',
            current_date: `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
            current_time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
            welcome_message: "Here's what's happening with your local government system today."
        };
    },

    // ====================================
    // GET OVERVIEW CARDS (Ward-Scoped)
    // ====================================
    getOverview: async (wardId) => {
        const [totalCitizens] = await pool.execute(
            'SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND is_deleted = FALSE', [wardId]
        );
        const [documentRequests] = await pool.execute(
            'SELECT COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ?', [wardId]
        );
        const [documentsSent] = await pool.execute(
            "SELECT COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ? AND dr.request_status = 'completed'", [wardId]
        );
        const [pendingRequests] = await pool.execute(
            "SELECT COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ? AND dr.request_status = 'pending'", [wardId]
        );
        const [paidTransactions] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? AND p.payment_status = 'paid'", [wardId]
        );
        const [totalRevenue] = await pool.execute(
            "SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? AND p.payment_status = 'paid'", [wardId]
        );
        const [announcements] = await pool.execute(
            "SELECT COUNT(*) as count FROM announcements WHERE ward_id = ? AND is_deleted = FALSE AND status = 'published'", [wardId]
        );
        const [messages] = await pool.execute(
            `SELECT COUNT(*) as count FROM messages m 
             JOIN conversations conv ON m.conversation_id = conv.id 
             JOIN citizens c ON conv.citizen_id = c.id 
             WHERE c.ward_id = ?`, [wardId]
        );
        const [unreadMessages] = await pool.execute(
            `SELECT COUNT(*) as count FROM messages m 
             JOIN conversations conv ON m.conversation_id = conv.id 
             JOIN citizens c ON conv.citizen_id = c.id 
             WHERE c.ward_id = ? AND m.sender_role = 'citizen' AND m.is_read = FALSE`, [wardId]
        );

        return {
            total_citizens: totalCitizens[0].count,
            document_requests: documentRequests[0].count,
            documents_sent: documentsSent[0].count,
            pending_requests: pendingRequests[0].count,
            paid_transactions: paidTransactions[0].count,
            total_revenue: parseFloat(totalRevenue[0].total),
            announcements: announcements[0].count,
            total_messages: messages[0].count,
            unread_messages: unreadMessages[0].count
        };
    },

        // ====================================
    // GET RECENT ACTIVITIES (Ward-Scoped)
    // ====================================
    getRecentActivities: async (wardId, adminEmail, limit = 10) => {
        const [rows] = await pool.execute(
            `SELECT * FROM audit_logs 
             WHERE email = ? 
             ORDER BY created_at DESC LIMIT ?`,
            [adminEmail, limit.toString()]
        );

        // Also get ward-specific recent activities
        const [wardActivities] = await pool.execute(
            `SELECT 'citizen' as type, CONCAT('Citizen registered: ', full_name) as description, registration_date as activity_date 
             FROM citizens WHERE ward_id = ? AND is_deleted = FALSE ORDER BY registration_date DESC LIMIT 5`,
            [wardId]
        );

        return {
            audit_logs: rows,
            ward_activities: wardActivities
        };
    },
    
    // ====================================
    // GET QUICK ACTIONS
    // ====================================
    getQuickActions: async () => {
        return [
            { id: 1, name: 'Add Citizen', icon: 'user-plus', route: '/admin/citizens', color: '#27ae60' },
            { id: 2, name: 'Issue Document', icon: 'file-text', route: '/admin/documents', color: '#2980b9' },
            { id: 3, name: 'View Payments', icon: 'dollar-sign', route: '/admin/payments', color: '#f39c12' },
            { id: 4, name: 'Send Announcement', icon: 'megaphone', route: '/admin/announcements', color: '#8e44ad' },
            { id: 5, name: 'View Citizens', icon: 'users', route: '/admin/citizens', color: '#2c3e50' },
            { id: 6, name: 'Generate Report', icon: 'bar-chart', route: '/admin/reports', color: '#e74c3c' },
            { id: 7, name: 'Messages', icon: 'message-circle', route: '/admin/messages', color: '#16a085' },
            { id: 8, name: 'Settings', icon: 'settings', route: '/admin/settings', color: '#7f8c8d' }
        ];
    },

    // ====================================
    // GLOBAL SEARCH
    // ====================================
    globalSearch: async (wardId, query) => {
        const searchQuery = `%${query}%`;
        const results = { citizens: [], documents: [], payments: [], announcements: [] };

        // Search citizens
        const [citizens] = await pool.execute(
            `SELECT id, full_name, phone, status, 'citizen' as type FROM citizens 
             WHERE ward_id = ? AND is_deleted = FALSE AND (full_name LIKE ? OR phone LIKE ?) LIMIT 5`,
            [wardId, searchQuery, searchQuery]
        );
        results.citizens = citizens;

        // Search documents
        const [documents] = await pool.execute(
            `SELECT dr.id, dr.document_type, dr.request_status, dr.citizen_name, 'document' as type 
             FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id 
             WHERE c.ward_id = ? AND (dr.citizen_name LIKE ? OR dr.document_type LIKE ?) LIMIT 5`,
            [wardId, searchQuery, searchQuery]
        );
        results.documents = documents;

        // Search payments
        const [payments] = await pool.execute(
            `SELECT p.id, p.payment_id, p.amount, p.payment_status, c.full_name as citizen_name, 'payment' as type 
             FROM payments p JOIN citizens c ON p.citizen_id = c.id 
             WHERE c.ward_id = ? AND (p.payment_id LIKE ? OR c.full_name LIKE ?) LIMIT 5`,
            [wardId, searchQuery, searchQuery]
        );
        results.payments = payments;

        // Search announcements
        const [announcements] = await pool.execute(
            `SELECT id, title, category, status, 'announcement' as type 
             FROM announcements WHERE ward_id = ? AND is_deleted = FALSE AND title LIKE ? LIMIT 5`,
            [wardId, searchQuery]
        );
        results.announcements = announcements;

        return results;
    }
};

module.exports = AdminDashboard;
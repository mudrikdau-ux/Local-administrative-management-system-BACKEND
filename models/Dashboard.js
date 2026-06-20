const pool = require('../config/db');

const Dashboard = {
    // ====================================
    // GET ALL SUMMARY STATISTICS
    // ====================================
    getSummaryStats: async () => {
        const [totalCitizens] = await pool.execute('SELECT COUNT(*) as count FROM citizens');
        const [activeCitizens] = await pool.execute("SELECT COUNT(*) as count FROM citizens WHERE status = 'active'");
        const [totalAdmins] = await pool.execute('SELECT COUNT(*) as count FROM admins');
        const [activeAdmins] = await pool.execute("SELECT COUNT(*) as count FROM admins WHERE status = 'active'");
        const [suspendedAdmins] = await pool.execute("SELECT COUNT(*) as count FROM admins WHERE status = 'suspended'");
        const [inactiveAdmins] = await pool.execute("SELECT COUNT(*) as count FROM admins WHERE status = 'inactive'");
        const [totalWards] = await pool.execute('SELECT COUNT(*) as count FROM wards');
        const [totalReports] = await pool.execute('SELECT COUNT(*) as count FROM reports');
        const [totalAuditLogs] = await pool.execute('SELECT COUNT(*) as count FROM audit_logs');

        let totalRevenue = 0;
        try {
            const [revenue] = await pool.execute(
                "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"
            );
            totalRevenue = revenue[0].total;
        } catch (e) {
            totalRevenue = 0;
        }

        return {
            total_citizens: totalCitizens[0].count,
            active_citizens: activeCitizens[0].count,
            total_admins: totalAdmins[0].count,
            active_admins: activeAdmins[0].count,
            suspended_admins: suspendedAdmins[0].count,
            inactive_admins: inactiveAdmins[0].count,
            total_wards: totalWards[0].count,
            total_reports: totalReports[0].count,
            total_audit_logs: totalAuditLogs[0].count,
            total_revenue: totalRevenue
        };
    },

    // ====================================
    // GET LEADERSHIP OVERVIEW
    // ====================================
    getLeadershipOverview: async () => {
        const [rows] = await pool.execute(`
            SELECT 
                w.id as ward_id,
                w.ward_name,
                a.id as admin_id,
                a.full_name as leader_name,
                p.position_name,
                la.status as assignment_status
            FROM wards w
            LEFT JOIN leadership_assignments la ON w.id = la.ward_id AND la.status = 'active'
            LEFT JOIN admins a ON la.admin_id = a.id
            LEFT JOIN positions p ON la.position_id = p.id
            ORDER BY w.ward_name ASC
        `);
        return rows;
    },

    // ====================================
    // GET RECENT ACTIVITIES
    // ====================================
    getRecentActivities: async (limit = 10) => {
        const [rows] = await pool.query(
            `SELECT id, email, role, action, type, status, description, ip_address, created_at 
             FROM audit_logs 
             ORDER BY created_at DESC 
             LIMIT ${parseInt(limit)}`
        );
        return rows;
    },

    // ====================================
    // GET CITIZENS PER WARD
    // ====================================
    getCitizensPerWard: async () => {
        const [rows] = await pool.execute(`
            SELECT w.ward_name, COUNT(c.id) as citizen_count
            FROM wards w
            LEFT JOIN citizens c ON w.id = c.ward_id
            GROUP BY w.id, w.ward_name
            ORDER BY w.ward_name ASC
        `);
        return rows;
    },

    // ====================================
    // GET ADMINS PER WARD
    // ====================================
    getAdminsPerWard: async () => {
        const [rows] = await pool.execute(`
            SELECT w.ward_name, COUNT(a.id) as admin_count
            FROM wards w
            LEFT JOIN admins a ON w.id = a.ward_id
            GROUP BY w.id, w.ward_name
            ORDER BY w.ward_name ASC
        `);
        return rows;
    },

    // ====================================
    // GET ADMIN STATUS DISTRIBUTION
    // ====================================
    getAdminStatusDistribution: async () => {
        const [rows] = await pool.execute(`
            SELECT status, COUNT(*) as count FROM admins GROUP BY status
        `);
        return rows;
    },

    // ====================================
    // GET CITIZEN STATUS DISTRIBUTION
    // ====================================
    getCitizenStatusDistribution: async () => {
        const [rows] = await pool.execute(`
            SELECT status, COUNT(*) as count FROM citizens GROUP BY status
        `);
        return rows;
    },

    // ====================================
    // GET REVENUE OVERVIEW
    // ====================================
    getRevenueOverview: async () => {
        try {
            const [rows] = await pool.execute(`
                SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, COALESCE(SUM(amount), 0) as total_amount
                FROM payments WHERE status = 'completed'
                GROUP BY month ORDER BY month DESC LIMIT 12
            `);
            return rows;
        } catch (e) {
            return [];
        }
    },

    // ====================================
    // GET NOTIFICATIONS
    // ====================================
    getNotifications: async (limit = 5) => {
        const [rows] = await pool.query(
            `SELECT id, email, role, action, type, description, severity, is_read, created_at 
             FROM security_alerts 
             WHERE is_read = FALSE 
             ORDER BY created_at DESC 
             LIMIT ${parseInt(limit)}`
        );
        const [unreadCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM security_alerts WHERE is_read = FALSE'
        );
        return {
            notifications: rows,
            unread_count: unreadCount[0].count
        };
    },

    // ====================================
    // GET SYSTEM STATUS
    // ====================================
    getSystemStatus: async () => {
        try {
            await pool.execute('SELECT 1');
            return { status: 'operational', color: 'green', message: 'System Operational' };
        } catch (e) {
            return { status: 'warning', color: 'orange', message: 'System Degraded' };
        }
    },

    // ====================================
    // GET FULL DASHBOARD
    // ====================================
    getFullDashboard: async () => {
        const [
            summaryStats,
            leadershipOverview,
            recentActivities,
            citizensPerWard,
            adminsPerWard,
            adminStatusDistribution,
            citizenStatusDistribution,
            revenueOverview,
            notifications,
            systemStatus
        ] = await Promise.all([
            Dashboard.getSummaryStats(),
            Dashboard.getLeadershipOverview(),
            Dashboard.getRecentActivities(10),
            Dashboard.getCitizensPerWard(),
            Dashboard.getAdminsPerWard(),
            Dashboard.getAdminStatusDistribution(),
            Dashboard.getCitizenStatusDistribution(),
            Dashboard.getRevenueOverview(),
            Dashboard.getNotifications(5),
            Dashboard.getSystemStatus()
        ]);

        return {
            system_status: systemStatus,
            summary_cards: summaryStats,
            leadership_overview: leadershipOverview,
            recent_activities: recentActivities,
            charts: {
                citizens_per_ward: citizensPerWard,
                admins_per_ward: adminsPerWard,
                admin_status_distribution: adminStatusDistribution,
                citizen_status_distribution: citizenStatusDistribution,
                revenue_overview: revenueOverview
            },
            notifications: notifications,
            quick_actions: [
                { id: 1, name: 'Add New Admin', icon: 'user-plus', link: '/admin-management' },
                { id: 2, name: 'Transfer Leadership', icon: 'swap', link: '/leadership-management' },
                { id: 3, name: 'Generate Report', icon: 'file-text', link: '/system-reports' },
                { id: 4, name: 'View Audit Logs', icon: 'shield', link: '/audit-logs' },
                { id: 5, name: 'System Settings', icon: 'settings', link: '/system-settings' },
                { id: 6, name: 'Security Check', icon: 'lock', link: '/security-center' }
            ]
        };
    }
};

module.exports = Dashboard;
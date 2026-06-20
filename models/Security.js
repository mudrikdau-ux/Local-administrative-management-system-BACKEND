const pool = require('../config/db');

const Security = {
    // ====================================
    // DASHBOARD STATISTICS
    // ====================================
    getDashboardStats: async () => {
        const today = new Date().toISOString().split('T')[0];

        const [totalLoginsToday] = await pool.execute(
            "SELECT COUNT(*) as count FROM security_logs WHERE DATE(created_at) = ?",
            [today]
        );
        const [successfulLogins] = await pool.execute(
            "SELECT COUNT(*) as count FROM security_logs WHERE status = 'success'"
        );
        const [failedAttempts] = await pool.execute(
            "SELECT COUNT(*) as count FROM security_logs WHERE status IN ('failed', 'suspicious')"
        );
        const [passwordResets] = await pool.execute(
            "SELECT COUNT(*) as count FROM security_alerts WHERE type = 'password_reset'"
        );

        return {
            total_logins_today: totalLoginsToday[0].count,
            successful_logins: successfulLogins[0].count,
            failed_attempts: failedAttempts[0].count,
            password_resets: passwordResets[0].count
        };
    },
    // ====================================
    // LOGIN ACTIVITY (PAGINATED)
    // ====================================
    getLoginActivity: async (page = 1, limit = 20, filters = {}) => {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM security_logs WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as count FROM security_logs WHERE 1=1';
        const params = [];
        const countParams = [];

        if (filters.status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(filters.status);
            countParams.push(filters.status);
        }

        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(created_at) BETWEEN ? AND ?';
            countQuery += ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
            countParams.push(filters.start_date, filters.end_date);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(String(limit), String(offset));

        const [rows] = await pool.execute(query, params);
        const [total] = await pool.execute(countQuery, countParams);

        return {
            logs: rows,
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },
    // Get single login detail
    getLoginById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM security_logs WHERE id = ?', [id]);
        return rows[0];
    },

    // Record login attempt
    recordLogin: async (data) => {
        const { user_id, email, full_name, role, action, status, failure_reason, ip_address, browser, device, operating_system } = data;
        const [result] = await pool.execute(
            `INSERT INTO security_logs (user_id, email, full_name, role, action, status, failure_reason, ip_address, browser, device, operating_system) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id || null, email, full_name || null, role || null, action, status || 'success', 
             failure_reason || null, ip_address || null, browser || null, device || null, operating_system || null]
        );
        return result.insertId;
    },

    // ====================================
    // ACCOUNT SEARCH & LOCK CONTROLS
    // ====================================
    searchAccount: async (email) => {
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, phone, role, status, created_at, updated_at FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    lockAccount: async (userId) => {
        await pool.execute(
            "UPDATE users SET status = 'locked' WHERE id = ?",
            [userId]
        );
    },

    unlockAccount: async (userId) => {
        await pool.execute(
            "UPDATE users SET status = 'active' WHERE id = ?",
            [userId]
        );
    },

       // ====================================
    // SECURITY ALERTS
    // ====================================
    getAlerts: async (page = 1, limit = 20, filters = {}) => {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM security_alerts WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as count FROM security_alerts WHERE 1=1';
        const params = [];
        const countParams = [];

        if (filters.type) {
            query += ' AND type = ?';
            countQuery += ' AND type = ?';
            params.push(filters.type);
            countParams.push(filters.type);
        }

        if (filters.severity) {
            query += ' AND severity = ?';
            countQuery += ' AND severity = ?';
            params.push(filters.severity);
            countParams.push(filters.severity);
        }

        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(created_at) BETWEEN ? AND ?';
            countQuery += ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
            countParams.push(filters.start_date, filters.end_date);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(String(limit), String(offset));

        const [rows] = await pool.execute(query, params);
        const [total] = await pool.execute(countQuery, countParams);

        return {
            alerts: rows,
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },
    // Create alert
    createAlert: async (data) => {
        const { user_id, email, role, action, type, description, severity, performed_by, performed_by_name, ip_address } = data;
        const [result] = await pool.execute(
            `INSERT INTO security_alerts (user_id, email, role, action, type, description, severity, performed_by, performed_by_name, ip_address) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id || null, email || null, role || null, action, type, description, severity || 'medium', 
             performed_by || null, performed_by_name || null, ip_address || null]
        );
        return result.insertId;
    },

    // Mark alert as read
    markAlertRead: async (id) => {
        await pool.execute('UPDATE security_alerts SET is_read = TRUE WHERE id = ?', [id]);
    },

    // ====================================
    // ANALYTICS
    // ====================================
    getLoginSuccessVsFailed: async () => {
        const [rows] = await pool.execute(
            "SELECT status, COUNT(*) as count FROM security_logs GROUP BY status"
        );
        return rows;
    },

    getPasswordResetsPerMonth: async () => {
        const [rows] = await pool.execute(
            `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count 
             FROM security_alerts WHERE type = 'password_reset' 
             GROUP BY month ORDER BY month DESC LIMIT 12`
        );
        return rows;
    },

    getAccountLockActivities: async () => {
        const [rows] = await pool.execute(
            `SELECT type, COUNT(*) as count FROM security_alerts 
             WHERE type IN ('account_locked', 'account_unlocked') 
             GROUP BY type`
        );
        return rows;
    },

    getAlertsBySeverity: async () => {
        const [rows] = await pool.execute(
            'SELECT severity, COUNT(*) as count FROM security_alerts GROUP BY severity'
        );
        return rows;
    }
};

module.exports = Security;
const pool = require('../config/db');

const Report = {
    // Save report record
    create: async (data) => {
        const { report_type, report_name, description, file_path, filters_applied, record_count, generated_by, generated_by_name } = data;
        const [result] = await pool.execute(
            `INSERT INTO reports (report_type, report_name, description, file_path, filters_applied, record_count, generated_by, generated_by_name) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [report_type, report_name, description, file_path || null, 
             filters_applied ? JSON.stringify(filters_applied) : null, 
             record_count, generated_by, generated_by_name]
        );
        return result.insertId;
    },

    // Get all reports
    getAll: async () => {
        const [rows] = await pool.execute(
            'SELECT * FROM reports ORDER BY generated_date DESC'
        );
        return rows;
    },

    // Get report history
    getHistory: async (limit = 50) => {
        const [rows] = await pool.execute(
            'SELECT * FROM reports ORDER BY generated_date DESC LIMIT ?', [limit]
        );
        return rows;
    },

    // Get report by ID
    getById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);
        return rows[0];
    },

    // Get report statistics
    getStats: async () => {
        const [totalReports] = await pool.execute('SELECT COUNT(*) as count FROM reports');
        const [reportTypes] = await pool.execute(
            'SELECT report_type, COUNT(*) as count FROM reports GROUP BY report_type'
        );

        return {
            total_reports: totalReports[0].count,
            by_type: reportTypes
        };
    },

    // Delete report
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM reports WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    // Delete all reports
    deleteAll: async () => {
        await pool.execute('DELETE FROM reports');
    },

    // Get citizens for report (with optional filters)
    getCitizensForReport: async (filters = {}) => {
        let query = `
            SELECT c.*, w.ward_name 
            FROM citizens c
            LEFT JOIN wards w ON c.ward_id = w.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.ward_id) {
            query += ' AND c.ward_id = ?';
            params.push(filters.ward_id);
        }

        if (filters.status) {
            query += ' AND c.status = ?';
            params.push(filters.status);
        }

        if (filters.start_date && filters.end_date) {
            query += ' AND c.registration_date BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }

        query += ' ORDER BY c.registration_date DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get admins for report (with optional filters)
    getAdminsForReport: async (filters = {}) => {
        let query = `
            SELECT a.*, w.ward_name, p.position_name
            FROM admins a
            LEFT JOIN wards w ON a.ward_id = w.id
            LEFT JOIN positions p ON a.position_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.ward_id) {
            query += ' AND a.ward_id = ?';
            params.push(filters.ward_id);
        }

        if (filters.status) {
            query += ' AND a.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY a.created_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get audit logs for report (with optional filters)
    getAuditLogsForReport: async (filters = {}) => {
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (filters.action) {
            query += ' AND action = ?';
            params.push(filters.action);
        }

        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }

        query += ' ORDER BY created_at DESC LIMIT 500';

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get full system overview data
    getSystemOverview: async () => {
        const [totalCitizens] = await pool.execute('SELECT COUNT(*) as count FROM citizens');
        const [activeCitizens] = await pool.execute("SELECT COUNT(*) as count FROM citizens WHERE status = 'active'");
        const [inactiveCitizens] = await pool.execute("SELECT COUNT(*) as count FROM citizens WHERE status = 'inactive'");
        const [totalAdmins] = await pool.execute('SELECT COUNT(*) as count FROM admins');
        const [activeAdmins] = await pool.execute("SELECT COUNT(*) as count FROM admins WHERE status = 'active'");
        const [suspendedAdmins] = await pool.execute("SELECT COUNT(*) as count FROM admins WHERE status = 'suspended'");
        const [inactiveAdmins] = await pool.execute("SELECT COUNT(*) as count FROM admins WHERE status = 'inactive'");
        const [totalWards] = await pool.execute('SELECT COUNT(*) as count FROM wards');
        const [totalAuditLogs] = await pool.execute('SELECT COUNT(*) as count FROM audit_logs');
        const [totalReports] = await pool.execute('SELECT COUNT(*) as count FROM reports');

        return {
            citizens: {
                total: totalCitizens[0].count,
                active: activeCitizens[0].count,
                inactive: inactiveCitizens[0].count
            },
            admins: {
                total: totalAdmins[0].count,
                active: activeAdmins[0].count,
                suspended: suspendedAdmins[0].count,
                inactive: inactiveAdmins[0].count
            },
            wards: {
                total: totalWards[0].count
            },
            audit_logs: {
                total: totalAuditLogs[0].count
            },
            reports: {
                total: totalReports[0].count
            }
        };
    },

    // Get ward-by-ward citizen and admin counts for charts
    getWardComparisonData: async () => {
        const [rows] = await pool.execute(`
            SELECT 
                w.id,
                w.ward_name,
                COUNT(DISTINCT c.id) as citizen_count,
                COUNT(DISTINCT a.id) as admin_count
            FROM wards w
            LEFT JOIN citizens c ON w.id = c.ward_id
            LEFT JOIN admins a ON w.id = a.ward_id
            GROUP BY w.id, w.ward_name
            ORDER BY w.ward_name ASC
        `);
        return rows;
    },

    // Get citizen status breakdown for charts
    getCitizenStatusBreakdown: async () => {
        const [rows] = await pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM citizens
            GROUP BY status
        `);
        return rows;
    },

    // Get admin status breakdown for charts
    getAdminStatusBreakdown: async () => {
        const [rows] = await pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM admins
            GROUP BY status
        `);
        return rows;
    }
};

module.exports = Report;
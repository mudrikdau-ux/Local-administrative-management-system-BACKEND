const pool = require('../config/db');

const AuditLogModel = {
    // Create log entry
    create: async (data) => {
        const { admin_id, email, role, action, type, status, description, entity_type, entity_id, old_values, new_values, performed_by, ip_address, browser, device, operating_system } = data;
        const [result] = await pool.execute(
            `INSERT INTO audit_logs (admin_id, email, role, action, type, status, description, entity_type, entity_id, old_values, new_values, performed_by, ip_address, browser, device, operating_system) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [admin_id || null, email || null, role || null, action, type || 'system', status || 'success', description || null,
             entity_type || null, entity_id || null,
             old_values ? JSON.stringify(old_values) : null,
             new_values ? JSON.stringify(new_values) : null,
             performed_by || null, ip_address || null, browser || null, device || null, operating_system || null]
        );
        return result.insertId;
    },

    // Get all logs with pagination
    getAll: async (page = 1, limit = 20) => {
        const offset = (page - 1) * limit;
        const [rows] = await pool.execute(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        const [total] = await pool.execute('SELECT COUNT(*) as count FROM audit_logs');
        return {
            logs: rows,
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },

    // Get log by ID
    getById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM audit_logs WHERE id = ?', [id]);
        return rows[0];
    },

    // Search logs
    search: async (query, page = 1, limit = 20) => {
        const offset = (page - 1) * limit;
        const searchQuery = `%${query}%`;
        const [rows] = await pool.execute(
            `SELECT * FROM audit_logs 
             WHERE email LIKE ? OR action LIKE ? OR type LIKE ? OR description LIKE ?
             ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [searchQuery, searchQuery, searchQuery, searchQuery, limit, offset]
        );
        const [total] = await pool.execute(
            `SELECT COUNT(*) as count FROM audit_logs 
             WHERE email LIKE ? OR action LIKE ? OR type LIKE ? OR description LIKE ?`,
            [searchQuery, searchQuery, searchQuery, searchQuery]
        );
        return {
            logs: rows,
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },

    // Filter logs
    filter: async (filters, page = 1, limit = 20) => {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
        const params = [];

        if (filters.type) {
            query += ' AND type = ?';
            countQuery += ' AND type = ?';
            params.push(filters.type);
        }

        if (filters.status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(created_at) BETWEEN ? AND ?';
            countQuery += ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const countParams = params.slice(0, -2);

        const [rows] = await pool.execute(query, params);
        const [total] = await pool.execute(countQuery, countParams);

        return {
            logs: rows,
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit),
            filters_applied: filters
        };
    },

    // Get statistics
    getStats: async () => {
        const [totalLogs] = await pool.execute('SELECT COUNT(*) as count FROM audit_logs');
        const [successLogs] = await pool.execute("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'success'");
        const [warningLogs] = await pool.execute("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'warning'");
        const [errorLogs] = await pool.execute("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'error'");

        return {
            total_logs: totalLogs[0].count,
            success_logs: successLogs[0].count,
            warning_logs: warningLogs[0].count,
            error_logs: errorLogs[0].count
        };
    },

    // Get logs by status for charts
    getStatusBreakdown: async () => {
        const [rows] = await pool.execute(
            'SELECT status, COUNT(*) as count FROM audit_logs GROUP BY status'
        );
        return rows;
    },

    // Get logs by type for charts
    getTypeBreakdown: async () => {
        const [rows] = await pool.execute(
            'SELECT type, COUNT(*) as count FROM audit_logs GROUP BY type ORDER BY count DESC'
        );
        return rows;
    },

    // Get all logs for export (no pagination)
    getAllForExport: async (filters = {}) => {
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (filters.type) {
            query += ' AND type = ?';
            params.push(filters.type);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.start_date && filters.end_date) {
            query += ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }

        query += ' ORDER BY created_at DESC LIMIT 1000';

        const [rows] = await pool.execute(query, params);
        return rows;
    }
};

module.exports = AuditLogModel;
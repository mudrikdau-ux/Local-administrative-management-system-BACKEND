const pool = require('../config/db');

const AuditLogModel = {
    create: async (data) => {
        const { admin_id, email, role, action, type, status, description, entity_type, entity_id, old_values, new_values, performed_by, ip_address, browser, device, operating_system } = data;
        const [result] = await pool.execute(
            'INSERT INTO audit_logs (admin_id, email, role, action, type, status, description, entity_type, entity_id, old_values, new_values, performed_by, ip_address, browser, device, operating_system) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [admin_id || null, email || null, role || null, action, type || 'system', status || 'success', description || null, entity_type || null, entity_id || null, old_values ? JSON.stringify(old_values) : null, new_values ? JSON.stringify(new_values) : null, performed_by || null, ip_address || null, browser || null, device || null, operating_system || null]
        );
        return result.insertId;
    },

    getAll: async (page = 1, limit = 20) => {
        const p = Number(page);
        const l = Number(limit);
        const offset = (p - 1) * l;
        const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ' + l + ' OFFSET ' + offset);
        const [total] = await pool.execute('SELECT COUNT(*) as count FROM audit_logs');
        return { logs: rows, total: total[0].count, page: p, limit: l, total_pages: Math.ceil(total[0].count / l) };
    },

    getById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM audit_logs WHERE id = ?', [Number(id)]);
        return rows[0];
    },

    search: async (query, page = 1, limit = 20) => {
        const p = Number(page);
        const l = Number(limit);
        const offset = (p - 1) * l;
        const sq = "'%" + query.replace(/'/g, "''") + "%'";
        const [rows] = await pool.query('SELECT * FROM audit_logs WHERE email LIKE ' + sq + ' OR action LIKE ' + sq + ' OR type LIKE ' + sq + ' OR description LIKE ' + sq + ' ORDER BY created_at DESC LIMIT ' + l + ' OFFSET ' + offset);
        const [total] = await pool.query('SELECT COUNT(*) as count FROM audit_logs WHERE email LIKE ' + sq + ' OR action LIKE ' + sq + ' OR type LIKE ' + sq + ' OR description LIKE ' + sq);
        return { logs: rows, total: total[0].count, page: p, limit: l, total_pages: Math.ceil(total[0].count / l) };
    },

    filter: async (filters, page = 1, limit = 20) => {
        const p = Number(page);
        const l = Number(limit);
        const offset = (p - 1) * l;
        let where = ' WHERE 1=1';
        if (filters.type) where += " AND type = '" + filters.type.replace(/'/g, "''") + "'";
        if (filters.status) where += " AND status = '" + filters.status.replace(/'/g, "''") + "'";
        if (filters.start_date && filters.end_date) where += " AND DATE(created_at) BETWEEN '" + filters.start_date + "' AND '" + filters.end_date + "'";
        const [rows] = await pool.query('SELECT * FROM audit_logs' + where + ' ORDER BY created_at DESC LIMIT ' + l + ' OFFSET ' + offset);
        const [total] = await pool.query('SELECT COUNT(*) as count FROM audit_logs' + where);
        return { logs: rows, total: total[0].count, page: p, limit: l, total_pages: Math.ceil(total[0].count / l), filters_applied: filters };
    },

    getStats: async () => {
        const [totalLogs] = await pool.execute('SELECT COUNT(*) as count FROM audit_logs');
        const [successLogs] = await pool.execute("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'success'");
        const [warningLogs] = await pool.execute("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'warning'");
        const [errorLogs] = await pool.execute("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'error'");
        return { total_logs: totalLogs[0].count, success_logs: successLogs[0].count, warning_logs: warningLogs[0].count, error_logs: errorLogs[0].count };
    },

    getStatusBreakdown: async () => {
        const [rows] = await pool.execute('SELECT status, COUNT(*) as count FROM audit_logs GROUP BY status');
        return rows;
    },

    getTypeBreakdown: async () => {
        const [rows] = await pool.execute('SELECT type, COUNT(*) as count FROM audit_logs GROUP BY type ORDER BY count DESC');
        return rows;
    },

    getAllForExport: async (filters = {}) => {
        let where = ' WHERE 1=1';
        if (filters.type) where += " AND type = '" + filters.type.replace(/'/g, "''") + "'";
        if (filters.status) where += " AND status = '" + filters.status.replace(/'/g, "''") + "'";
        if (filters.start_date && filters.end_date) where += " AND DATE(created_at) BETWEEN '" + filters.start_date + "' AND '" + filters.end_date + "'";
        const [rows] = await pool.query('SELECT * FROM audit_logs' + where + ' ORDER BY created_at DESC LIMIT 1000');
        return rows;
    }
};

module.exports = AuditLogModel;

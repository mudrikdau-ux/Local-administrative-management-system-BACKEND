const pool = require('../config/db');

const AuditLog = {
    create: async (data) => {
        const { admin_id, action, entity_type, entity_id, description, old_values, new_values, performed_by, ip_address } = data;
        const [result] = await pool.execute(
            `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, old_values, new_values, performed_by, ip_address) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [admin_id || null, action, entity_type, entity_id || null, description || null,
                old_values ? JSON.stringify(old_values) : null,
                new_values ? JSON.stringify(new_values) : null,
                performed_by, ip_address || null]
        );
        return result.insertId;
    },

    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
        return rows;
    },

    getByAdmin: async (adminId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM audit_logs WHERE admin_id = ? ORDER BY created_at DESC', [adminId]
        );
        return rows;
    }
};

module.exports = AuditLog;
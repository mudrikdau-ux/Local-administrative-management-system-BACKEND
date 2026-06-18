const pool = require('../config/db');

const Admin = {
    // Create new admin
    create: async (adminData) => {
        const { user_id, profile_photo, full_name, email, phone, ward_id, position_id, start_date, end_date, status, created_by } = adminData;
        const [result] = await pool.execute(
            `INSERT INTO admins (user_id, profile_photo, full_name, email, phone, ward_id, position_id, start_date, end_date, status, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id || null, profile_photo || null, full_name, email, phone, ward_id, position_id, start_date, end_date, status || 'active', created_by]
        );
        return result.insertId;
    },

    // Get all admins with ward and position names
    getAll: async () => {
        const [rows] = await pool.execute(`
            SELECT a.*, w.ward_name, p.position_name, u.status as account_status
            FROM admins a
            LEFT JOIN wards w ON a.ward_id = w.id
            LEFT JOIN positions p ON a.position_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
        `);
        return rows;
    },

    // Get admin by ID
    getById: async (id) => {
        const [rows] = await pool.execute(`
            SELECT a.*, w.ward_name, p.position_name, u.status as account_status
            FROM admins a
            LEFT JOIN wards w ON a.ward_id = w.id
            LEFT JOIN positions p ON a.position_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        `, [id]);
        return rows[0];
    },

    // Get admin by email
    getByEmail: async (email) => {
        const [rows] = await pool.execute(
            'SELECT * FROM admins WHERE email = ?', [email]
        );
        return rows[0];
    },

    // Get admin by phone
    getByPhone: async (phone) => {
        const [rows] = await pool.execute(
            'SELECT * FROM admins WHERE phone = ?', [phone]
        );
        return rows[0];
    },

    // Update admin
    update: async (id, adminData) => {
        const { full_name, email, phone, ward_id, position_id, start_date, end_date, status, profile_photo } = adminData;
        const [result] = await pool.execute(
            `UPDATE admins SET 
                full_name = ?, email = ?, phone = ?, ward_id = ?, position_id = ?, 
                start_date = ?, end_date = ?, status = ?, profile_photo = COALESCE(?, profile_photo)
             WHERE id = ?`,
            [full_name, email, phone, ward_id, position_id, start_date, end_date, status, profile_photo || null, id]
        );
        return result.affectedRows > 0;
    },

    // Update status
    updateStatus: async (id, status) => {
        const [result] = await pool.execute(
            'UPDATE admins SET status = ? WHERE id = ?', [status, id]
        );
        return result.affectedRows > 0;
    },

    // Delete admin
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM admins WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    // Search admins
    search: async (query) => {
        const searchQuery = `%${query}%`;
        const [rows] = await pool.execute(`
            SELECT a.*, w.ward_name, p.position_name
            FROM admins a
            LEFT JOIN wards w ON a.ward_id = w.id
            LEFT JOIN positions p ON a.position_id = p.id
            WHERE a.full_name LIKE ? OR a.email LIKE ? OR w.ward_name LIKE ?
            ORDER BY a.created_at DESC
        `, [searchQuery, searchQuery, searchQuery]);
        return rows;
    },

    // Filter admins
    filter: async (filters) => {
        let query = `
            SELECT a.*, w.ward_name, p.position_name
            FROM admins a
            LEFT JOIN wards w ON a.ward_id = w.id
            LEFT JOIN positions p ON a.position_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND a.status = ?';
            params.push(filters.status);
        }

        if (filters.ward_id) {
            query += ' AND a.ward_id = ?';
            params.push(filters.ward_id);
        }

        query += ' ORDER BY a.created_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get admin leadership history
    getLeadershipHistory: async (adminId) => {
        const [rows] = await pool.execute(`
            SELECT lh.*, w.ward_name, p.position_name
            FROM leadership_history lh
            LEFT JOIN wards w ON lh.ward_id = w.id
            LEFT JOIN positions p ON lh.position_id = p.id
            WHERE lh.admin_id = ?
            ORDER BY lh.created_at DESC
        `, [adminId]);
        return rows;
    }
};

module.exports = Admin;
const pool = require('../config/db');

const AdminCitizen = {
    // ====================================
    // CREATE CITIZEN
    // ====================================
    create: async (data) => {
        const { full_name, email, phone, address, status, ward_id, created_by, registration_date } = data;
        const [result] = await pool.execute(
            `INSERT INTO citizens (full_name, email, phone, address, status, ward_id, created_by, registration_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email || null, phone, address || null, status || 'active', ward_id, created_by, 
             registration_date || new Date().toISOString().split('T')[0]]
        );
        return result.insertId;
    },

           // ====================================
    // GET ALL CITIZENS (Paginated + Filtered + Searched + Ward-Scoped)
    // ====================================
    getAll: async (wardId, options = {}) => {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM citizens WHERE ward_id = ? AND is_deleted = FALSE';
        let countQuery = 'SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND is_deleted = FALSE';
        const params = [wardId];
        const countParams = [wardId];

        // Filter by status
        if (options.status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(options.status);
            countParams.push(options.status);
        }

        // Search by name
        if (options.name) {
            query += ' AND full_name LIKE ?';
            countQuery += ' AND full_name LIKE ?';
            params.push(`%${options.name}%`);
            countParams.push(`%${options.name}%`);
        }

        // Order & Pagination — use direct interpolation for integers to avoid prepared statement issue
        query += ` ORDER BY registration_date DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await pool.execute(query, params);
        const [total] = await pool.execute(countQuery, countParams);

        return {
            data: rows,
            pagination: {
                current_page: page,
                per_page: limit,
                total_records: total[0].count,
                total_pages: Math.ceil(total[0].count / limit)
            }
        };
    },

    // ====================================
    // GET CITIZEN BY ID (Ward-Scoped)
    // ====================================
    getById: async (id, wardId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM citizens WHERE id = ? AND ward_id = ? AND is_deleted = FALSE',
            [id, wardId]
        );
        return rows[0];
    },

    // ====================================
    // CHECK DUPLICATE EMAIL
    // ====================================
    getByEmail: async (email, excludeId = null) => {
        let query = 'SELECT id FROM citizens WHERE email = ? AND is_deleted = FALSE';
        const params = [email];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // ====================================
    // CHECK DUPLICATE PHONE
    // ====================================
    getByPhone: async (phone, excludeId = null) => {
        let query = 'SELECT id FROM citizens WHERE phone = ? AND is_deleted = FALSE';
        const params = [phone];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // ====================================
    // UPDATE CITIZEN
    // ====================================
    update: async (id, wardId, data) => {
        const { full_name, email, phone, address, status, updated_by } = data;
        const [result] = await pool.execute(
            `UPDATE citizens SET 
                full_name = ?, email = ?, phone = ?, address = ?, status = ?, 
                updated_by = ?, updated_at = NOW()
             WHERE id = ? AND ward_id = ? AND is_deleted = FALSE`,
            [full_name, email || null, phone, address || null, status, updated_by || null, id, wardId]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // SOFT DELETE CITIZEN
    // ====================================
    softDelete: async (id, wardId) => {
        const [result] = await pool.execute(
            'UPDATE citizens SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ? AND ward_id = ? AND is_deleted = FALSE',
            [id, wardId]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // HARD DELETE (Optional — for super admin)
    // ====================================
    hardDelete: async (id) => {
        const [result] = await pool.execute('DELETE FROM citizens WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    // ====================================
    // GET WARD STATISTICS
    // ====================================
    getWardStats: async (wardId) => {
        const [total] = await pool.execute(
            'SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND is_deleted = FALSE', [wardId]
        );
        const [active] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND status = 'active' AND is_deleted = FALSE", [wardId]
        );
        const [inactive] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND status = 'inactive' AND is_deleted = FALSE", [wardId]
        );
        const [deceased] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND status = 'deceased' AND is_deleted = FALSE", [wardId]
        );

        return {
            total: total[0].count,
            active: active[0].count,
            inactive: inactive[0].count,
            deceased: deceased[0].count
        };
    }
};

module.exports = AdminCitizen;
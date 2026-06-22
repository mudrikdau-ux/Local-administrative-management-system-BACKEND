const pool = require('../config/db');

const AdminAnnouncement = {
    create: async (data) => {
        const { title, category, description, image, ward_id, created_by } = data;
        const [result] = await pool.execute(
            'INSERT INTO announcements (title, category, description, image, ward_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [title, category, description, image || null, ward_id || null, created_by || null]
        );
        return result.insertId;
    },

    getAll: async (wardId, options = {}) => {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const offset = (page - 1) * limit;

        const conditions = ['is_deleted = FALSE'];
        const values = [];

        if (wardId) {
            conditions.push('ward_id = ?');
            values.push(wardId);
        }

        if (options.search) {
            conditions.push('(title LIKE ? OR description LIKE ?)');
            values.push('%' + options.search + '%', '%' + options.search + '%');
        }

        if (options.category) {
            conditions.push('category = ?');
            values.push(options.category);
        }

        if (options.status) {
            conditions.push('status = ?');
            values.push(options.status);
        }

        let sortOrder = ' ORDER BY created_at DESC';
        if (options.sort === 'oldest') sortOrder = ' ORDER BY created_at ASC';
        else if (options.sort === 'published') sortOrder = ' ORDER BY status ASC, created_at DESC';
        else if (options.sort === 'unpublished') sortOrder = ' ORDER BY status DESC, created_at DESC';

        const whereClause = conditions.join(' AND ');
        const query = 'SELECT * FROM announcements WHERE ' + whereClause + sortOrder + ' LIMIT ? OFFSET ?';
        const countQuery = 'SELECT COUNT(*) as count FROM announcements WHERE ' + whereClause;

        const queryValues = [...values, limit, offset];
        const countValues = [...values];

               const [rows] = await pool.query(query, queryValues);
        const [total] = await pool.query(countQuery, countValues);

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

    getById: async (id, wardId) => {
        let query = 'SELECT * FROM announcements WHERE id = ? AND is_deleted = FALSE';
        const params = [id];
        if (wardId) {
            query += ' AND ward_id = ?';
            params.push(wardId);
        }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    update: async (id, wardId, data) => {
        const { title, category, description, image } = data;
        let query = 'UPDATE announcements SET title = ?, category = ?, description = ?, image = COALESCE(?, image) WHERE id = ? AND is_deleted = FALSE';
        const params = [title, category, description, image || null, id];
        if (wardId) {
            query += ' AND ward_id = ?';
            params.push(wardId);
        }
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    },

    softDelete: async (id, wardId) => {
        let query = 'UPDATE announcements SET is_deleted = TRUE WHERE id = ? AND is_deleted = FALSE';
        const params = [id];
        if (wardId) {
            query += ' AND ward_id = ?';
            params.push(wardId);
        }
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    },

    publish: async (id, wardId) => {
        let query = "UPDATE announcements SET status = 'published', published_at = NOW() WHERE id = ? AND is_deleted = FALSE AND status = 'unpublished'";
        const params = [id];
        if (wardId) { query += ' AND ward_id = ?'; params.push(wardId); }
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    },

    unpublish: async (id, wardId) => {
        let query = "UPDATE announcements SET status = 'unpublished', published_at = NULL WHERE id = ? AND is_deleted = FALSE AND status = 'published'";
        const params = [id];
        if (wardId) { query += ' AND ward_id = ?'; params.push(wardId); }
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    },

    getPublishedByWard: async (wardId, page = 1, limit = 10) => {
        const p = parseInt(page) || 1;
        const l = parseInt(limit) || 10;
        const offset = (p - 1) * l;
        const [rows] = await pool.execute(
            "SELECT * FROM announcements WHERE ward_id = ? AND status = 'published' AND is_deleted = FALSE ORDER BY published_at DESC LIMIT ? OFFSET ?",
            [wardId, l, offset]
        );
        const [total] = await pool.execute(
            "SELECT COUNT(*) as count FROM announcements WHERE ward_id = ? AND status = 'published' AND is_deleted = FALSE",
            [wardId]
        );
        return { data: rows, pagination: { current_page: p, per_page: l, total_records: total[0].count, total_pages: Math.ceil(total[0].count / l) } };
    },

    getStats: async (wardId) => {
        let whereTotal = 'is_deleted = FALSE';
        const paramsTotal = [];
        if (wardId) { whereTotal += ' AND ward_id = ?'; paramsTotal.push(wardId); }

        const [total] = await pool.execute('SELECT COUNT(*) as count FROM announcements WHERE ' + whereTotal, paramsTotal);
        const [published] = await pool.execute("SELECT COUNT(*) as count FROM announcements WHERE status = 'published' AND " + whereTotal, paramsTotal);
        const [unpublished] = await pool.execute("SELECT COUNT(*) as count FROM announcements WHERE status = 'unpublished' AND " + whereTotal, paramsTotal);
        return { total: total[0].count, published: published[0].count, unpublished: unpublished[0].count };
    }
};

module.exports = AdminAnnouncement;
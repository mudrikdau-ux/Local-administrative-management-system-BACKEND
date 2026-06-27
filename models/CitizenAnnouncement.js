const pool = require('../config/db');

const CitizenAnnouncement = {
    // Get published announcements for citizen's ward
        getAll: async (wardId, options = {}) => {
        const { page = 1, limit = 10, search, category } = options;
        const offset = (page - 1) * limit;

        let query = "SELECT * FROM announcements WHERE ward_id = ? AND status = 'published' AND is_deleted = FALSE";
        let countQuery = "SELECT COUNT(*) as count FROM announcements WHERE ward_id = ? AND status = 'published' AND is_deleted = FALSE";
        const params = [wardId];

        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            countQuery += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category && category !== 'all') {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY published_at DESC';

        const countParams = [...params];
        const [total] = await pool.execute(countQuery, countParams);

        // Use query() for LIMIT/OFFSET
        const [rows] = await pool.query(
            `${query} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
            params
        );

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

    // Get single announcement
    getById: async (id, wardId) => {
        const [rows] = await pool.execute(
            "SELECT * FROM announcements WHERE id = ? AND ward_id = ? AND status = 'published' AND is_deleted = FALSE",
            [id, wardId]
        );
        return rows[0];
    }
};

module.exports = CitizenAnnouncement;
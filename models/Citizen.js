const pool = require('../config/db');

const Citizen = {
    // Get all citizens with ward name
    getAll: async () => {
        const [rows] = await pool.execute(`
            SELECT c.*, w.ward_name 
            FROM citizens c
            LEFT JOIN wards w ON c.ward_id = w.id
            ORDER BY c.registration_date DESC
        `);
        return rows;
    },

    // Get citizen by ID with full details
    getById: async (id) => {
        const [rows] = await pool.execute(`
            SELECT c.*, w.ward_name 
            FROM citizens c
            LEFT JOIN wards w ON c.ward_id = w.id
            WHERE c.id = ?
        `, [id]);
        return rows[0];
    },

    // Search citizens by name, email, or ID
    search: async (query) => {
        const searchQuery = `%${query}%`;
        const [rows] = await pool.execute(`
            SELECT c.*, w.ward_name 
            FROM citizens c
            LEFT JOIN wards w ON c.ward_id = w.id
            WHERE c.full_name LIKE ? 
               OR c.email LIKE ? 
               OR CAST(c.id AS CHAR) LIKE ?
            ORDER BY c.registration_date DESC
        `, [searchQuery, searchQuery, searchQuery]);
        return rows;
    },

    // Filter citizens by ward and/or status
    filter: async (filters) => {
        let query = `
            SELECT c.*, w.ward_name 
            FROM citizens c
            LEFT JOIN wards w ON c.ward_id = w.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND c.status = ?';
            params.push(filters.status);
        }

        if (filters.ward_id) {
            query += ' AND c.ward_id = ?';
            params.push(filters.ward_id);
        }

        query += ' ORDER BY c.registration_date DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get overall statistics
    getOverallStats: async () => {
        const [total] = await pool.execute('SELECT COUNT(*) as count FROM citizens');
        const [active] = await pool.execute("SELECT COUNT(*) as count FROM citizens WHERE status = 'active'");
        const [inactive] = await pool.execute("SELECT COUNT(*) as count FROM citizens WHERE status = 'inactive'");
        const [wards] = await pool.execute('SELECT COUNT(*) as count FROM wards');

        return {
            total_citizens: total[0].count,
            active_citizens: active[0].count,
            inactive_citizens: inactive[0].count,
            total_wards: wards[0].count
        };
    },

    // Get ward-by-ward statistics
    getWardStats: async () => {
        const [rows] = await pool.execute(`
            SELECT 
                w.id,
                w.ward_name,
                COUNT(c.id) as total_citizens,
                SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active_citizens,
                SUM(CASE WHEN c.status = 'inactive' THEN 1 ELSE 0 END) as inactive_citizens
            FROM wards w
            LEFT JOIN citizens c ON w.id = c.ward_id
            GROUP BY w.id, w.ward_name
            ORDER BY w.ward_name ASC
        `);
        return rows;
    },

    // Get citizens per ward (detailed)
    getCitizensByWard: async (wardId) => {
        const [rows] = await pool.execute(`
            SELECT c.*, w.ward_name 
            FROM citizens c
            LEFT JOIN wards w ON c.ward_id = w.id
            WHERE c.ward_id = ?
            ORDER BY c.registration_date DESC
        `, [wardId]);
        return rows;
    }
};

module.exports = Citizen;
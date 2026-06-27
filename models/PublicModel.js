const pool = require('../config/db');

const PublicModel = {
    // ====================================
    // HOME PAGE STATISTICS
    // ====================================
    getHomeStatistics: async () => {
        const [citizens] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE status != 'deceased' AND is_deleted = FALSE"
        );
        const [documents] = await pool.execute(
            "SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'completed'"
        );
        const [announcements] = await pool.execute(
            "SELECT COUNT(*) as count FROM announcements WHERE status = 'published' AND is_deleted = FALSE"
        );
        const [servicesCompleted] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizen_applications WHERE status = 'completed'"
        );

        return {
            registered_citizens: citizens[0].count,
            documents_issued: documents[0].count,
            announcements: announcements[0].count,
            services_completed: servicesCompleted[0].count
        };
    },

    // ====================================
    // ABOUT PAGE STATISTICS
    // ====================================
    getAboutStatistics: async () => {
        const [citizens] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE status != 'deceased' AND is_deleted = FALSE"
        );
        const [documents] = await pool.execute(
            "SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'completed'"
        );
        const [announcements] = await pool.execute(
            "SELECT COUNT(*) as count FROM announcements WHERE status = 'published' AND is_deleted = FALSE"
        );
        const [servicesCompleted] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizen_applications WHERE status IN ('approved', 'completed')"
        );
        const [wards] = await pool.execute('SELECT COUNT(*) as count FROM wards');

        return {
            citizens_served: citizens[0].count,
            documents_issued: documents[0].count,
            announcements: announcements[0].count,
            services_completed: servicesCompleted[0].count,
            wards_count: wards[0].count
        };
    },

    // ====================================
    // PUBLIC ANNOUNCEMENTS
    // ====================================
    getAnnouncements: async (options = {}) => {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 12;
        const offset = (page - 1) * limit;
        const { search, category } = options;

        let query = "SELECT id, title, category, description, image, published_at, view_count FROM announcements WHERE status = 'published' AND is_deleted = FALSE";
        let countQuery = "SELECT COUNT(*) as count FROM announcements WHERE status = 'published' AND is_deleted = FALSE";
        const params = [];
        const countParams = [];

        if (search) {
            const searchClause = ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
            query += searchClause;
            countQuery += searchClause;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (category && category !== 'all') {
            const categoryClause = ' AND category = ?';
            query += categoryClause;
            countQuery += categoryClause;
            params.push(category);
            countParams.push(category);
        }

        // Use template literals for LIMIT/OFFSET (safe integers, no SQL injection risk)
        query += ` ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await pool.execute(query, params);
        const [total] = await pool.execute(countQuery, countParams);

        // Format short description
        const announcements = rows.map(row => ({
            ...row,
            short_description: row.description ? row.description.substring(0, 150) + (row.description.length > 150 ? '...' : '') : ''
        }));

        return {
            data: announcements,
            pagination: {
                current_page: page,
                per_page: limit,
                total_records: total[0].count,
                total_pages: Math.ceil(total[0].count / limit)
            }
        };
    },

    // Get single announcement
    getAnnouncementById: async (id) => {
        const [rows] = await pool.execute(
            "SELECT * FROM announcements WHERE id = ? AND status = 'published' AND is_deleted = FALSE",
            [parseInt(id)]
        );
        return rows[0];
    },

    // Increment view count
    incrementView: async (announcementId, ipAddress) => {
        await pool.execute(
            'INSERT INTO announcement_views (announcement_id, ip_address) VALUES (?, ?)',
            [parseInt(announcementId), ipAddress || null]
        );
        await pool.execute(
            'UPDATE announcements SET view_count = view_count + 1 WHERE id = ?',
            [parseInt(announcementId)]
        );
    },

    // Get announcement views count
    getViewCount: async (announcementId) => {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM announcement_views WHERE announcement_id = ?',
            [parseInt(announcementId)]
        );
        return rows[0].count;
    },

    // ====================================
    // CONTACT MESSAGES
    // ====================================
    createContactMessage: async (data) => {
        const { full_name, email, phone, subject, message, ip_address } = data;
        const [result] = await pool.execute(
            'INSERT INTO contact_messages (full_name, email, phone, subject, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [full_name, email, phone, subject, message, ip_address || null]
        );
        return result.insertId;
    },

    // Get all contact messages (for admin)
    getContactMessages: async (options = {}) => {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 20;
        const offset = (page - 1) * limit;
        const { status } = options;

        let query = 'SELECT * FROM contact_messages WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as count FROM contact_messages WHERE 1=1';
        const params = [];
        const countParams = [];

        if (status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
            countParams.push(status);
        }

        // Use template literals for LIMIT/OFFSET
        query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

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

    // Get contact message by ID
    getContactMessageById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM contact_messages WHERE id = ?', [parseInt(id)]);
        return rows[0];
    }
};

module.exports = PublicModel;
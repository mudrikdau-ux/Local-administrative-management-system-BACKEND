const pool = require('../config/db');

const CitizenSupport = {
    // ====================================
    // SUPPORT REQUESTS
    // ====================================
    createRequest: async (data) => {
        const { citizen_id, admin_id, subject, message } = data;
        const [result] = await pool.execute(
            'INSERT INTO support_requests (citizen_id, admin_id, subject, message) VALUES (?, ?, ?, ?)',
            [citizen_id, admin_id || null, subject, message]
        );
        return result.insertId;
    },

    getRequests: async (citizenId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM support_requests WHERE citizen_id = ? ORDER BY created_at DESC',
            [citizenId]
        );
        return rows;
    },

    getRequestById: async (id, citizenId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM support_requests WHERE id = ? AND citizen_id = ?',
            [id, citizenId]
        );
        return rows[0];
    },

    // ====================================
    // FAQS
    // ====================================
    getFAQs: async (category = null) => {
        let query = "SELECT * FROM faqs WHERE status = 'active'";
        const params = [];
        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }
        query += ' ORDER BY sort_order ASC, created_at DESC';
        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // ====================================
    // REPORTED ISSUES
    // ====================================
    reportIssue: async (data) => {
        const { citizen_id, issue_title, issue_description, priority } = data;
        const [result] = await pool.execute(
            'INSERT INTO reported_issues (citizen_id, issue_title, issue_description, priority) VALUES (?, ?, ?, ?)',
            [citizen_id, issue_title, issue_description, priority || 'medium']
        );
        return result.insertId;
    },

    getIssues: async (citizenId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM reported_issues WHERE citizen_id = ? ORDER BY created_at DESC',
            [citizenId]
        );
        return rows;
    },

    // ====================================
    // SYSTEM GUIDES
    // ====================================
    getGuides: async (category = null) => {
        let query = "SELECT * FROM system_guides WHERE status = 'active'";
        const params = [];
        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }
        query += ' ORDER BY sort_order ASC';
        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get ward admin for citizen
    getWardAdmin: async (wardId) => {
        const [rows] = await pool.execute(
            `SELECT a.id, a.user_id, u.email 
             FROM admins a JOIN users u ON a.user_id = u.id 
             WHERE a.ward_id = ? AND a.status = 'active' LIMIT 1`,
            [wardId]
        );
        return rows[0];
    }
};

module.exports = CitizenSupport;
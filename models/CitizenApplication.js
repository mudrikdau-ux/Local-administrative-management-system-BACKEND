const pool = require('../config/db');

const CitizenApplication = {
    // ====================================
    // CREATE APPLICATION
    // ====================================
    create: async (data) => {
        const { citizen_id, admin_id, document_type, reason, additional_notes, document_request_id } = data;
        const [result] = await pool.execute(
            `INSERT INTO citizen_applications (citizen_id, admin_id, document_type, reason, additional_notes, document_request_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [citizen_id, admin_id || null, document_type, reason || null, additional_notes || null, document_request_id || null]
        );
        return result.insertId;
    },

    // ====================================
    // GET ALL APPLICATIONS FOR CITIZEN
    // ====================================
    getAll: async (citizenId, options = {}) => {
        const { page = 1, limit = 10, search, status } = options;
        const offset = (page - 1) * limit;

        let query = `
            SELECT ca.*, dr.request_status, dr.payment_status, dr.file_path, dr.id as doc_req_id,
                   p.amount as payment_amount, p.payment_id as payment_ref, p.payment_status as pay_status
            FROM citizen_applications ca
            LEFT JOIN document_requests dr ON ca.document_request_id = dr.id
            LEFT JOIN payments p ON dr.id = p.document_request_id
            WHERE ca.citizen_id = ?
        `;
        let countQuery = 'SELECT COUNT(*) as count FROM citizen_applications ca WHERE ca.citizen_id = ?';
        const queryParams = [citizenId];
        const countParams = [citizenId];

        if (search) {
            query += ' AND (ca.document_type LIKE ? OR CAST(ca.id AS CHAR) LIKE ?)';
            countQuery += ' AND (ca.document_type LIKE ? OR CAST(ca.id AS CHAR) LIKE ?)';
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern);
        }

        if (status && status.toLowerCase() !== 'all') {
            query += ' AND ca.status = ?';
            countQuery += ' AND ca.status = ?';
            queryParams.push(status);
            countParams.push(status);
        }

        query += ' ORDER BY ca.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(String(limit), String(offset));

        const [rows] = await pool.execute(query, queryParams);
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
    // GET APPLICATION BY ID
    // ====================================
    getById: async (id, citizenId) => {
        const [rows] = await pool.execute(
            `SELECT ca.*, dr.request_status, dr.payment_status, dr.file_path, dr.admin_notes,
                    p.amount as payment_amount, p.payment_id as payment_ref, p.payment_status as pay_status,
                    p.id as payment_db_id
             FROM citizen_applications ca
             LEFT JOIN document_requests dr ON ca.document_request_id = dr.id
             LEFT JOIN payments p ON dr.id = p.document_request_id
             WHERE ca.id = ? AND ca.citizen_id = ?`,
            [id, citizenId]
        );
        return rows[0];
    },

    // ====================================
    // CHECK IF DOCUMENT IS DOWNLOADABLE
    // ====================================
    isDownloadable: async (id, citizenId) => {
        const [rows] = await pool.execute(
            `SELECT ca.id, dr.payment_status, dr.file_path, dr.request_status
             FROM citizen_applications ca
             LEFT JOIN document_requests dr ON ca.document_request_id = dr.id
             WHERE ca.id = ? AND ca.citizen_id = ?`,
            [id, citizenId]
        );
        return rows[0];
    },

    // ====================================
    // GET ADMIN FOR CITIZEN'S WARD
    // ====================================
    getWardAdmin: async (wardId) => {
        const [rows] = await pool.execute(
            `SELECT a.id as admin_id, a.user_id, u.email
             FROM admins a
             JOIN users u ON a.user_id = u.id
             WHERE a.ward_id = ? AND a.status = 'active' AND u.status = 'active'
             LIMIT 1`,
            [wardId]
        );
        return rows[0];
    },

    // ====================================
    // GET DOCUMENT FEE
    // ====================================
    getDocumentFee: async (documentType) => {
        const [rows] = await pool.execute(
            'SELECT fee FROM document_types WHERE type_name = ? AND is_active = TRUE LIMIT 1',
            [documentType]
        );
        return rows[0] ? rows[0].fee : 5000;
    }
};

module.exports = CitizenApplication;
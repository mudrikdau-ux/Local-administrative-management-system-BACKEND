const pool = require('../config/db');

const CitizenDocument = {
    // Get all documents for citizen (paid + uploaded)
        getAll: async (citizenId, options = {}) => {
        const { page = 1, limit = 10, search, type } = options;
        const offset = (page - 1) * limit;

        let query = `
            SELECT dr.*, p.payment_id as pay_ref, p.amount
            FROM document_requests dr
            LEFT JOIN payments p ON dr.id = p.document_request_id
            WHERE dr.citizen_id = ? AND dr.payment_status = 'paid' AND dr.file_path IS NOT NULL
        `;
        let countQuery = `
            SELECT COUNT(*) as count FROM document_requests 
            WHERE citizen_id = ? AND payment_status = 'paid' AND file_path IS NOT NULL
        `;
        const params = [citizenId];

        if (search) {
            query += ' AND (dr.document_type LIKE ? OR dr.citizen_name LIKE ?)';
            countQuery += ' AND (document_type LIKE ? OR citizen_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (type && type !== 'all') {
            query += ' AND dr.document_type = ?';
            countQuery += ' AND document_type = ?';
            params.push(type);
        }

        query += ' ORDER BY dr.sent_at DESC';

        const countParams = [...params];
        const [total] = await pool.execute(countQuery, countParams);

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

    // Get single document
    getById: async (id, citizenId) => {
        const [rows] = await pool.execute(
            `SELECT dr.*, p.payment_id as pay_ref, p.amount
             FROM document_requests dr
             LEFT JOIN payments p ON dr.id = p.document_request_id
             WHERE dr.id = ? AND dr.citizen_id = ? AND dr.payment_status = 'paid' AND dr.file_path IS NOT NULL`,
            [id, citizenId]
        );
        return rows[0];
    },

    // Record share
    recordShare: async (documentId, citizenId, recipientEmail) => {
        await pool.execute(
            'INSERT INTO document_share_history (document_id, citizen_id, recipient_email) VALUES (?, ?, ?)',
            [documentId, citizenId, recipientEmail]
        );
    },

    // Get share history
    getShareHistory: async (citizenId) => {
        const [rows] = await pool.execute(
            `SELECT dsh.*, dr.document_type, dr.citizen_name
             FROM document_share_history dsh
             JOIN document_requests dr ON dsh.document_id = dr.id
             WHERE dsh.citizen_id = ?
             ORDER BY dsh.shared_at DESC`,
            [citizenId]
        );
        return rows;
    }
};

module.exports = CitizenDocument;
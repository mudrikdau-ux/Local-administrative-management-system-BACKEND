const pool = require('../config/db');

const AdminDocument = {
    // ====================================
    // GET ALL DOCUMENT REQUESTS (Paginated + Filtered)
    // ====================================
    getAll: async (options = {}) => {
        const pageNum = parseInt(options.page) || 1;
        const limitNum = parseInt(options.limit) || 10;
        const { search, payment_status, request_status, document_type } = options;
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT dr.*, c.phone as citizen_phone, c.ward_id, c.status as citizen_status
            FROM document_requests dr
            LEFT JOIN citizens c ON dr.citizen_id = c.id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as count FROM document_requests dr WHERE 1=1';
        const params = [];
        const countParams = [];

        if (search) {
            const searchTerm = `%${search}%`;
            query += ' AND (dr.citizen_name LIKE ? OR dr.document_type LIKE ?)';
            countQuery += ' AND (dr.citizen_name LIKE ? OR dr.document_type LIKE ?)';
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        if (payment_status) {
            query += ' AND dr.payment_status = ?';
            countQuery += ' AND dr.payment_status = ?';
            params.push(payment_status);
            countParams.push(payment_status);
        }

        if (request_status) {
            query += ' AND dr.request_status = ?';
            countQuery += ' AND dr.request_status = ?';
            params.push(request_status);
            countParams.push(request_status);
        }

        if (document_type) {
            query += ' AND dr.document_type = ?';
            countQuery += ' AND dr.document_type = ?';
            params.push(document_type);
            countParams.push(document_type);
        }

        query += ' ORDER BY dr.date_requested DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

               const [rows] = await pool.execute(query, params);
        const [total] = countParams.length > 0 
            ? await pool.execute(countQuery, countParams) 
            : await pool.execute(countQuery);

        return {
            data: rows,
            pagination: {
                current_page: pageNum,
                per_page: limitNum,
                total_records: total[0].count,
                total_pages: Math.ceil(total[0].count / limitNum)
            }
        };
    },

    // ====================================
    // GET REQUEST BY ID
    // ====================================
    getById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT dr.*, c.phone as citizen_phone, c.email as citizen_email, 
                    c.address as citizen_address, c.ward_id, c.status as citizen_status
             FROM document_requests dr
             LEFT JOIN citizens c ON dr.citizen_id = c.id
             WHERE dr.id = ?`,
            [id]
        );
        return rows[0];
    },

    // ====================================
    // GET REQUESTS BY CITIZEN
    // ====================================
    getByCitizen: async (citizenId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM document_requests WHERE citizen_id = ? ORDER BY date_requested DESC',
            [citizenId]
        );
        return rows;
    },

    // ====================================
    // UPLOAD DOCUMENT FILE
    // ====================================
    uploadDocument: async (requestId, fileData) => {
        const { file_path, file_type, file_size, notes, admin_id } = fileData;
        const [result] = await pool.execute(
            `UPDATE document_requests SET 
                file_path = ?, file_type = ?, file_size = ?, 
                admin_notes = CONCAT_WS('\n', admin_notes, ?),
                request_status = 'processing',
                uploaded_at = NOW(),
                updated_by = ?
             WHERE id = ?`,
            [file_path, file_type, file_size, notes || null, admin_id, requestId]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // SEND DOCUMENT TO CITIZEN
    // ====================================
    sendDocument: async (requestId, adminId) => {
        const [result] = await pool.execute(
            `UPDATE document_requests SET 
                request_status = 'completed',
                sent_at = NOW(),
                updated_by = ?
             WHERE id = ? AND payment_status IN ('paid', 'exempted') AND file_path IS NOT NULL`,
            [adminId, requestId]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // UPDATE PAYMENT STATUS (Called by payment module)
    // ====================================
    updatePaymentStatus: async (requestId, paymentStatus) => {
        await pool.execute(
            'UPDATE document_requests SET payment_status = ? WHERE id = ?',
            [paymentStatus, requestId]
        );
    },

    // ====================================
    // CHECK IF DOCUMENT IS PAID
    // ====================================
    isPaid: async (requestId) => {
        const [rows] = await pool.execute(
            "SELECT payment_status FROM document_requests WHERE id = ?",
            [requestId]
        );
        return rows[0] && (rows[0].payment_status === 'paid' || rows[0].payment_status === 'exempted');
    },

    // ====================================
    // CHECK IF DOCUMENT EXISTS
    // ====================================
    hasDocument: async (requestId) => {
        const [rows] = await pool.execute(
            'SELECT file_path, file_type FROM document_requests WHERE id = ? AND file_path IS NOT NULL',
            [requestId]
        );
        return rows[0] || null;
    },

    // ====================================
    // GET DOCUMENT PREVIEW URL
    // ====================================
    getPreviewUrl: async (requestId) => {
        const [rows] = await pool.execute(
            'SELECT file_path, file_type FROM document_requests WHERE id = ?',
            [requestId]
        );
        return rows[0];
    },

    // ====================================
    // GET DOCUMENT TYPES
    // ====================================
    getDocumentTypes: async () => {
        const [rows] = await pool.execute(
            'SELECT * FROM document_types WHERE is_active = TRUE ORDER BY type_name ASC'
        );
        return rows;
    },

    // ====================================
    // GET STATISTICS
    // ====================================
    getStats: async () => {
        const [total] = await pool.execute('SELECT COUNT(*) as count FROM document_requests');
        const [pending] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'pending'");
        const [processing] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'processing'");
        const [completed] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'completed'");
        const [paid] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE payment_status = 'paid'");
        const [unpaid] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE payment_status = 'unpaid'");

        return {
            total: total[0].count,
            pending: pending[0].count,
            processing: processing[0].count,
            completed: completed[0].count,
            paid: paid[0].count,
            unpaid: unpaid[0].count
        };
    },

    // ====================================
    // CANCEL REQUEST
    // ====================================
    cancelRequest: async (requestId, adminId) => {
        const [result] = await pool.execute(
            "UPDATE document_requests SET request_status = 'cancelled', updated_by = ? WHERE id = ?",
            [adminId, requestId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = AdminDocument;
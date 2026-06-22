const pool = require('../config/db');

const AdminPayment = {
    // ====================================
    // GET PAYMENT SUMMARY (Dashboard Cards)
    // ====================================
    getSummary: async () => {
        const [totalRevenue] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'paid'"
        );
        const [paidCount] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments WHERE payment_status = 'paid'"
        );
        const [unpaidCount] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments WHERE payment_status IN ('unpaid', 'pending')"
        );
        const [failedCount] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments WHERE payment_status = 'failed'"
        );

        return {
            total_revenue: parseFloat(totalRevenue[0].total),
            paid_transactions: paidCount[0].count,
            unpaid_transactions: unpaidCount[0].count,
            failed_transactions: failedCount[0].count
        };
    },

        // ====================================
    // GET ALL PAYMENTS (Paginated + Filtered + Searched)
    // ====================================
    getAll: async (options = {}) => {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (options.search) {
            whereClause += ' AND (c.full_name LIKE ? OR p.payment_id LIKE ?)';
            params.push(`%${options.search}%`, `%${options.search}%`);
        }

        if (options.status) {
            whereClause += ' AND p.payment_status = ?';
            params.push(options.status);
        }

        if (options.method) {
            whereClause += ' AND p.payment_method = ?';
            params.push(options.method);
        }

        if (options.start_date && options.end_date) {
            whereClause += ' AND p.payment_date BETWEEN ? AND ?';
            params.push(options.start_date, options.end_date);
        }

        // Count query (no pagination)
        const countQuery = `
            SELECT COUNT(*) as count FROM payments p
            LEFT JOIN citizens c ON p.citizen_id = c.id
            ${whereClause}
        `;

        // Data query (with pagination)
        const query = `
            SELECT p.*, c.full_name as citizen_name, c.email as citizen_email, c.phone as citizen_phone,
                   dr.document_type, dr.id as doc_request_id
            FROM payments p
            LEFT JOIN citizens c ON p.citizen_id = c.id
            LEFT JOIN document_requests dr ON p.document_request_id = dr.id
            ${whereClause}
            ORDER BY p.payment_date DESC LIMIT ${limit} OFFSET ${offset}
        `;

        const [rows] = await pool.query(query, params);
        const [total] = await pool.query(countQuery, params);

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
    // GET PAYMENT BY ID
    // ====================================
    getById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT p.*, c.full_name as citizen_name, c.email as citizen_email, c.phone as citizen_phone,
                    c.address as citizen_address, c.ward_id,
                    dr.document_type, dr.request_status as doc_status, dr.file_path as doc_file_path,
                    dr.id as doc_request_id
             FROM payments p
             LEFT JOIN citizens c ON p.citizen_id = c.id
             LEFT JOIN document_requests dr ON p.document_request_id = dr.id
             WHERE p.id = ?`,
            [id]
        );
        return rows[0];
    },

    // ====================================
    // GET PAYMENT BY PAYMENT_ID
    // ====================================
    getByPaymentId: async (paymentId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM payments WHERE payment_id = ?',
            [paymentId]
        );
        return rows[0];
    },

    // ====================================
    // GET PAYMENTS BY CITIZEN
    // ====================================
    getByCitizen: async (citizenId) => {
        const [rows] = await pool.execute(
            `SELECT p.*, dr.document_type
             FROM payments p
             LEFT JOIN document_requests dr ON p.document_request_id = dr.id
             WHERE p.citizen_id = ?
             ORDER BY p.payment_date DESC`,
            [citizenId]
        );
        return rows;
    },

    // ====================================
    // GET PAYMENTS BY DOCUMENT REQUEST
    // ====================================
    getByDocumentRequest: async (requestId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM payments WHERE document_request_id = ? ORDER BY created_at DESC',
            [requestId]
        );
        return rows;
    },

    // ====================================
    // CREATE PAYMENT
    // ====================================
    create: async (data) => {
        const { payment_id, citizen_id, document_request_id, amount, payment_method, transaction_reference, payment_status, payment_date, notes, recorded_by } = data;
        const [result] = await pool.execute(
            `INSERT INTO payments (payment_id, citizen_id, document_request_id, amount, payment_method, transaction_reference, payment_status, payment_date, notes, recorded_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [payment_id, citizen_id, document_request_id || null, amount, payment_method,
                transaction_reference || null, payment_status || 'pending', payment_date, notes || null, recorded_by || null]
        );
        return result.insertId;
    },

    // ====================================
    // UPDATE PAYMENT STATUS
    // ====================================
    updateStatus: async (id, status) => {
        const [result] = await pool.execute(
            'UPDATE payments SET payment_status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // GENERATE PAYMENT ID
    // ====================================
    generatePaymentId: async () => {
        const year = new Date().getFullYear();
        const [rows] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments WHERE payment_id LIKE ?",
            [`PAY-${year}-%`]
        );
        const count = rows[0].count + 1;
        return `PAY-${year}-${count.toString().padStart(4, '0')}`;
    },

        // ====================================
    // GET MONTHLY REVENUE (Chart Data)
    // ====================================
    getMonthlyRevenue: async (months = 12) => {
        const [rows] = await pool.execute(`
            SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') as month,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(*) as transaction_count
            FROM payments 
            WHERE payment_status = 'paid'
            GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
            ORDER BY month DESC 
            LIMIT ${parseInt(months)}
        `);
        return rows;
    },
    // ====================================
    // GET REVENUE BY METHOD
    // ====================================
    getRevenueByMethod: async () => {
        const [rows] = await pool.execute(
            `SELECT 
                payment_method,
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as total_amount
             FROM payments 
             WHERE payment_status = 'paid'
             GROUP BY payment_method`
        );
        return rows;
    }
};

module.exports = AdminPayment;
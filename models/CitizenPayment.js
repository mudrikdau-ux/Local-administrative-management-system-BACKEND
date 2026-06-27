const pool = require('../config/db');

const CitizenPayment = {
    // ====================================
    // GET PAYMENT SUMMARY
    // ====================================
    getSummary: async (citizenId) => {
        const [totalPaid] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE citizen_id = ? AND payment_status = 'paid'",
            [citizenId]
        );
        const [totalUnpaid] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE citizen_id = ? AND payment_status IN ('unpaid', 'pending')",
            [citizenId]
        );
        const [totalTransactions] = await pool.execute(
            'SELECT COUNT(*) as count FROM payments WHERE citizen_id = ?',
            [citizenId]
        );

        return {
            total_paid: parseFloat(totalPaid[0].total),
            total_unpaid: parseFloat(totalUnpaid[0].total),
            outstanding_balance: parseFloat(totalUnpaid[0].total),
            total_transactions: totalTransactions[0].count
        };
    },

         // ====================================
    // GET ALL PAYMENTS FOR CITIZEN
    // ====================================
    getAll: async (citizenId, options = {}) => {
        const { page = 1, limit = 10, search, status } = options;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, dr.document_type, ca.id as application_id
            FROM payments p
            LEFT JOIN document_requests dr ON p.document_request_id = dr.id
            LEFT JOIN citizen_applications ca ON dr.id = ca.document_request_id
            WHERE p.citizen_id = ?
        `;
        let countQuery = 'SELECT COUNT(*) as count FROM payments WHERE citizen_id = ?';
        const params = [citizenId];

        if (search) {
            query += ' AND (p.payment_id LIKE ? OR dr.document_type LIKE ?)';
            countQuery += ' AND (payment_id LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status && status !== 'all') {
            query += ' AND p.payment_status = ?';
            countQuery += ' AND payment_status = ?';
            params.push(status);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        const countParams = [...params];
        params.push(limit.toString(), offset.toString());

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
    // GET PAYMENT BY ID
    // ====================================
    getById: async (id, citizenId) => {
        const [rows] = await pool.execute(
            `SELECT p.*, dr.document_type, dr.request_status
             FROM payments p
             LEFT JOIN document_requests dr ON p.document_request_id = dr.id
             WHERE p.id = ? AND p.citizen_id = ?`,
            [id, citizenId]
        );
        return rows[0];
    },

        // ====================================
    // GET PAYMENT HISTORY
    // ====================================
    getHistory: async (citizenId, page = 1, limit = 20) => {
        const offset = (page - 1) * limit;
        const [rows] = await pool.execute(
            'SELECT * FROM payment_history WHERE citizen_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [citizenId, limit.toString(), offset.toString()]
        );
        const [total] = await pool.execute(
            'SELECT COUNT(*) as count FROM payment_history WHERE citizen_id = ?',
            [citizenId]
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

    // ====================================
    // PROCESS PAYMENT (Simulation)
    // ====================================
    processPayment: async (paymentId, paymentMethod, phoneNumber, citizenId) => {
        // Generate transaction reference
        const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Update payment status to paid
        await pool.execute(
            "UPDATE payments SET payment_status = 'paid', transaction_reference = ?, payment_method = ?, updated_at = NOW() WHERE id = ? AND citizen_id = ? AND payment_status IN ('unpaid', 'pending')",
            [transactionRef, paymentMethod, paymentId, citizenId]
        );

        // Get the payment details
        const [payment] = await pool.execute('SELECT * FROM payments WHERE id = ?', [paymentId]);

        if (payment.length > 0) {
            // Add to payment history
            await pool.execute(
                `INSERT INTO payment_history (payment_id, citizen_id, amount, payment_method, status, transaction_reference) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [paymentId, citizenId, payment[0].amount, paymentMethod, 'paid', transactionRef]
            );

            // Sync with document request
            if (payment[0].document_request_id) {
                await pool.execute(
                    "UPDATE document_requests SET payment_status = 'paid' WHERE id = ?",
                    [payment[0].document_request_id]
                );
            }

            return {
                success: true,
                transaction_reference: transactionRef,
                amount: payment[0].amount
            };
        }

        return { success: false, message: 'Payment not found.' };
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
    }
};

module.exports = CitizenPayment;
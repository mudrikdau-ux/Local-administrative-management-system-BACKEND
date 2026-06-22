const pool = require("../config/db");

const AdminDocument = {
    getAll: async (options = {}) => {
        const pageNum = parseInt(options.page) || 1;
        const limitNum = parseInt(options.limit) || 10;
        const offset = (pageNum - 1) * limitNum;
        const search = options.search || null;
        const payment_status = options.payment_status || null;
        const request_status = options.request_status || null;
        const document_type = options.document_type || null;

        let where = "WHERE 1=1";
        const params = [];

        if (search) {
            where += " AND (dr.citizen_name LIKE ? OR dr.document_type LIKE ?)";
            params.push("%" + search + "%", "%" + search + "%");
        }
        if (payment_status) {
            where += " AND dr.payment_status = ?";
            params.push(payment_status);
        }
        if (request_status) {
            where += " AND dr.request_status = ?";
            params.push(request_status);
        }
        if (document_type) {
            where += " AND dr.document_type = ?";
            params.push(document_type);
        }

        const query = "SELECT dr.*, c.phone as citizen_phone, c.ward_id, c.status as citizen_status FROM document_requests dr LEFT JOIN citizens c ON dr.citizen_id = c.id " + where + " ORDER BY dr.date_requested DESC LIMIT " + limitNum + " OFFSET " + offset;
        const countQuery = "SELECT COUNT(*) as count FROM document_requests dr " + where;

        const [rows] = await pool.query(query, params);
        const [total] = await pool.query(countQuery, params);

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

    getById: async (id) => {
        const [rows] = await pool.execute("SELECT dr.*, c.phone as citizen_phone, c.email as citizen_email, c.address as citizen_address, c.ward_id, c.status as citizen_status FROM document_requests dr LEFT JOIN citizens c ON dr.citizen_id = c.id WHERE dr.id = ?", [id]);
        return rows[0];
    },

    getByCitizen: async (citizenId) => {
        const [rows] = await pool.execute("SELECT * FROM document_requests WHERE citizen_id = ? ORDER BY date_requested DESC", [citizenId]);
        return rows;
    },

    uploadDocument: async (requestId, fileData) => {
        const { file_path, file_type, file_size, notes, admin_id } = fileData;
        const [result] = await pool.execute("UPDATE document_requests SET file_path = ?, file_type = ?, file_size = ?, admin_notes = CONCAT_WS('\n', admin_notes, ?), request_status = 'processing', uploaded_at = NOW(), updated_by = ? WHERE id = ?", [file_path, file_type, file_size, notes || null, admin_id, requestId]);
        return result.affectedRows > 0;
    },

    sendDocument: async (requestId, adminId) => {
        const [result] = await pool.execute("UPDATE document_requests SET request_status = 'completed', sent_at = NOW(), updated_by = ? WHERE id = ? AND payment_status IN ('paid', 'exempted') AND file_path IS NOT NULL", [adminId, requestId]);
        return result.affectedRows > 0;
    },

    updatePaymentStatus: async (requestId, paymentStatus) => {
        await pool.execute("UPDATE document_requests SET payment_status = ? WHERE id = ?", [paymentStatus, requestId]);
    },

    isPaid: async (requestId) => {
        const [rows] = await pool.execute("SELECT payment_status FROM document_requests WHERE id = ?", [requestId]);
        return rows[0] && (rows[0].payment_status === "paid" || rows[0].payment_status === "exempted");
    },

    hasDocument: async (requestId) => {
        const [rows] = await pool.execute("SELECT file_path, file_type FROM document_requests WHERE id = ? AND file_path IS NOT NULL", [requestId]);
        return rows[0] || null;
    },

    getPreviewUrl: async (requestId) => {
        const [rows] = await pool.execute("SELECT file_path, file_type FROM document_requests WHERE id = ?", [requestId]);
        return rows[0];
    },

    getDocumentTypes: async () => {
        const [rows] = await pool.execute("SELECT * FROM document_types WHERE is_active = TRUE ORDER BY type_name ASC");
        return rows;
    },

    getStats: async () => {
        const [total] = await pool.execute("SELECT COUNT(*) as count FROM document_requests");
        const [pending] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'pending'");
        const [processing] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'processing'");
        const [completed] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE request_status = 'completed'");
        const [paid] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE payment_status = 'paid'");
        const [unpaid] = await pool.execute("SELECT COUNT(*) as count FROM document_requests WHERE payment_status = 'unpaid'");
        return { total: total[0].count, pending: pending[0].count, processing: processing[0].count, completed: completed[0].count, paid: paid[0].count, unpaid: unpaid[0].count };
    },

    cancelRequest: async (requestId, adminId) => {
        const [result] = await pool.execute("UPDATE document_requests SET request_status = 'cancelled', updated_by = ? WHERE id = ?", [adminId, requestId]);
        return result.affectedRows > 0;
    }
};

module.exports = AdminDocument;

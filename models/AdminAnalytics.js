const pool = require('../config/db');

const AdminAnalytics = {
    // ====================================
    // DASHBOARD SUMMARY
    // ====================================
    getDashboardSummary: async (wardId) => {
        const [totalCitizens] = await pool.execute(
            'SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND is_deleted = FALSE', [wardId]
        );
        const [activeCitizens] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND status = 'active' AND is_deleted = FALSE", [wardId]
        );
        const [inactiveCitizens] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND status = 'inactive' AND is_deleted = FALSE", [wardId]
        );
        const [deceasedCitizens] = await pool.execute(
            "SELECT COUNT(*) as count FROM citizens WHERE ward_id = ? AND status = 'deceased' AND is_deleted = FALSE", [wardId]
        );
        const [totalDocuments] = await pool.execute(
            'SELECT COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ?', [wardId]
        );
        const [documentsIssued] = await pool.execute(
            "SELECT COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ? AND dr.request_status = 'completed'", [wardId]
        );
        const [totalRevenue] = await pool.execute(
            "SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? AND p.payment_status = 'paid'", [wardId]
        );
        const [paidTransactions] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? AND p.payment_status = 'paid'", [wardId]
        );
        const [unpaidTransactions] = await pool.execute(
            "SELECT COUNT(*) as count FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? AND p.payment_status IN ('unpaid', 'pending')", [wardId]
        );

        return {
            total_citizens: totalCitizens[0].count,
            active_citizens: activeCitizens[0].count,
            inactive_citizens: inactiveCitizens[0].count,
            deceased_citizens: deceasedCitizens[0].count,
            total_documents: totalDocuments[0].count,
            documents_issued: documentsIssued[0].count,
            total_revenue: parseFloat(totalRevenue[0].total),
            paid_transactions: paidTransactions[0].count,
            unpaid_transactions: unpaidTransactions[0].count
        };
    },

    // ====================================
    // CITIZENS CHART DATA
    // ====================================
    getCitizensChartData: async (wardId) => {
        const [statusDist] = await pool.execute(
            'SELECT status, COUNT(*) as count FROM citizens WHERE ward_id = ? AND is_deleted = FALSE GROUP BY status', [wardId]
        );
        const [monthlyReg] = await pool.execute(
            'SELECT DATE_FORMAT(registration_date, "%Y-%m") as month, COUNT(*) as count FROM citizens WHERE ward_id = ? AND is_deleted = FALSE GROUP BY month ORDER BY month ASC LIMIT 12', [wardId]
        );
        return { status_distribution: statusDist, monthly_registrations: monthlyReg };
    },

    // ====================================
    // PAYMENTS CHART DATA
    // ====================================
    getPaymentsChartData: async (wardId) => {
        const [monthlyRevenue] = await pool.execute(
            'SELECT DATE_FORMAT(p.payment_date, "%Y-%m") as month, COALESCE(SUM(p.amount), 0) as total_amount, COUNT(*) as count FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? AND p.payment_status = "paid" GROUP BY month ORDER BY month ASC LIMIT 12', [wardId]
        );
        const [statusDist] = await pool.execute(
            'SELECT p.payment_status as status, COUNT(*) as count FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? GROUP BY p.payment_status', [wardId]
        );
        const [methodDist] = await pool.execute(
            'SELECT p.payment_method as method, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total_amount FROM payments p JOIN citizens c ON p.citizen_id = c.id WHERE c.ward_id = ? AND p.payment_status = "paid" GROUP BY p.payment_method', [wardId]
        );
        return { monthly_revenue: monthlyRevenue, status_distribution: statusDist, method_distribution: methodDist };
    },

    // ====================================
    // DOCUMENTS CHART DATA
    // ====================================
    getDocumentsChartData: async (wardId) => {
        const [monthlyDocs] = await pool.execute(
            'SELECT DATE_FORMAT(dr.date_requested, "%Y-%m") as month, COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ? GROUP BY month ORDER BY month ASC LIMIT 12', [wardId]
        );
        const [docTypes] = await pool.execute(
            'SELECT dr.document_type, COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ? GROUP BY dr.document_type ORDER BY count DESC', [wardId]
        );
        const [statusDist] = await pool.execute(
            'SELECT dr.request_status as status, COUNT(*) as count FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ? GROUP BY dr.request_status', [wardId]
        );
        return { monthly_documents: monthlyDocs, document_types: docTypes, status_distribution: statusDist };
    },

    // ====================================
    // GET CITIZENS FOR REPORT
    // ====================================
    getCitizensForReport: async (wardId, filters = {}) => {
        let query = 'SELECT * FROM citizens WHERE ward_id = ? AND is_deleted = FALSE';
        const params = [wardId];
        if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
        query += ' ORDER BY registration_date DESC';
        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // ====================================
    // GET PAYMENTS FOR REPORT
    // ====================================
    getPaymentsForReport: async (wardId, filters = {}) => {
        let query = 'SELECT p.*, c.full_name as citizen_name, dr.document_type FROM payments p JOIN citizens c ON p.citizen_id = c.id LEFT JOIN document_requests dr ON p.document_request_id = dr.id WHERE c.ward_id = ?';
        const params = [wardId];
        if (filters.status) { query += ' AND p.payment_status = ?'; params.push(filters.status); }
        query += ' ORDER BY p.payment_date DESC';
        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // ====================================
    // GET DOCUMENTS FOR REPORT
    // ====================================
    getDocumentsForReport: async (wardId, filters = {}) => {
        let query = 'SELECT dr.*, c.full_name as citizen_name, c.phone as citizen_phone FROM document_requests dr JOIN citizens c ON dr.citizen_id = c.id WHERE c.ward_id = ?';
        const params = [wardId];
        if (filters.status) { query += ' AND dr.request_status = ?'; params.push(filters.status); }
        query += ' ORDER BY dr.date_requested DESC';
        const [rows] = await pool.execute(query, params);
        return rows;
    }
};

module.exports = AdminAnalytics;

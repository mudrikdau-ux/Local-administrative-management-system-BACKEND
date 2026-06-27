const pool = require('../config/db');

const analyticsController = {
    getAdvancedAnalytics: async (req, res) => {
        try {
            // Monthly revenue (last 12 months)
            const [monthlyRevenue] = await pool.execute(
                `SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, 
                        COALESCE(SUM(amount), 0) as total
                 FROM payments WHERE payment_status = 'paid'
                 GROUP BY month ORDER BY month DESC LIMIT 12`
            );

            // Monthly citizen registrations
            const [monthlyCitizens] = await pool.execute(
                `SELECT DATE_FORMAT(registration_date, '%Y-%m') as month, COUNT(*) as count
                 FROM citizens WHERE is_deleted = FALSE
                 GROUP BY month ORDER BY month DESC LIMIT 12`
            );

            // Monthly documents issued
            const [monthlyDocuments] = await pool.execute(
                `SELECT DATE_FORMAT(sent_at, '%Y-%m') as month, COUNT(*) as count
                 FROM document_requests WHERE request_status = 'completed' AND sent_at IS NOT NULL
                 GROUP BY month ORDER BY month DESC LIMIT 12`
            );

            // Most requested documents
            const [topDocuments] = await pool.execute(
                `SELECT document_type, COUNT(*) as count
                 FROM document_requests GROUP BY document_type ORDER BY count DESC LIMIT 10`
            );

            // Ward performance
            const [wardPerformance] = await pool.execute(
                `SELECT w.ward_name, 
                        COUNT(DISTINCT c.id) as citizens,
                        COUNT(DISTINCT dr.id) as documents
                 FROM wards w
                 LEFT JOIN citizens c ON w.id = c.ward_id AND c.is_deleted = FALSE
                 LEFT JOIN document_requests dr ON c.id = dr.citizen_id
                 GROUP BY w.id, w.ward_name ORDER BY citizens DESC`
            );

            // Payment method distribution
            const [paymentMethods] = await pool.execute(
                `SELECT payment_method, COUNT(*) as count, SUM(amount) as total
                 FROM payments WHERE payment_status = 'paid'
                 GROUP BY payment_method`
            );

            res.json({
                success: true,
                monthly_revenue: monthlyRevenue,
                monthly_citizens: monthlyCitizens,
                monthly_documents: monthlyDocuments,
                top_documents: topDocuments,
                ward_performance: wardPerformance,
                payment_methods: paymentMethods
            });
        } catch (error) {
            console.error('Analytics Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = analyticsController;
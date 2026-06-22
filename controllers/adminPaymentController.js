const AdminPayment = require('../models/AdminPayment');
const paymentSyncService = require('../services/paymentSyncService');
const AuditLogModel = require('../models/AuditLogModel');

const adminPaymentController = {
    getSummary: async (req, res) => {
        try {
            const summary = await AdminPayment.getSummary();
            res.json({ success: true, summary });
        } catch (error) {
            console.error('Payment Summary Error:', error);
            res.status(500).json({ success: false, message: 'Server error fetching summary.' });
        }
    },

    getPayments: async (req, res) => {
        try {
            const { page, limit, search, status, method, start_date, end_date } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                status: status || null,
                method: method || null,
                start_date: start_date || null,
                end_date: end_date || null
            };
            const result = await AdminPayment.getAll(options);
            if (search || status) {
                await AuditLogModel.create({
                    email: req.user.email, role: 'admin', action: 'PAYMENTS_SEARCHED',
                    type: 'payment', status: 'success',
                    description: 'Payments searched/filtered',
                    performed_by: req.user.id, ip_address: req.ip
                });
            }
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Get Payments Error:', error);
            res.status(500).json({ success: false, message: 'Server error fetching payments.' });
        }
    },

    getPaymentById: async (req, res) => {
        try {
            const payment = await AdminPayment.getById(req.params.id);
            if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
            await AuditLogModel.create({
                email: req.user.email, role: 'admin', action: 'PAYMENT_VIEWED',
                type: 'payment', status: 'success',
                description: 'Payment viewed: ' + payment.payment_id,
                entity_type: 'payment', entity_id: payment.id,
                performed_by: req.user.id, ip_address: req.ip
            });
            res.json({ success: true, payment });
        } catch (error) {
            console.error('Get Payment Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    getPaymentsByCitizen: async (req, res) => {
        try {
            const payments = await AdminPayment.getByCitizen(req.params.citizen_id);
            res.json({ success: true, citizen_id: req.params.citizen_id, total: payments.length, payments });
        } catch (error) {
            console.error('Get Citizen Payments Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    createPayment: async (req, res) => {
        try {
            const { citizen_id, document_request_id, amount, payment_method, transaction_reference, payment_status, payment_date, notes } = req.body;
            if (!citizen_id || !amount || !payment_method || !payment_date) {
                return res.status(400).json({ success: false, message: 'Missing required fields.' });
            }
            const payment_id = await AdminPayment.generatePaymentId();
            const paymentId = await AdminPayment.create({
                payment_id, citizen_id, document_request_id: document_request_id || null,
                amount, payment_method, transaction_reference: transaction_reference || null,
                payment_status: payment_status || 'pending', payment_date,
                notes: notes || null, recorded_by: req.user.admin_id
            });
            if ((payment_status === 'paid') && document_request_id) {
                await paymentSyncService.syncPaymentToDocument(document_request_id, 'paid');
            }
            await AuditLogModel.create({
                email: req.user.email, role: 'admin', action: 'PAYMENT_CREATED',
                type: 'payment', status: 'success',
                description: 'Payment created: ' + payment_id + ' - TZS ' + amount,
                entity_type: 'payment', entity_id: paymentId,
                new_values: { payment_id, amount, payment_method, payment_status },
                performed_by: req.user.id, ip_address: req.ip
            });
            res.status(201).json({ success: true, message: 'Payment recorded successfully.', payment_id, id: paymentId });
        } catch (error) {
            console.error('Create Payment Error:', error);
            res.status(500).json({ success: false, message: 'Server error creating payment.' });
        }
    },

    updatePaymentStatus: async (req, res) => {
        try {
            const { payment_status } = req.body;
            if (!['paid', 'unpaid', 'pending', 'failed'].includes(payment_status)) {
                return res.status(400).json({ success: false, message: 'Invalid payment status.' });
            }
            const payment = await AdminPayment.getById(req.params.id);
            if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
            await AdminPayment.updateStatus(req.params.id, payment_status);
            if (payment.document_request_id) {
                const docStatus = payment_status === 'paid' ? 'paid' : 'unpaid';
                await paymentSyncService.syncPaymentToDocument(payment.document_request_id, docStatus);
            }
            await AuditLogModel.create({
                email: req.user.email, role: 'admin', action: 'PAYMENT_UPDATED',
                type: 'payment', status: 'success',
                description: 'Payment status updated: ' + payment.payment_id + ' to ' + payment_status,
                entity_type: 'payment', entity_id: req.params.id,
                performed_by: req.user.id, ip_address: req.ip
            });
            res.json({ success: true, message: 'Payment status updated successfully.' });
        } catch (error) {
            console.error('Update Payment Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    getStatistics: async (req, res) => {
        try {
            const [summary, monthlyRevenue, revenueByMethod] = await Promise.all([
                AdminPayment.getSummary(),
                AdminPayment.getMonthlyRevenue(12),
                AdminPayment.getRevenueByMethod()
            ]);
            res.json({ success: true, summary, monthly_revenue: monthlyRevenue, revenue_by_method: revenueByMethod });
        } catch (error) {
            console.error('Statistics Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = adminPaymentController;

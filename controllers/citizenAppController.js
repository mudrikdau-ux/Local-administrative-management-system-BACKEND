const CitizenApplication = require('../models/CitizenApplication');
const CitizenPayment = require('../models/CitizenPayment');
const AdminPayment = require('../models/AdminPayment');
const receiptService = require('../services/receiptService');
const AuditLogModel = require('../models/AuditLogModel');
const notificationService = require('../services/notificationService');
const paymentSyncService = require('../services/paymentSyncService');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const citizenAppController = {
    // Helper: Get citizen_id from users table
    _getCitizenId: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT id FROM citizens WHERE user_id = ? AND is_deleted = FALSE',
            [userId]
        );
        return rows.length > 0 ? rows[0].id : null;
    },

    // Helper: Get citizen full details
    _getCitizenDetails: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT id, full_name, ward_id FROM citizens WHERE user_id = ? AND is_deleted = FALSE',
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    // ====================================
    // SUBMIT NEW APPLICATION
    // ====================================
    submitApplication: async (req, res) => {
        try {
            const userId = req.user.id;
            const citizen = await citizenAppController._getCitizenDetails(userId);

            if (!citizen) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Citizen profile not found. Contact ward administration.' 
                });
            }

            const citizenId = citizen.id;
            const citizenName = citizen.full_name;
            const citizenWardId = citizen.ward_id;
            const { document_type, reason, additional_notes } = req.body;

            if (!document_type) {
                return res.status(400).json({ success: false, message: 'Document type is required.' });
            }

            // Get ward admin
            const wardAdmin = await CitizenApplication.getWardAdmin(citizenWardId);
            const adminId = wardAdmin ? wardAdmin.admin_id : null;

            // Get document fee
            const fee = await CitizenApplication.getDocumentFee(document_type);

            // Create document request
            const [docReqResult] = await pool.execute(
                `INSERT INTO document_requests (citizen_id, citizen_name, document_type, description, payment_status, request_status, date_requested, created_by_admin) 
                 VALUES (?, ?, ?, ?, 'unpaid', 'pending', CURDATE(), ?)`,
                [citizenId, citizenName, document_type, reason || additional_notes || '', adminId]
            );
            const documentRequestId = docReqResult.insertId;

            // Create application record
            const applicationId = await CitizenApplication.create({
                citizen_id: citizenId,
                admin_id: adminId,
                document_type,
                reason: reason || '',
                additional_notes: additional_notes || '',
                document_request_id: documentRequestId
            });

            // Auto-create payment record
            const paymentId = await AdminPayment.generatePaymentId();
            await AdminPayment.create({
                payment_id: paymentId,
                citizen_id: citizenId,
                document_request_id: documentRequestId,
                amount: fee,
                payment_method: 'pending',
                transaction_reference: null,
                payment_status: 'unpaid',
                payment_date: new Date().toISOString().split('T')[0],
                notes: `${document_type} application fee`,
                recorded_by: adminId
            });

            // Notify admin
            try {
                await notificationService.notifySuperAdmin(
                    'New Document Application',
                    `${citizenName} applied for ${document_type}`,
                    'document',
                    'info',
                    'documents',
                    applicationId
                );
            } catch (e) {
                console.log('Notification skipped:', e.message);
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'APPLICATION_SUBMITTED',
                type: 'document',
                status: 'success',
                description: `Application submitted: ${document_type}`,
                entity_type: 'application',
                entity_id: applicationId,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.status(201).json({
                success: true,
                message: 'Application submitted successfully.',
                application_id: applicationId,
                payment_id: paymentId,
                amount: fee,
                payment_status: 'unpaid'
            });
        } catch (error) {
            console.error('Submit Application Error:', error);
            res.status(500).json({ success: false, message: 'Server error submitting application.' });
        }
    },

    // ====================================
    // GET ALL APPLICATIONS
    // ====================================
    getApplications: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const { page, limit, search, status } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                status: status || null
            };

            const result = await CitizenApplication.getAll(citizenId, options);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Get Applications Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET APPLICATION DETAILS
    // ====================================
    getApplicationById: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const application = await CitizenApplication.getById(req.params.id, citizenId);
            if (!application) {
                return res.status(404).json({ success: false, message: 'Application not found.' });
            }

            res.json({ success: true, application });
        } catch (error) {
            console.error('Get Application Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // DOWNLOAD DOCUMENT
    // ====================================
    downloadDocument: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const application = await CitizenApplication.isDownloadable(req.params.id, citizenId);
            if (!application) {
                return res.status(404).json({ success: false, message: 'Application not found.' });
            }

            if (application.payment_status !== 'paid') {
                return res.status(400).json({ success: false, message: 'Please complete payment first.' });
            }

            if (!application.file_path) {
                return res.status(400).json({ success: false, message: 'Document not yet available. Admin is still processing.' });
            }

            if (application.request_status !== 'completed') {
                return res.status(400).json({ success: false, message: 'Document not ready for download yet.' });
            }

            const filePath = path.join(__dirname, '..', application.file_path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'Document file not found on server.' });
            }

            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'DOCUMENT_DOWNLOADED',
                type: 'document',
                status: 'success',
                description: `Document downloaded for application #${req.params.id}`,
                entity_type: 'application',
                entity_id: req.params.id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.download(filePath);
        } catch (error) {
            console.error('Download Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // PAYMENT SUMMARY
    // ====================================
    getPaymentSummary: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const summary = await CitizenPayment.getSummary(citizenId);
            res.json({ success: true, summary });
        } catch (error) {
            console.error('Payment Summary Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET ALL PAYMENTS
    // ====================================
    getPayments: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const { page, limit, search, status } = req.query;
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                status: status || null
            };

            const result = await CitizenPayment.getAll(citizenId, options);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Get Payments Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET PAYMENT HISTORY
    // ====================================
    getPaymentHistory: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const { page, limit } = req.query;
            const result = await CitizenPayment.getHistory(citizenId, parseInt(page) || 1, parseInt(limit) || 20);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Payment History Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // PAY NOW (Simulation)
    // ====================================
    payNow: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const { payment_id, payment_method, phone_number } = req.body;

            console.log('=== PAY NOW REQUEST ===');
            console.log('User ID:', req.user.id);
            console.log('Citizen ID:', citizenId);
            console.log('Payment ID (numeric):', payment_id);
            console.log('Payment Method:', payment_method);
            console.log('Phone:', phone_number);

            if (!payment_id || !payment_method) {
                console.log('FAIL: Missing fields');
                return res.status(400).json({ success: false, message: 'Payment ID and payment method are required.' });
            }

            // Get payment (payment_id here is the numeric id from the payments table)
            const payment = await CitizenPayment.getById(payment_id, citizenId);
            console.log('Payment lookup result:', payment ? `Found - Status: ${payment.payment_status}, Amount: ${payment.amount}` : 'NOT FOUND');

            if (!payment) {
                return res.status(404).json({ success: false, message: 'Payment not found or does not belong to you.' });
            }

            if (payment.payment_status === 'paid') {
                console.log('FAIL: Already paid');
                return res.status(400).json({ success: false, message: 'This payment has already been completed.' });
            }

            // Process payment (Simulation)
            console.log('Processing payment...');
            const result = await CitizenPayment.processPayment(payment_id, payment_method, phone_number || '', citizenId);
            console.log('Process result:', result);

            if (!result.success) {
                return res.status(400).json({ success: false, message: result.message || 'Payment processing failed.' });
            }

            // Sync with document request
            if (payment.document_request_id) {
                await paymentSyncService.syncPaymentToDocument(payment.document_request_id, 'paid');
            }

            // Ensure receipts folder exists
            const receiptsDir = path.join(__dirname, '../uploads/receipts');
            if (!fs.existsSync(receiptsDir)) {
                console.log('Creating receipts folder:', receiptsDir);
                fs.mkdirSync(receiptsDir, { recursive: true });
            }

            // Generate receipt
            console.log('Generating receipt...');
            const { filePath, fileName } = await receiptService.generateReceipt({
                payment_id: payment.payment_id,
                document_type: payment.document_type || 'N/A',
                amount: payment.amount,
                payment_method,
                transaction_reference: result.transaction_reference,
                paid_at: new Date().toISOString()
            }, req.user.full_name);
            console.log('Receipt generated:', fileName);

            // Update payment with receipt path
            await pool.execute(
                'UPDATE payments SET receipt_path = ? WHERE id = ?',
                [`/uploads/receipts/${fileName}`, payment_id]
            );

            // Add receipt to payment history
            await pool.execute(
                'UPDATE payment_history SET receipt_path = ? WHERE payment_id = ? ORDER BY created_at DESC LIMIT 1',
                [`/uploads/receipts/${fileName}`, payment_id]
            );

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'PAYMENT_COMPLETED',
                type: 'payment',
                status: 'success',
                description: `Payment completed: ${payment.payment_id} - TZS ${payment.amount}`,
                entity_type: 'payment',
                entity_id: payment_id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            // Notify admin
            try {
                await notificationService.notifySuperAdmin(
                    'Payment Received',
                    `${req.user.full_name} paid TZS ${payment.amount} for ${payment.document_type || 'document'}`,
                    'payment',
                    'success'
                );
            } catch (e) {
                console.log('Notification skipped:', e.message);
            }

            console.log('=== PAYMENT SUCCESS ===');
            res.json({
                success: true,
                message: 'Payment processed successfully.',
                transaction_reference: result.transaction_reference,
                receipt_url: `/api/citizen/payments/${payment_id}/receipt`
            });
        } catch (error) {
            console.error('Pay Now Error:', error);
            res.status(500).json({ success: false, message: 'Server error processing payment: ' + error.message });
        }
    },

    // ====================================
    // DOWNLOAD RECEIPT
    // ====================================
    downloadReceipt: async (req, res) => {
        try {
            const citizenId = await citizenAppController._getCitizenId(req.user.id);
            if (!citizenId) {
                return res.status(400).json({ success: false, message: 'Citizen profile not found.' });
            }

            const paymentId = req.params.id;
            const [rows] = await pool.execute(
                'SELECT receipt_path FROM payments WHERE id = ? AND citizen_id = ? AND payment_status = ?',
                [paymentId, citizenId, 'paid']
            );

            if (rows.length === 0 || !rows[0].receipt_path) {
                return res.status(404).json({ success: false, message: 'Receipt not found.' });
            }

            const filePath = path.join(__dirname, '..', rows[0].receipt_path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'Receipt file not found.' });
            }

            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'RECEIPT_DOWNLOADED',
                type: 'payment',
                status: 'success',
                description: `Receipt downloaded for payment #${paymentId}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.download(filePath, `Receipt_${paymentId}.pdf`);
        } catch (error) {
            console.error('Download Receipt Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = citizenAppController;
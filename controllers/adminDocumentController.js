const AdminDocument = require('../models/AdminDocument');
const AuditLogModel = require('../models/AuditLogModel');
const docVerifyService = require('../services/documentVerificationService');
const fs = require('fs');
const path = require('path');

const adminDocumentController = {
    // ====================================
    // GET ALL DOCUMENT REQUESTS
    // ====================================
    getDocuments: async (req, res) => {
        try {
            const { page, limit, search, payment_status, request_status, document_type } = req.query;

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                payment_status: payment_status || null,
                request_status: request_status || null,
                document_type: document_type || null
            };

            const result = await AdminDocument.getAll(options);

            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Get Documents Error:', error);
            res.status(500).json({ success: false, message: 'Server error fetching documents.' });
        }
    },

    // ====================================
    // GET DOCUMENT REQUEST BY ID
    // ====================================
    getDocumentById: async (req, res) => {
        try {
            const document = await AdminDocument.getById(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Document request not found.' });
            }

            // Get verification info if exists
            const verification = await docVerifyService.getByDocumentId(document.id);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'DOCUMENT_VIEWED',
                type: 'document',
                status: 'success',
                description: `Document request #${document.id} viewed`,
                entity_type: 'document_request',
                entity_id: document.id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, document, verification: verification || null });
        } catch (error) {
            console.error('Get Document Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UPLOAD DOCUMENT
    // ====================================
    uploadDocument: async (req, res) => {
        try {
            const { request_id } = req.params;

            // Check if request exists
            const document = await AdminDocument.getById(request_id);
            if (!document) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ success: false, message: 'Document request not found.' });
            }

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded.' });
            }

            const fileData = {
                file_path: `/uploads/documents/${req.file.filename}`,
                file_type: req.file.mimetype,
                file_size: req.file.size,
                notes: req.body.notes || null,
                admin_id: req.user.admin_id
            };

            const uploaded = await AdminDocument.uploadDocument(request_id, fileData);
            if (!uploaded) {
                fs.unlinkSync(req.file.path);
                return res.status(500).json({ success: false, message: 'Failed to upload document.' });
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'DOCUMENT_UPLOADED',
                type: 'document',
                status: 'success',
                description: `Document uploaded for request #${request_id} (${document.document_type} - ${document.citizen_name})`,
                entity_type: 'document_request',
                entity_id: request_id,
                new_values: { file_path: fileData.file_path, file_type: fileData.file_type },
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Document uploaded successfully.',
                file_path: fileData.file_path,
                file_type: fileData.file_type
            });
        } catch (error) {
            console.error('Upload Error:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ success: false, message: 'Server error uploading document.' });
        }
    },

    // ====================================
    // SEND DOCUMENT TO CITIZEN (With Verification)
    // ====================================
    sendDocument: async (req, res) => {
        try {
            const { request_id } = req.params;

            const document = await AdminDocument.getById(request_id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Document request not found.' });
            }

            // Check payment
            if (document.payment_status !== 'paid' && document.payment_status !== 'exempted') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment required before sending document.',
                    payment_status: document.payment_status
                });
            }

            // Check document exists
            if (!document.file_path) {
                return res.status(400).json({
                    success: false,
                    message: 'No document uploaded yet. Please upload first.'
                });
            }

            // Check if already sent
            if (document.request_status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Document has already been sent.'
                });
            }

            const sent = await AdminDocument.sendDocument(request_id, req.user.admin_id);
            if (!sent) {
                return res.status(500).json({ success: false, message: 'Failed to send document.' });
            }

            // Generate document verification code and QR
            let verification = null;
            try {
                const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
                const verifyUrl = `${baseUrl}/api/public/verify-document/`;
                verification = await docVerifyService.createVerification(request_id, verifyUrl);
            } catch (vErr) {
                console.error('Verification generation error:', vErr.message);
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'DOCUMENT_SENT',
                type: 'document',
                status: 'success',
                description: `Document sent to citizen: ${document.citizen_name} (${document.document_type})`,
                entity_type: 'document_request',
                entity_id: request_id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Document sent to citizen successfully.',
                document: {
                    id: document.id,
                    citizen_name: document.citizen_name,
                    document_type: document.document_type,
                    file_path: document.file_path,
                    sent_at: new Date().toISOString()
                },
                verification: verification ? {
                    code: verification.code,
                    qr_code_path: verification.qrPath
                } : null
            });
        } catch (error) {
            console.error('Send Document Error:', error);
            res.status(500).json({ success: false, message: 'Server error sending document.' });
        }
    },

    // ====================================
    // PREVIEW DOCUMENT
    // ====================================
    previewDocument: async (req, res) => {
        try {
            const { request_id } = req.params;
            const preview = await AdminDocument.getPreviewUrl(request_id);

            if (!preview || !preview.file_path) {
                return res.status(404).json({
                    success: false,
                    message: 'No document uploaded yet.'
                });
            }

            const filePath = path.join(__dirname, '..', preview.file_path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'Document file not found on server.' });
            }

            const contentTypes = {
                'application/pdf': 'application/pdf',
                'image/jpeg': 'image/jpeg',
                'image/jpg': 'image/jpeg',
                'image/png': 'image/png'
            };

            res.setHeader('Content-Type', contentTypes[preview.file_type] || 'application/octet-stream');
            res.setHeader('Content-Disposition', 'inline');

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } catch (error) {
            console.error('Preview Error:', error);
            res.status(500).json({ success: false, message: 'Server error previewing document.' });
        }
    },

    // ====================================
    // DOWNLOAD DOCUMENT
    // ====================================
    downloadDocument: async (req, res) => {
        try {
            const { request_id } = req.params;
            const document = await AdminDocument.getById(request_id);

            if (!document || !document.file_path) {
                return res.status(404).json({ success: false, message: 'Document not found.' });
            }

            const filePath = path.join(__dirname, '..', document.file_path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'Document file not found.' });
            }

            const fileName = `${document.document_type.replace(/\s+/g, '_')}_${document.citizen_name.replace(/\s+/g, '_')}${path.extname(document.file_path)}`;

            res.download(filePath, fileName);
        } catch (error) {
            console.error('Download Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET DOCUMENT TYPES
    // ====================================
    getDocumentTypes: async (req, res) => {
        try {
            const types = await AdminDocument.getDocumentTypes();
            res.json({ success: true, types });
        } catch (error) {
            console.error('Get Types Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET STATISTICS
    // ====================================
    getStats: async (req, res) => {
        try {
            const stats = await AdminDocument.getStats();
            res.json({ success: true, statistics: stats });
        } catch (error) {
            console.error('Stats Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // CANCEL REQUEST
    // ====================================
    cancelRequest: async (req, res) => {
        try {
            const { request_id } = req.params;
            const document = await AdminDocument.getById(request_id);

            if (!document) {
                return res.status(404).json({ success: false, message: 'Document request not found.' });
            }

            if (document.request_status === 'completed') {
                return res.status(400).json({ success: false, message: 'Cannot cancel a completed request.' });
            }

            await AdminDocument.cancelRequest(request_id, req.user.admin_id);

            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'DOCUMENT_CANCELLED',
                type: 'document',
                status: 'success',
                description: `Document request cancelled: #${request_id}`,
                entity_type: 'document_request',
                entity_id: request_id,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Request cancelled successfully.' });
        } catch (error) {
            console.error('Cancel Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = adminDocumentController;
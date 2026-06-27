const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const docVerifyService = {
    // Generate unique verification code
    generateCode: () => {
        return 'LAMS-' + crypto.randomBytes(12).toString('hex').toUpperCase();
    },

    // Generate QR code image
    generateQR: async (data) => {
        const fileName = `qr_${Date.now()}.png`;
        const dir = path.join(__dirname, '../uploads/qrcodes');
        const filePath = path.join(dir, fileName);
        
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        await QRCode.toFile(filePath, data, {
            width: 200,
            margin: 2,
            color: { dark: '#1a5276', light: '#ffffff' }
        });

        return `/uploads/qrcodes/${fileName}`;
    },

    // Create verification record
    createVerification: async (documentId, verificationUrl) => {
        const code = docVerifyService.generateCode();
        const qrPath = await docVerifyService.generateQR(verificationUrl + code);

        await pool.execute(
            'INSERT INTO document_verifications (document_id, verification_code, qr_code_path) VALUES (?, ?, ?)',
            [documentId, code, qrPath]
        );

        return { code, qrPath };
    },

    // Verify document publicly
    verifyDocument: async (verificationCode) => {
        const [rows] = await pool.execute(
            `SELECT dv.*, dr.citizen_name, dr.document_type, dr.sent_at as issue_date,
                    a.full_name as issued_by, dr.request_status
             FROM document_verifications dv
             JOIN document_requests dr ON dv.document_id = dr.id
             LEFT JOIN admins a ON dr.updated_by = a.id
             WHERE dv.verification_code = ?`,
            [verificationCode]
        );

        if (rows.length === 0) {
            return { valid: false, message: 'Document Not Valid' };
        }

        await pool.execute(
            'UPDATE document_verifications SET verified_count = verified_count + 1, last_verified_at = NOW() WHERE id = ?',
            [rows[0].id]
        );

        return {
            valid: true,
            document: {
                citizen_name: rows[0].citizen_name,
                document_type: rows[0].document_type,
                issue_date: rows[0].issue_date,
                issued_by: rows[0].issued_by || 'Administrator',
                verification_status: 'Valid',
                verified_count: rows[0].verified_count + 1
            }
        };
    },

    // Get verification by document ID
    getByDocumentId: async (documentId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM document_verifications WHERE document_id = ?',
            [documentId]
        );
        return rows[0] || null;
    }
};

module.exports = docVerifyService;
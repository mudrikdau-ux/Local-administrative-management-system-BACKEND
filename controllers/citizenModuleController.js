const CitizenMessage = require('../models/CitizenMessage');
const CitizenAnnouncement = require('../models/CitizenAnnouncement');
const CitizenDocument = require('../models/CitizenDocument');
const AuditLogModel = require('../models/AuditLogModel');
const notificationService = require('../services/notificationService');
const { sendReportEmail } = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');

const citizenModuleController = {
    // ====================================
    // MESSAGES — GET CONVERSATIONS
    // ====================================
    getConversations: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const conversations = await CitizenMessage.getConversations(citizenId);
            res.json({ success: true, conversations });
        } catch (error) {
            console.error('Get Conversations Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MESSAGES — SEARCH CONVERSATIONS
    // ====================================
    searchConversations: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const { query } = req.query;
            if (!query || query.length < 2) return res.status(400).json({ success: false, message: 'Query too short.' });
            const conversations = await CitizenMessage.searchConversations(citizenId, query);
            res.json({ success: true, conversations });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

        // ====================================
    // MESSAGES — GET CONVERSATION MESSAGES
    // ====================================
    getConversationMessages: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            
            const result = await CitizenMessage.getMessages(id, citizenId, page, limit);
            
            // Mark as read
            await CitizenMessage.markAsRead(id, 'citizen');
            
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Get Conversation Messages Error:', error);
            res.status(500).json({ success: false, message: 'Server error: ' + error.message });
        }
    },

    // ====================================
    // MESSAGES — SEND MESSAGE
    // ====================================
    sendMessage: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const { conversation_id, message, message_type } = req.body;

            if (!conversation_id || !message) {
                return res.status(400).json({ success: false, message: 'Conversation ID and message are required.' });
            }

            // Get conversation to determine type
            const [conv] = await pool.execute('SELECT * FROM conversations WHERE id = ? AND citizen_id = ?', [conversation_id, citizenId]);
            if (conv.length === 0) return res.status(404).json({ success: false, message: 'Conversation not found.' });

            const conversation = conv[0];
            let receiverRole = 'admin';
            let receiverId = conversation.admin_id || 0;

            if (conversation.conversation_type === 'support') {
                receiverRole = 'support';
                receiverId = 0;
            }

            const messageId = await CitizenMessage.sendMessage({
                conversation_id,
                sender_id: citizenId,
                receiver_id: receiverId,
                sender_role: 'citizen',
                receiver_role: receiverRole,
                message,
                message_type
            });

            // Emit via Socket.IO
            const io = req.app.get('io');
            if (io) {
                io.emit('receive_message', {
                    id: messageId,
                    conversation_id,
                    sender_id: citizenId,
                    receiver_id: receiverId,
                    sender_role: 'citizen',
                    receiver_role: receiverRole,
                    message,
                    message_type: message_type || 'text',
                    status: 'sent',
                    created_at: new Date().toISOString()
                });
            }

            // Auto-reply for support
            if (conversation.conversation_type === 'support') {
                const autoReply = CitizenMessage.getAutoReply(message);
                setTimeout(async () => {
                    const replyId = await CitizenMessage.sendMessage({
                        conversation_id,
                        sender_id: 0,
                        receiver_id: citizenId,
                        sender_role: 'support',
                        receiver_role: 'citizen',
                        message: autoReply,
                        message_type: 'text'
                    });
                    if (io) {
                        io.emit('receive_message', {
                            id: replyId,
                            conversation_id,
                            sender_id: 0,
                            receiver_id: citizenId,
                            sender_role: 'support',
                            receiver_role: 'citizen',
                            message: autoReply,
                            message_type: 'text',
                            status: 'sent',
                            created_at: new Date().toISOString()
                        });
                    }
                }, 1500);
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'MESSAGE_SENT',
                type: 'message',
                status: 'success',
                description: `Message sent in conversation #${conversation_id}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: 'Message sent.', message_id: messageId });
        } catch (error) {
            console.error('Send Message Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MESSAGES — UNREAD COUNT
    // ====================================
    getUnreadCount: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const count = await CitizenMessage.getUnreadCount(citizenId);
            res.json({ success: true, unread_count: count });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MESSAGES — MARK READ
    // ====================================
    markRead: async (req, res) => {
        try {
            await CitizenMessage.markAsRead(req.params.conversationId, 'citizen');
            res.json({ success: true, message: 'Marked as read.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // ANNOUNCEMENTS — GET ALL
    // ====================================
    getAnnouncements: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const { page, limit, search, category } = req.query;
            const result = await CitizenAnnouncement.getAll(wardId, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search, category
            });
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // ANNOUNCEMENTS — GET BY ID
    // ====================================
    getAnnouncementById: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const announcement = await CitizenAnnouncement.getById(req.params.id, wardId);
            if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
            
            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'ANNOUNCEMENT_VIEWED',
                type: 'announcement',
                status: 'success',
                description: `Announcement viewed: ${announcement.title}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, announcement });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // DOCUMENTS — GET ALL
    // ====================================
    getDocuments: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const { page, limit, search, type } = req.query;
            const result = await CitizenDocument.getAll(citizenId, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search, type
            });
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

        // ====================================
    // DOCUMENTS — DOWNLOAD
    // ====================================
    downloadDocument: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const document = await CitizenDocument.getById(req.params.id, citizenId);
            
            if (!document) {
                return res.status(404).json({ success: false, message: 'Document not found.' });
            }

            if (!document.file_path) {
                return res.status(404).json({ success: false, message: 'No file attached to this document.' });
            }

            const filePath = path.join(__dirname, '..', document.file_path);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'File not found on server.' });
            }

            const ext = path.extname(filePath).toLowerCase();
            const fileName = `${document.document_type.replace(/\s+/g, '_')}_${document.citizen_name.replace(/\s+/g, '_')}${ext}`;

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'DOCUMENT_DOWNLOADED',
                type: 'document',
                status: 'success',
                description: `Document downloaded: ${document.document_type}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, message: 'Error downloading file.' });
                    }
                }
            });

        } catch (error) {
            console.error('Download Error:', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Server error.' });
            }
        }
    },

        // ====================================
    // DOCUMENTS — PRINT (PDF/Image Stream)
    // ====================================
    printDocument: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const document = await CitizenDocument.getById(req.params.id, citizenId);
            
            if (!document) {
                return res.status(404).json({ success: false, message: 'Document not found.' });
            }

            if (!document.file_path) {
                return res.status(404).json({ success: false, message: 'No file attached to this document.' });
            }

            const filePath = path.join(__dirname, '..', document.file_path);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'File not found on server.' });
            }

            // Get file extension and set proper content type
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.pdf': 'application/pdf',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            };
            
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const fileName = `${document.document_type.replace(/\s+/g, '_')}${ext}`;

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'citizen',
                action: 'DOCUMENT_PRINTED',
                type: 'document',
                status: 'success',
                description: `Document printed: ${document.document_type}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            // Set headers for inline viewing
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            res.setHeader('Content-Length', fs.statSync(filePath).size);

            // Stream the file
            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);

            readStream.on('error', (err) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error reading file.' });
                }
            });

        } catch (error) {
            console.error('Print Document Error:', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Server error.' });
            }
        }
    },

    // ====================================
    // DOCUMENTS — SHARE VIA EMAIL
    // ====================================
    shareDocument: async (req, res) => {
        try {
            const citizenId = req.user.citizen_id;
            const { recipient_email } = req.body;

            if (!recipient_email) return res.status(400).json({ success: false, message: 'Recipient email is required.' });

            const document = await CitizenDocument.getById(req.params.id, citizenId);
            if (!document) return res.status(404).json({ success: false, message: 'Document not found.' });

            const filePath = path.join(__dirname, '..', document.file_path);
            if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found.' });

            // Send email with attachment
            try {
                await sendReportEmail(recipient_email, {
                    report_name: document.document_type,
                    report_type: 'document',
                    record_count: 1,
                    file_path: filePath,
                    created_at: new Date().toISOString()
                }, req.user.full_name);
            } catch (e) {
                console.log('Share email error:', e.message);
            }

            // Record share
            await CitizenDocument.recordShare(document.id, citizenId, recipient_email);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email, role: 'citizen', action: 'DOCUMENT_SHARED',
                type: 'document', status: 'success',
                description: `Document shared with ${recipient_email}: ${document.document_type}`,
                performed_by: req.user.id, ip_address: req.ip
            });

            res.json({ success: true, message: 'Document shared successfully.' });
        } catch (error) {
            console.error('Share Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = citizenModuleController;
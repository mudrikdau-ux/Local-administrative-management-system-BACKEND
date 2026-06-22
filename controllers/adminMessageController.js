const AdminMessage = require('../models/AdminMessage');
const AuditLogModel = require('../models/AuditLogModel');

const adminMessageController = {
    // ====================================
    // GET ALL CONVERSATIONS
    // ====================================
    getConversations: async (req, res) => {
        try {
            const adminId = req.user.admin_id || req.user.id;
            const wardId = req.user.ward_id;
            const conversations = await AdminMessage.getConversations(adminId, wardId);

            res.json({
                success: true,
                conversations,
                total: conversations.length
            });
        } catch (error) {
            console.error('Get Conversations Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // SEARCH CONVERSATIONS
    // ====================================
    searchConversations: async (req, res) => {
        try {
            const { query } = req.query;
            const adminId = req.user.admin_id || req.user.id;
            const wardId = req.user.ward_id;

            if (!query || query.trim().length < 2) {
                return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters.' });
            }

            const conversations = await AdminMessage.searchConversations(adminId, wardId, query.trim());

            res.json({
                success: true,
                conversations,
                total: conversations.length,
                query
            });
        } catch (error) {
            console.error('Search Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET CONVERSATION MESSAGES
    // ====================================
    getConversationMessages: async (req, res) => {
        try {
            const { citizenId } = req.params;
            const adminId = req.user.admin_id || req.user.id;
            const { page, limit } = req.query;

            // Get or create conversation
            const conversationId = await AdminMessage.getOrCreateConversation(citizenId, adminId);
            const conversation = await AdminMessage.getConversationByCitizen(citizenId, adminId);

            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Citizen not found.' });
            }

            // Get messages
            const result = await AdminMessage.getMessages(
                conversationId,
                parseInt(page) || 1,
                parseInt(limit) || 50
            );

            // Mark messages as read
            await AdminMessage.markAsRead(conversationId, 'admin');

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'CONVERSATION_OPENED',
                type: 'message',
                status: 'success',
                description: `Conversation opened with ${conversation.citizen_name}`,
                entity_type: 'conversation',
                entity_id: conversationId,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                conversation: {
                    id: conversation.id,
                    citizen_id: conversation.citizen_id,
                    citizen_name: conversation.citizen_name,
                    citizen_photo: conversation.citizen_photo
                },
                ...result
            });
        } catch (error) {
            console.error('Get Messages Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // SEND MESSAGE (REST fallback)
    // ====================================
    sendMessage: async (req, res) => {
        try {
            const { receiver_id, message, message_type } = req.body;
            const senderId = req.user.admin_id || req.user.id;

            if (!receiver_id || !message) {
                return res.status(400).json({ success: false, message: 'Receiver ID and message are required.' });
            }

            const conversationId = await AdminMessage.getOrCreateConversation(receiver_id, senderId);
            const messageId = await AdminMessage.sendMessage({
                conversation_id: conversationId,
                sender_id: senderId,
                receiver_id,
                sender_role: 'admin',
                message,
                message_type: message_type || 'text'
            });

            // Emit via Socket.IO if available
            const io = req.app.get('io');
            if (io) {
                const { activeUsers } = require('../socket/socketHandler');
                const receiverKey = `${receiver_id}_citizen`;
                const receiverSocketId = activeUsers.get(receiverKey);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', {
                        id: messageId,
                        conversation_id: conversationId,
                        sender_id: senderId,
                        receiver_id,
                        sender_role: 'admin',
                        message,
                        message_type: message_type || 'text',
                        status: 'delivered',
                        is_read: false,
                        created_at: new Date().toISOString()
                    });
                }
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'MESSAGE_SENT',
                type: 'message',
                status: 'success',
                description: `Message sent to citizen ID: ${receiver_id}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Message sent successfully.',
                message_id: messageId,
                conversation_id: conversationId
            });
        } catch (error) {
            console.error('Send Message Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // MARK CONVERSATION AS READ
    // ====================================
    markConversationRead: async (req, res) => {
        try {
            const { conversationId } = req.params;
            await AdminMessage.markAsRead(conversationId, 'admin');
            res.json({ success: true, message: 'Messages marked as read.' });
        } catch (error) {
            console.error('Mark Read Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET UNREAD COUNT
    // ====================================
    getUnreadCount: async (req, res) => {
        try {
            const adminId = req.user.admin_id || req.user.id;
            const count = await AdminMessage.getUnreadCount(adminId);
            res.json({ success: true, unread_count: count });
        } catch (error) {
            console.error('Unread Count Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = adminMessageController;
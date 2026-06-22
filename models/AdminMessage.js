const pool = require('../config/db');

const AdminMessage = {
    // ====================================
    // GET ALL CONVERSATIONS FOR ADMIN
    // ====================================
    getConversations: async (adminId, wardId) => {
        const [rows] = await pool.execute(`
            SELECT 
                c.id as conversation_id,
                c.citizen_id,
                ct.full_name as citizen_name,
                ct.email as citizen_email,
                ct.phone as citizen_phone,
                NULL as citizen_photo,
                c.last_message,
                c.last_message_at,
                c.updated_at,
                up.is_online,
                up.last_seen,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role = 'citizen' AND m.is_read = FALSE) as unread_count
            FROM conversations c
            JOIN citizens ct ON c.citizen_id = ct.id
            LEFT JOIN user_presence up ON ct.id = up.user_id AND up.role = 'citizen'
            WHERE c.admin_id = ? AND ct.ward_id = ? AND ct.is_deleted = FALSE
            ORDER BY c.last_message_at DESC
        `, [adminId, wardId]);
        return rows;
    },

    // ====================================
    // SEARCH CONVERSATIONS
    // ====================================
    searchConversations: async (adminId, wardId, query) => {
        const searchQuery = `%${query}%`;
        const [rows] = await pool.execute(`
            SELECT 
                c.id as conversation_id,
                c.citizen_id,
                ct.full_name as citizen_name,
                ct.email as citizen_email,
                ct.phone as citizen_phone,
                NULL as citizen_photo,
                c.last_message,
                c.last_message_at,
                up.is_online,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role = 'citizen' AND m.is_read = FALSE) as unread_count
            FROM conversations c
            JOIN citizens ct ON c.citizen_id = ct.id
            LEFT JOIN user_presence up ON ct.id = up.user_id AND up.role = 'citizen'
            WHERE c.admin_id = ? AND ct.ward_id = ? AND ct.is_deleted = FALSE
              AND (ct.full_name LIKE ? OR ct.email LIKE ?)
            ORDER BY c.last_message_at DESC
        `, [adminId, wardId, searchQuery, searchQuery]);
        return rows;
    },

    // ====================================
    // GET OR CREATE CONVERSATION
    // ====================================
    getOrCreateConversation: async (citizenId, adminId) => {
        let [rows] = await pool.execute(
            'SELECT id FROM conversations WHERE citizen_id = ? AND admin_id = ?',
            [citizenId, adminId]
        );

        if (rows.length === 0) {
            const [result] = await pool.execute(
                'INSERT INTO conversations (citizen_id, admin_id) VALUES (?, ?)',
                [citizenId, adminId]
            );
            return result.insertId;
        }

        return rows[0].id;
    },

        // ====================================
    // GET CONVERSATION MESSAGES (Paginated)
    // ====================================
    getMessages: async (conversationId, page = 1, limit = 50) => {
        const offset = (page - 1) * limit;
        const [rows] = await pool.execute(
            'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
            [conversationId, limit.toString(), offset.toString()]
        );
        const [total] = await pool.execute(
            'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
            [conversationId]
        );
        return {
            messages: rows,
            total: total[0].count,
            page,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },

    // ====================================
    // GET CONVERSATION BY CITIZEN ID
    // ====================================
    getConversationByCitizen: async (citizenId, adminId) => {
        const [rows] = await pool.execute(
            `SELECT c.*, ct.full_name as citizen_name
             FROM conversations c
             JOIN citizens ct ON c.citizen_id = ct.id
             WHERE c.citizen_id = ? AND c.admin_id = ?`,
            [citizenId, adminId]
        );
        return rows[0];
    },

    // ====================================
    // SEND MESSAGE
    // ====================================
    sendMessage: async (data) => {
        const { conversation_id, sender_id, receiver_id, sender_role, message, message_type } = data;
        const [result] = await pool.execute(
            `INSERT INTO messages (conversation_id, sender_id, receiver_id, sender_role, message, message_type, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
            [conversation_id, sender_id, receiver_id, sender_role, message, message_type || 'text']
        );

        await pool.execute(
            'UPDATE conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?',
            [message, conversation_id]
        );

        return result.insertId;
    },

    // ====================================
    // MARK MESSAGES AS READ
    // ====================================
    markAsRead: async (conversationId, readerRole) => {
        const oppositeRole = readerRole === 'admin' ? 'citizen' : 'admin';
        await pool.execute(
            `UPDATE messages SET is_read = TRUE, status = 'read', read_at = NOW() 
             WHERE conversation_id = ? AND sender_role = ? AND is_read = FALSE`,
            [conversationId, oppositeRole]
        );
    },

    // ====================================
    // GET UNREAD COUNT FOR ADMIN
    // ====================================
    getUnreadCount: async (adminId) => {
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as count FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.admin_id = ? AND m.sender_role = 'citizen' AND m.is_read = FALSE
        `, [adminId]);
        return rows[0].count;
    },

    // ====================================
    // UPDATE MESSAGE STATUS
    // ====================================
    updateMessageStatus: async (messageId, status) => {
        await pool.execute(
            'UPDATE messages SET status = ? WHERE id = ?',
            [status, messageId]
        );
    },

    // ====================================
    // USER PRESENCE
    // ====================================
    updatePresence: async (userId, role, isOnline, socketId = null) => {
        await pool.execute(
            `INSERT INTO user_presence (user_id, role, is_online, socket_id, last_seen) 
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE is_online = ?, socket_id = COALESCE(?, socket_id), last_seen = NOW()`,
            [userId, role, isOnline, socketId, isOnline, socketId]
        );
    },

    getPresence: async (userId, role) => {
        const [rows] = await pool.execute(
            'SELECT * FROM user_presence WHERE user_id = ? AND role = ?',
            [userId, role]
        );
        return rows[0];
    },

    // ====================================
    // GET CITIZEN INFO
    // ====================================
    getCitizenInfo: async (citizenId) => {
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, phone, ward_id FROM citizens WHERE id = ? AND is_deleted = FALSE',
            [citizenId]
        );
        return rows[0];
    }
};

module.exports = AdminMessage;
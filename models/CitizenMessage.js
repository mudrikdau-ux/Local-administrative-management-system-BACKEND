const pool = require('../config/db');

const CitizenMessage = {
    // ====================================
    // GET/ CREATE CONVERSATIONS
    // ====================================
    getOrCreateConversation: async (citizenId, adminId, type = 'admin') => {
        if (type === 'admin') {
            let [rows] = await pool.execute(
                'SELECT id FROM conversations WHERE citizen_id = ? AND admin_id = ? AND conversation_type = ?',
                [citizenId, adminId, 'admin']
            );
            if (rows.length === 0) {
                const [result] = await pool.execute(
                    'INSERT INTO conversations (citizen_id, admin_id, conversation_type) VALUES (?, ?, ?)',
                    [citizenId, adminId, 'admin']
                );
                return result.insertId;
            }
            return rows[0].id;
        } else {
            // Support conversation
            let [rows] = await pool.execute(
                "SELECT id FROM conversations WHERE citizen_id = ? AND conversation_type = 'support'",
                [citizenId]
            );
            if (rows.length === 0) {
                const [result] = await pool.execute(
                    "INSERT INTO conversations (citizen_id, conversation_type) VALUES (?, 'support')",
                    [citizenId]
                );
                return result.insertId;
            }
            return rows[0].id;
        }
    },

    // ====================================
    // GET ALL CONVERSATIONS FOR CITIZEN
    // ====================================
    getConversations: async (citizenId) => {
        // Get admin conversation
        const [adminConvo] = await pool.execute(`
            SELECT c.id, c.conversation_type, c.last_message, c.last_message_at,
                   a.full_name as participant_name, 'admin' as participant_role,
                   a.profile_photo as participant_photo,
                   up.is_online,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role = 'admin' AND m.is_read = FALSE) as unread_count
            FROM conversations c
            LEFT JOIN admins a ON c.admin_id = a.id
            LEFT JOIN user_presence up ON a.user_id = up.user_id AND up.role = 'admin'
            WHERE c.citizen_id = ? AND c.conversation_type = 'admin'
        `, [citizenId]);

        // Get/create support conversation
        const supportConvoId = await CitizenMessage.getOrCreateConversation(citizenId, null, 'support');
        const [supportConvo] = await pool.execute(`
            SELECT c.id, c.conversation_type, c.last_message, c.last_message_at,
                   'Support Assistant' as participant_name, 'support' as participant_role,
                   NULL as participant_photo,
                   TRUE as is_online,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_role = 'support' AND m.is_read = FALSE) as unread_count
            FROM conversations c
            WHERE c.id = ?
        `, [supportConvoId]);

        return [...adminConvo, ...supportConvo];
    },

    // ====================================
    // SEARCH CONVERSATIONS
    // ====================================
    searchConversations: async (citizenId, query) => {
        const searchQuery = `%${query}%`;
        const [rows] = await pool.execute(`
            SELECT c.id, c.conversation_type, c.last_message, c.last_message_at,
                   COALESCE(a.full_name, 'Support Assistant') as participant_name,
                   COALESCE('admin', 'support') as participant_role
            FROM conversations c
            LEFT JOIN admins a ON c.admin_id = a.id
            WHERE c.citizen_id = ? AND (a.full_name LIKE ? OR c.conversation_type LIKE ?)
        `, [citizenId, searchQuery, searchQuery]);
        return rows;
    },

         // ====================================
    // GET MESSAGES IN CONVERSATION
    // ====================================
    getMessages: async (conversationId, citizenId, page = 1, limit = 50) => {
        const offset = (page - 1) * limit;
        
        // First verify the conversation belongs to this citizen
        const [convCheck] = await pool.execute(
            'SELECT id FROM conversations WHERE id = ? AND citizen_id = ?',
            [conversationId, citizenId]
        );
        
        if (convCheck.length === 0) {
            return { messages: [], total: 0, page, limit, total_pages: 0 };
        }

        // Use query() instead of execute() for LIMIT/OFFSET with integers
        const [rows] = await pool.query(
            `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
            [conversationId]
        );
        
        const [total] = await pool.execute(
            'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
            [conversationId]
        );
        
        return { 
            messages: rows, 
            total: total[0].count,
            page,
            limit,
            total_pages: Math.ceil(total[0].count / limit)
        };
    },

        // ====================================
    // SEND MESSAGE
    // ====================================
    sendMessage: async (data) => {
        const { conversation_id, sender_id, receiver_id, sender_role, receiver_role, message, message_type } = data;
        
        // Check if receiver_role column exists, if not use INSERT without it
        try {
            const [result] = await pool.execute(
                `INSERT INTO messages (conversation_id, sender_id, receiver_id, sender_role, receiver_role, message, message_type, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')`,
                [conversation_id, sender_id, receiver_id || 0, sender_role, receiver_role || 'admin', message, message_type || 'text']
            );
            await pool.execute(
                'UPDATE conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?',
                [message, conversation_id]
            );
            return result.insertId;
        } catch (err) {
            // Fallback: insert without receiver_role if column doesn't exist
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                const [result] = await pool.execute(
                    `INSERT INTO messages (conversation_id, sender_id, receiver_id, sender_role, message, message_type, status) 
                     VALUES (?, ?, ?, ?, ?, ?, 'sent')`,
                    [conversation_id, sender_id, receiver_id || 0, sender_role, message, message_type || 'text']
                );
                await pool.execute(
                    'UPDATE conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?',
                    [message, conversation_id]
                );
                return result.insertId;
            }
            throw err;
        }
    },
    
    // ====================================
    // MARK MESSAGES AS READ
    // ====================================
    markAsRead: async (conversationId, readerRole) => {
        const oppositeRole = readerRole === 'citizen' ? 'admin' : 'citizen';
        await pool.execute(
            `UPDATE messages SET is_read = TRUE, status = 'read', read_at = NOW() 
             WHERE conversation_id = ? AND sender_role = ? AND is_read = FALSE`,
            [conversationId, oppositeRole]
        );
    },

    // ====================================
    // GET UNREAD COUNT
    // ====================================
    getUnreadCount: async (citizenId) => {
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as count FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.citizen_id = ? AND m.sender_role != 'citizen' AND m.is_read = FALSE
        `, [citizenId]);
        return rows[0].count;
    },

    // ====================================
    // SUPPORT AUTO-REPLY
    // ====================================
    getAutoReply: (message) => {
        const msg = message.toLowerCase().trim();
        
        if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
            return 'Hello! Thank you for contacting LAMS Support. How may we assist you today?';
        }
        if (msg.includes('how are you')) {
            return 'Our support team is available 24/7 to help you with system-related questions. How can we help?';
        }
        if (msg.includes('help') || msg.includes('assist')) {
            return 'I am here to help! You can ask about:\n- Document applications\n- Payment issues\n- Account problems\n- System navigation\n\nWhat do you need help with?';
        }
        if (msg.includes('document') || msg.includes('application')) {
            return 'For document-related queries, you can check your application status in "My Applications". If you need further help, please provide your application ID.';
        }
        if (msg.includes('payment') || msg.includes('pay')) {
            return 'You can view and make payments in the "My Payments" section. If a payment is failing, ensure you have the correct payment ID and try again.';
        }
        if (msg.includes('thank')) {
            return 'You are welcome! Is there anything else we can help you with?';
        }
        if (msg.includes('bye') || msg.includes('goodbye')) {
            return 'Goodbye! Feel free to reach out anytime you need assistance. Have a great day!';
        }
        
        return 'Thank you for your message. Our support team will review your inquiry. For urgent matters, please visit your ward administration office.';
    }
};

module.exports = CitizenMessage;
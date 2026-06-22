const jwt = require('jsonwebtoken');
const AdminMessage = require('../models/AdminMessage');
require('dotenv').config();

// Store active socket connections
const activeUsers = new Map(); // userId_role → socketId
const socketToUser = new Map(); // socketId → {userId, role}

const setupSocket = (io) => {
    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            socket.wardId = decoded.ward_id;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.userId;
        const role = socket.userRole;
        const userKey = `${userId}_${role}`;

        console.log(`User connected: ${userKey} (Socket: ${socket.id})`);

        // Store socket mapping
        activeUsers.set(userKey, socket.id);
        socketToUser.set(socket.id, { userId, role });

        // Update presence to online
        await AdminMessage.updatePresence(userId, role, true, socket.id);

        // Broadcast online status
        socket.broadcast.emit('user_online', { user_id: userId, role });

        // ====================================
        // JOIN ROOM (For direct messaging)
        // ====================================
        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`${userKey} joined room: ${room}`);
        });

        // ====================================
        // SEND MESSAGE
        // ====================================
        socket.on('send_message', async (data) => {
            try {
                const { receiver_id, message, message_type } = data;
                const senderRole = role;
                const receiverRole = senderRole === 'admin' ? 'citizen' : 'admin';

                // Get or create conversation
                let adminId, citizenId;
                if (senderRole === 'admin') {
                    adminId = userId;
                    citizenId = receiver_id;
                } else {
                    adminId = receiver_id;
                    citizenId = userId;
                }

                const conversationId = await AdminMessage.getOrCreateConversation(citizenId, adminId);

                // Save message
                const messageId = await AdminMessage.sendMessage({
                    conversation_id: conversationId,
                    sender_id: userId,
                    receiver_id,
                    sender_role: senderRole,
                    message,
                    message_type: message_type || 'text'
                });

                // Prepare message data
                const messageData = {
                    id: messageId,
                    conversation_id: conversationId,
                    sender_id: userId,
                    receiver_id,
                    sender_role: senderRole,
                    message,
                    message_type: message_type || 'text',
                    status: 'sent',
                    is_read: false,
                    created_at: new Date().toISOString()
                };

                // Send to receiver if online
                const receiverKey = `${receiver_id}_${receiverRole}`;
                const receiverSocketId = activeUsers.get(receiverKey);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', messageData);
                    // Update status to delivered
                    await AdminMessage.updateMessageStatus(messageId, 'delivered');
                    messageData.status = 'delivered';
                }

                // Confirm to sender
                socket.emit('message_sent', messageData);

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });

        // ====================================
        // MESSAGE READ RECEIPT
        // ====================================
        socket.on('mark_read', async (data) => {
            try {
                const { conversation_id } = data;
                await AdminMessage.markAsRead(conversation_id, role);

                // Notify sender that messages were read
                socket.broadcast.emit('message_read', {
                    conversation_id,
                    read_by: userId,
                    read_by_role: role
                });
            } catch (error) {
                console.error('Mark read error:', error);
            }
        });

        // ====================================
        // TYPING INDICATOR
        // ====================================
        socket.on('typing', (data) => {
            const { conversation_id, receiver_id } = data;
            const receiverRole = role === 'admin' ? 'citizen' : 'admin';
            const receiverKey = `${receiver_id}_${receiverRole}`;
            const receiverSocketId = activeUsers.get(receiverKey);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_indicator', {
                    conversation_id,
                    user_id: userId,
                    role,
                    is_typing: true
                });
            }
        });

        socket.on('stop_typing', (data) => {
            const { conversation_id, receiver_id } = data;
            const receiverRole = role === 'admin' ? 'citizen' : 'admin';
            const receiverKey = `${receiver_id}_${receiverRole}`;
            const receiverSocketId = activeUsers.get(receiverKey);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_indicator', {
                    conversation_id,
                    user_id: userId,
                    role,
                    is_typing: false
                });
            }
        });

        // ====================================
        // DISCONNECT
        // ====================================
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${userKey}`);

            // Update presence to offline
            await AdminMessage.updatePresence(userId, role, false, null);

            // Broadcast offline status
            socket.broadcast.emit('user_offline', { user_id: userId, role });

            // Clean up mappings
            activeUsers.delete(userKey);
            socketToUser.delete(socket.id);
        });
    });
};

module.exports = { setupSocket, activeUsers };
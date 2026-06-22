const express = require('express');
const router = express.Router();
const adminMessageController = require('../controllers/adminMessageController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');

// All routes require admin authentication
router.use(verifyAdminToken);

// Conversations
router.get('/conversations', adminMessageController.getConversations);
router.get('/search', adminMessageController.searchConversations);
router.get('/unread-count', adminMessageController.getUnreadCount);

// Messages
router.get('/conversation/:citizenId', adminMessageController.getConversationMessages);
router.post('/send', adminMessageController.sendMessage);
router.patch('/read/:conversationId', adminMessageController.markConversationRead);

module.exports = router;
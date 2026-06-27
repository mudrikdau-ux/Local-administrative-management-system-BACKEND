const express = require('express');
const router = express.Router();
const citizenModuleController = require('../controllers/citizenModuleController');
const { verifyCitizenToken } = require('../middleware/citizenAuthMiddleware');

router.use(verifyCitizenToken);

// Messages
router.get('/messages/conversations', citizenModuleController.getConversations);
router.get('/messages/search', citizenModuleController.searchConversations);
router.get('/messages/unread-count', citizenModuleController.getUnreadCount);
router.get('/messages/conversation/:id', citizenModuleController.getConversationMessages);
router.post('/messages/send', citizenModuleController.sendMessage);
router.patch('/messages/read/:conversationId', citizenModuleController.markRead);

// Announcements
router.get('/announcements', citizenModuleController.getAnnouncements);
router.get('/announcements/:id', citizenModuleController.getAnnouncementById);

// Documents
router.get('/documents', citizenModuleController.getDocuments);
router.get('/documents/:id/download', citizenModuleController.downloadDocument);
router.get('/documents/:id/print', citizenModuleController.printDocument);
router.post('/documents/:id/share', citizenModuleController.shareDocument);

module.exports = router;
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/stream', notificationController.streamNotifications);
router.get('/unread', notificationController.getUnread);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/', notificationController.getNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAll);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

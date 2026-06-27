const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// SSE Stream (Real-time)
router.get('/stream', notificationController.streamNotifications);

// Get notifications (paginated, optional type filter)
router.get('/', notificationController.getNotifications);

// Get unread notifications
router.get('/unread', notificationController.getUnread);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark single as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete single notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear-all', notificationController.clearAll);

module.exports = router;
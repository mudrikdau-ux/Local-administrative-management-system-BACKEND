const express = require('express');
const router = express.Router();
const citizenDashboardController = require('../controllers/citizenDashboardController');
const { verifyCitizenToken } = require('../middleware/citizenAuthMiddleware');

router.use(verifyCitizenToken);

// Full Dashboard (All data in one call)
router.get('/', citizenDashboardController.getFullDashboard);

// Individual Endpoints
router.get('/welcome', citizenDashboardController.getWelcome);
router.get('/current-time', citizenDashboardController.getCurrentTime);
router.get('/summary', citizenDashboardController.getSummary);
router.get('/quick-actions', citizenDashboardController.getQuickActions);
router.get('/recent-activities', citizenDashboardController.getRecentActivities);

// Notifications
router.get('/notifications', citizenDashboardController.getNotifications);
router.patch('/notifications/:id/read', citizenDashboardController.markNotificationRead);
router.patch('/notifications/read-all', citizenDashboardController.markAllNotificationsRead);

// Unread Messages
router.get('/unread-messages', citizenDashboardController.getUnreadMessages);

module.exports = router;
const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');

// All routes require admin authentication
router.use(verifyAdminToken);

// Full Dashboard (All in one)
router.get('/', adminDashboardController.getFullDashboard);

// Individual Endpoints
router.get('/welcome', adminDashboardController.getWelcome);
router.get('/overview', adminDashboardController.getOverview);
router.get('/recent-activities', adminDashboardController.getRecentActivities);
router.get('/quick-actions', adminDashboardController.getQuickActions);

// Notifications
router.get('/notifications', adminDashboardController.getNotifications);
router.get('/notifications/unread-count', adminDashboardController.getUnreadNotificationCount);
router.patch('/notifications/:id/read', adminDashboardController.markNotificationRead);
router.patch('/notifications/read-all', adminDashboardController.markAllNotificationsRead);

// Messages
router.get('/messages/unread-count', adminDashboardController.getUnreadMessagesCount);

// Global Search
router.get('/search', adminDashboardController.globalSearch);

module.exports = router;
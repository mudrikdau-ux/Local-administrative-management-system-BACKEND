const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.getFullDashboard);
router.get('/statistics', dashboardController.getStatistics);
router.get('/leadership', dashboardController.getLeadership);
router.get('/activities', dashboardController.getActivities);
router.get('/notifications', dashboardController.getNotifications);
router.get('/charts', dashboardController.getChartData);
router.get('/system-status', dashboardController.getSystemStatus);

module.exports = router;
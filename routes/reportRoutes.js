const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Dashboard Statistics
router.get('/statistics', reportController.getDashboardStats);

// Generate Reports
router.post('/citizens', reportController.generateCitizenReport);
router.post('/admins', reportController.generateAdminReport);
router.post('/audit', reportController.generateAuditReport);
router.post('/full-system', reportController.generateFullSystemReport);

// Download & View
router.get('/download/:fileName', reportController.downloadReport);
router.get('/view/:fileName', reportController.viewReport);

// History
router.get('/history', reportController.getReportHistory);
router.delete('/history/:id', reportController.deleteReport);

module.exports = router;
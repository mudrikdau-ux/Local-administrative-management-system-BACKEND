const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReportController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');

router.use(verifyAdminToken);

// Dashboard & Charts
router.get('/dashboard-summary', adminReportController.getDashboardSummary);
router.get('/citizens-chart', adminReportController.getCitizensChart);
router.get('/payments-chart', adminReportController.getPaymentsChart);
router.get('/documents-chart', adminReportController.getDocumentsChart);

// Report Generation & Management
router.post('/generate', adminReportController.generateReport);
router.get('/download/:reportId', adminReportController.downloadReport);
router.post('/share', adminReportController.shareReport);
router.get('/history', adminReportController.getReportHistory);

module.exports = router;
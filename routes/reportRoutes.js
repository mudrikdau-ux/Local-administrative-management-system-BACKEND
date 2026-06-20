const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/statistics', reportController.getDashboardStats);
router.post('/citizens', reportController.generateCitizenReport);
router.post('/admins', reportController.generateAdminReport);
router.post('/audit', reportController.generateAuditReport);
router.post('/full-system', reportController.generateFullSystemReport);
router.get('/download/:fileName', reportController.downloadReport);
router.get('/view/:fileName', reportController.viewReport);
router.get('/history', reportController.getReportHistory);
router.delete('/history/:id', reportController.deleteReport);

module.exports = router;

const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

// Dashboard Statistics
router.get('/statistics', auditLogController.getStatistics);

// Search & Filter (Must be before /:id)
router.get('/search', auditLogController.searchLogs);
router.get('/filter', auditLogController.filterLogs);

// Export
router.get('/export/csv', auditLogController.exportCSV);
router.get('/export/pdf', auditLogController.exportPDF);

// Get All (Paginated)
router.get('/', auditLogController.getLogs);

// Get By ID
router.get('/:id', auditLogController.getLogById);

// Record Log (Internal use)
router.post('/record', auditLogController.recordLog);

module.exports = router;
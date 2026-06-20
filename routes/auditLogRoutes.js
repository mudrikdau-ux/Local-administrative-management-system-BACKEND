const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

router.get('/statistics', auditLogController.getStatistics);
router.get('/search', auditLogController.searchLogs);
router.get('/filter', auditLogController.filterLogs);
router.get('/export/csv', auditLogController.exportCSV);
router.get('/export/pdf', auditLogController.exportPDF);
router.get('/', auditLogController.getLogs);
router.get('/:id', auditLogController.getLogById);
router.post('/record', auditLogController.recordLog);

module.exports = router;

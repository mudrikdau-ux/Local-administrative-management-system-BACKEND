const express = require('express');
const router = express.Router();
const adminDocumentController = require('../controllers/adminDocumentController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');
const documentUpload = require('../middleware/documentUploadMiddleware');

// All routes require admin authentication
router.use(verifyAdminToken);

// Document Types & Statistics
router.get('/types', adminDocumentController.getDocumentTypes);
router.get('/stats', adminDocumentController.getStats);

// CRUD & Workflow
router.get('/', adminDocumentController.getDocuments);
router.get('/:id', adminDocumentController.getDocumentById);

// Upload Document
router.post('/upload/:request_id', documentUpload.single('document'), adminDocumentController.uploadDocument);

// Preview & Download
router.get('/preview/:request_id', adminDocumentController.previewDocument);
router.get('/download/:request_id', adminDocumentController.downloadDocument);

// Send & Cancel
router.post('/send/:request_id', adminDocumentController.sendDocument);
router.put('/cancel/:request_id', adminDocumentController.cancelRequest);

module.exports = router;
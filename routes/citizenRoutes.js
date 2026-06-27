const express = require('express');
const router = express.Router();
const citizenAppController = require('../controllers/citizenAppController');
const { verifyCitizenToken } = require('../middleware/citizenAuthMiddleware');

// All routes require citizen authentication
router.use(verifyCitizenToken);

// ====================================
// APPLICATIONS
// ====================================
router.post('/applications', citizenAppController.submitApplication);
router.get('/applications', citizenAppController.getApplications);
router.get('/applications/:id', citizenAppController.getApplicationById);
router.get('/applications/:id/download', citizenAppController.downloadDocument);

// ====================================
// PAYMENTS
// ====================================
router.get('/payments/summary', citizenAppController.getPaymentSummary);
router.get('/payments/history', citizenAppController.getPaymentHistory);
router.get('/payments', citizenAppController.getPayments);
router.post('/payments/pay', citizenAppController.payNow);
router.get('/payments/:id/receipt', citizenAppController.downloadReceipt);

module.exports = router;
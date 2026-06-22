const express = require('express');
const router = express.Router();
const adminPaymentController = require('../controllers/adminPaymentController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');

// All routes require admin authentication
router.use(verifyAdminToken);

// Dashboard Summary
router.get('/summary', adminPaymentController.getSummary);
router.get('/statistics', adminPaymentController.getStatistics);

// CRUD
router.get('/', adminPaymentController.getPayments);
router.post('/', adminPaymentController.createPayment);

// Citizen Payments (must be before /:id)
router.get('/citizen/:citizen_id', adminPaymentController.getPaymentsByCitizen);

// Single payment (must be last)
router.get('/:id', adminPaymentController.getPaymentById);
router.put('/:id/status', adminPaymentController.updatePaymentStatus);

module.exports = router;
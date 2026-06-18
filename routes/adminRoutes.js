const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/uploadMiddleware');

// ====================================
// WARDS
// ====================================
router.get('/wards', adminController.getWards);
router.post('/wards', adminController.addWard);
router.delete('/wards/:id', adminController.deleteWard);

// ====================================
// POSITIONS
// ====================================
router.get('/positions', adminController.getPositions);
router.post('/positions', adminController.addPosition);
router.delete('/positions/:id', adminController.deletePosition);

// ====================================
// ADMINS CRUD
// ====================================
router.get('/', adminController.getAllAdmins);
router.get('/search', adminController.searchAdmins);
router.get('/filter', adminController.filterAdmins);
router.get('/:id', adminController.getAdminById);
router.post('/', upload.single('profile_photo'), adminController.createAdmin);
router.put('/:id', upload.single('profile_photo'), adminController.updateAdmin);
router.put('/:id/suspend', adminController.suspendAdmin);
router.put('/:id/activate', adminController.activateAdmin);
router.put('/:id/reset-password', adminController.resetPassword);
router.delete('/:id', adminController.deleteAdmin);

// ====================================
// LEADERSHIP
// ====================================
router.post('/transfer', adminController.transferLeader);
router.get('/transfer/history', adminController.getAllTransfers);
router.get('/:id/transfers', adminController.getTransferHistory);
router.put('/:id/extend-term', adminController.extendTerm);
router.put('/:id/end-term', adminController.endTerm);

// ====================================
// AUDIT LOGS
// ====================================
router.get('/logs/all', adminController.getAuditLogs);

module.exports = router;
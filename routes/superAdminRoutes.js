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
router.get('/users', adminController.getAllAdmins);
router.get('/users/search', adminController.searchAdmins);
router.get('/users/filter', adminController.filterAdmins);
router.get('/users/:id', adminController.getAdminById);
router.post('/admins', upload.single('profile_photo'), adminController.createAdmin);
router.put('/users/:id', upload.single('profile_photo'), adminController.updateAdmin);
router.put('/users/:id/suspend', adminController.suspendAdmin);
router.put('/users/:id/activate', adminController.activateAdmin);
router.put('/users/:id/reset-password', adminController.resetPassword);
router.delete('/users/:id', adminController.deleteAdmin);

// ====================================
// LEADERSHIP
// ====================================
router.post('/transfer', adminController.transferLeader);
router.get('/transfer/history', adminController.getAllTransfers);
router.get('/users/:id/transfers', adminController.getTransferHistory);
router.put('/users/:id/extend-term', adminController.extendTerm);
router.put('/users/:id/end-term', adminController.endTerm);

// ====================================
// AUDIT LOGS
// ====================================
router.get('/logs', adminController.getAuditLogs);

// ====================================
// STATS
// ====================================
router.get('/stats', async (req, res) => {
    try {
        const pool = require('../config/db');
        const [adminCount] = await pool.execute('SELECT COUNT(*) as total FROM admins');
        const [activeCount] = await pool.execute("SELECT COUNT(*) as total FROM admins WHERE status = 'active'");
        const [suspendedCount] = await pool.execute("SELECT COUNT(*) as total FROM admins WHERE status = 'suspended'");
        res.json({
            total_admins: adminCount[0].total,
            active: activeCount[0].total,
            suspended: suspendedCount[0].total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
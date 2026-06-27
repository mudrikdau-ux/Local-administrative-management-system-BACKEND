const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(verifyToken, authorize('super_admin'));

router.get('/', backupController.getBackups);
router.post('/create', backupController.createBackup);
router.get('/download/:id', backupController.downloadBackup);

module.exports = router;
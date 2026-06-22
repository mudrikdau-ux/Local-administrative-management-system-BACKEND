const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettingsController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');

// All routes require admin authentication
router.use(verifyAdminToken);

// View & Update All Settings
router.get('/', adminSettingsController.getSettings);
router.put('/', adminSettingsController.updateSettings);

// Individual Updates
router.put('/language', adminSettingsController.updateLanguage);
router.put('/theme', adminSettingsController.updateTheme);
router.put('/notifications', adminSettingsController.updateNotifications);

module.exports = router;
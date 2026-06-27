const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const upload = require('../middleware/uploadMiddleware');

// Get current settings
router.get('/', settingsController.getSettings);

// Update general settings
router.put('/', upload.single('logo'), settingsController.updateSettings);

// Update theme only
router.put('/theme', settingsController.updateTheme);

// Update language only
router.put('/language', settingsController.updateLanguage);

// Update notification settings
router.put('/notifications', settingsController.updateNotifications);

module.exports = router;
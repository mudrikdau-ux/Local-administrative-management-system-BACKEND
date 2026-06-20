const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', settingsController.getSettings);
router.put('/', upload.single('logo'), settingsController.updateSettings);
router.put('/theme', settingsController.updateTheme);
router.put('/language', settingsController.updateLanguage);
router.put('/notifications', settingsController.updateNotifications);

module.exports = router;

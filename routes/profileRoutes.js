const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const profileUpload = require('../middleware/profileUploadMiddleware');

// Get Profile
router.get('/', profileController.getProfile);

// Update Profile (Name, Email, Phone)
router.put('/', profileController.updateProfile);

// Update Profile Image
router.put('/image', profileUpload.single('profile_photo'), profileController.updateProfileImage);

// Remove Profile Image
router.delete('/image', profileController.removeProfileImage);

// Change Password
router.put('/password', profileController.changePassword);

module.exports = router;
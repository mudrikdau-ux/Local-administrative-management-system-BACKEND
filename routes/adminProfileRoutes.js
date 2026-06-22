const express = require('express');
const router = express.Router();
const adminProfileController = require('../controllers/adminProfileController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');
const profileUpload = require('../middleware/profileUploadMiddleware');

// All routes require admin authentication
router.use(verifyAdminToken);

// View & Update Profile
router.get('/', adminProfileController.getProfile);
router.put('/', adminProfileController.updateProfile);

// Profile Photo
router.put('/photo', profileUpload.single('profile_photo'), adminProfileController.updateProfilePhoto);
router.delete('/photo', adminProfileController.removeProfilePhoto);

// Change Password
router.put('/change-password', adminProfileController.changePassword);

module.exports = router;
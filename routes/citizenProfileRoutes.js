const express = require('express');
const router = express.Router();
const citizenProfileController = require('../controllers/citizenProfileController');
const { verifyCitizenToken } = require('../middleware/citizenAuthMiddleware');
const profileUpload = require('../middleware/profileUploadMiddleware');

router.use(verifyCitizenToken);

// Profile
router.get('/profile', citizenProfileController.getProfile);
router.put('/profile', citizenProfileController.updateProfile);
router.put('/profile/photo', profileUpload.single('profile_photo'), citizenProfileController.updatePhoto);
router.put('/profile/change-password', citizenProfileController.changePassword);

// Support
router.post('/support/contact-admin', citizenProfileController.contactAdmin);
router.get('/support/faqs', citizenProfileController.getFAQs);
router.post('/support/report-issue', citizenProfileController.reportIssue);
router.get('/support/guides', citizenProfileController.getGuides);

module.exports = router;
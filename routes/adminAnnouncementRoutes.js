const express = require('express');
const router = express.Router();
const adminAnnouncementController = require('../controllers/adminAnnouncementController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');
const announcementUpload = require('../middleware/announcementUploadMiddleware');

router.use(verifyAdminToken);

// Debug middleware
router.use((req, res, next) => {
    console.log('Announcement Route Hit:', req.method, req.path, req.params);
    next();
});

router.get('/stats', adminAnnouncementController.getStats);
router.patch('/:id/publish', adminAnnouncementController.publishAnnouncement);
router.patch('/:id/unpublish', adminAnnouncementController.unpublishAnnouncement);
router.get('/', adminAnnouncementController.getAnnouncements);
router.post('/', announcementUpload.single('image'), adminAnnouncementController.createAnnouncement);
router.get('/:id', adminAnnouncementController.getAnnouncementById);
router.put('/:id', announcementUpload.single('image'), adminAnnouncementController.updateAnnouncement);
router.delete('/:id', adminAnnouncementController.deleteAnnouncement);

module.exports = router;
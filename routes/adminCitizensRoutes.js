const express = require('express');
const router = express.Router();
const adminCitizenController = require('../controllers/adminCitizenController');
const { verifyAdminToken } = require('../middleware/adminAuthMiddleware');

// All routes require admin authentication
router.use(verifyAdminToken);

// Statistics
router.get('/stats', adminCitizenController.getWardStats);

// CRUD
router.post('/', adminCitizenController.createCitizen);
router.get('/', adminCitizenController.getCitizens);
router.get('/:id', adminCitizenController.getCitizenById);
router.put('/:id', adminCitizenController.updateCitizen);
router.delete('/:id', adminCitizenController.deleteCitizen);

module.exports = router;
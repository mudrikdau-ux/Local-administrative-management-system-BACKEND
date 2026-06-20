const express = require('express');
const router = express.Router();
const citizenMonitoringController = require('../controllers/citizenMonitoringController');

router.get('/dashboard', citizenMonitoringController.getDashboardData);
router.get('/statistics', citizenMonitoringController.getOverallStatistics);
router.get('/wards/statistics', citizenMonitoringController.getWardStatistics);
router.get('/search', citizenMonitoringController.searchCitizens);
router.get('/filter', citizenMonitoringController.filterCitizens);
router.get('/wards/:ward_id', citizenMonitoringController.getCitizensByWard);
router.get('/', citizenMonitoringController.getAllCitizens);
router.get('/:id', citizenMonitoringController.getCitizenById);

module.exports = router;

const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');

router.get('/dashboard', securityController.getDashboard);
router.get('/statistics', securityController.getStatistics);
router.get('/logins', securityController.getLoginActivity);
router.get('/logins/:id', securityController.getLoginDetail);
router.get('/search-account', securityController.searchAccount);
router.put('/lock-account', securityController.lockAccount);
router.put('/unlock-account', securityController.unlockAccount);
router.get('/alerts', securityController.getAlerts);
router.put('/alerts/:id/read', securityController.markAlertRead);
router.post('/force-logout', securityController.forceLogoutUser);

module.exports = router;

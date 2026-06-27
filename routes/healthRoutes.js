const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', verifyToken, authorize('super_admin'), healthController.getHealth);

module.exports = router;
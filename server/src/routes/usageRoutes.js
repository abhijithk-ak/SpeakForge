const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const usageController = require('../controllers/usageController');

router.get('/', authMiddleware, usageController.getUsage);

module.exports = router;

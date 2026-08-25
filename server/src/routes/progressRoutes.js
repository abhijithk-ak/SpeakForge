const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const progressController = require('../controllers/progressController');

router.get('/', authMiddleware, progressController.getProgress);

module.exports = router;

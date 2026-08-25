const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const onboardingController = require('../controllers/onboardingController');

// Complete user onboarding flow
router.post('/', authMiddleware, onboardingController.complete);

module.exports = router;

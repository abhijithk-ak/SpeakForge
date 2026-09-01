const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { createEvaluation, getEvaluation } = require('../controllers/evaluationController');

router.use(authenticate);

router.post('/:sessionId',  createEvaluation);
router.get('/:sessionId',   getEvaluation);

module.exports = router;

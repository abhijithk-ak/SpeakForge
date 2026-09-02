const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { getRandomTopic, getCategories } = require('../services/topicService');

router.use(authenticate);

// GET /api/topics/categories - List available topic categories
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    data: getCategories()
  });
});

// GET /api/topics/random - Get random topic and slot machine words
router.get('/random', (req, res) => {
  const { category } = req.query;
  const result = getRandomTopic(category);
  res.json({
    success: true,
    data: result
  });
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { getKeys, saveKey, selectModel, getAvailableModels, deleteKey, testKey } = require('../controllers/apiKeyController');

// All routes require authentication
router.use(authenticate);

router.get('/',                       getKeys);
router.put('/:provider',              saveKey);
router.put('/:provider/model',        selectModel);
router.get('/:provider/models',       getAvailableModels);
router.delete('/:provider',           deleteKey);
router.post('/:provider/test',        testKey);

module.exports = router;

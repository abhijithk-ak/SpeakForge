const express = require('express');
const router = express.Router();

// TODO: implement realtime routes
router.all('*', (req, res) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'This endpoint is not yet implemented' }
  });
});

module.exports = router;

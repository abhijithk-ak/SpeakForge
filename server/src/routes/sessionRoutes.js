const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createSession,
  getSessions,
  getSession,
  startSession,
  processTurn,
  streamTurn,
  endSession
} = require('../controllers/sessionController');

router.use(authenticate);

router.post('/',               createSession);
router.get('/',                getSessions);
router.get('/:id',             getSession);
router.post('/:id/start',      startSession);
router.post('/:id/turn',       processTurn);
router.post('/:id/stream',     streamTurn);
router.post('/:id/end',        endSession);

module.exports = router;

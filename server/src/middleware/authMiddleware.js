// Protects routes that require authentication.
// Extracts JWT from the Authorization header,
// verifies it, and attaches the user ID to req.user.

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify throws if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach userId to the request — routes use this, not any body/param
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
};

module.exports = authMiddleware;

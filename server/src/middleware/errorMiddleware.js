// Central error handler — Express calls this when next(err) is called
// Must have 4 parameters for Express to recognize it as error middleware

const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  logger.error('Unhandled error', err);

  // Don't expose internal errors to clients
  if (err.type === 'validation') {
    return sendError(res, 'VALIDATION_ERROR', err.message, 400);
  }

  return sendError(
    res,
    'INTERNAL_ERROR',
    'Something went wrong. Please try again.',
    500
  );
};

module.exports = errorMiddleware;

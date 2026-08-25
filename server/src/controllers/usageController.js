const usageRepository = require('../db/repositories/usageRepository');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getUsage = async (req, res, next) => {
  try {
    const summary = await usageRepository.getUsageSummary(req.user.id);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsage };

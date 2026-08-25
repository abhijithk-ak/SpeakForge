const { validationResult } = require('express-validator');
const profileService = require('../services/profileService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const complete = async (req, res, next) => {
  try {
    const { role, experience_level, primary_goal, employment_status, target_role } = req.body;

    if (!role || !experience_level || !primary_goal || !employment_status) {
      return sendError(res, 'VALIDATION_ERROR', 'All required onboarding fields must be provided', 400);
    }

    const updatedProfile = await profileService.completeOnboarding(req.user.id, {
      role,
      experience_level,
      primary_goal,
      employment_status,
      target_role: target_role || null
    });

    return sendSuccess(res, updatedProfile);
  } catch (err) {
    next(err);
  }
};

module.exports = { complete };

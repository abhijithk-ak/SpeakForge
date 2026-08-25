const profileService = require('../services/profileService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);
    if (!profile) {
      return sendError(res, 'NOT_FOUND', 'Profile not found', 404);
    }
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'full_name', 'avatar_url', 'role', 'experience_level',
      'primary_goal', 'employment_status', 'target_role',
      'industry', 'preferred_coach'
    ];
    
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const updated = await profileService.updateProfile(req.user.id, updateData);
    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };

const profileRepository = require('../db/repositories/profileRepository');
const userRepository = require('../db/repositories/userRepository');
const logger = require('../utils/logger');

const getProfileByUserId = async (userId) => {
  const profile = await profileRepository.findByUserId(userId);
  if (!profile) return null;
  
  const user = await userRepository.findById(userId);
  return {
    ...profile,
    email: user ? user.email : null,
    created_at: user ? user.created_at : null
  };
};

const completeOnboarding = async (userId, data) => {
  logger.info('Completing onboarding for user', { userId });
  
  // Update profile demographic details
  const updatedProfile = await profileRepository.update(userId, data);
  
  // Mark user record as onboarding complete
  await userRepository.markOnboardingComplete(userId);
  
  return updatedProfile;
};

const updateProfile = async (userId, data) => {
  logger.info('Updating profile for user', { userId });
  return await profileRepository.update(userId, data);
};

module.exports = {
  getProfileByUserId,
  completeOnboarding,
  updateProfile
};

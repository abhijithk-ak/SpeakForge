import api from './api';

export const completeOnboarding = async (data) => {
  const res = await api.post('/onboarding', data);
  return res.data.data;
};

export const getProfile = async () => {
  const res = await api.get('/profile');
  return res.data.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/profile', data);
  return res.data.data;
};

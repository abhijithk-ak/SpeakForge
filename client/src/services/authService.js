import api from './api';

export const registerUser = async (email, password) => {
  const res = await api.post('/auth/register', { email, password });
  return res.data.data;
};

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data;
};

export const getCurrentUser = async () => {
  const res = await api.get('/auth/me');
  return res.data.data;
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
};

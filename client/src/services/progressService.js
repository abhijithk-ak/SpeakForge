import api from './api';

export const getProgress = async () => {
  const res = await api.get('/progress');
  return res.data.data;
};

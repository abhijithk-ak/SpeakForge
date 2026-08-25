import api from './api';

export const getUsage = async () => {
  const res = await api.get('/usage');
  return res.data.data;
};

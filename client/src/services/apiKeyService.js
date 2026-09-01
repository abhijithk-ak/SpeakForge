import api from './api';

export const getKeys = () =>
  api.get('/keys').then(r => r.data.data);

export const saveKey = (provider, apiKey, selectedModel) =>
  api.put(`/keys/${provider}`, { apiKey, selectedModel }).then(r => r.data.data);

export const selectModel = (provider, selectedModel) =>
  api.put(`/keys/${provider}/model`, { selectedModel }).then(r => r.data.data);

export const fetchModels = (provider) =>
  api.get(`/keys/${provider}/models`).then(r => r.data.data);

export const deleteKey = (provider) =>
  api.delete(`/keys/${provider}`).then(r => r.data.data);

export const testKey = (provider, model) =>
  api.post(`/keys/${provider}/test`, { model }).then(r => r.data.data);

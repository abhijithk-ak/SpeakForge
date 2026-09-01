import api from './api';

export const createSession = (data) =>
  api.post('/sessions', data).then(r => r.data.data);

export const getSessions = (limit = 20, offset = 0) =>
  api.get(`/sessions?limit=${limit}&offset=${offset}`).then(r => r.data.data);

export const getSession = (id) =>
  api.get(`/sessions/${id}`).then(r => r.data.data);

export const startSession = (id, data) =>
  api.post(`/sessions/${id}/start`, data).then(r => r.data.data);

export const sendTurn = (id, data) =>
  api.post(`/sessions/${id}/turn`, data).then(r => r.data.data);

export const endSession = (id) =>
  api.post(`/sessions/${id}/end`).then(r => r.data.data);

export const createEvaluation = (sessionId, provider) =>
  api.post(`/evaluations/${sessionId}`, { provider }).then(r => r.data.data);

export const getEvaluation = (sessionId) =>
  api.get(`/evaluations/${sessionId}`).then(r => r.data.data);

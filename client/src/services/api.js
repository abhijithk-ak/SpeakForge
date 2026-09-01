// Central Axios instance — all API calls go through here.
// This means we set the base URL and auth header in one place.

import axios from 'axios';

const api = axios.create({
  // Use a relative URL — Vite proxy forwards /api → http://localhost:5000/api
  // This way the client works regardless of which port Vite picks.
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Before every request, attach the JWT if one exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('speakforge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server returns 401, the token is invalid/expired.
// Remove it and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('speakforge_token');
      localStorage.removeItem('speakforge_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

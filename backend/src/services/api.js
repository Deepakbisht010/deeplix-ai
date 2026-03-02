import axios from 'axios';

// Axios instance with base URL
const api = axios.create({
  baseURL: '/api',  // React proxy forwards to backend
  headers: { 'Content-Type': 'application/json' }
});

// Authentication endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// User endpoints
export const usersAPI = {
  updatePreferences: (prefs) => api.patch('/users/preferences', prefs),
};
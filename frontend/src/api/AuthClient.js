import { api } from './ApiClient';

// Auth is typically the first request a visitor makes, so it's the one most
// likely to hit a cold backend (free-tier scale-to-zero can take 30-50s to wake).
// Give these a generous timeout so a wake-up isn't mistaken for a failure.
const AUTH_TIMEOUT = 60000;

export const AuthClient = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password }, { timeout: AUTH_TIMEOUT });
  },
  register: async (email, password, name) => {
    return await api.post('/auth/signup', { email, password, name }, { timeout: AUTH_TIMEOUT });
  },
  logout: async () => {
    return await api.post('/auth/logout');
  },
  refresh: async () => {
    return await api.post('/auth/refresh', {}, { _retry: true, timeout: AUTH_TIMEOUT });
  }
};

import { api, refreshAccessToken } from './ApiClient';
import { getTurnstileToken, clearTurnstileToken } from '../utils/turnstile';

// Auth is typically the first request a visitor makes, so it's the one most
// likely to hit a cold backend (free-tier scale-to-zero can take 30-50s to wake).
// Give these a generous timeout so a wake-up isn't mistaken for a failure.
const AUTH_TIMEOUT = 60000;

export const AuthClient = {
  login: async (email, password) => {
    const turnstileToken = getTurnstileToken() || undefined;
    try {
      return await api.post('/auth/login', { email, password, turnstileToken }, { timeout: AUTH_TIMEOUT });
    } finally {
      clearTurnstileToken();   // tokens are single-use; force a fresh one on the next attempt
    }
  },
  register: async (email, password, name) => {
    const turnstileToken = getTurnstileToken() || undefined;
    try {
      return await api.post('/auth/signup', { email, password, name, turnstileToken }, { timeout: AUTH_TIMEOUT });
    } finally {
      clearTurnstileToken();
    }
  },
  logout: async () => {
    return await api.post('/auth/logout');
  },
  // Shares the single-flight refresh in ApiClient so the resync loop can't add
  // to a refresh storm. Returns the same shape callers expect.
  refresh: async () => {
    const access_token = await refreshAccessToken();
    return { access_token };
  }
};

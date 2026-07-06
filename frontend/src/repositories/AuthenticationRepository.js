import { AuthClient } from '../api/AuthClient';
import { setToken, api } from '../api/ApiClient';
import { parseToken } from '../utils/token';
import { RepositoryError } from '../errors/RepositoryError';

export const AuthenticationRepository = {
  // Request a password-reset email (always resolves; never reveals account existence).
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  // Set a new password using the emailed token.
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),

  signUp: async (email, password, metadata) => {
    try {
      const payload = await AuthClient.register(email, password, metadata?.full_name || "");
      const data = payload.data || payload;
      if (data && data.access_token) {
        setToken(data.access_token);
        return parseToken(data.access_token);
      }
      return data;
    } catch (e) {
      // Surface the real server message (e.g. "already registered") instead of a
      // generic string, so users can actually act on the failure.
      const msg = e?.details?.message || e?.message || "Signup failed. Please try again.";
      throw new RepositoryError(msg, e);
    }
  },
  signIn: async (email, password) => {
    try {
      const payload = await AuthClient.login(email, password);
      const data = payload.data || payload;
      setToken(data.access_token);
      return parseToken(data.access_token);
    } catch (e) {
      throw new RepositoryError("Authentication failed", e);
    }
  },
  signOut: async () => {
    try {
      await AuthClient.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken(null);
  },
  refreshSession: async () => {
    try {
      const payload = await AuthClient.refresh();
      const data = payload.data || payload;
      if (data && data.access_token) {
        setToken(data.access_token);
        return parseToken(data.access_token);
      }
      return null;
    } catch (e) {
      // Do NOT setToken(null) here because it causes a race condition if login() succeeds while refresh() is still pending.
      // ApiClient.js already handles session expiration.
      return null;
    }
  }
};

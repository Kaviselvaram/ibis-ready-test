import { AuthClient } from '../api/AuthClient';
import { setToken } from '../api/ApiClient';
import { parseToken } from '../utils/token';
import { RepositoryError } from '../errors/RepositoryError';

export const AuthenticationRepository = {
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
      throw new RepositoryError("Signup failed", e);
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

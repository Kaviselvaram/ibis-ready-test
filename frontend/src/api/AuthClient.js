import { api } from './ApiClient';

export const AuthClient = {
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },
  register: async (email, password, name) => {
    return await api.post('/auth/signup', { email, password, name });
  },
  logout: async () => {
    return await api.post('/auth/logout');
  },
  refresh: async () => {
    return await api.post('/auth/refresh', {}, { _retry: true });
  }
};

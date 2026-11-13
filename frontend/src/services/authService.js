import { apiClient } from '../api/client';

export const authService = {
  register: (payload) =>
    apiClient('/api/auth/register', {
      method: 'POST',
      body: payload,
    }),

  login: (payload) =>
    apiClient('/api/auth/login', {
      method: 'POST',
      body: payload,
    }),

  getMe: () =>
    apiClient('/api/auth/me', {
      method: 'GET',
    }),

  logout: () =>
    apiClient('/api/auth/logout', {
      method: 'POST',
    }),
};

export const authApi = authService;
export default authService;

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

  createInviteToken: ({
    role = 'student',
    courseId,
    semesterId,
    expiresInMinutes = 15,
  } = {}) =>
    apiClient('/api/auth/invite-token', {
      method: 'POST',
      body: {
        role,
        course_id: courseId ? Number(courseId) : undefined,
        semester_id: semesterId ? Number(semesterId) : undefined,
        expires_in_minutes: expiresInMinutes,
      },
    }),

  getInviteInfo: (token) =>
    apiClient(`/api/auth/invite-info?token=${encodeURIComponent(token || '')}`, {
      method: 'GET',
    }),

  logout: () =>
    apiClient('/api/auth/logout', {
      method: 'POST',
    }),
};

export const authApi = authService;
export default authService;

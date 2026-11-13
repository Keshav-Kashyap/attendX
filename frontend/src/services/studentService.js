import { apiClient } from '../api/client';

export const studentService = {
  getProfile: () =>
    apiClient('/api/student/profile', {
      method: 'GET',
    }),

  saveProfile: (payload) =>
    apiClient('/api/student/profile', {
      method: 'POST',
      body: payload,
    }),

  getCourses: () =>
    apiClient('/api/student/courses', {
      method: 'GET',
    }),

  getDashboard: () =>
    apiClient('/api/student/dashboard', {
      method: 'GET',
    }),

  getAttendance: () =>
    apiClient('/api/student/attendance', {
      method: 'GET',
    }),
};

export const studentApi = studentService;
export default studentService;

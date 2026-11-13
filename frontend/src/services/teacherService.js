import { apiClient } from '../api/client';

export const teacherService = {
  getProfile: () =>
    apiClient('/api/teacher/profile', {
      method: 'GET',
    }),

  saveProfile: (payload) =>
    apiClient('/api/teacher/profile', {
      method: 'POST',
      body: payload,
    }),

  getAllTeachers: () =>
    apiClient('/api/teacher/all', {
      method: 'GET',
    }),

  getTeacherCourses: () =>
    apiClient('/api/teacher/courses', {
      method: 'GET',
    }),

  scanAttendance: (payload) =>
    apiClient('/api/teacher/attendance/scan', {
      method: 'POST',
      body: payload,
    }),

  getAttendanceHistory: () =>
    apiClient('/api/teacher/attendance/history', {
      method: 'GET',
    }),

  getTeacherStudents: () =>
    apiClient('/api/teacher/students', {
      method: 'GET',
    }),

  getTeacherReports: () =>
    apiClient('/api/teacher/reports', {
      method: 'GET',
    }),

  updateAttendanceRecord: (recordId, payload) =>
    apiClient(`/api/attendance/records/${recordId}`, {
      method: 'PUT',
      body: payload,
    }),

  changePassword: (payload) =>
    apiClient('/api/auth/change-password', {
      method: 'POST',
      body: payload,
    }),
};

export const teacherApi = teacherService;
export default teacherService;

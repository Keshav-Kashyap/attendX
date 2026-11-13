import { apiClient } from '../api/client';

export const courseService = {
  // Level 1: All courses list (summary counts only)
  getAllCourses: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient(`/api/courses${query}`, { method: 'GET' });
  },

  // Single course overview
  getCourseById: (courseId, includeSubjects = false) =>
    apiClient(`/api/courses/${courseId}?include_subjects=${includeSubjects}`, {
      method: 'GET',
    }),

  // Level 2: Semesters for a specific course (contains subjects_count, no full subjects)
  getCourseSemesters: (courseId) =>
    apiClient(`/api/courses/${courseId}/semesters`, {
      method: 'GET',
    }),

  // Level 3: Subjects for a specific semester when opened
  getSemesterSubjects: (semesterId) =>
    apiClient(`/api/courses/semesters/${semesterId}/subjects`, {
      method: 'GET',
    }),

  // Subjects for a course, optionally filtered
  getCourseSubjects: (courseId, params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient(`/api/courses/${courseId}/subjects${query}`, {
      method: 'GET',
    });
  },

  getCourseStudents: (courseId) =>
    apiClient(`/api/courses/${courseId}/students`, {
      method: 'GET',
    }),

  createCourse: (payload) =>
    apiClient('/api/courses', {
      method: 'POST',
      body: payload,
    }),

  updateCourse: (courseId, payload) =>
    apiClient(`/api/courses/${courseId}`, {
      method: 'PUT',
      body: payload,
    }),

  deleteCourse: (courseId) =>
    apiClient(`/api/courses/${courseId}`, {
      method: 'DELETE',
    }),

  createSubject: (courseId, payload) =>
    apiClient(`/api/courses/${courseId}/subjects`, {
      method: 'POST',
      body: payload,
    }),

  updateSubject: (subjectId, payload) =>
    apiClient(`/api/courses/subjects/${subjectId}`, {
      method: 'PUT',
      body: payload,
    }),

  deleteSubject: (subjectId) =>
    apiClient(`/api/courses/subjects/${subjectId}`, {
      method: 'DELETE',
    }),
};

export const courseApi = courseService;
export default courseService;

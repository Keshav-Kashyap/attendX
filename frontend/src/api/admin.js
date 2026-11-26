import { apiClient } from './client';

export const adminApi = {
  // Stats
  getStats: () => apiClient('/api/admin/stats'),

  // Courses
  getCourses: () => apiClient('/api/admin/courses'),
  createCourse: (data) =>
    apiClient('/api/admin/courses', {
      method: 'POST',
      body: data,
    }),
  updateCourse: (courseId, data) =>
    apiClient(`/api/admin/courses/${courseId}`, {
      method: 'PUT',
      body: data,
    }),
  deleteCourse: (courseId) =>
    apiClient(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
    }),

  // Semesters & Subjects
  getCourseSemesters: (courseId) => apiClient(`/api/admin/courses/${courseId}/semesters`),
  getSemesterSubjects: (semesterId) =>
    apiClient(`/api/admin/semesters/${semesterId}/subjects`),
  createSubject: (courseId, data) =>
    apiClient(`/api/admin/courses/${courseId}/subjects`, {
      method: 'POST',
      body: data,
    }),
  updateSubject: (subjectId, data) =>
    apiClient(`/api/admin/subjects/${subjectId}`, {
      method: 'PUT',
      body: data,
    }),
  deleteSubject: (subjectId) =>
    apiClient(`/api/admin/subjects/${subjectId}`, {
      method: 'DELETE',
    }),

  // Batches & Enrollments
  getCourseBatches: (courseId) => apiClient(`/api/admin/courses/${courseId}/batches`),
  enrollBatch: (courseId, data) =>
    apiClient(`/api/admin/courses/${courseId}/batches/enroll`, {
      method: 'POST',
      body: data,
    }),
  updateEnrollment: (enrollmentId, data) =>
    apiClient(`/api/admin/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: data,
    }),
  removeEnrollment: (enrollmentId) =>
    apiClient(`/api/admin/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    }),

  // Teachers & Assignments
  getTeachers: () => apiClient('/api/admin/teachers'),
  createTeacher: (data) =>
    apiClient('/api/admin/teachers', {
      method: 'POST',
      body: data,
    }),
  updateTeacher: (teacherId, data) =>
    apiClient(`/api/admin/teachers/${teacherId}`, {
      method: 'PUT',
      body: data,
    }),
  deleteTeacher: (teacherId) =>
    apiClient(`/api/admin/teachers/${teacherId}`, {
      method: 'DELETE',
    }),
  getStudents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.course_id) query.append('course_id', params.course_id);
    if (params.semester_id) query.append('semester_id', params.semester_id);
    const qs = query.toString();
    return apiClient(`/api/admin/students${qs ? `?${qs}` : ''}`);
  },
  createStudent: (data) =>
    apiClient('/api/admin/students', {
      method: 'POST',
      body: data,
    }),
  updateStudent: (studentId, data) =>
    apiClient(`/api/admin/students/${studentId}`, {
      method: 'PUT',
      body: data,
    }),
  deleteStudent: (studentId) =>
    apiClient(`/api/admin/students/${studentId}`, {
      method: 'DELETE',
    }),
  getTeacherAssignments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.course_id) query.append('course_id', params.course_id);
    if (params.teacher_id) query.append('teacher_id', params.teacher_id);
    if (params.subject_id) query.append('subject_id', params.subject_id);
    const qs = query.toString();
    return apiClient(`/api/admin/teacher-assignments${qs ? `?${qs}` : ''}`);
  },
  checkRoomAvailability: ({ room, schedule, subject_id } = {}) => {
    const query = new URLSearchParams();
    if (room) query.append('room', room);
    if (schedule) query.append('schedule', schedule);
    if (subject_id) query.append('subject_id', String(subject_id));
    return apiClient(`/api/admin/rooms/check-availability?${query.toString()}`);
  },
  getBookedRoomSlots: () => apiClient('/api/admin/rooms/booked-slots'),
  assignTeacher: (data) =>
    apiClient('/api/admin/teacher-assignments', {
      method: 'POST',
      body: data,
    }),
  updateTeacherAssignment: (assignmentId, data) =>
    apiClient(`/api/admin/teacher-assignments/${assignmentId}`, {
      method: 'PUT',
      body: data,
    }),
  unassignTeacher: (assignmentId) =>
    apiClient(`/api/admin/teacher-assignments/${assignmentId}`, {
      method: 'DELETE',
    }),
};

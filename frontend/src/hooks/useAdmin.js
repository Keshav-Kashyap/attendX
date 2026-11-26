import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { useAuthStore } from '../store/useAuthStore';

export const ADMIN_KEYS = {
  stats: ['admin', 'stats'],
  courses: ['admin', 'courses'],
  semesters: (courseId) => ['admin', 'semesters', courseId],
  semesterSubjects: (semesterId) => ['admin', 'semesterSubjects', semesterId],
  batches: (courseId) => ['admin', 'batches', courseId],
  teachers: ['admin', 'teachers'],
  bookedRoomSlots: ['admin', 'bookedRoomSlots'],
  students: (params) => ['admin', 'students', params],
  assignments: (params) => ['admin', 'assignments', params],
};

export function useAdminStats(options = {}) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: async () => {
      const res = await adminApi.getStats();
      return res.data;
    },
    enabled: !!user && isAdmin,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useAdminCourses(options = {}) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ADMIN_KEYS.courses,
    queryFn: async () => {
      const res = await adminApi.getCourses();
      return res.data || [];
    },
    enabled: !!user && isAdmin,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useCourseSemesters(courseId) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ADMIN_KEYS.semesters(courseId),
    queryFn: async () => {
      if (!courseId) return [];
      const res = await adminApi.getCourseSemesters(courseId);
      return res.data || [];
    },
    enabled: !!user && isAdmin && Boolean(courseId),
  });
}

export function useSemesterSubjects(semesterId, options = {}) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const safeOptions = options || {};
  const extraEnabled = safeOptions.enabled ?? true;

  return useQuery({
    queryKey: ADMIN_KEYS.semesterSubjects(semesterId),
    queryFn: async () => {
      if (!semesterId) return [];
      const res = await adminApi.getSemesterSubjects(semesterId);
      return res.data || [];
    },
    ...safeOptions,
    enabled: !!user && isAdmin && Boolean(semesterId) && extraEnabled,
  });
}

export function useAdminTeachers(options = {}) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ADMIN_KEYS.teachers,
    queryFn: async () => {
      const res = await adminApi.getTeachers();
      return res.data || [];
    },
    enabled: !!user && isAdmin,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useBookedRoomSlots(options = {}) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const extraEnabled = options.enabled ?? true;

  return useQuery({
    queryKey: ADMIN_KEYS.bookedRoomSlots,
    queryFn: async () => {
      const res = await adminApi.getBookedRoomSlots();
      return res.data || [];
    },
    staleTime: 30 * 1000,
    ...options,
    enabled: !!user && isAdmin && extraEnabled,
  });
}

export function useTeacherAssignments(params = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.assignments(params),
    queryFn: async () => {
      const res = await adminApi.getTeacherAssignments(params);
      return res.data || [];
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }) => adminApi.updateCourse(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.semesters(courseId) });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId) => adminApi.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }) => adminApi.createSubject(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.semesters(courseId) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'semesterSubjects'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.bookedRoomSlots });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, data, courseId }) => adminApi.updateSubject(subjectId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.semesters(courseId) });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'semesterSubjects'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.bookedRoomSlots });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, courseId }) => adminApi.deleteSubject(subjectId),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.semesters(courseId) });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'semesterSubjects'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.bookedRoomSlots });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useAssignTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.assignTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useUnassignTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId) => adminApi.unassignTeacher(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useEnrollBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }) => adminApi.enrollBatch(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.semesters(courseId) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.batches(courseId) });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.createTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.teachers });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teacherId, data }) => adminApi.updateTeacher(teacherId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.teachers });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teacherId) => adminApi.deleteTeacher(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.teachers });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useAdminStudents(params = {}, options = {}) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const extraEnabled = options.enabled ?? true;

  return useQuery({
    queryKey: ADMIN_KEYS.students(params),
    queryFn: async () => {
      const res = await adminApi.getStudents(params);
      return res.data || [];
    },
    staleTime: 30 * 1000,
    ...options,
    enabled: !!user && isAdmin && extraEnabled,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, data }) => adminApi.updateStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId) => adminApi.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}

export function useRemoveEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId) => adminApi.removeEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.courses });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats });
    },
  });
}


import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '../services/teacherService';
import { useAuthStore } from '../store/useAuthStore';

export function useTeacherProfile() {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'teacher';

  return useQuery({
    queryKey: ['teacherProfile', user?.id],
    queryFn: async () => {
      const response = await teacherService.getProfile();
      return response?.data;
    },
    enabled: !!user && isTeacher,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTeacherProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (profileData) => {
      const response = await teacherService.saveProfile(profileData);
      return response;
    },
    onSuccess: (response) => {
      const teacherProfile = response?.data;
      if (teacherProfile && user) {
        setUser({
          ...user,
          teacher_profile: teacherProfile,
          identifier: teacherProfile.employee_code || user.identifier,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['teacherProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useAllTeachers() {
  return useQuery({
    queryKey: ['allTeachers'],
    queryFn: async () => {
      const response = await teacherService.getAllTeachers();
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useScanAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scanPayload) => {
      const response = await teacherService.scanAttendance(scanPayload);
      return response;
    },
    onSuccess: () => {
      // Do not invalidate attendance history on scan — only after explicit Confirm
    },
  });
}

export function useConfirmAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, records }) => {
      const response = await teacherService.confirmAttendanceSession(sessionId, { records });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherAttendanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['teacherStudents'] });
      queryClient.invalidateQueries({ queryKey: ['teacherReports'] });
      queryClient.invalidateQueries({ queryKey: ['teacherCourses'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentHistory'] });
    },
  });
}

export function useTeacherAttendanceHistory() {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'teacher';

  return useQuery({
    queryKey: ['teacherAttendanceHistory'],
    queryFn: async () => {
      const response = await teacherService.getAttendanceHistory();
      return response?.data || [];
    },
    enabled: !!user && isTeacher,
    staleTime: 60 * 1000,
  });
}

export function useTeacherCourses() {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'teacher';

  return useQuery({
    queryKey: ['teacherCourses'],
    queryFn: async () => {
      const response = await teacherService.getTeacherCourses();
      return response?.data || [];
    },
    enabled: !!user && isTeacher,
    staleTime: 60 * 1000,
  });
}

export function useTeacherStudents() {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'teacher';

  return useQuery({
    queryKey: ['teacherStudents'],
    queryFn: async () => {
      const response = await teacherService.getTeacherStudents();
      return response?.data || [];
    },
    enabled: !!user && isTeacher,
    staleTime: 60 * 1000,
  });
}

export function useTeacherReports() {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'teacher';

  return useQuery({
    queryKey: ['teacherReports'],
    queryFn: async () => {
      const response = await teacherService.getTeacherReports();
      return response?.data || null;
    },
    enabled: !!user && isTeacher,
    staleTime: 60 * 1000,
  });
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, status, remarks }) => {
      const response = await teacherService.updateAttendanceRecord(recordId, { status, remarks });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherAttendanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['teacherStudents'] });
      queryClient.invalidateQueries({ queryKey: ['teacherReports'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ old_password, new_password }) => {
      const response = await teacherService.changePassword({ old_password, new_password });
      return response;
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/studentService';
import { useAuthStore } from '../store/useAuthStore';

export function useStudentProfile() {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'student';

  return useQuery({
    queryKey: ['studentProfile', user?.id],
    queryFn: async () => {
      const response = await studentService.getProfile();
      return response?.data;
    },
    enabled: !!user && isStudent,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'student';

  return useQuery({
    queryKey: ['studentDashboard', user?.id],
    queryFn: async () => {
      const response = await studentService.getDashboard();
      return response?.data;
    },
    enabled: !!user && isStudent,
    staleTime: 60 * 1000,
  });
}

export function useStudentAttendance() {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'student';

  return useQuery({
    queryKey: ['studentAttendance', user?.id],
    queryFn: async () => {
      const response = await studentService.getAttendance();
      return response?.data;
    },
    enabled: !!user && isStudent,
    staleTime: 60 * 1000,
  });
}

export function useStudentCourses() {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'student';

  return useQuery({
    queryKey: ['studentCourses', user?.id],
    queryFn: async () => {
      const response = await studentService.getCourses();
      return response?.data;
    },
    enabled: !!user && isStudent,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveStudentProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (profileData) => {
      const response = await studentService.saveProfile(profileData);
      return response;
    },
    onSuccess: (response) => {
      const studentProfile = response?.data;
      if (studentProfile && user) {
        setUser({
          ...user,
          student_profile: studentProfile,
          identifier: studentProfile.roll_number || user.identifier,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

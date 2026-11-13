import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await authService.login(credentials);
      return response;
    },
    onSuccess: (response) => {
      const data = response?.data;
      if (data) {
        const user = data.user || {
          id: data.user_id,
          username: data.username,
          email: data.email,
          role: data.role || 'student',
        };
        const token = data.token;
        setAuth(user, token);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await authService.register(userData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authService.getMe();
      if (response?.data) {
        setUser(response.data);
      }
      return response?.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch (err) {
        console.warn('Backend logout error:', err);
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

export { useUser } from './useUser';


import { useAuthStore } from '../store/useAuthStore';

/**
 * Custom hook to easily access and manage the current user's global state.
 * Returns the current user, authentication status, role helpers, and store actions.
 */
export function useUser() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const role = (user?.role || (user?.student_profile ? 'student' : user?.teacher_profile ? 'teacher' : '')).toLowerCase();
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';

  const rawName = user?.name || user?.username || '';
  const firstName = rawName ? rawName.trim().split(' ')[0] : (isAdmin ? 'Admin' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User');
  const displayName = rawName || firstName;

  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    logout,
    role,
    isAdmin,
    isTeacher,
    isStudent,
    displayName,
    firstName,
  };
}

export default useUser;


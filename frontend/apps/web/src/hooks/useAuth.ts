/**
 * useAuth Hook - Convenience hook for accessing authentication state
 */
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const logout = useAuthStore((state) => state.logout);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    token,
    user,
    isAuthenticated,
    logout,
    setToken,
    setUser,
  };
};


import { useAuthStore } from '../store/authStore';

/**
 * Custom hook to access auth state and actions.
 * Convenience wrapper around the Zustand auth store.
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const patientLogin = useAuthStore((state) => state.patientLogin);
  const logout = useAuthStore((state) => state.logout);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    patientLogin,
    logout,
    fetchUser,

    // Derived helpers
    isAdmin: user?.role === 'ADMIN',
    isDentist: user?.role === 'DENTIST',
    isEmployee: user?.role === 'EMPLOYEE',
    isPatient: user?.role === 'PATIENT',
  };
};

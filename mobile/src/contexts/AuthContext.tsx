import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, PatientLoginPayload, authService } from '../services/auth.service';
import { tokenStorage } from '../services/storage';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (payload: PatientLoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const cachedUser = await tokenStorage.getUser<AuthUser>();
        if (mounted && cachedUser) {
          setUser(cachedUser);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (payload: PatientLoginPayload) => {
    const loggedInUser = await authService.patientLogin(payload);
    setUser(loggedInUser);
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

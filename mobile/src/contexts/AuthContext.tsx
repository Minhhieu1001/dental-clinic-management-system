import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthUser, PatientLoginPayload, authService } from '../services/auth.service';
import { patientService } from '../services/patient.service';
import { tokenStorage } from '../services/storage';

interface AuthContextValue {
  user: AuthUser | null;
  patientId: string | null;
  isLoading: boolean;
  signIn: (payload: PatientLoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateAvatarUrl: (avatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydratePatientId = useCallback(async (targetUser: AuthUser | null) => {
    if (!targetUser) {
      setPatientId(null);
      return;
    }
    if (targetUser.patientId) {
      setPatientId(targetUser.patientId);
      return;
    }
    const resolved = await patientService.resolvePatientId(targetUser);
    setPatientId(resolved);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const cachedUser = await tokenStorage.getUser<AuthUser>();
        if (mounted && cachedUser) {
          setUser(cachedUser);
          await hydratePatientId(cachedUser);
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
  }, [hydratePatientId]);

  const signIn = async (payload: PatientLoginPayload) => {
    const loggedInUser = await authService.patientLogin(payload);
    setUser(loggedInUser);
    await hydratePatientId(loggedInUser);
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setPatientId(null);
  };

  const refreshUser = async () => {
    try {
      const me = await authService.getCurrentUser();
      if (me) {
        await tokenStorage.setUser(me);
        setUser(me);
        await hydratePatientId(me);
      }
    } catch {
      // ignore if unauthenticated
    }
  };

  const updateAvatarUrl = async (avatarUrl: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatarUrl };
      tokenStorage.setUser(next).catch(() => { });
      return next;
    });
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, patientId, isLoading, signIn, signOut, refreshUser, updateAvatarUrl }}>
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

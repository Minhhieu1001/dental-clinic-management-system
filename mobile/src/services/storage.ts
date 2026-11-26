import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'crown_dental_access_token';
const REFRESH_TOKEN_KEY = 'crown_dental_refresh_token';
const USER_KEY = 'crown_dental_user';
const SAVED_LOGIN_KEY = 'crown_dental_saved_patient_login';

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface SavedPatientLogin {
  patientCode: string;
  phone: string;
}

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => setItem(ACCESS_TOKEN_KEY, token),
  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => setItem(REFRESH_TOKEN_KEY, token),
  getUser: async <T = unknown>(): Promise<T | null> => {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUser: (user: unknown) => setItem(USER_KEY, JSON.stringify(user)),
  getSavedLogin: async (): Promise<SavedPatientLogin | null> => {
    const raw = await getItem(SAVED_LOGIN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SavedPatientLogin;
    } catch {
      return null;
    }
  },
  setSavedLogin: (data: SavedPatientLogin) => setItem(SAVED_LOGIN_KEY, JSON.stringify(data)),
  clearSavedLogin: () => removeItem(SAVED_LOGIN_KEY),
  clearAll: async () => {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
    ]);
  },
};

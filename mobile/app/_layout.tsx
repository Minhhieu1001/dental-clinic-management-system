import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '../src/contexts/AuthContext';
import { SuccessModalProvider } from '../src/contexts/SuccessModalContext';
import { Colors } from '../src/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SuccessModalProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: Colors.onPrimary,
            headerTitleStyle: { fontWeight: '800' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ title: 'Thông báo & Nhắc lịch' }} />
          <Stack.Screen name="profile" options={{ title: 'Thông tin tài khoản' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </SuccessModalProvider>
    </AuthProvider>
  );
}

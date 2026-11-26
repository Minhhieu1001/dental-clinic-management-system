import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '../src/constants/theme';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { SuccessModalProvider } from '../src/contexts/SuccessModalContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthProtectedNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded, isLoading]);

  useEffect(() => {
    if (!fontsLoaded || isLoading) return;

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [fontsLoaded, isLoading, user, inAuthGroup, router]);

  if (!fontsLoaded || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.onPrimary,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: 'Thông báo & Nhắc lịch' }} />
      <Stack.Screen name="profile" options={{ title: 'Thông tin tài khoản' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return (
    <AuthProvider>
      <SuccessModalProvider>
        <StatusBar style="light" />
        <AuthProtectedNavigator fontsLoaded={loaded} />
      </SuccessModalProvider>
    </AuthProvider>
  );
}

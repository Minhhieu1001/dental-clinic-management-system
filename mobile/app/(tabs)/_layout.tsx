import { Tabs } from 'expo-router';
import Calendar from 'lucide-react-native/icons/calendar';
import FileText from 'lucide-react-native/icons/file-text';
import Home from 'lucide-react-native/icons/house';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Receipt from 'lucide-react-native/icons/receipt';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderRightActions } from '../../src/components/HeaderRightActions';
import { Colors } from '../../src/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.primarySoft,
          borderTopWidth: 1,
          height: 58 + bottom,
          paddingBottom: bottom,
          paddingTop: 6,
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.onPrimary,
        headerTitleStyle: { fontWeight: '800', color: Colors.onPrimary },
        headerRight: () => <HeaderRightActions inTabHeader />,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Lịch hẹn',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Hóa đơn',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="consultation"
        options={{
          title: 'Tư vấn',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

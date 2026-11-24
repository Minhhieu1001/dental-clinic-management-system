import { useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import Calendar from 'lucide-react-native/icons/calendar';
import FileText from 'lucide-react-native/icons/file-text';
import LogIn from 'lucide-react-native/icons/log-in';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Receipt from 'lucide-react-native/icons/receipt';
import User from 'lucide-react-native/icons/user';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function PatientDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const quickActions = [
    { label: 'Lịch hẹn', route: '/(tabs)/appointments' as const, icon: Calendar },
    { label: 'Hồ sơ bệnh án', route: '/(tabs)/records' as const, icon: FileText },
    { label: 'Hóa đơn', route: '/(tabs)/invoices' as const, icon: Receipt },
    { label: 'Tư vấn', route: '/(tabs)/consultation' as const, icon: MessageCircle },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>{user?.username ?? 'Khách hàng Crown Dental'}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Bell size={20} color={Colors.primaryDark} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push(user ? '/profile' : '/(auth)/login')}>
              {user ? (
                <User size={20} color={Colors.primaryDark} />
              ) : (
                <LogIn size={20} color={Colors.primaryDark} />
              )}
            </Pressable>
          </View>
        </View>

        {!user && (
          <Pressable style={styles.loginBanner} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBannerTitle}>Đăng nhập tài khoản bệnh nhân</Text>
            <Text style={styles.loginBannerSub}>
              Theo dõi lịch khám, mã QR check-in, kế hoạch điều trị và hóa đơn cá nhân
            </Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Chức năng nhanh</Text>
        <View style={styles.grid}>
          {quickActions.map(({ label, route, icon: Icon }) => (
            <Pressable key={label} style={styles.card} onPress={() => router.push(route)}>
              <View style={styles.cardIcon}>
                <Icon size={22} color={Colors.primary} />
              </View>
              <Text style={styles.cardLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  loginBannerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginBannerSub: { color: '#dcfce7', fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
});

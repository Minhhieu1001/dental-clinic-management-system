import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../src/constants/theme';
import { useAuth } from '../src/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Họ tên</Text>
        <Text style={styles.value}>{user?.username ?? '—'}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
        <Text style={styles.label}>Số điện thoại</Text>
        <Text style={styles.value}>{user?.phone ?? '—'}</Text>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: 12, color: Colors.textSecondary, marginTop: 10 },
  value: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: '#fee2e2',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});

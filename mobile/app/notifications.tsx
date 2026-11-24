import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../src/constants/theme';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông báo & Nhắc lịch</Text>
      <Text style={styles.sub}>Các nhắc nhở lịch tái khám, khuyến mãi và thông báo từ phòng khám.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});

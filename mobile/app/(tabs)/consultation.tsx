import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/constants/theme';

export default function ConsultationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tư vấn trực tuyến</Text>
      <Text style={styles.sub}>Nhắn tin trực tiếp với lễ tân / nhân viên phòng khám qua WebSocket.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});

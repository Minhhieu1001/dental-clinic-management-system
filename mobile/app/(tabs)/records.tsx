import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/constants/theme';

export default function RecordsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hồ sơ bệnh án & Điều trị</Text>
      <Text style={styles.sub}>Theo dõi kế hoạch điều trị, hồ sơ khám và đơn thuốc cá nhân.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});

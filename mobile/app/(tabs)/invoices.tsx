import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/constants/theme';

export default function InvoicesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hóa đơn của tôi</Text>
      <Text style={styles.sub}>Xem chi tiết hóa đơn, công nợ và quét mã QR thanh toán.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});

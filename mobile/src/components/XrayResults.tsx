import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';
import { formatDate } from '../utils/formatters';

export type XrayAnalysis = {
  analysisId?: string;
  imageUrl?: string;
  analyzedAt?: string;
  captureDate?: string;
  examinationDate?: string;
  treatmentPlanName?: string;
};

const treatmentLabel = (item: XrayAnalysis) =>
  item.treatmentPlanName?.trim()
    ? `${item.treatmentPlanName.trim()} (đợt khám ${formatDate(item.examinationDate, 'chưa rõ ngày')})`
    : `Chưa có kế hoạch điều trị (đợt khám ${formatDate(item.examinationDate, 'chưa rõ ngày')})`;

export function XrayResults({ analyses, error }: { analyses: XrayAnalysis[]; error: boolean }) {
  if (error) return <Text style={styles.empty}>Không tải được phim X-quang. Kéo xuống để thử lại.</Text>;
  if (!analyses.length) return <Text style={styles.empty}>Hồ sơ này chưa có phim X-quang đã lưu.</Text>;

  return (
    <View style={styles.list}>
      {analyses.map((item, index) => (
        <View key={item.analysisId || index} style={styles.card}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} resizeMode="contain" style={styles.image} accessibilityLabel={`Phim X-quang thuộc ${treatmentLabel(item)}`} />
          ) : (
            <Text style={styles.emptyImage}>Chưa có ảnh X-quang.</Text>
          )}
          <View style={styles.details}>
            <Text style={styles.text}><Text style={styles.label}>Ngày phân tích: </Text>{formatDate(item.analyzedAt || item.captureDate)}</Text>
            <Text style={styles.text}><Text style={styles.label}>Đợt điều trị: </Text>{treatmentLabel(item)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  empty: { textAlign: 'center', color: Colors.textSecondary, marginTop: 32, fontSize: 13.5 },
  card: { overflow: 'hidden', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  image: { width: '100%', height: 250, backgroundColor: '#0f172a' },
  emptyImage: { padding: 24, textAlign: 'center', color: Colors.textSecondary },
  details: { padding: 14, gap: 6 },
  text: { fontSize: 13, color: Colors.text },
  label: { fontWeight: '800' },
});

import { useRouter } from 'expo-router';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { invoiceService } from '../../src/services/invoice.service';
import { formatDate, formatMoney } from '../../src/utils/formatters';

type StatusFilter = 'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID';

function normalizeInvoiceStatus(raw?: string): 'PAID' | 'PARTIAL' | 'UNPAID' {
  if (raw === 'PAID') return 'PAID';
  if (raw === 'PARTIALLY_PAID' || raw === 'PARTIAL') return 'PARTIAL';
  return 'UNPAID';
}

export default function InvoicesScreen() {
  const router = useRouter();
  const { user, patientId } = useAuth();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const loadInvoices = useCallback(async () => {
    if (!user || !patientId) return;
    setLoading(true);
    try {
      const list = await invoiceService.getByPatientId(patientId);
      setInvoices(list);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const summary = useMemo(() => {
    let totalCost = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    invoices.forEach((inv) => {
      if (inv.paymentStatus === 'CANCELLED') return;
      totalCost += Number(inv.finalAmount ?? inv.totalAmount ?? 0);
      totalPaid += Number(inv.paidAmount ?? 0);
      totalDebt += Math.max(0, Number(inv.remainingAmount ?? 0));
    });
    return { count: invoices.length, totalCost, totalPaid, totalDebt };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      const st = normalizeInvoiceStatus(inv.paymentStatus || inv.status);
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;
      if (!q) return true;
      const details = inv.invoiceDetails || [];
      const svcMatch = details.some((d: any) =>
        String(d.itemName || d.serviceName || '').toLowerCase().includes(q)
      );
      return (
        svcMatch ||
        [inv.invoiceCode, inv.branchName].some((v) => String(v || '').toLowerCase().includes(q))
      );
    });
  }, [invoices, statusFilter, searchQuery]);

  if (!user) {
    return (
      <View style={styles.guestBox}>
        <Text style={styles.guestTitle}>Hóa đơn & Viện phí</Text>
        <Text style={styles.guestSub}>Đăng nhập để tra cứu hóa đơn và lịch sử thanh toán.</Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Strip */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumBox}>
          <Text style={styles.sumLabel}>Tổng viện phí</Text>
          <Text numberOfLines={1} style={styles.sumVal}>
            {formatMoney(summary.totalCost)}
          </Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={styles.sumLabel}>Đã thanh toán</Text>
          <Text numberOfLines={1} style={[styles.sumVal, { color: Colors.emerald }]}>
            {formatMoney(summary.totalPaid)}
          </Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={styles.sumLabel}>Còn nợ</Text>
          <Text numberOfLines={1} style={[styles.sumVal, { color: Colors.danger }]}>
            {formatMoney(summary.totalDebt)}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm mã hóa đơn, cơ sở, dịch vụ..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter Pills */}
      <View style={styles.tabsRow}>
        {(
          [
            { key: 'ALL', label: `Tất cả (${summary.count})` },
            { key: 'UNPAID', label: 'Chưa trả' },
            { key: 'PARTIAL', label: 'Một phần' },
            { key: 'PAID', label: 'Đã trả' },
          ] as const
        ).map((t) => {
          const active = statusFilter === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setStatusFilter(t.key)}>
              <Text style={[styles.tabPillText, active && { color: '#fff' }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy hóa đơn nào.</Text>}
          renderItem={({ item }) => {
            const st = normalizeInvoiceStatus(item.paymentStatus || item.status);
            const badge =
              st === 'PAID'
                ? { label: 'Đã thanh toán', bg: '#ecfdf5', color: '#007552' }
                : st === 'PARTIAL'
                  ? { label: 'Thanh toán 1 phần', bg: '#fffbeb', color: '#b45309' }
                  : { label: 'Chưa thanh toán', bg: '#fef2f2', color: '#dc2626' };

            return (
              <Pressable style={styles.card} onPress={() => setSelectedInvoice(item)}>
                <View style={styles.rowBetween}>
                  <Text selectable style={styles.invCode}>
                    {item.invoiceCode || 'HÓA ĐƠN'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <Text style={styles.subMeta}>
                  Ngày lập: {formatDate(item.invoiceDate || item.createdAt)}
                  {item.branchName ? ` • ${item.branchName}` : ''}
                </Text>

                <View style={styles.amountFooter}>
                  <View>
                    <Text style={styles.amountSmallLabel}>Tổng thanh toán</Text>
                    <Text style={styles.amountFinal}>
                      {formatMoney(item.finalAmount ?? item.totalAmount)}
                    </Text>
                  </View>
                  {Number(item.remainingAmount ?? 0) > 0 ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.amountSmallLabel}>Còn lại</Text>
                      <Text style={[styles.amountFinal, { color: Colors.danger }]}>
                        {formatMoney(item.remainingAmount)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Invoice Detail Modal (Read-only, không hiển thị mã QR thanh toán online) */}
      <Modal
        visible={Boolean(selectedInvoice)}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setSelectedInvoice(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedInvoice ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.rowBetween}>
                  <Text style={styles.modalTitle}>
                    Hóa đơn {selectedInvoice.invoiceCode || ''}
                  </Text>
                  <Pressable onPress={() => setSelectedInvoice(null)} hitSlop={8}>
                    <X size={20} color={Colors.text} />
                  </Pressable>
                </View>
                <Text style={[styles.subMeta, { marginTop: 4, marginBottom: 12 }]}>
                  Ngày: {formatDate(selectedInvoice.invoiceDate || selectedInvoice.createdAt)} •{' '}
                  {selectedInvoice.branchName || 'Crown Dental'}
                </Text>

                {/* Services table */}
                {(selectedInvoice.invoiceDetails ?? []).map((d: any, i: number) => (
                  <View key={d.id || i} style={styles.detailItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailName}>
                        {i + 1}. {d.itemName || d.serviceName || 'Dịch vụ nha khoa'}
                      </Text>
                      <Text style={styles.subMeta}>
                        {formatMoney(d.unitPrice)} × {d.quantity || 1}
                      </Text>
                    </View>
                    <Text style={styles.detailSubtotal}>{formatMoney(d.subtotal)}</Text>
                  </View>
                ))}

                <View style={styles.totalsBox}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.subMeta}>Tạm tính</Text>
                    <Text style={styles.detailSubtotal}>
                      {formatMoney(selectedInvoice.totalAmount)}
                    </Text>
                  </View>
                  {Number(selectedInvoice.discountAmount ?? 0) > 0 ? (
                    <View style={styles.rowBetween}>
                      <Text style={styles.subMeta}>Giảm giá / Khuyến mãi</Text>
                      <Text style={[styles.detailSubtotal, { color: Colors.emerald }]}>
                        -{formatMoney(selectedInvoice.discountAmount)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.rowBetween}>
                    <Text style={styles.totalBoldLabel}>Thành tiền</Text>
                    <Text style={styles.totalBoldVal}>
                      {formatMoney(selectedInvoice.finalAmount ?? selectedInvoice.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.subMeta}>Đã thanh toán</Text>
                    <Text style={[styles.detailSubtotal, { color: Colors.emerald }]}>
                      {formatMoney(selectedInvoice.paidAmount ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.totalBoldLabel}>Còn cần thanh toán</Text>
                    <Text style={[styles.totalBoldVal, { color: Colors.danger }]}>
                      {formatMoney(selectedInvoice.remainingAmount ?? 0)}
                    </Text>
                  </View>
                </View>

                {Number(selectedInvoice.remainingAmount ?? 0) > 0 ? (
                  <View style={styles.counterNotice}>
                    <Text style={styles.counterNoticeText}>
                      Quý khách vui lòng thanh toán trực tiếp tại quầy Lễ tân / Thu ngân của phòng khám để được hỗ trợ xuất biên lai.
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  guestBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  guestTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  guestSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  loginBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: { color: '#fff', fontWeight: '800' },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sumBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sumLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  sumVal: { fontSize: 13.5, fontWeight: '800', color: Colors.text, marginTop: 3 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 16,
    marginTop: 10,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text, paddingVertical: 0 },
  tabsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  tabPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabPillText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  listContent: { paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 36, fontSize: 13.5 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invCode: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800' },
  subMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  amountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  amountSmallLabel: { fontSize: 11, color: Colors.textSecondary },
  amountFinal: { fontSize: 15, fontWeight: '800', color: Colors.text, marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailName: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  detailSubtotal: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  totalsBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    gap: 6,
  },
  totalBoldLabel: { fontSize: 13.5, fontWeight: '800', color: Colors.text },
  totalBoldVal: { fontSize: 15.5, fontWeight: '900', color: Colors.text },
  counterNotice: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  counterNoticeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primaryDark,
    lineHeight: 18,
    textAlign: 'center',
  },
});

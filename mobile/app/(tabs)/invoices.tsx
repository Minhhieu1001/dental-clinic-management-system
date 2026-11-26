import { useRouter } from 'expo-router';
import Calendar from 'lucide-react-native/icons/calendar';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
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

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function toIsoDay(raw?: any): string {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    const [y, m = 1, d = 1] = raw;
    return y ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : '';
  }
  const match = String(raw).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : '';
}

/** Thông tin hạn thanh toán tiếp theo (chỉ khi hóa đơn còn nợ) */
function getNextPaymentInfo(inv: any): { label: string; overdue: boolean; isToday: boolean } | null {
  if (!inv || Number(inv.remainingAmount ?? 0) <= 0 || inv.paymentStatus === 'CANCELLED') return null;
  const iso = toIsoDay(inv.nextPaymentDate);
  if (!iso) return null;
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  return { label: formatDate(iso), overdue: iso < todayIso, isToday: iso === todayIso };
}

function normalizeInvoiceStatus(raw?: string): 'PAID' | 'PARTIAL' | 'UNPAID' {
  if (raw === 'PAID') return 'PAID';
  if (raw === 'PARTIALLY_PAID' || raw === 'PARTIAL') return 'PARTIAL';
  return 'UNPAID';
}

function extractInvoiceYearMonth(raw?: any): { year: number; month: number } | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const year = Number(raw[0]);
    const month = Number(raw[1]);
    if (year > 1900 && month >= 1 && month <= 12) return { year, month };
    return null;
  }
  const str = String(raw).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    if (year > 1900 && month >= 1 && month <= 12) return { year, month };
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), month: parsed.getMonth() + 1 };
  }
  return null;
}

export default function InvoicesScreen() {
  const router = useRouter();
  const { user, patientId } = useAuth();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<'ALL' | number>('ALL');
  const [selectedYear, setSelectedYear] = useState<'ALL' | number>('ALL');
  const [pickerMode, setPickerMode] = useState<'MONTH' | 'YEAR' | null>(null);
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

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearSet = new Set<number>([currentYear]);
    invoices.forEach((inv) => {
      const ym = extractInvoiceYearMonth(inv.invoiceDate || inv.createdAt);
      if (ym?.year) yearSet.add(ym.year);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      const st = normalizeInvoiceStatus(inv.paymentStatus || inv.status);
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;

      if (selectedMonth !== 'ALL' || selectedYear !== 'ALL') {
        const ym = extractInvoiceYearMonth(inv.invoiceDate || inv.createdAt);
        if (!ym) return false;
        if (selectedYear !== 'ALL' && ym.year !== selectedYear) return false;
        if (selectedMonth !== 'ALL' && ym.month !== selectedMonth) return false;
      }

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
  }, [invoices, statusFilter, selectedMonth, selectedYear, searchQuery]);


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
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <X size={15} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Bộ lọc Tháng / Năm đồng bộ Web */}
      <View style={styles.periodFilterRow}>
        <Pressable
          style={[
            styles.periodDropdownBtn,
            selectedMonth !== 'ALL' && styles.periodDropdownBtnActive,
          ]}
          onPress={() => setPickerMode('MONTH')}>
          <Calendar
            size={14}
            color={selectedMonth !== 'ALL' ? Colors.primaryDark : Colors.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.periodDropdownText,
              selectedMonth !== 'ALL' && styles.periodDropdownTextActive,
            ]}>
            {selectedMonth === 'ALL' ? 'Tất cả tháng' : `Tháng ${selectedMonth}`}
          </Text>
          <ChevronDown
            size={14}
            color={selectedMonth !== 'ALL' ? Colors.primaryDark : Colors.textMuted}
          />
        </Pressable>

        <Pressable
          style={[
            styles.periodDropdownBtn,
            selectedYear !== 'ALL' && styles.periodDropdownBtnActive,
          ]}
          onPress={() => setPickerMode('YEAR')}>
          <Calendar
            size={14}
            color={selectedYear !== 'ALL' ? Colors.primaryDark : Colors.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.periodDropdownText,
              selectedYear !== 'ALL' && styles.periodDropdownTextActive,
            ]}>
            {selectedYear === 'ALL' ? 'Tất cả năm' : `Năm ${selectedYear}`}
          </Text>
          <ChevronDown
            size={14}
            color={selectedYear !== 'ALL' ? Colors.primaryDark : Colors.textMuted}
          />
        </Pressable>
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

                {(() => {
                  const next = getNextPaymentInfo(item);
                  if (!next) return null;
                  return (
                    <View
                      style={[
                        styles.nextPayRow,
                        next.overdue && styles.nextPayRowOverdue,
                        next.isToday && styles.nextPayRowToday,
                      ]}>
                      <Calendar
                        size={13}
                        color={next.overdue ? Colors.danger : next.isToday ? '#b45309' : Colors.primaryDark}
                      />
                      <Text
                        style={[
                          styles.nextPayText,
                          next.overdue && { color: Colors.danger },
                          next.isToday && { color: '#b45309' },
                        ]}>
                        Hạn thanh toán tiếp theo: {next.label}
                        {next.overdue ? ' (Quá hạn)' : next.isToday ? ' (Hôm nay)' : ''}
                      </Text>
                    </View>
                  );
                })()}
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
                  {(() => {
                    const next = getNextPaymentInfo(selectedInvoice);
                    if (!next) return null;
                    return (
                      <View style={styles.rowBetween}>
                        <Text style={styles.subMeta}>Hạn thanh toán tiếp theo</Text>
                        <Text
                          style={[
                            styles.detailSubtotal,
                            { color: next.overdue ? Colors.danger : next.isToday ? '#b45309' : Colors.primaryDark },
                          ]}>
                          {next.label}
                          {next.overdue ? ' (Quá hạn)' : next.isToday ? ' (Hôm nay)' : ''}
                        </Text>
                      </View>
                    );
                  })()}
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

      {/* Modal chọn Tháng / Năm */}
      <Modal
        visible={pickerMode !== null}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setPickerMode(null)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setPickerMode(null)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <View style={styles.rowBetween}>
              <Text style={styles.pickerTitle}>
                {pickerMode === 'MONTH' ? 'Lọc theo Tháng' : 'Lọc theo Năm'}
              </Text>
              <Pressable onPress={() => setPickerMode(null)} hitSlop={8}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {pickerMode === 'MONTH' ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                <Pressable
                  style={[
                    styles.pickerAllRow,
                    selectedMonth === 'ALL' && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedMonth('ALL');
                    setPickerMode(null);
                  }}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedMonth === 'ALL' && styles.pickerOptionTextActive,
                    ]}>
                    Tất cả các tháng
                  </Text>
                  {selectedMonth === 'ALL' ? <Check size={16} color={Colors.primary} /> : null}
                </Pressable>

                <View style={styles.monthGrid}>
                  {MONTHS.map((m) => {
                    const active = selectedMonth === m;
                    return (
                      <Pressable
                        key={m}
                        style={[styles.monthCell, active && styles.monthCellActive]}
                        onPress={() => {
                          setSelectedMonth(m);
                          setPickerMode(null);
                        }}>
                        <Text style={[styles.monthCellText, active && { color: '#ffffff' }]}>
                          Tháng {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : pickerMode === 'YEAR' ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Pressable
                  style={[
                    styles.pickerAllRow,
                    selectedYear === 'ALL' && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedYear('ALL');
                    setPickerMode(null);
                  }}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedYear === 'ALL' && styles.pickerOptionTextActive,
                    ]}>
                    Tất cả các năm
                  </Text>
                  {selectedYear === 'ALL' ? <Check size={16} color={Colors.primary} /> : null}
                </Pressable>

                {availableYears.map((yr) => {
                  const active = selectedYear === yr;
                  return (
                    <Pressable
                      key={yr}
                      style={[styles.pickerAllRow, active && styles.pickerOptionActive]}
                      onPress={() => {
                        setSelectedYear(yr);
                        setPickerMode(null);
                      }}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          active && styles.pickerOptionTextActive,
                        ]}>
                        Năm {yr}
                      </Text>
                      {active ? <Check size={16} color={Colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
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
  periodFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 9,
  },
  periodDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    paddingHorizontal: 11,
    height: 38,
  },
  periodDropdownBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  periodDropdownText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  periodDropdownTextActive: {
    color: Colors.primaryDark,
  },
  clearPeriodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  clearPeriodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
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
  nextPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  nextPayRowOverdue: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.dangerBorder,
  },
  nextPayRowToday: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  nextPayText: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
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
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerSheet: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  pickerAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  pickerOptionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
  },
  pickerOptionTextActive: {
    color: Colors.primaryDark,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '31%',
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  monthCellActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthCellText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.text,
  },
});

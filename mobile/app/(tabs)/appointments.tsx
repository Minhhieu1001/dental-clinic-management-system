import { useRouter } from 'expo-router';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock from 'lucide-react-native/icons/clock';
import MapPin from 'lucide-react-native/icons/map-pin';
import Pencil from 'lucide-react-native/icons/pencil';
import Plus from 'lucide-react-native/icons/plus';
import QrCode from 'lucide-react-native/icons/qr-code';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Search from 'lucide-react-native/icons/search';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import X from 'lucide-react-native/icons/x';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import QRCode from 'react-native-qrcode-svg';
import { BookingModal } from '../../src/components/BookingModal';
import { CheckInModal } from '../../src/components/CheckInModal';
import { KeyboardSafeView } from '../../src/components/KeyboardSafeView';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSuccessModal } from '../../src/contexts/SuccessModalContext';
import { appointmentService } from '../../src/services/appointment.service';
import { useAppRealtime } from '../../src/services/stompClient';
import { formatDate } from '../../src/utils/formatters';

type TabFilter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
type DateRangeMode = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

function extractTimeStr(raw?: any): string {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    const [, , , h = 0, m = 0] = raw;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const match = String(raw).trim().match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

function formatDoctorName(name?: string): string {
  if (!name) return '';
  const clean = name.replace(/^(BS\.?|Bác sĩ)\s*/i, '').trim();
  return clean ? `BS. ${clean}` : '';
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function extractDateIso(raw?: any): string {
  if (!raw) return '';
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(raw).split('T')[0];
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  CONFIRMED: { label: 'Đã xác nhận', bg: '#ecfdf5', color: '#007552' },
  PENDING: { label: 'Chờ xác nhận', bg: '#fffbeb', color: '#b45309' },
  WAITING: { label: 'Đang chờ khám', bg: '#eff6ff', color: '#1d4ed8' },
  CALLED: { label: 'Đã gọi vào phòng', bg: '#ecfdf5', color: '#009165' },
  IN_PROGRESS: { label: 'Đang khám', bg: '#eef2ff', color: '#4338ca' },
  COMPLETED: { label: 'Đã hoàn tất', bg: '#f1f5f9', color: '#334155' },
  CANCELLED: { label: 'Đã hủy', bg: '#fef2f2', color: '#dc2626' },
  DOCTOR_ORDERED: { label: 'Chỉ định tái khám', bg: '#fef3c7', color: '#b45309' },
};

function canEditWithinOneHour(createdAt?: string): boolean {
  if (!createdAt) return false;
  const createdMs = Date.parse(createdAt);
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs <= 3600000;
}

function canCancelBeforeOneHour(dateStr?: string, timeStr?: string): boolean {
  if (!dateStr) return false;
  const dt = Date.parse(`${dateStr}T${timeStr || '08:00'}:00`);
  if (Number.isNaN(dt)) return true;
  return dt - Date.now() > 3600000;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function buildMonthGrid(year: number, monthIndex: number): Array<{ iso: string; day: number } | null> {
  const firstDay = new Date(year, monthIndex, 1);
  // Chuyển CN (0) -> 6, T2 (1) -> 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ iso: string; day: number } | null> = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ iso, day: d });
  }
  return cells;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user, patientId } = useAuth();
  const { showSuccess } = useSuccessModal();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // State lọc theo ngày hoàn toàn trên UI
  const [dateMode, setDateMode] = useState<DateRangeMode>('ALL');
  const [customDateIso, setCustomDateIso] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const nowRef = useMemo(() => new Date(), []);
  const [calYear, setCalYear] = useState(nowRef.getFullYear());
  const [calMonth, setCalMonth] = useState(nowRef.getMonth());

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<any | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !patientId) return;
    setLoading(true);
    try {
      const [apptList, followList] = await Promise.all([
        appointmentService.getByPatientId(patientId).catch(() => []),
        appointmentService.getFollowUps({ patientId }).catch(() => []),
      ]);
      setAppointments(apptList);
      setFollowUps(followList);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tự động đồng bộ lịch hẹn realtime khi Lễ tân / Bác sĩ thay đổi trạng thái
  useAppRealtime({
    userId: user?.id,
    patientId,
    userPhone: user?.phone,
    onAppointmentRealtime: loadData,
    onNotificationRealtime: useCallback(
      (notif) => {
        const t = notif?.type || '';
        if (t === 'APPOINTMENT' || t === 'STATUS_CHANGE' || t === 'FOLLOW_UP' || t === 'PATIENT_CHECKIN') {
          loadData();
        }
      },
      [loadData]
    ),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const mergedItems = useMemo(() => {
    const aList = appointments.map((a) => ({
      ...a,
      itemType: 'APPOINTMENT' as const,
      dateStr: extractDateIso(a.appointmentDate || a.appointmentTime),
      timeStr: extractTimeStr(a.appointmentTime) || extractTimeStr(a.appointmentDate),
      title: a.reason || a.serviceName || 'Khám nha khoa',
      normStatus: a.status || 'CONFIRMED',
    }));

    const fList = followUps.map((f) => {
      const isCancelled = f.status === false || f.status === 'CANCELLED';
      return {
        ...f,
        itemType: 'FOLLOW_UP' as const,
        dateStr: extractDateIso(f.followUpDate),
        timeStr: extractTimeStr(f.followUpTime) || extractTimeStr(f.followUpDate) || '08:00',
        title: f.reason || f.chiefComplaint || 'Lịch tái khám bác sĩ chỉ định',
        normStatus: isCancelled ? 'CANCELLED' : 'DOCTOR_ORDERED',
      };
    });

    return [...aList, ...fList].sort((a, b) =>
      `${b.dateStr} ${b.timeStr}`.localeCompare(`${a.dateStr} ${a.timeStr}`)
    );
  }, [appointments, followUps]);

  // Tập các ngày có lịch hẹn để đánh dấu chấm trên lịch chọn ngày
  const markedDates = useMemo(() => {
    const set = new Set<string>();
    mergedItems.forEach((i) => {
      if (i.dateStr) set.add(i.dateStr);
    });
    return set;
  }, [mergedItems]);

  const todayIso = toIsoDate(new Date());

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();
    const next7Iso = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return mergedItems.filter((item) => {
      // 1. Lọc theo tab trạng thái
      if (activeTab === 'UPCOMING') {
        if (item.normStatus === 'COMPLETED' || item.normStatus === 'CANCELLED') return false;
      } else if (activeTab === 'COMPLETED') {
        if (item.normStatus !== 'COMPLETED') return false;
      } else if (activeTab === 'CANCELLED') {
        if (item.normStatus !== 'CANCELLED') return false;
      }

      // 2. Lọc theo ngày trên UI state
      if (dateMode === 'TODAY') {
        if (item.dateStr !== todayIso) return false;
      } else if (dateMode === 'WEEK') {
        if (!item.dateStr || item.dateStr < todayIso || item.dateStr > next7Iso) return false;
      } else if (dateMode === 'MONTH') {
        if (!item.dateStr || !item.dateStr.startsWith(currentYm)) return false;
      } else if (dateMode === 'CUSTOM' && customDateIso) {
        if (item.dateStr !== customDateIso) return false;
      }

      // 3. Lọc theo từ khóa
      if (!q) return true;
      return [
        item.title,
        item.dentistName,
        item.branchName,
        item.appointmentCode,
        formatDate(item.dateStr),
      ].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [mergedItems, activeTab, dateMode, customDateIso, searchQuery, todayIso]);

  const handleConfirmCancel = async () => {
    if (!selectedItem || cancelling) return;
    setCancelling(true);
    try {
      const codeLabel = selectedItem.appointmentCode || selectedItem.title;
      await appointmentService.cancelAppointment(selectedItem.id, cancelReason);
      setCancelModalOpen(false);
      setSelectedItem(null);
      setCancelReason('');
      await loadData();
      showSuccess({
        title: 'Đã hủy lịch hẹn thành công!',
        message: `Lịch hẹn "${codeLabel}" đã được chuyển sang trạng thái Đã hủy.`,
      });
    } catch (err: any) {
      Alert.alert(
        'Không thể hủy lịch',
        err?.response?.data?.message || 'Vui lòng liên hệ Hotline để được hỗ trợ.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const changeCalendarMonth = (delta: number) => {
    const next = new Date(calYear, calMonth + delta, 1);
    setCalYear(next.getFullYear());
    setCalMonth(next.getMonth());
  };

  const monthCells = useMemo(() => buildMonthGrid(calYear, calMonth), [calYear, calMonth]);

  if (!user) {
    return (
      <View style={styles.guestBox}>
        <Text style={styles.guestTitle}>Vui lòng đăng nhập</Text>
        <Text style={styles.guestSub}>
          Đăng nhập để quản lý lịch hẹn và đặt lịch khám trực tuyến.
        </Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topControls}>
        <View style={styles.searchBox}>
          <Search size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm dịch vụ, bác sĩ, mã hẹn..."
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
        <Pressable
          style={styles.qrBtn}
          onPress={() => {
            setSelectedItem(null);
            setEditingAppt(null);
            setCheckInOpen(true);
          }}>
          <QrCode size={18} color={Colors.primaryDark} />
        </Pressable>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            setEditingAppt(null);
            setBookingOpen(true);
          }}>
          <Plus size={18} color="#fff" />
          <Text style={styles.addBtnText}>Đặt lịch</Text>
        </Pressable>
      </View>

      {/* Thanh lọc theo ngày (UI State) */}
      <View style={styles.dateFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateChipsRow}>
          <Pressable
            style={[
              styles.calendarPickerBtn,
              dateMode === 'CUSTOM' && Boolean(customDateIso) && styles.dateChipActive,
            ]}
            onPress={() => setCalendarOpen(true)}>
            <CalendarDays
              size={15}
              color={
                dateMode === 'CUSTOM' && Boolean(customDateIso) ? '#ffffff' : Colors.primary
              }
            />
            <Text
              style={[
                styles.dateChipText,
                { color: Colors.primaryDark },
                dateMode === 'CUSTOM' && Boolean(customDateIso) && { color: '#ffffff' },
              ]}>
              {dateMode === 'CUSTOM' && customDateIso
                ? `Ngày ${formatDate(customDateIso)}`
                : 'Chọn ngày'}
            </Text>
          </Pressable>

          {(
            [
              { key: 'ALL', label: 'Mọi ngày' },
              { key: 'TODAY', label: 'Hôm nay' },
              { key: 'WEEK', label: '7 ngày tới' },
              { key: 'MONTH', label: 'Tháng này' },
            ] as const
          ).map((d) => {
            const active = dateMode === d.key;
            return (
              <Pressable
                key={d.key}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => {
                  setDateMode(d.key);
                  setCustomDateIso('');
                }}>
                <Text style={[styles.dateChipText, active && { color: '#ffffff' }]}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}

          {dateMode !== 'ALL' ? (
            <Pressable
              style={styles.resetDateBtn}
              onPress={() => {
                setDateMode('ALL');
                setCustomDateIso('');
              }}>
              <RotateCcw size={13} color={Colors.danger} />
              <Text style={styles.resetDateText}>Bỏ lọc</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      {/* Filter Status Tabs */}
      <View style={styles.tabsRow}>
        {(
          [
            { key: 'ALL', label: 'Tất cả' },
            { key: 'UPCOMING', label: 'Sắp tới' },
            { key: 'COMPLETED', label: 'Đã khám' },
            { key: 'CANCELLED', label: 'Đã hủy' },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabPillText, active && { color: '#fff' }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, idx) => `${item.itemType}-${item.id ?? idx}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {dateMode === 'CUSTOM' && customDateIso
                  ? `Không có lịch hẹn nào vào ngày ${formatDate(customDateIso)}.`
                  : 'Chưa có lịch hẹn phù hợp trong mục này.'}
              </Text>
              {dateMode !== 'ALL' ? (
                <Pressable
                  style={styles.clearFilterBtn}
                  onPress={() => {
                    setDateMode('ALL');
                    setCustomDateIso('');
                  }}>
                  <Text style={styles.clearFilterText}>Xem tất cả các ngày</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const st = STATUS_META[item.normStatus] ?? STATUS_META.CONFIRMED;
            return (
              <Pressable style={styles.card} onPress={() => setSelectedItem(item)}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.codeText}>
                    {item.itemType === 'FOLLOW_UP'
                      ? 'LỊCH TÁI KHÁM'
                      : item.appointmentCode || 'PHIẾU HẸN KHÁM'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>

                <View style={styles.metaRow}>
                  <Clock size={14} color={Colors.primary} />
                  <Text style={styles.metaText}>
                    {item.timeStr ? `${item.timeStr} • ` : ''}
                    {formatDate(item.dateStr)}
                  </Text>
                </View>

                {item.dentistName ? (
                  <View style={styles.metaRow}>
                    <Stethoscope size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{formatDoctorName(item.dentistName)}</Text>
                  </View>
                ) : null}

                {item.branchName ? (
                  <View style={styles.metaRow}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text numberOfLines={1} style={styles.metaText}>
                      {item.branchName}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      {/* Modal Lịch chọn ngày cụ thể */}
      <Modal
        statusBarTranslucent
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc lịch hẹn theo ngày</Text>
              <Pressable onPress={() => setCalendarOpen(false)} hitSlop={8}>
                <X size={20} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.calNavRow}>
              <Pressable style={styles.calNavBtn} onPress={() => changeCalendarMonth(-1)}>
                <ChevronLeft size={18} color={Colors.text} />
              </Pressable>
              <Text style={styles.calMonthLabel}>
                Tháng {String(calMonth + 1).padStart(2, '0')} / {calYear}
              </Text>
              <Pressable style={styles.calNavBtn} onPress={() => changeCalendarMonth(1)}>
                <ChevronRight size={18} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekHeaderRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekHeaderText}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {monthCells.map((cell, idx) => {
                if (!cell) {
                  return <View key={`empty-${idx}`} style={styles.calCell} />;
                }
                const isSelected = dateMode === 'CUSTOM' && customDateIso === cell.iso;
                const isToday = cell.iso === todayIso;
                const hasAppt = markedDates.has(cell.iso);
                return (
                  <Pressable
                    key={cell.iso}
                    style={[
                      styles.calCell,
                      isToday && styles.calCellToday,
                      isSelected && styles.calCellSelected,
                    ]}
                    onPress={() => {
                      setCustomDateIso(cell.iso);
                      setDateMode('CUSTOM');
                      setCalendarOpen(false);
                    }}>
                    <Text
                      style={[
                        styles.calDayNum,
                        isToday && { color: Colors.primary, fontWeight: '800' },
                        isSelected && { color: '#ffffff', fontWeight: '800' },
                      ]}>
                      {cell.day}
                    </Text>
                    {hasAppt ? (
                      <View
                        style={[
                          styles.calDot,
                          isSelected && { backgroundColor: '#ffffff' },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.calHint}>
              • Chấm xanh đánh dấu những ngày bạn có lịch hẹn hoặc lịch tái khám
            </Text>

            <View style={styles.calFooter}>
              <Pressable
                style={[styles.editActionBtn, { flex: 1 }]}
                onPress={() => {
                  setDateMode('ALL');
                  setCustomDateIso('');
                  setCalendarOpen(false);
                }}>
                <Text style={styles.editActionText}>Tất cả ngày</Text>
              </Pressable>
              <Pressable
                style={[styles.checkInActionBtn, { flex: 1 }]}
                onPress={() => {
                  setCustomDateIso(todayIso);
                  setDateMode('CUSTOM');
                  setCalendarOpen(false);
                }}>
                <Text style={styles.checkInActionText}>Chọn hôm nay</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Electronic Ticket Detail Modal */}
      <Modal
        statusBarTranslucent
        visible={Boolean(selectedItem) && !cancelModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}>
        <KeyboardSafeView style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedItem ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Phiếu hẹn khám điện tử</Text>
                  <Pressable onPress={() => setSelectedItem(null)}>
                    <X size={20} color={Colors.text} />
                  </Pressable>
                </View>

                <View style={styles.qrTicketBox}>
                  <QRCode
                    value={String(selectedItem.appointmentCode || selectedItem.id)}
                    size={125}
                  />
                  {selectedItem.appointmentCode ? (
                    <Text selectable style={styles.ticketCodeBig}>
                      {selectedItem.appointmentCode}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.detailRows}>
                  <Text style={styles.detailService}>{selectedItem.title}</Text>
                  <Text style={styles.detailLine}>
                    Thời gian: {selectedItem.timeStr ? `${selectedItem.timeStr} — ` : ''}
                    {formatDate(selectedItem.dateStr)}
                  </Text>
                  <Text style={styles.detailLine}>
                    Bác sĩ:{' '}
                    {selectedItem.dentistName
                      ? formatDoctorName(selectedItem.dentistName)
                      : 'Phòng khám sắp xếp'}
                  </Text>
                  <Text style={styles.detailLine}>
                    Cơ sở: {selectedItem.branchName || 'Crown Dental'}
                  </Text>
                  {selectedItem.roomName ? (
                    <Text style={styles.detailLine}>Phòng khám: {selectedItem.roomName}</Text>
                  ) : null}
                  {selectedItem.notes || selectedItem.note ? (
                    <Text style={styles.detailLine}>
                      Ghi chú: {selectedItem.notes || selectedItem.note}
                    </Text>
                  ) : null}
                </View>

                {selectedItem.itemType === 'APPOINTMENT' &&
                selectedItem.normStatus !== 'COMPLETED' &&
                selectedItem.normStatus !== 'CANCELLED' ? (
                  <View style={styles.actionFooter}>
                    <Pressable
                      style={styles.checkInActionBtn}
                      onPress={() => {
                        const target = selectedItem;
                        setSelectedItem(null);
                        setEditingAppt(target);
                        setCheckInOpen(true);
                      }}>
                      <QrCode size={16} color="#fff" />
                      <Text style={styles.checkInActionText}>Quét QR Check-in</Text>
                    </Pressable>

                    {canEditWithinOneHour(selectedItem.createdAt) ? (
                      <Pressable
                        style={styles.editActionBtn}
                        onPress={() => {
                          const target = selectedItem;
                          setSelectedItem(null);
                          setEditingAppt(target);
                          setBookingOpen(true);
                        }}>
                        <Pencil size={15} color={Colors.primaryDark} />
                        <Text style={styles.editActionText}>Đổi lịch</Text>
                      </Pressable>
                    ) : null}

                    {canCancelBeforeOneHour(selectedItem.dateStr, selectedItem.timeStr) ? (
                      <Pressable
                        style={styles.cancelActionBtn}
                        onPress={() => setCancelModalOpen(true)}>
                        <Text style={styles.cancelActionText}>Hủy hẹn</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </KeyboardSafeView>
      </Modal>

      {/* Cancel Confirm Modal */}
      <Modal
        statusBarTranslucent
        visible={cancelModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalOpen(false)}>
        <KeyboardSafeView style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { borderRadius: 20, margin: 16 }]}>
            <Text style={styles.modalTitle}>Xác nhận hủy lịch hẹn</Text>
            <Text style={styles.cancelSub}>
              Bạn chỉ có thể hủy trước giờ hẹn tối thiểu 60 phút. Nhập lý do hủy (tùy chọn):
            </Text>
            <TextInput
              style={styles.cancelInput}
              placeholder="VD: Bận công tác đột xuất..."
              placeholderTextColor={Colors.textMuted}
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={[styles.editActionBtn, { flex: 1 }]}
                onPress={() => setCancelModalOpen(false)}>
                <Text style={styles.editActionText}>Quay lại</Text>
              </Pressable>
              <Pressable
                style={[styles.cancelConfirmBtn, { flex: 1 }]}
                disabled={cancelling}
                onPress={handleConfirmCancel}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardSafeView>
      </Modal>

      <BookingModal
        visible={bookingOpen}
        initialAppointment={editingAppt}
        onClose={() => {
          setBookingOpen(false);
          setEditingAppt(null);
        }}
        onSuccess={loadData}
      />

      <CheckInModal
        visible={checkInOpen}
        initialAppointment={editingAppt}
        onClose={() => {
          setCheckInOpen(false);
          setEditingAppt(null);
        }}
        onSuccess={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  guestBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  guestTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  guestSub: { fontSize: 13.5, color: Colors.textSecondary, textAlign: 'center', marginVertical: 10 },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  topControls: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text },
  qrBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  dateFilterBar: {
    marginTop: 10,
  },
  dateChipsRow: {
    paddingHorizontal: 14,
    gap: 7,
    alignItems: 'center',
  },
  calendarPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  dateChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  resetDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  resetDateText: { fontSize: 11.5, fontWeight: '700', color: Colors.danger },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabPillText: { fontSize: 12.5, fontWeight: '700', color: Colors.textSecondary },
  listContent: { paddingHorizontal: 14, paddingBottom: 30, gap: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 42, gap: 10 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 13.5 },
  clearFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  clearFilterText: { fontSize: 12.5, fontWeight: '800', color: Colors.primary },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeText: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.4 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardTitle: { fontSize: 15.5, fontWeight: '800', color: Colors.text, marginVertical: 7 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12.5, fontWeight: '600', color: Colors.textSecondary, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  calendarSheet: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: 18,
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthLabel: { fontSize: 15.5, fontWeight: '800', color: Colors.text },
  weekHeaderRow: { flexDirection: 'row', marginBottom: 6 },
  weekHeaderText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  calCell: {
    width: '14.28%',
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCellToday: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  calCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  calDayNum: { fontSize: 13.5, fontWeight: '600', color: Colors.text },
  calDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  calHint: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  calFooter: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  qrTicketBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: 14,
    gap: 8,
  },
  ticketCodeBig: { fontSize: 16, fontWeight: '900', color: Colors.primaryDark, letterSpacing: 0.8 },
  detailRows: { gap: 6, marginBottom: 16 },
  detailService: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  detailLine: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  actionFooter: { flexDirection: 'row', gap: 8 },
  checkInActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  checkInActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryLight,
  },
  editActionText: { color: Colors.primaryDark, fontSize: 13, fontWeight: '800' },
  cancelActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.dangerLight,
  },
  cancelActionText: { color: Colors.danger, fontSize: 13, fontWeight: '800' },
  cancelSub: { fontSize: 13, color: Colors.textSecondary, marginVertical: 10, lineHeight: 19 },
  cancelInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: Colors.text,
  },
  cancelConfirmBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

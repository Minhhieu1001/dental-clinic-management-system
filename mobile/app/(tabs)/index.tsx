import { useRouter } from 'expo-router';
import Bot from 'lucide-react-native/icons/bot';
import Calendar from 'lucide-react-native/icons/calendar';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock from 'lucide-react-native/icons/clock';
import FileText from 'lucide-react-native/icons/file-text';
import HeartPulse from 'lucide-react-native/icons/heart-pulse';
import MapPin from 'lucide-react-native/icons/map-pin';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Pill from 'lucide-react-native/icons/pill';
import Plus from 'lucide-react-native/icons/plus';
import QrCode from 'lucide-react-native/icons/qr-code';
import Receipt from 'lucide-react-native/icons/receipt';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import User from 'lucide-react-native/icons/user';
import Wallet from 'lucide-react-native/icons/wallet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingModal } from '../../src/components/BookingModal';
import { CheckInModal } from '../../src/components/CheckInModal';
import { HeaderRightActions } from '../../src/components/HeaderRightActions';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { appointmentService } from '../../src/services/appointment.service';
import { medicalRecordService } from '../../src/services/medicalRecord.service';
import { notificationService } from '../../src/services/notification.service';
import { PatientStatistics, patientService } from '../../src/services/patient.service';
import { useAppRealtime } from '../../src/services/stompClient';
import { formatDate, formatMoney } from '../../src/utils/formatters';

const APPOINTMENT_STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  CONFIRMED: { label: 'Đã xác nhận', bg: '#ecfdf5', color: '#007552' },
  PENDING: { label: 'Chờ xác nhận', bg: '#fffbeb', color: '#b45309' },
  WAITING: { label: 'Đang chờ khám', bg: '#eff6ff', color: '#1d4ed8' },
  CALLED: { label: 'Đã gọi vào phòng', bg: '#ecfdf5', color: '#009165' },
  IN_PROGRESS: { label: 'Đang khám', bg: '#eef2ff', color: '#4338ca' },
  COMPLETED: { label: 'Đã hoàn tất', bg: '#f1f5f9', color: '#334155' },
  CANCELLED: { label: 'Đã hủy', bg: '#fef2f2', color: '#dc2626' },
};

function extractDateIso(raw?: any): string {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    const [y, m = 1, d = 1] = raw;
    if (!y) return '';
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const str = String(raw).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : str.split('T')[0] || '';
}

function getLocalTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

function extractTimeStr(raw?: any): string {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    const [, , , h = 0, m = 0] = raw;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const str = String(raw).trim();
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function formatDoctorName(name?: string): string {
  if (!name) return '';
  const clean = name.replace(/^(BS\.?|Bác sĩ)\s*/i, '').trim();
  return clean ? `BS. ${clean}` : '';
}

export default function PatientDashboardScreen() {
  const router = useRouter();
  const { user, patientId } = useAuth();

  const [stats, setStats] = useState<PatientStatistics>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [apptFilter, setApptFilter] = useState<'ALL' | 'APPOINTMENT' | 'FOLLOW_UP'>('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState<any | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user || !patientId) return;
    setLoading(true);
    try {
      const [statRes, apptRes, followRes, inProgPlans, examRes, notifRes] = await Promise.all([
        patientService.getStatistics(patientId).catch(() => ({})),
        appointmentService.getByPatientId(patientId).catch(() => []),
        appointmentService.getCurrentMonthFollowUps(patientId).catch(() => []),
        medicalRecordService.getInProgressPlansByPatientId(patientId).catch(() => []),
        medicalRecordService.getExamsByPatientId(patientId).catch(() => []),
        notificationService.getByUserId(user.id).catch(() => []),
      ]);

      let finalPlans = inProgPlans;
      if (!finalPlans.length) {
        finalPlans = await medicalRecordService.getTreatmentPlansByPatientId(patientId).catch(() => []);
      }

      setStats(statRes);
      setAppointments(apptRes);
      setFollowUps(followRes);
      setPlans(finalPlans);
      setExams(examRes);
      setUnreadNotifs(notifRes.filter((n) => !n.isRead).length);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Đồng bộ Realtime Lịch hẹn & Thông báo qua WebSocket (không dùng polling)
  useAppRealtime({
    userId: user?.id,
    patientId,
    userPhone: user?.phone,
    onAppointmentRealtime: useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
    onNotificationRealtime: useCallback(
      (notif) => {
        if (notif && !notif.isRead) {
          setUnreadNotifs((c) => c + 1);
        }
        loadDashboard();
      },
      [loadDashboard]
    ),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const todayIso = getLocalTodayIso();

  const mergedUpcoming = useMemo(() => {
    // Hiển thị mọi trạng thái (kể cả Đã hoàn tất / Đã hủy) cho tới khi qua ngày hẹn mới ẩn
    const booked = appointments
      .map((a) => ({
        ...a,
        itemType: 'APPOINTMENT' as const,
        dateStr: extractDateIso(a.appointmentDate || a.appointmentTime),
        timeStr: extractTimeStr(a.appointmentTime) || extractTimeStr(a.appointmentDate),
        title: a.reason || a.serviceName || 'Khám nha khoa',
      }));

    const rechecks = followUps
      .map((f) => {
        const dPart = extractDateIso(f.followUpDate);
        return {
          ...f,
          itemType: 'FOLLOW_UP' as const,
          dateStr: dPart || '',
          timeStr: extractTimeStr(f.followUpTime) || extractTimeStr(f.followUpDate) || '08:00',
          title: f.reason || f.chiefComplaint || 'Tái khám theo chỉ định',
        };
      });

    return [...booked, ...rechecks]
      .filter((item) => !item.dateStr || item.dateStr >= todayIso)
      .sort((a, b) => `${a.dateStr} ${a.timeStr}`.localeCompare(`${b.dateStr} ${b.timeStr}`));
  }, [appointments, followUps, todayIso]);

  const filteredUpcoming = useMemo(
    () =>
      apptFilter === 'ALL'
        ? mergedUpcoming
        : mergedUpcoming.filter((i) => i.itemType === apptFilter),
    [mergedUpcoming, apptFilter]
  );

  const nextAppointment = mergedUpcoming[0] ?? null;
  const nextApptStatus =
    nextAppointment?.itemType === 'APPOINTMENT'
      ? APPOINTMENT_STATUS_META[nextAppointment.status || 'CONFIRMED'] ?? null
      : null;
  const nextApptFinished =
    nextAppointment?.status === 'COMPLETED' ||
    nextAppointment?.status === 'CANCELLED' ||
    nextAppointment?.status === false;
  const activePlan = plans[selectedPlanIdx] ?? plans[0] ?? null;

  const planProgress = useMemo(() => {
    const phases = activePlan?.phases ?? [];
    if (!phases.length) return 0;
    const done = phases.filter((p: any) => p.status === 'COMPLETED').length;
    return Math.round((done / phases.length) * 100);
  }, [activePlan]);

  const formatDateTimeLine = (item: any) => {
    const d = formatDate(item.dateStr);
    return item.timeStr ? `${item.timeStr} • ${d}` : d;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Header Xanh Ngọc phủ trọn dưới thanh trạng thái để chữ/icon luôn rõ nét */}
        <SafeAreaView edges={['top']} style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandPill}>
              <View style={styles.brandLogoCircle}>
                <Image
                  source={require('../../assets/images/crown-logo.png')}
                  style={styles.brandLogoImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandPillText}>Crown Dental</Text>
            </View>
            <HeaderRightActions
              unreadCountOverride={unreadNotifs}
              onCheckInSuccess={loadDashboard}
            />
          </View>

          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>Cổng thông tin Bệnh nhân</Text>
            <Text style={styles.userName}>
              {user ? `Xin chào, ${user.username}` : 'Xin chào'}
            </Text>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          {/* Hero Next Appointment Card */}
          <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>LỊCH HẸN SẮP TỚI GẦN NHẤT</Text>
                  </View>
                  {nextAppointment ? (
                    <View style={styles.heroRightBadges}>
                      <View
                        style={[
                          styles.relativeDayBadge,
                          nextAppointment.dateStr === todayIso
                            ? styles.relativeTodayBadge
                            : styles.relativeUpcomingBadge,
                        ]}>
                        <Text
                          style={[
                            styles.relativeDayText,
                            nextAppointment.dateStr === todayIso
                              ? styles.relativeTodayText
                              : styles.relativeUpcomingText,
                          ]}>
                          {nextAppointment.dateStr === todayIso ? 'Hôm nay' : 'Sắp tới'}
                        </Text>
                      </View>
                      {nextAppointment.appointmentCode ? (
                        <Text style={styles.heroCodeBadge}>{nextAppointment.appointmentCode}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                {loading && !nextAppointment ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
                ) : nextAppointment ? (
                  <View style={{ marginTop: 10 }}>
                    {nextApptStatus ? (
                      <View
                        style={[
                          styles.apptStatusBadge,
                          { backgroundColor: nextApptStatus.bg, alignSelf: 'flex-start', marginBottom: 6 },
                        ]}>
                        <Text style={[styles.apptStatusText, { color: nextApptStatus.color }]}>
                          {nextApptStatus.label}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.heroService}>{nextAppointment.title}</Text>
                    <View style={styles.heroMetaRow}>
                      <Clock size={14} color={Colors.primary} />
                      <Text style={styles.heroMetaText}>{formatDateTimeLine(nextAppointment)}</Text>
                    </View>
                    {nextAppointment.dentistName ? (
                      <View style={styles.heroMetaRow}>
                        <Stethoscope size={14} color={Colors.primary} />
                        <Text style={styles.heroMetaText}>
                          {formatDoctorName(nextAppointment.dentistName)}
                        </Text>
                      </View>
                    ) : null}
                    {nextAppointment.branchName ? (
                      <View style={styles.heroMetaRow}>
                        <MapPin size={14} color={Colors.primary} />
                        <Text numberOfLines={1} style={styles.heroMetaText}>
                          {nextAppointment.branchName}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.heroBtnRow}>
                      {!nextApptFinished ? (
                        <Pressable
                          style={styles.heroActionPrimary}
                          onPress={() => {
                            setCheckInTarget(nextAppointment);
                            setCheckInOpen(true);
                          }}>
                          <QrCode size={16} color="#ffffff" />
                          <Text style={styles.heroActionPrimaryText}>Quét QR Check-in</Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        style={styles.heroActionOutline}
                        onPress={() => setBookingOpen(true)}>
                        <Plus size={16} color={Colors.primary} />
                        <Text style={styles.heroActionOutlineText}>Đặt thêm lịch</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.heroEmptyText}>
                      Bạn chưa có lịch hẹn khám nào sắp tới.
                    </Text>
                    <Pressable
                      style={[styles.heroActionPrimary, { alignSelf: 'flex-start', marginTop: 12 }]}
                      onPress={() => setBookingOpen(true)}>
                      <Plus size={16} color="#ffffff" />
                      <Text style={styles.heroActionPrimaryText}>Đặt lịch khám ngay</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* 4 KPI Summary Cards */}
              <View style={styles.kpiGrid}>
                <Pressable
                  style={styles.kpiCard}
                  onPress={() => router.push('/(tabs)/appointments')}>
                  <View style={styles.kpiIconBox}>
                    <Calendar size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.kpiLabel}>Lịch hẹn</Text>
                  <Text style={styles.kpiValue}>
                    {stats.totalAppointmentsLast30Days || mergedUpcoming.length || 0}
                  </Text>
                </Pressable>

                <Pressable style={styles.kpiCard} onPress={() => router.push('/(tabs)/records')}>
                  <View style={styles.kpiIconBox}>
                    <HeartPulse size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.kpiLabel}>Phác đồ điều trị</Text>
                  <Text style={styles.kpiValue}>
                    {stats.inProgressTreatmentPlans ?? stats.totalTreatmentPlans ?? plans.length}
                  </Text>
                </Pressable>

                <Pressable style={styles.kpiCard} onPress={() => router.push('/(tabs)/records')}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#e0f2fe' }]}>
                    <Pill size={18} color={Colors.info} />
                  </View>
                  <Text style={styles.kpiLabel}>Đơn thuốc</Text>
                  <Text style={styles.kpiValue}>{stats.totalPrescriptions ?? 0}</Text>
                </Pressable>

                <Pressable style={styles.kpiCard} onPress={() => router.push('/(tabs)/invoices')}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#fef2f2' }]}>
                    <Wallet size={18} color={Colors.danger} />
                  </View>
                  <Text style={styles.kpiLabel}>Cần thanh toán</Text>
                  <Text numberOfLines={1} style={[styles.kpiValue, { fontSize: 15, color: Colors.danger }]}>
                    {formatMoney(stats.totalOutstandingDebt ?? 0)}
                  </Text>
                </Pressable>
              </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionTitle}>Tiện ích nhanh</Text>
          <View style={styles.quickGrid}>
            {[
              {
                label: 'Đặt lịch khám',
                icon: Plus,
                action: () => setBookingOpen(true),
              },
              {
                label: 'Quét QR Check-in',
                icon: QrCode,
                action: () => {
                  setCheckInTarget(nextApptFinished ? null : nextAppointment);
                  setCheckInOpen(true);
                },
              },
              {
                label: 'Trợ lý AI 24/7',
                icon: Bot,
                action: () => router.push('/ai-chat' as any),
              },
              { label: 'Bệnh án & Đơn thuốc', icon: FileText, action: () => router.push('/(tabs)/records') },
              { label: 'Hóa đơn viện phí', icon: Receipt, action: () => router.push('/(tabs)/invoices') },
              { label: 'Tài khoản & BH', icon: User, action: () => router.push('/profile') },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Pressable key={item.label} style={styles.quickItem} onPress={item.action}>
                  <View style={styles.quickIcon}>
                    <Icon size={20} color={Colors.primary} />
                  </View>
                  <Text numberOfLines={2} style={styles.quickLabel}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Active Treatment Plan Section */}
          {user && activePlan ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionCardTitle}>Tiến độ Kế hoạch điều trị</Text>
                <Pressable onPress={() => router.push('/(tabs)/records')}>
                  <Text style={styles.seeAllText}>Chi tiết</Text>
                </Pressable>
              </View>

              {plans.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, marginBottom: 10 }}>
                  {plans.map((p, idx) => (
                    <Pressable
                      key={p.id || idx}
                      style={[
                        styles.filterPill,
                        selectedPlanIdx === idx && styles.filterPillActive,
                      ]}
                      onPress={() => setSelectedPlanIdx(idx)}>
                      <Text
                        style={[
                          styles.filterPillText,
                          selectedPlanIdx === idx && { color: '#fff' },
                        ]}>
                        {p.planName || `Phác đồ ${idx + 1}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              <Text style={styles.planTitle}>{activePlan.planName || 'Phác đồ điều trị nha khoa'}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${planProgress}%` }]} />
                </View>
                <Text style={styles.progressPct}>{planProgress}%</Text>
              </View>

              {(activePlan.phases ?? []).slice(0, 4).map((phase: any, idx: number) => (
                <View key={phase.id || idx} style={styles.phaseRow}>
                  <View
                    style={[
                      styles.phaseDot,
                      phase.status === 'COMPLETED' && { backgroundColor: Colors.primary },
                      phase.status === 'IN_PROGRESS' && { backgroundColor: Colors.accent },
                    ]}
                  />
                  <Text numberOfLines={1} style={styles.phaseName}>
                    {String(phase.phaseName || `Giai đoạn ${idx + 1}`).replace(/[:\s]+$/, '')}
                  </Text>
                  <Text style={styles.phaseStatus}>
                    {phase.status === 'COMPLETED'
                      ? 'Hoàn tất'
                      : phase.status === 'IN_PROGRESS'
                        ? 'Đang điều trị'
                        : 'Chờ thực hiện'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Upcoming Appointments List */}
          {user ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionCardTitle}>Lịch hẹn & Tái khám</Text>
                <Pressable onPress={() => router.push('/(tabs)/appointments')}>
                  <Text style={styles.seeAllText}>Tất cả</Text>
                </Pressable>
              </View>

              <View style={styles.tabPillRow}>
                {(
                  [
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'APPOINTMENT', label: 'Lịch hẹn' },
                    { key: 'FOLLOW_UP', label: 'Tái khám' },
                  ] as const
                ).map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.filterPill, apptFilter === t.key && styles.filterPillActive]}
                    onPress={() => setApptFilter(t.key)}>
                    <Text
                      style={[styles.filterPillText, apptFilter === t.key && { color: '#fff' }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {filteredUpcoming.length === 0 ? (
                <Text style={styles.emptySmall}>Không có lịch hẹn nào trong mục này.</Text>
              ) : (
                filteredUpcoming.slice(0, 4).map((item, idx) => {
                  const apptStatus =
                    item.itemType === 'APPOINTMENT'
                      ? APPOINTMENT_STATUS_META[item.status || 'CONFIRMED'] || {
                          label: item.status || 'Đã xác nhận',
                          bg: '#f1f5f9',
                          color: '#334155',
                        }
                      : null;

                  return (
                    <Pressable
                      key={item.id || idx}
                      style={styles.listRow}
                      onPress={() => router.push('/(tabs)/appointments')}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.listTagsWrap}>
                          <Text
                            style={[
                              styles.typeTag,
                              item.itemType === 'FOLLOW_UP' && {
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                              },
                            ]}>
                            {item.itemType === 'FOLLOW_UP' ? 'Tái khám' : 'Lịch hẹn'}
                          </Text>
                          {apptStatus ? (
                            <View style={[styles.apptStatusBadge, { backgroundColor: apptStatus.bg }]}>
                              <Text style={[styles.apptStatusText, { color: apptStatus.color }]}>
                                {apptStatus.label}
                              </Text>
                            </View>
                          ) : null}
                          {item.dateStr === todayIso ? (
                            <View style={[styles.relativeDayBadge, styles.relativeTodayBadge]}>
                              <Text style={[styles.relativeDayText, styles.relativeTodayText]}>
                                Hôm nay
                              </Text>
                            </View>
                          ) : null}
                          <Text style={styles.listDate}>{formatDateTimeLine(item)}</Text>
                        </View>
                        <Text numberOfLines={1} style={styles.listTitle}>
                          {item.title}
                        </Text>
                        {item.branchName || item.dentistName ? (
                          <Text numberOfLines={1} style={styles.listSub}>
                            {item.dentistName ? `${formatDoctorName(item.dentistName)} • ` : ''}
                            {item.branchName || ''}
                          </Text>
                        ) : null}
                      </View>
                      <ChevronRight size={18} color={Colors.textMuted} />
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}

          {/* Recent Clinical History */}
          {user && exams.length > 0 ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionCardTitle}>Lịch sử khám gần đây</Text>
                <Pressable onPress={() => router.push('/(tabs)/records')}>
                  <Text style={styles.seeAllText}>Xem hồ sơ</Text>
                </Pressable>
              </View>
              {exams.slice(0, 3).map((ex: any, idx: number) => (
                <View key={ex.id || idx} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listDate}>{formatDate(ex.examinationDate || ex.createdAt)}</Text>
                    <Text style={styles.listTitle}>
                      {ex.chiefComplaint || 'Khám lâm sàng nha khoa'}
                    </Text>
                    <Text style={styles.listSub}>
                      {ex.dentistName ? formatDoctorName(ex.dentistName) : 'Bác sĩ điều trị'}
                      {ex.branchName ? ` • ${ex.branchName}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Nút nổi Trợ lý ảo AI 24/7 đồng bộ Web */}
      <Pressable
        style={styles.floatingAiBtn}
        onPress={() => router.push('/ai-chat' as any)}
        accessibilityLabel="Mở Trợ lý ảo AI">
        <Bot size={24} color="#ffffff" />
        <View style={styles.floatingAiOnlineDot} />
      </Pressable>

      <BookingModal
        visible={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSuccess={loadDashboard}
      />

      <CheckInModal
        visible={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSuccess={loadDashboard}
        initialAppointment={checkInTarget}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 32 },
  headerBanner: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 42,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingRight: 11,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 999,
  },
  brandLogoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImg: {
    width: 18,
    height: 18,
  },
  brandPillText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  floatingAiBtn: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1f4fb2',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingAiOnlineDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34d399',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  greetingBlock: { marginTop: 12 },
  greetingSub: { fontSize: 12, fontWeight: '600', color: Colors.onPrimaryMuted },
  userName: { fontSize: 21, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  body: { paddingHorizontal: 16, marginTop: -26 },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    shadowColor: '#009165',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  guestTitle: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  guestSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: { fontSize: 10.5, fontWeight: '800', color: Colors.primary, letterSpacing: 0.4 },
  heroRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relativeDayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  relativeTodayBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  relativeUpcomingBadge: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryBorder,
  },
  relativeDayText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  relativeTodayText: {
    color: '#b45309',
  },
  relativeUpcomingText: {
    color: Colors.primaryDark,
  },
  heroCodeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroService: { fontSize: 16.5, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  heroMetaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', flex: 1 },
  heroEmptyText: { fontSize: 13.5, color: Colors.textSecondary },
  heroBtnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  heroActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
  },
  heroActionPrimaryText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  heroActionOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1.2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
  },
  heroActionOutlineText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  kpiCard: {
    width: '48.3%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  kpiValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  quickItem: {
    width: '31.2%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontSize: 11.5, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionCardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  seeAllText: { fontSize: 12.5, fontWeight: '700', color: Colors.primary },
  planTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressPct: { fontSize: 12.5, fontWeight: '800', color: Colors.primary },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  phaseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1' },
  phaseName: { flex: 1, fontSize: 12.5, fontWeight: '600', color: Colors.text },
  phaseStatus: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  tabPillRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPillText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  emptySmall: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 14 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  listTagsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeTag: {
    fontSize: 10.5,
    fontWeight: '800',
    backgroundColor: Colors.primaryLight,
    color: Colors.primaryDark,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  apptStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  apptStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  listDate: { fontSize: 11.5, fontWeight: '700', color: Colors.textSecondary },
  listTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 3 },
  listSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

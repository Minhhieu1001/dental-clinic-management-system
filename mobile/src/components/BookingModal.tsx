import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import X from 'lucide-react-native/icons/x';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  APPOINTMENT_REASONS,
  BOOKABLE_SLOT_TIMES,
  REASON_CATEGORIES,
} from '../constants/appointmentReasons';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useSuccessModal } from '../contexts/SuccessModalContext';
import { DentistItem, appointmentService } from '../services/appointment.service';
import { resolveMediaUrl } from '../services/chat.service';
import { BranchItem, clinicService } from '../services/clinic.service';
import { patientService } from '../services/patient.service';

import { KeyboardSafeView } from './KeyboardSafeView';
interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAppointment?: any | null;
}

function DentistAvatarView({
  avatar,
  fullName,
  selected,
  size = 44,
}: {
  avatar?: string;
  fullName: string;
  selected?: boolean;
  size?: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  const resolved = avatar ? resolveMediaUrl(avatar) : '';
  const initial = (fullName.trim().split(/\s+/).pop() || 'B').charAt(0).toUpperCase();

  if (resolved && !imgErr) {
    return (
      <Image
        source={{ uri: resolved }}
        onError={() => setImgErr(true)}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.primarySoft,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? Colors.primary : Colors.border,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.dentistAvatar,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.dentistAvatarActive,
      ]}>
      <Text style={[styles.dentistAvatarText, selected && { color: '#ffffff' }]}>{initial}</Text>
    </View>
  );
}

function getNext14Days(): Array<{ iso: string; dayLabel: string; dateLabel: string }> {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const result = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    result.push({
      iso,
      dayLabel: i === 0 ? 'H.Nay' : days[d.getDay()],
      dateLabel: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}`,
    });
  }
  return result;
}

export function BookingModal({
  visible,
  onClose,
  onSuccess,
  initialAppointment,
}: BookingModalProps) {
  const { user, patientId } = useAuth();
  const { showSuccess } = useSuccessModal();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [category, setCategory] = useState<string>('ALL');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [customReasonText, setCustomReasonText] = useState('');

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [dentists, setDentists] = useState<DentistItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');

  const upcomingDays = useMemo(() => getNext14Days(), []);
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0]?.iso ?? '');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    setStep(1);
    setLoadingMeta(true);

    Promise.all([
      clinicService.getBranches().catch(() => []),
      appointmentService.getDentistsList().catch(() => []),
      patientId ? patientService.getById(patientId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([branchList, dentistList, patientProfile]) => {
        const activeBranches = branchList.filter((b) => !b.status || b.status === 'ACTIVE');
        setBranches(activeBranches);
        setDentists(dentistList);

        if (initialAppointment) {
          setSelectedReason(initialAppointment.reason || initialAppointment.serviceName || '');
          setIsCustomReason(false);
          setSelectedBranchId(initialAppointment.branchId || activeBranches[0]?.branchId || '');
          setSelectedDentistId(initialAppointment.dentistId || '');
          setSelectedDate(
            (initialAppointment.appointmentDate || '').split('T')[0] || upcomingDays[0]?.iso
          );
          setSelectedTime((initialAppointment.appointmentTime || '').slice(0, 5));
          setFullName(initialAppointment.patientName || user?.username || '');
          setPhone(initialAppointment.phone || user?.phone || '');
          setEmail(initialAppointment.email || user?.email || '');
          setNotes(initialAppointment.notes || '');
        } else {
          setSelectedReason(APPOINTMENT_REASONS[0]?.reasonName ?? '');
          setIsCustomReason(false);
          setCustomReasonText('');
          setSelectedBranchId(activeBranches[0]?.branchId || '');
          setSelectedDentistId('');
          setSelectedDate(upcomingDays[0]?.iso ?? '');
          setSelectedTime('');
          setFullName(patientProfile?.fullName || user?.username || '');
          setPhone(patientProfile?.phone || patientProfile?.phoneNumber || user?.phone || '');
          setEmail(patientProfile?.email || user?.email || '');
          setNotes('');
        }
      })
      .finally(() => setLoadingMeta(false));
  }, [visible, initialAppointment, patientId, user, upcomingDays]);

  useEffect(() => {
    if (!visible || step !== 3 || !selectedDentistId || !selectedDate) {
      setBookedTimes([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    appointmentService
      .getDentistBookedTimesByDate(selectedDentistId, selectedDate, initialAppointment?.id)
      .then((list) => {
        if (!cancelled) setBookedTimes(list);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, step, selectedDentistId, selectedDate, initialAppointment?.id]);

  const filteredReasons = useMemo(
    () =>
      category === 'ALL'
        ? APPOINTMENT_REASONS
        : APPOINTMENT_REASONS.filter((r) => r.category === category),
    [category]
  );

  const filteredDentists = useMemo(
    () =>
      dentists.filter((d) => !selectedBranchId || !d.branchId || d.branchId === selectedBranchId),
    [dentists, selectedBranchId]
  );

  const finalReason = isCustomReason ? customReasonText.trim() : selectedReason.trim();
  const chosenBranch = branches.find((b) => b.branchId === selectedBranchId);
  const chosenDentist = dentists.find((d) => d.id === selectedDentistId);

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!finalReason) {
        setError('Vui lòng chọn dịch vụ hoặc nhập lý do khám');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedBranchId) {
        setError('Vui lòng chọn cơ sở phòng khám');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedDate || !selectedTime) {
        setError('Vui lòng chọn ngày khám và khung giờ hẹn');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setError('');

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên bệnh nhân');
      return;
    }
    if (!phone.trim() || !/^(?:0|\+?84)[0-9]{9}$/.test(phone.trim())) {
      setError('Số điện thoại không hợp lệ');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Vui lòng nhập Email hợp lệ để nhận mã lịch hẹn');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        requestId: null,
        patientId: patientId ?? null,
        branchId: selectedBranchId || null,
        branchName: chosenBranch?.branchName ?? null,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        dentistId: selectedDentistId || null,
        roomId: null,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason: finalReason,
        notes: notes.trim(),
        status: initialAppointment?.status || 'CONFIRMED',
      };

      let saved: any;
      if (initialAppointment?.id) {
        saved = await appointmentService.updateAppointment(initialAppointment.id, payload);
      } else {
        saved = await appointmentService.createAppointment(payload);
      }
      onSuccess();
      onClose();
      showSuccess({
        title: initialAppointment?.id ? 'Đổi lịch hẹn thành công!' : 'Đặt lịch khám thành công!',
        message: `${saved?.appointmentCode ? `Mã hẹn: ${saved.appointmentCode} • ` : ''}${selectedTime} ngày ${selectedDate} tại ${chosenBranch?.branchName || 'Crown Dental'}.`,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể lưu lịch hẹn. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal statusBarTranslucent visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardSafeView style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {initialAppointment ? 'Đổi lịch hẹn khám' : 'Đặt lịch khám mới'}
              </Text>
              <Text style={styles.stepSubtitle}>Bước {step}/4</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.text} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <CircleAlert size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loadingMeta ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Đang tải dữ liệu phòng khám...</Text>
            </View>
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* STEP 1: REASON */}
              {step === 1 && (
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catRow}>
                    {REASON_CATEGORIES.map((cat) => {
                      const active = !isCustomReason && category === cat.key;
                      return (
                        <Pressable
                          key={cat.key}
                          style={[styles.catChip, active && styles.catChipActive]}
                          onPress={() => {
                            setIsCustomReason(false);
                            setCategory(cat.key);
                          }}>
                          <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      style={[styles.catChip, isCustomReason && styles.catChipActive]}
                      onPress={() => setIsCustomReason(true)}>
                      <Text
                        style={[styles.catChipText, isCustomReason && styles.catChipTextActive]}>
                        Lý do khác
                      </Text>
                    </Pressable>
                  </ScrollView>

                  {isCustomReason ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.label}>NHẬP LÝ DO KHÁM CỦA BẠN</Text>
                      <TextInput
                        style={styles.textArea}
                        multiline
                        placeholder="Mô tả triệu chứng (VD: Đau răng hàm dưới, sưng lợi...)"
                        placeholderTextColor={Colors.textMuted}
                        value={customReasonText}
                        onChangeText={setCustomReasonText}
                      />
                    </View>
                  ) : (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {filteredReasons.map((item) => {
                        const selected = selectedReason === item.reasonName;
                        return (
                          <Pressable
                            key={item.id}
                            style={[styles.optionCard, selected && styles.optionCardSelected]}
                            onPress={() => setSelectedReason(item.reasonName)}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.optionTitle}>{item.reasonName}</Text>
                              <Text numberOfLines={2} style={styles.optionDesc}>
                                {item.description}
                              </Text>
                            </View>
                            {selected ? <Check size={18} color={Colors.primary} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* STEP 2: BRANCH & DENTIST */}
              {step === 2 && (
                <View>
                  <Text style={styles.label}>CHỌN CƠ SỞ PHÒNG KHÁM</Text>
                  <View style={{ gap: 8 }}>
                    {branches.map((b) => {
                      const selected = b.branchId === selectedBranchId;
                      return (
                        <Pressable
                          key={b.branchId}
                          style={[styles.optionCard, selected && styles.optionCardSelected]}
                          onPress={() => {
                            setSelectedBranchId(b.branchId);
                            setSelectedDentistId('');
                          }}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.optionTitle}>{b.branchName}</Text>
                            {b.address ? <Text style={styles.optionDesc}>{b.address}</Text> : null}
                          </View>
                          {selected ? <Check size={18} color={Colors.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.label, { marginTop: 16 }]}>CHỌN BÁC SĨ (TÙY CHỌN)</Text>
                  <View style={{ gap: 8 }}>
                    <Pressable
                      style={[styles.optionCard, !selectedDentistId && styles.optionCardSelected]}
                      onPress={() => setSelectedDentistId('')}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>Phòng khám sắp xếp bác sĩ phù hợp</Text>
                        <Text style={styles.optionDesc}>Ưu tiên khung giờ trống nhanh nhất</Text>
                      </View>
                      {!selectedDentistId ? <Check size={18} color={Colors.primary} /> : null}
                    </Pressable>

                    {filteredDentists.length === 0 ? (
                      <Text style={styles.optionDesc}>
                        Chưa có bác sĩ tại cơ sở này — phòng khám sẽ sắp xếp cho bạn.
                      </Text>
                    ) : null}

                    {filteredDentists.map((d) => {
                      const selected = d.id === selectedDentistId;
                      return (
                        <Pressable
                          key={d.id}
                          style={[styles.optionCard, selected && styles.optionCardSelected]}
                          onPress={() => setSelectedDentistId(d.id)}>
                          <DentistAvatarView
                            avatar={d.avatar}
                            fullName={d.fullName}
                            selected={selected}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.optionTitle}>BS. {d.fullName}</Text>
                            <Text style={styles.optionDesc} numberOfLines={2}>
                              {d.specialization}
                              {d.experienceYears ? ` • ${d.experienceYears} năm kinh nghiệm` : ''}
                            </Text>
                          </View>
                          {selected ? <Check size={18} color={Colors.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* STEP 3: DATE & TIME */}
              {step === 3 && (
                <View>
                  <Text style={styles.label}>CHỌN NGÀY KHÁM</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {upcomingDays.map((d) => {
                      const active = selectedDate === d.iso;
                      return (
                        <Pressable
                          key={d.iso}
                          style={[styles.dateChip, active && styles.dateChipActive]}
                          onPress={() => {
                            setSelectedDate(d.iso);
                            setSelectedTime('');
                          }}>
                          <Text style={[styles.dateDayText, active && styles.dateTextActive]}>
                            {d.dayLabel}
                          </Text>
                          <Text style={[styles.dateNumText, active && styles.dateTextActive]}>
                            {d.dateLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Text style={[styles.label, { marginTop: 16 }]}>CHỌN KHUNG GIỜ HẸN</Text>
                  {loadingSlots ? (
                    <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
                  ) : (
                    <View style={styles.slotGrid}>
                      {BOOKABLE_SLOT_TIMES.map((time) => {
                        const isBooked = bookedTimes.includes(time);
                        const active = selectedTime === time;
                        return (
                          <Pressable
                            key={time}
                            disabled={isBooked}
                            style={[
                              styles.slotBtn,
                              active && styles.slotBtnActive,
                              isBooked && styles.slotBtnBooked,
                            ]}
                            onPress={() => setSelectedTime(time)}>
                            <Text
                              style={[
                                styles.slotText,
                                active && styles.slotTextActive,
                                isBooked && styles.slotTextBooked,
                              ]}>
                              {time}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* STEP 4: CONFIRM */}
              {step === 4 && (
                <View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>{finalReason}</Text>
                    <Text style={styles.summaryLine}>
                      Cơ sở: {chosenBranch?.branchName ?? '—'}
                    </Text>
                    {chosenDentist ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 }}>
                        <DentistAvatarView
                          avatar={chosenDentist.avatar}
                          fullName={chosenDentist.fullName}
                          selected
                          size={32}
                        />
                        <Text style={styles.summaryLine}>BS. {chosenDentist.fullName}</Text>
                      </View>
                    ) : (
                      <Text style={styles.summaryLine}>Bác sĩ: Phòng khám sắp xếp</Text>
                    )}
                    <Text style={styles.summaryLine}>
                      Thời gian: {selectedTime} • Ngày {selectedDate}
                    </Text>
                  </View>

                  <Text style={styles.label}>HỌ VÀ TÊN *</Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nguyễn Văn A"
                  />

                  <Text style={styles.label}>SỐ ĐIỆN THOẠI *</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="0912345678"
                  />

                  <Text style={styles.label}>EMAIL NHẬN PHIẾU HẸN *</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="patient@gmail.com"
                  />

                  <Text style={styles.label}>GHI CHÚ THÊM</Text>
                  <TextInput
                    style={[styles.textArea, { height: 76 }]}
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Lưu ý dị ứng thuốc hoặc yêu cầu riêng (nếu có)..."
                  />
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {step > 1 ? (
              <Pressable
                style={styles.secondaryBtn}
                disabled={submitting}
                onPress={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}>
                <ChevronLeft size={18} color={Colors.text} />
                <Text style={styles.secondaryBtnText}>Quay lại</Text>
              </Pressable>
            ) : null}

            {step < 4 ? (
              <Pressable style={styles.primaryBtn} onPress={handleNext}>
                <Text style={styles.primaryBtnText}>Tiếp tục</Text>
                <ChevronRight size={18} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
                disabled={submitting}
                onPress={handleSubmit}>
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {initialAppointment ? 'Lưu thay đổi' : 'Xác nhận đặt lịch'}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  stepSubtitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { marginTop: 12 },
  centerBox: { padding: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: Colors.textSecondary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  errorText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: Colors.danger },
  catRow: { gap: 8, paddingVertical: 4 },
  catChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.textSecondary },
  catChipTextActive: { color: '#ffffff' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  dentistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dentistAvatarActive: { backgroundColor: Colors.primary },
  dentistAvatarText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  optionDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, lineHeight: 17 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  textArea: {
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  dateChip: {
    width: 64,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDayText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  dateNumText: { fontSize: 13, fontWeight: '800', color: Colors.text, marginTop: 3 },
  dateTextActive: { color: '#ffffff' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  slotBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotBtnBooked: { backgroundColor: '#f1f5f9', opacity: 0.45 },
  slotText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  slotTextActive: { color: '#ffffff' },
  slotTextBooked: { textDecorationLine: 'line-through', color: Colors.textMuted },
  summaryBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: 8,
    gap: 4,
  },
  summaryTitle: { fontSize: 14.5, fontWeight: '800', color: Colors.primaryDark },
  summaryLine: { fontSize: 12.5, color: Colors.text, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  primaryBtnText: { fontSize: 14.5, fontWeight: '800', color: '#ffffff' },
});

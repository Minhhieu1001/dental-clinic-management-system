import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import Building2 from 'lucide-react-native/icons/building-2';
import Camera from 'lucide-react-native/icons/camera';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import ScanLine from 'lucide-react-native/icons/scan-line';
import X from 'lucide-react-native/icons/x';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useSuccessModal } from '../contexts/SuccessModalContext';
import { appointmentService } from '../services/appointment.service';
import { BranchItem, clinicService } from '../services/clinic.service';
import { patientService } from '../services/patient.service';
import { KeyboardSafeView } from './KeyboardSafeView';

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAppointment?: any | null;
}

interface ParsedQrCheckinData {
  branchId: string;
  appointmentCode?: string;
  phone?: string;
  fullName?: string;
}

function getQueryParam(queryString: string, key: string): string {
  const regex = new RegExp(`(?:^|[?&])${key}=([^&#]*)`, 'i');
  const match = queryString.match(regex);
  if (!match?.[1]) return '';
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
  } catch {
    return match[1].trim();
  }
}

/**
 * Giải mã QR đặt tại quầy lễ tân (VD: `https://.../checkin?branchId=CN01&code=APT-...`)
 */
function parseCounterQrData(raw: string, branches: BranchItem[]): ParsedQrCheckinData | null {
  const text = (raw || '').trim();
  if (!text) return null;

  // 1. Trường hợp QR là URL `/checkin?branchId=...` (giống CheckinQrModal trên Web)
  const qIndex = text.indexOf('?');
  if (qIndex >= 0) {
    const query = text.slice(qIndex);
    const branchId = getQueryParam(query, 'branchId') || getQueryParam(query, 'branch');
    if (branchId) {
      return {
        branchId,
        appointmentCode:
          getQueryParam(query, 'code') || getQueryParam(query, 'appointmentCode') || undefined,
        phone: getQueryParam(query, 'phone') || getQueryParam(query, 'sdt') || undefined,
        fullName: getQueryParam(query, 'name') || getQueryParam(query, 'fullName') || undefined,
      };
    }
  }

  // 2. Trường hợp QR chứa JSON `{"branchId":"..."}`
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text);
      if (obj?.branchId) {
        return {
          branchId: String(obj.branchId).trim(),
          appointmentCode: obj.appointmentCode || obj.code || undefined,
          phone: obj.phone || undefined,
          fullName: obj.fullName || obj.name || undefined,
        };
      }
    } catch {
      // ignore invalid json
    }
  }

  // 3. Trường hợp QR chứa trực tiếp mã chi nhánh khớp danh sách chi nhánh đang hoạt động
  const matchedBranch = branches.find(
    (b) => b.branchId.toLowerCase() === text.toLowerCase()
  );
  if (matchedBranch) {
    return { branchId: matchedBranch.branchId };
  }

  return null;
}

function getLocalTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function CheckInModal({
  visible,
  onClose,
  onSuccess,
  initialAppointment,
}: CheckInModalProps) {
  const { user, patientId } = useAuth();
  const { showSuccess } = useSuccessModal();
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<'SCAN' | 'FORM'>('SCAN');
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [patientProfileName, setPatientProfileName] = useState('');
  const [patientProfilePhone, setPatientProfilePhone] = useState('');

  const [scannedBranchId, setScannedBranchId] = useState('');
  const [appointmentCode, setAppointmentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [scanError, setScanError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scanLockedRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    scanLockedRef.current = false;
    setStep('SCAN');
    setScannedBranchId('');
    setScanError('');
    setFormError('');
    setAppointmentCode(initialAppointment?.appointmentCode || '');
    setFullName(initialAppointment?.patientName || user?.username || '');
    setPhone(initialAppointment?.phone || user?.phone || '');

    Promise.all([
      clinicService.getBranches().catch(() => []),
      patientId ? appointmentService.getByPatientId(patientId).catch(() => []) : Promise.resolve([]),
      patientId ? patientService.getById(patientId).catch(() => null) : Promise.resolve(null),
    ]).then(([branchList, apptList, profile]) => {
      setBranches(branchList.filter((b) => !b.status || b.status === 'ACTIVE'));
      setMyAppointments(Array.isArray(apptList) ? apptList : []);
      if (profile?.fullName) {
        setPatientProfileName(profile.fullName);
        setFullName((prev) => prev || profile.fullName);
      }
      const pPhone = profile?.phone || profile?.phoneNumber || '';
      if (pPhone) {
        setPatientProfilePhone(pPhone);
        setPhone((prev) => prev || pPhone);
      }
    });
  }, [visible, initialAppointment, user, patientId]);

  const scannedBranch = useMemo(
    () => branches.find((b) => b.branchId === scannedBranchId),
    [branches, scannedBranchId]
  );

  // Các lịch hẹn hợp lệ để gợi ý điền nhanh ở chi nhánh vừa quét
  const candidateAppointments = useMemo(() => {
    const today = getLocalTodayIso();
    return myAppointments.filter((a) => {
      if (!a?.appointmentCode) return false;
      if (a.status === 'CANCELLED' || a.status === 'COMPLETED') return false;
      const d = String(a.appointmentDate || '').split('T')[0];
      const fromToday = !d || d >= today;
      const sameBranch = !scannedBranchId || !a.branchId || a.branchId === scannedBranchId;
      return fromToday && sameBranch;
    });
  }, [myAppointments, scannedBranchId]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanLockedRef.current || step !== 'SCAN') return;
    scanLockedRef.current = true;

    const parsed = parseCounterQrData(result.data, branches);
    if (!parsed?.branchId) {
      setScanError(
        'Mã QR không hợp lệ. Vui lòng quét đúng mã QR Tự Check-in đặt tại quầy Lễ tân phòng khám.'
      );
      setTimeout(() => {
        scanLockedRef.current = false;
      }, 1800);
      return;
    }

    setScanError('');
    setFormError('');
    setScannedBranchId(parsed.branchId);

    // Ưu tiên thông tin từ QR -> initialAppointment -> lịch hẹn hôm nay tại chi nhánh vừa quét
    const today = getLocalTodayIso();
    const matchedToday = myAppointments.find(
      (a) =>
        a?.appointmentCode &&
        a.status !== 'CANCELLED' &&
        a.status !== 'COMPLETED' &&
        (!a.branchId || a.branchId === parsed.branchId) &&
        String(a.appointmentDate || '').split('T')[0] === today
    );

    const nextCode =
      parsed.appointmentCode ||
      (initialAppointment?.branchId === parsed.branchId
        ? initialAppointment?.appointmentCode
        : '') ||
      matchedToday?.appointmentCode ||
      initialAppointment?.appointmentCode ||
      '';

    setAppointmentCode(nextCode ? String(nextCode).toUpperCase() : '');
    setFullName(
      parsed.fullName ||
        initialAppointment?.patientName ||
        matchedToday?.patientName ||
        patientProfileName ||
        user?.username ||
        ''
    );
    setPhone(
      parsed.phone ||
        initialAppointment?.phone ||
        matchedToday?.phone ||
        patientProfilePhone ||
        user?.phone ||
        ''
    );
    setStep('FORM');
  };

  const handleRescan = () => {
    scanLockedRef.current = false;
    setScanError('');
    setFormError('');
    setScannedBranchId('');
    setStep('SCAN');
  };

  const handleApplyCandidate = (apt: any) => {
    setAppointmentCode(String(apt.appointmentCode || '').toUpperCase());
    if (apt.patientName) setFullName(apt.patientName);
    if (apt.phone) setPhone(apt.phone);
    setFormError('');
  };

  const handleCheckInSubmit = async () => {
    if (submitting) return;
    setFormError('');

    if (!scannedBranchId) {
      setFormError('Vui lòng quét mã QR tại quầy Lễ tân trước khi check-in.');
      return;
    }
    if (!appointmentCode.trim()) {
      setFormError('Vui lòng nhập Mã lịch hẹn (VD: APT-123456)');
      return;
    }
    if (!fullName.trim()) {
      setFormError('Vui lòng nhập Họ và tên bệnh nhân');
      return;
    }
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || !/^(?:0|\+?84)[0-9]{9}$/.test(cleanPhone)) {
      setFormError('Số điện thoại không đúng định dạng (10 chữ số)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await appointmentService.checkIn({
        appointmentCode: appointmentCode.trim().toUpperCase(),
        fullName: fullName.trim(),
        phone: cleanPhone,
        branchId: scannedBranchId,
      });

      onSuccess?.();
      onClose();
      showSuccess({
        title: res?.alreadyCheckedIn ? 'Lịch hẹn đã được tiếp nhận' : 'Check-in thành công!',
        message: res?.alreadyCheckedIn
          ? 'Lịch hẹn này đã được check-in trước đó. Quý khách vui lòng theo hướng dẫn của lễ tân.'
          : `Đã xác nhận lịch hẹn ${appointmentCode
              .trim()
              .toUpperCase()} tại ${scannedBranch?.branchName || 'phòng khám'}. Quý khách vui lòng ngồi chờ tại sảnh để bác sĩ gọi tên.`,
      });
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
          'Không thể check-in. Vui lòng kiểm tra lại Mã lịch hẹn hoặc cơ sở phòng khám.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      statusBarTranslucent
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardSafeView style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {step === 'SCAN' ? 'Quét mã QR tại Quầy Lễ tân' : 'Xác nhận Check-in Lịch hẹn'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'SCAN'
                  ? ' Bước 1/2 • Hướng camera vào bảng QR tại quầy tiếp đón'
                  : ' Bước 2/2 • Kiểm tra thông tin lịch khám để tiếp nhận tự động'}
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={20} color={Colors.text} />
            </Pressable>
          </View>

          {step === 'SCAN' ? (
            <View style={styles.scanContainer}>
              {!permission ? (
                <View style={styles.permBox}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : !permission.granted ? (
                <View style={styles.permBox}>
                  <View style={styles.permIconCircle}>
                    <Camera size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.permTitle}>Cho phép sử dụng Máy ảnh</Text>
                  <Text style={styles.permDesc}>
                    Ứng dụng cần mở Camera để quét mã QR Check-in đặt tại quầy Lễ tân khi bạn đến phòng khám.
                  </Text>
                  <Pressable style={styles.submitBtn} onPress={requestPermission}>
                    <Text style={styles.submitBtnText}>Cấp quyền Máy ảnh</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.cameraBox}>
                    <CameraView
                      style={styles.cameraView}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={handleBarcodeScanned}
                    />
                    <View style={styles.viewfinderOverlay}>
                      <View style={styles.viewfinderFrame}>
                        <ScanLine size={34} color="#00e6a0" />
                      </View>
                      <Text style={styles.cameraHint}>
                        Đặt mã QR Tự Check-in tại quầy Lễ tân vào khung hình
                      </Text>
                    </View>
                  </View>

                  {scanError ? (
                    <View style={[styles.errorBox, { marginTop: 12 }]}>
                      <CircleAlert size={16} color={Colors.danger} />
                      <Text style={styles.errorText}>{scanError}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Banner chi nhánh đã quét QR */}
              <View style={styles.branchVerifiedCard}>
                <View style={styles.branchIconWrap}>
                  <Building2 size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.branchVerifiedLabel}>ĐÃ QUÉT MÃ TẠI QUẦY TIẾP ĐÓN</Text>
                  <Text style={styles.branchVerifiedName}>
                    {scannedBranch?.branchName || `Cơ sở: ${scannedBranchId}`}
                  </Text>
                  {scannedBranch?.address ? (
                    <Text numberOfLines={1} style={styles.branchVerifiedAddr}>
                      {scannedBranch.address}
                    </Text>
                  ) : null}
                </View>
                <Pressable style={styles.rescanBtn} onPress={handleRescan}>
                  <RotateCcw size={14} color={Colors.primaryDark} />
                  <Text style={styles.rescanText}>Quét lại</Text>
                </Pressable>
              </View>

              {formError ? (
                <View style={styles.errorBox}>
                  <CircleAlert size={16} color={Colors.danger} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              {/* Gợi ý chọn nhanh lịch hẹn sẵn có của bệnh nhân */}
              {candidateAppointments.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.label}>CHỌN NHANH LỊCH HẸN CỦA BẠN</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ gap: 8 }}>
                    {candidateAppointments.slice(0, 5).map((apt) => {
                      const active =
                        String(apt.appointmentCode).toUpperCase() ===
                        appointmentCode.trim().toUpperCase();
                      return (
                        <Pressable
                          key={apt.id || apt.appointmentCode}
                          style={[styles.aptChip, active && styles.aptChipActive]}
                          onPress={() => handleApplyCandidate(apt)}>
                          <Text style={[styles.aptChipCode, active && { color: '#fff' }]}>
                            {apt.appointmentCode}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.aptChipSub,
                              active && { color: Colors.onPrimaryMuted },
                            ]}>
                            {String(apt.appointmentDate || '').split('T')[0]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <Text style={styles.label}>MÃ LỊCH HẸN *</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="characters"
                placeholder="VD: APT-123456"
                placeholderTextColor={Colors.textMuted}
                value={appointmentCode}
                onChangeText={(v) => setAppointmentCode(v.toUpperCase())}
              />

              <Text style={styles.label}>HỌ VÀ TÊN BỆNH NHÂN *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên trên phiếu hẹn"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>SỐ ĐIỆN THOẠI ĐẶT LỊCH *</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="0912345678"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
              />

              <Pressable
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                disabled={submitting}
                onPress={handleCheckInSubmit}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Xác nhận Check-in</Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  title: { fontSize: 17.5, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanContainer: { paddingBottom: 6 },
  cameraBox: {
    height: 310,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  cameraView: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  viewfinderOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  viewfinderFrame: {
    width: 196,
    height: 196,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#00e6a0',
    backgroundColor: 'rgba(0, 145, 101, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraHint: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(15,23,42,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  permBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 14,
    gap: 8,
  },
  permIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  permTitle: { fontSize: 16.5, fontWeight: '800', color: Colors.text },
  permDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  branchVerifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: 12,
  },
  branchIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchVerifiedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  branchVerifiedName: { fontSize: 14, fontWeight: '800', color: Colors.text, marginTop: 1 },
  branchVerifiedAddr: { fontSize: 11.5, color: Colors.textSecondary, marginTop: 1 },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  rescanText: { fontSize: 11.5, fontWeight: '800', color: Colors.primaryDark },
  aptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  aptChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  aptChipCode: { fontSize: 12.5, fontWeight: '800', color: Colors.text },
  aptChipSub: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 1 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  errorText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: Colors.danger },
  label: { fontSize: 11, fontWeight: '800', color: Colors.text, marginTop: 10, marginBottom: 6 },
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
  submitBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

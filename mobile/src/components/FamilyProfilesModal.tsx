import Check from 'lucide-react-native/icons/check';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import Plus from 'lucide-react-native/icons/plus';
import Trash2 from 'lucide-react-native/icons/trash-2';
import Users from 'lucide-react-native/icons/users';
import X from 'lucide-react-native/icons/x';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../constants/theme';
import { useSuccessModal } from '../contexts/SuccessModalContext';
import { LinkedProfile, patientService } from '../services/patient.service';
import { OtpCodeInput } from './OtpCodeInput';

import { KeyboardSafeView } from './KeyboardSafeView';
interface FamilyProfilesModalProps {
  visible: boolean;
  onClose: () => void;
  profiles: LinkedProfile[];
  selectedPatientId: string;
  primaryPatientId: string;
  primaryPhone: string;
  onSelectProfile: (patientId: string) => void;
  onReloadProfiles: () => Promise<void>;
}

const REL_TYPES = [
  { key: 'CHILD', label: 'Con' },
  { key: 'SPOUSE', label: 'Vợ / Chồng' },
  { key: 'PARENT', label: 'Cha / Mẹ' },
  { key: 'GUARDIAN', label: 'Người giám hộ' },
] as const;

function formatDateTyping(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDdMmYyyyToIso(display: string): string | null {
  const parts = display.trim().split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy || yyyy < 1900 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

export function FamilyProfilesModal({
  visible,
  onClose,
  profiles,
  selectedPatientId,
  primaryPatientId,
  primaryPhone,
  onSelectProfile,
  onReloadProfiles,
}: FamilyProfilesModalProps) {
  const { showSuccess } = useSuccessModal();
  const [mode, setMode] = useState<'LIST' | 'LINK_FORM' | 'LINK_OTP'>('LIST');

  const [relatedCode, setRelatedCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthdayDisplay, setBirthdayDisplay] = useState('');
  const [relatedPhone, setRelatedPhone] = useState('');
  const [relType, setRelType] = useState<'CHILD' | 'SPOUSE' | 'PARENT' | 'GUARDIAN'>('CHILD');

  const [requestId, setRequestId] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setMode('LIST');
      setError('');
    }
  }, [visible]);

  const handleRequestOtp = async () => {
    if (submitting) return;
    setError('');
    const isoDob = parseDdMmYyyyToIso(birthdayDisplay);
    if (!relatedCode.trim()) {
      setError('Vui lòng nhập Mã bệnh nhân người thân');
      return;
    }
    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ tên người thân');
      return;
    }
    if (!isoDob) {
      setError('Ngày sinh không hợp lệ (nhập DD/MM/YYYY)');
      return;
    }
    if (!relatedPhone.trim()) {
      setError('Vui lòng nhập SĐT trên hồ sơ người thân');
      return;
    }

    setSubmitting(true);
    try {
      const res = await patientService.requestRelationshipOtp({
        patientId: primaryPatientId,
        patientPhone: primaryPhone,
        relatedPatientCode: relatedCode.trim().toUpperCase(),
        fullName: fullName.trim(),
        birthday: isoDob,
        phoneRelatedPatient: relatedPhone.trim(),
        relationshipType: relType,
      });
      setRequestId(res.requestId);
      setOtp(['', '', '', '', '', '']);
      setMode('LINK_OTP');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Không đối soát được hồ sơ người thân. Vui lòng kiểm tra thông tin.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (submitting) return;
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const linkedName = fullName.trim();
      await patientService.verifyRelationshipOtp(requestId, code);
      await onReloadProfiles();
      setRelatedCode('');
      setFullName('');
      setBirthdayDisplay('');
      setRelatedPhone('');
      setMode('LIST');
      showSuccess({
        title: 'Liên kết hồ sơ thành công!',
        message: `Đã liên kết hồ sơ người thân "${linkedName}" vào tài khoản của bạn.`,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = (item: LinkedProfile) => {
    if (!item.relationshipId) return;
    Alert.alert(
      'Hủy liên kết hồ sơ',
      `Bạn có chắc muốn gỡ liên kết hồ sơ "${item.fullName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gỡ liên kết',
          style: 'destructive',
          onPress: async () => {
            try {
              await patientService.deleteRelationship(item.relationshipId!);
              if (selectedPatientId === item.patientId) {
                onSelectProfile(primaryPatientId);
              }
              await onReloadProfiles();
              showSuccess({
                title: 'Đã gỡ liên kết hồ sơ!',
                message: `Hồ sơ "${item.fullName}" đã được gỡ khỏi danh sách người thân.`,
              });
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể gỡ liên kết.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal statusBarTranslucent visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardSafeView style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.title}>
                {mode === 'LIST'
                  ? 'Hồ sơ Bệnh án Gia đình'
                  : mode === 'LINK_FORM'
                    ? 'Liên kết Hồ sơ Người thân'
                    : 'Xác thực OTP Liên kết'}
              </Text>
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {mode === 'LIST' && (
              <View style={{ gap: 10 }}>
                {profiles.map((p) => {
                  const active = p.patientId === selectedPatientId;
                  return (
                    <Pressable
                      key={p.patientId}
                      style={[styles.profileCard, active && styles.profileCardActive]}
                      onPress={() => {
                        onSelectProfile(p.patientId);
                        onClose();
                      }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.profileName}>{p.fullName}</Text>
                          <Text style={styles.relBadge}>
                            {p.isPrimary
                              ? 'Chính chủ'
                              : p.relationshipLabel || p.relationship || p.relationshipType || 'Người thân'}
                          </Text>
                        </View>
                        <Text style={styles.profileCode}>
                          Mã HS: {p.patientCode || '—'} • {p.phoneMasked || p.phone || ''}
                        </Text>
                      </View>
                      {active ? <Check size={18} color={Colors.primary} /> : null}
                      {!p.isPrimary && p.relationshipId ? (
                        <Pressable hitSlop={8} onPress={() => handleUnlink(p)}>
                          <Trash2 size={17} color={Colors.danger} />
                        </Pressable>
                      ) : null}
                    </Pressable>
                  );
                })}

                <Pressable
                  style={styles.addLinkBtn}
                  onPress={() => {
                    setError('');
                    setMode('LINK_FORM');
                  }}>
                  <Plus size={18} color={Colors.primaryDark} />
                  <Text style={styles.addLinkText}>Liên kết thêm hồ sơ người thân</Text>
                </Pressable>
              </View>
            )}

            {mode === 'LINK_FORM' && (
              <View>
                <Text style={styles.label}>MỐI QUAN HỆ *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {REL_TYPES.map((r) => {
                    const active = relType === r.key;
                    return (
                      <Pressable
                        key={r.key}
                        style={[styles.relChip, active && styles.relChipActive]}
                        onPress={() => setRelType(r.key)}>
                        <Text style={[styles.relChipText, active && { color: '#fff' }]}>
                          {r.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>MÃ BỆNH NHÂN NGƯỜI THÂN *</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="characters"
                  placeholder="VD: BN001250"
                  value={relatedCode}
                  onChangeText={(v) => setRelatedCode(v.toUpperCase())}
                />

                <Text style={styles.label}>HỌ VÀ TÊN NGƯỜI THÂN *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn B"
                  value={fullName}
                  onChangeText={setFullName}
                />

                <Text style={styles.label}>NGÀY SINH (DD/MM/YYYY) *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="15/08/2015"
                  value={birthdayDisplay}
                  onChangeText={(v) => setBirthdayDisplay(formatDateTyping(v))}
                />

                <Text style={styles.label}>SĐT TRÊN HỒ SƠ NGƯỜI THÂN *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholder="0912345678"
                  value={relatedPhone}
                  onChangeText={setRelatedPhone}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                  <Pressable
                    style={styles.backBtn}
                    onPress={() => {
                      setError('');
                      setMode('LIST');
                    }}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.submitBtn, { flex: 1 }, submitting && { opacity: 0.6 }]}
                    disabled={submitting}
                    onPress={handleRequestOtp}>
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Nhận mã OTP qua Email</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {mode === 'LINK_OTP' && (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={styles.otpHint}>
                  Nhập 6 chữ số OTP đã gửi tới Email tài khoản chính của bạn để xác nhận liên kết:
                </Text>
                <OtpCodeInput value={otp} onChange={setOtp} disabled={submitting} />
                <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                  <Pressable style={styles.backBtn} onPress={() => setMode('LINK_FORM')}>
                    <Text style={styles.backBtnText}>Sửa lại</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.submitBtn, { flex: 1 }, submitting && { opacity: 0.6 }]}
                    disabled={submitting}
                    onPress={handleVerifyOtp}>
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Xác nhận liên kết</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
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
    padding: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errorText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: Colors.danger },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  profileCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  profileName: { fontSize: 14.5, fontWeight: '800', color: Colors.text },
  relBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.primaryDark,
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  profileCode: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  addLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    marginTop: 4,
  },
  addLinkText: { fontSize: 13.5, fontWeight: '800', color: Colors.primaryDark },
  label: { fontSize: 11, fontWeight: '800', color: Colors.text, marginTop: 10, marginBottom: 6 },
  input: {
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  relChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  relChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  relChipText: { fontSize: 12.5, fontWeight: '700', color: Colors.text },
  backBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  submitBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  otpHint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});

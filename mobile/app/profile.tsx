import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import Camera from 'lucide-react-native/icons/camera';
import CreditCard from 'lucide-react-native/icons/credit-card';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import KeyRound from 'lucide-react-native/icons/key-round';
import LogOut from 'lucide-react-native/icons/log-out';
import Pencil from 'lucide-react-native/icons/pencil';
import QrCode from 'lucide-react-native/icons/qr-code';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import User from 'lucide-react-native/icons/user';
import X from 'lucide-react-native/icons/x';
import { Colors } from '../src/constants/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { useSuccessModal } from '../src/contexts/SuccessModalContext';
import { chatService, resolveMediaUrl } from '../src/services/chat.service';
import { patientService } from '../src/services/patient.service';

import { KeyboardSafeView } from '../src/components/KeyboardSafeView';
type Tab = 'PERSONAL' | 'INSURANCE' | 'SECURITY';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  cccd: '',
  email: '',
  gender: 'MALE',
  dateOfBirth: '',
  address: '',
  nationality: 'Việt Nam',
  hometown: '',
  job: '',
  systemicDisease: '',
  allergies: '',
  currentMedications: '',
  surgicalHistory: '',
  contactName: '',
  contactPhone: '',
  contactRelationship: '',
};
type FormState = typeof EMPTY_FORM;

const GENDERS = [
  { key: 'MALE', label: 'Nam' },
  { key: 'FEMALE', label: 'Nữ' },
  { key: 'OTHER', label: 'Khác' },
];

function toDisplayDate(value?: any): string {
  if (!value) return '';
  if (Array.isArray(value)) {
    const [y, m, d] = value;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(value);
}

function toApiDate(display: string): string | null {
  const m = display.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00`;
}

function genderLabel(g?: string) {
  return GENDERS.find((x) => x.key === g)?.label ?? '—';
}

export default function ProfileScreen() {
  const { patientId, signOut, user, updateAvatarUrl } = useAuth();
  const { showSuccess } = useSuccessModal();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('PERSONAL');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  const pickAndUploadAvatar = async (source: 'camera' | 'library') => {
    if (!user?.id) return;
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền máy ảnh để chụp ảnh đại diện.');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh để chọn ảnh đại diện.');
          return;
        }
      }

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          })
          : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return;

      const asset = pickerResult.assets[0];
      setUploadingAvatar(true);
      const uploadedUrl = await chatService.uploadImage(
        asset.uri,
        asset.mimeType || 'image/jpeg',
        asset.fileName || `avatar-${Date.now()}.jpg`
      );
      if (!uploadedUrl) {
        throw new Error('Không nhận được đường dẫn ảnh sau khi tải lên.');
      }

      await patientService.updateUser(user.id, { avatarUrl: uploadedUrl });
      await updateAvatarUrl(uploadedUrl);
      setAvatarFailed(false);

      showSuccess({
        title: 'Đổi ảnh đại diện thành công!',
        message: 'Ảnh đại diện mới của bạn đã được lưu và đồng bộ trên toàn ứng dụng.',
      });
    } catch (e: any) {
      Alert.alert(
        'Lỗi tải ảnh',
        e?.response?.data?.message || e?.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = () => {
    if (uploadingAvatar || !user?.id) return;
    if (Platform.OS === 'web') {
      pickAndUploadAvatar('library');
      return;
    }
    Alert.alert('Đổi ảnh đại diện', 'Chọn nguồn ảnh cho hồ sơ cá nhân của bạn', [
      { text: 'Chụp ảnh mới', onPress: () => pickAndUploadAvatar('camera') },
      { text: 'Chọn từ thư viện', onPress: () => pickAndUploadAvatar('library') },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const fillForm = (p: any) => {
    setForm({
      fullName: p?.fullName ?? '',
      phone: p?.phone ?? '',
      cccd: p?.cccd ?? '',
      email: p?.email ?? '',
      gender: p?.gender ?? 'MALE',
      dateOfBirth: toDisplayDate(p?.dateOfBirth),
      address: p?.address ?? '',
      nationality: p?.nationality || 'Việt Nam',
      hometown: p?.hometown ?? '',
      job: p?.job ?? '',
      systemicDisease: p?.systemicDisease ?? '',
      allergies: p?.allergies ?? '',
      currentMedications: p?.currentMedications ?? '',
      surgicalHistory: p?.surgicalHistory ?? '',
      contactName: p?.contactName ?? '',
      contactPhone: p?.contactPhone ?? '',
      contactRelationship: p?.contactRelationship ?? '',
    });
  };

  const load = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    try {
      const p = await patientService.getById(patientId);
      setPatient(p);
      fillForm(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!patientId) return;
    if (!form.fullName.trim() || !form.phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Họ tên và số điện thoại là bắt buộc.');
      return;
    }
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      Alert.alert('Không hợp lệ', 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.');
      return;
    }
    let dob: string | null = null;
    if (form.dateOfBirth.trim()) {
      dob = toApiDate(form.dateOfBirth);
      if (!dob) {
        Alert.alert('Không hợp lệ', 'Ngày sinh phải có định dạng DD/MM/YYYY.');
        return;
      }
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = { ...form, dateOfBirth: dob };
      Object.keys(payload).forEach((k) => {
        if (typeof payload[k] === 'string') payload[k] = payload[k].trim();
      });
      const updated = await patientService.updateProfile(patientId, payload);
      const merged = updated && typeof updated === 'object' ? { ...patient, ...updated } : { ...patient, ...payload };
      setPatient(merged);
      fillForm(merged);
      setEditing(false);
      showSuccess({
        title: 'Cập nhật hồ sơ thành công!',
        message: 'Thông tin cá nhân và tiền sử y tế của bạn đã được lưu.',
      });
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pw.currentPassword || !pw.newPassword || !pw.confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường.');
      return;
    }
    if (pw.newPassword.length < 8) {
      Alert.alert('Không hợp lệ', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (pw.newPassword !== pw.confirmPassword) {
      Alert.alert('Không khớp', 'Xác nhận mật khẩu không khớp.');
      return;
    }
    setChangingPw(true);
    try {
      await patientService.changeMyPassword(pw);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess({
        title: 'Đổi mật khẩu thành công!',
        message: 'Mật khẩu đăng nhập mới của bạn đã có hiệu lực.',
      });
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setChangingPw(false);
    }
  };

  const logout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const insurances: any[] = Array.isArray(patient?.patientInsurances) ? patient.patientInsurances : [];
  const qrValue = String(patient?.patientCode || patientId || '');

  const renderField = (label: string, key: keyof FormState, opts?: { keyboard?: any; multiline?: boolean; placeholder?: string }) => (
    <View style={styles.field} key={key}>
      <Text style={styles.label}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.input, opts?.multiline && { minHeight: 64, textAlignVertical: 'top' }]}
          value={form[key]}
          onChangeText={set(key)}
          keyboardType={opts?.keyboard}
          multiline={opts?.multiline}
          placeholder={opts?.placeholder}
          placeholderTextColor={Colors.textMuted}
        />
      ) : (
        <Text style={styles.value}>{form[key] || '—'}</Text>
      )}
    </View>
  );

  return (
    <KeyboardSafeView style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }>
        {/* Header card */}
        <View style={styles.heroCard}>
          <Pressable
            style={styles.avatarWrap}
            onPress={handleAvatarPress}
            disabled={uploadingAvatar}
            accessibilityLabel="Đổi ảnh đại diện">
            <View style={styles.avatar}>
              {resolveMediaUrl(user?.avatarUrl) && !avatarFailed ? (
                <Image
                  source={{ uri: resolveMediaUrl(user?.avatarUrl) }}
                  style={styles.avatarImg}
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {(patient?.fullName || user?.username || 'B').charAt(0).toUpperCase()}
                </Text>
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              ) : null}
            </View>
            <View style={styles.avatarCamBadge}>
              <Camera size={12} color={Colors.primary} />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{patient?.fullName || user?.username || 'Bệnh nhân'}</Text>
            <Text style={styles.heroSub}>Mã BN: {patient?.patientCode || '—'}</Text>
            <Text style={styles.heroSub}>{patient?.phone || user?.phone || ''}</Text>
          </View>
          <Pressable style={styles.qrBtn} onPress={() => setShowQr(true)}>
            <QrCode size={22} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(
            [
              { key: 'PERSONAL', label: 'Cá nhân', Icon: User },
              { key: 'INSURANCE', label: 'Bảo hiểm', Icon: ShieldCheck },
              { key: 'SECURITY', label: 'Mật khẩu', Icon: KeyRound },
            ] as const
          ).map(({ key, label, Icon }) => (
            <Pressable key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
              <Icon size={15} color={tab === key ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.tabText, tab === key && { color: '#fff' }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'PERSONAL' && (
          <View style={{ gap: 14 }}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Thông tin hành chính</Text>
                {!editing ? (
                  <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
                    <Pencil size={14} color={Colors.primary} />
                    <Text style={styles.editText}>Chỉnh sửa</Text>
                  </Pressable>
                ) : null}
              </View>
              {renderField('Họ và tên *', 'fullName')}
              {renderField('Số điện thoại *', 'phone', { keyboard: 'phone-pad' })}
              {renderField('CCCD', 'cccd', { keyboard: 'number-pad' })}
              {renderField('Email', 'email', { keyboard: 'email-address' })}
              <View style={styles.field}>
                <Text style={styles.label}>Giới tính</Text>
                {editing ? (
                  <View style={styles.genderRow}>
                    {GENDERS.map((g) => (
                      <Pressable
                        key={g.key}
                        style={[styles.genderPill, form.gender === g.key && styles.genderActive]}
                        onPress={() => set('gender')(g.key)}>
                        <Text style={[styles.genderText, form.gender === g.key && { color: '#fff' }]}>{g.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.value}>{genderLabel(form.gender)}</Text>
                )}
              </View>
              {renderField('Ngày sinh', 'dateOfBirth', { placeholder: 'DD/MM/YYYY' })}
              {renderField('Địa chỉ', 'address')}
              {renderField('Quốc tịch', 'nationality')}
              {renderField('Quê quán', 'hometown')}
              {renderField('Nghề nghiệp', 'job')}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tiền sử y tế</Text>
              {renderField('Bệnh toàn thân', 'systemicDisease', { multiline: true })}
              {renderField('Dị ứng', 'allergies', { multiline: true })}
              {renderField('Thuốc đang dùng', 'currentMedications', { multiline: true })}
              {renderField('Tiền sử phẫu thuật', 'surgicalHistory', { multiline: true })}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Người liên hệ khẩn cấp</Text>
              {renderField('Họ tên', 'contactName')}
              {renderField('Số điện thoại', 'contactPhone', { keyboard: 'phone-pad' })}
              {renderField('Mối quan hệ', 'contactRelationship')}
            </View>

            {editing ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  style={[styles.secondaryBtn, { flex: 1 }]}
                  onPress={() => {
                    fillForm(patient);
                    setEditing(false);
                  }}
                  disabled={saving}>
                  <Text style={styles.secondaryText}>Hủy</Text>
                </Pressable>
                <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={save} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Lưu thay đổi</Text>}
                </Pressable>
              </View>
            ) : null}
          </View>
        )}

        {tab === 'INSURANCE' && (
          <View style={{ gap: 12 }}>
            {insurances.length === 0 ? (
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
                <ShieldCheck size={36} color={Colors.textMuted} />
                <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Chưa có thông tin bảo hiểm.</Text>
              </View>
            ) : (
              insurances.map((ins, idx) => {
                const exp = toDisplayDate(ins.expirationDate);
                const expired = ins.expirationDate && new Date(String(ins.expirationDate).slice(0, 10)) < new Date();
                return (
                  <View key={ins.id ?? idx} style={styles.insCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CreditCard size={18} color="#fff" />
                        <Text style={styles.insType}>{ins.type || 'Bảo hiểm'}</Text>
                      </View>
                      <View style={[styles.insBadge, expired && { backgroundColor: Colors.danger }]}>
                        <Text style={styles.insBadgeText}>{expired ? 'Hết hạn' : 'Còn hiệu lực'}</Text>
                      </View>
                    </View>
                    <Text style={styles.insProvider}>{ins.providerName || '—'}</Text>
                    <Text style={styles.insNumber}>{ins.policyNumber || '—'}</Text>
                    <View style={styles.insFooter}>
                      <Text style={styles.insMeta}>Mức hưởng: {ins.coveragePercent ?? 0}%</Text>
                      <Text style={styles.insMeta}>HSD: {exp || '—'}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === 'SECURITY' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Đổi mật khẩu</Text>
              <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={8}>
                {showPw ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
              </Pressable>
            </View>
            {(
              [
                ['currentPassword', 'Mật khẩu hiện tại'],
                ['newPassword', 'Mật khẩu mới (tối thiểu 8 ký tự)'],
                ['confirmPassword', 'Xác nhận mật khẩu mới'],
              ] as const
            ).map(([k, label]) => (
              <View key={k} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={pw[k]}
                  onChangeText={(v) => setPw((p) => ({ ...p, [k]: v }))}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                />
              </View>
            ))}
            <Pressable style={[styles.primaryBtn, { marginTop: 6 }]} onPress={changePassword} disabled={changingPw}>
              {changingPw ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Cập nhật mật khẩu</Text>}
            </Pressable>
          </View>
        )}

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showQr} transparent animationType="fade" onRequestClose={() => setShowQr(false)}>
        <View style={styles.backdrop}>
          <View style={styles.qrCard}>
            <Pressable style={styles.qrClose} onPress={() => setShowQr(false)} hitSlop={8}>
              <X size={22} color={Colors.textSecondary} />
            </Pressable>
            <Text style={styles.qrTitle}>Thẻ Bệnh nhân</Text>
            <Text style={styles.qrSub}>Đưa mã này cho lễ tân để tiếp nhận khám</Text>
            <View style={styles.qrBox}>
              {qrValue ? <QRCode value={qrValue} size={200} color={Colors.text} backgroundColor="#fff" /> : null}
            </View>
            <Text style={styles.qrName}>{patient?.fullName}</Text>
            <Text style={styles.qrCode}>{patient?.patientCode || '—'}</Text>
            {patient?.cccd ? <Text style={styles.qrSub}>CCCD: {patient.cccd}</Text> : null}
          </View>
        </View>
      </Modal>
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 16,
  },
  avatarWrap: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCamBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  heroSub: { color: '#ccfbf1', fontSize: 12, marginTop: 2 },
  qrBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 12 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  editText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  field: { gap: 4 },
  label: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  value: { fontSize: 14, color: Colors.text },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.text,
  },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderText: { color: Colors.textSecondary, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryText: { color: Colors.text, fontWeight: '700' },
  insCard: { backgroundColor: Colors.primaryDark, borderRadius: 16, padding: 16, gap: 6 },
  insType: { color: '#fff', fontWeight: '800' },
  insBadge: { backgroundColor: Colors.emerald, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  insBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  insProvider: { color: '#ccfbf1', fontSize: 13, marginTop: 6 },
  insNumber: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1.5 },
  insFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  insMeta: { color: '#ccfbf1', fontSize: 12 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  logoutText: { color: Colors.danger, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  qrCard: { width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 22, alignItems: 'center', gap: 6 },
  qrClose: { position: 'absolute', right: 14, top: 14 },
  qrTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  qrSub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  qrBox: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginVertical: 10 },
  qrName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  qrCode: { fontSize: 14, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import IdCard from 'lucide-react-native/icons/id-card';
import Lock from 'lucide-react-native/icons/lock';
import Phone from 'lucide-react-native/icons/phone';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Sparkles from 'lucide-react-native/icons/sparkles';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardSafeView } from '../../src/components/KeyboardSafeView';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { tokenStorage } from '../../src/services/storage';

export default function PatientLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientCode?: string; phone?: string }>();
  const { signIn, user } = useAuth();

  const [patientCode, setPatientCode] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'PATIENT') {
      router.replace('/(tabs)');
    }
  }, [user, router]);

  useEffect(() => {
    let mounted = true;
    async function prefill() {
      if (params.patientCode || params.phone) {
        if (params.patientCode) setPatientCode(String(params.patientCode).toUpperCase());
        if (params.phone) setPhone(String(params.phone));
        return;
      }
      const saved = await tokenStorage.getSavedLogin();
      if (mounted && saved) {
        setPatientCode(saved.patientCode);
        setPhone(saved.phone);
      }
    }
    prefill();
    return () => {
      mounted = false;
    };
  }, [params.patientCode, params.phone]);

  const handleLogin = async () => {
    if (submitting) return;
    setError('');

    const trimmedCode = patientCode.trim().toUpperCase();
    const trimmedPhone = phone.trim();

    if (!trimmedCode) {
      setError('Vui lòng nhập Mã bệnh nhân');
      return;
    }
    if (!trimmedPhone) {
      setError('Vui lòng nhập Số điện thoại');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập Mật khẩu');
      return;
    }

    setSubmitting(true);
    try {
      await signIn({
        patientCode: trimmedCode,
        phone: trimmedPhone,
        password,
      });
      if (rememberMe) {
        await tokenStorage.setSavedLogin({ patientCode: trimmedCode, phone: trimmedPhone });
      } else {
        await tokenStorage.clearSavedLogin();
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin hồ sơ.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardSafeView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}>
          {/* Header xanh ngọc liền mạch từ mép trên */}
          <SafeAreaView edges={['top']} style={styles.heroHeader}>
            <View style={styles.decorCircleLarge} />
            <View style={styles.decorCircleSmall} />

            <View style={styles.topNav}>
              <Pressable
                style={styles.navPill}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
                <ArrowLeft size={16} color="#ffffff" />
                <Text style={styles.navPillText}>Trang chủ</Text>
              </Pressable>
              <Pressable style={styles.navPill} onPress={() => Linking.openURL('tel:19008059')}>
                <Phone size={13} color="#ffffff" />
                <Text style={styles.navPillText}>1900 8059</Text>
              </Pressable>
            </View>

            <View style={styles.heroTextWrap}>
              <View style={styles.brandRow}>
                <ShieldCheck size={15} color={Colors.onPrimaryMuted} />
                <Text style={styles.brandLabel}>Nha khoa Crown Dental</Text>
              </View>
              <Text style={styles.heroTitle}>Đăng nhập Bệnh nhân</Text>
              <Text style={styles.heroSubtitle}>
                Quản lý lịch khám, bệnh án điện tử, đơn thuốc và tư vấn trực tuyến trên một ứng dụng
              </Text>
            </View>
          </SafeAreaView>

          {/* Bề mặt trắng liền mạch duy nhất (không đóng khung hộp rời rạc) */}
          <View style={styles.sheetBody}>
            {error ? (
              <View style={styles.errorBanner}>
                <CircleAlert size={17} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>
              Mã bệnh nhân <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputField}>
              <IdCard size={19} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: BN001248"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!submitting}
                value={patientCode}
                onChangeText={(val) => setPatientCode(val.toUpperCase())}
              />
            </View>

            <Text style={styles.fieldLabel}>
              Số điện thoại <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputField}>
              <Phone size={19} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 0912345678"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={11}
                editable={!submitting}
                value={phone}
                onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
              />
            </View>

            <Text style={styles.fieldLabel}>
              Mật khẩu <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputField}>
              <Lock size={19} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu đăng nhập"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                editable={!submitting}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable hitSlop={10} onPress={() => setShowPassword((prev) => !prev)}>
                {showPassword ? (
                  <EyeOff size={19} color={Colors.textSecondary} />
                ) : (
                  <Eye size={19} color={Colors.textSecondary} />
                )}
              </Pressable>
            </View>

            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRememberMe((prev) => !prev)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <Check size={12} color="#ffffff" /> : null}
                </View>
                <Text style={styles.rememberText}>Ghi nhớ thông tin</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Hỗ trợ khôi phục mật khẩu',
                    'Vui lòng liên hệ Hotline 1900 8059 hoặc quầy lễ tân để được hỗ trợ đặt lại mật khẩu nhanh chóng.'
                  )
                }>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryBtn, submitting && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={submitting}>
              {submitting ? (
                <View style={styles.btnInner}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryBtnText}>Đang xác thực...</Text>
                </View>
              ) : (
                <View style={styles.btnInner}>
                  <Text style={styles.primaryBtnText}>Đăng nhập</Text>
                  <ChevronRight size={19} color="#ffffff" />
                </View>
              )}
            </Pressable>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>Dành cho bệnh nhân chưa có tài khoản</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.secondaryActions}>
              <Pressable
                style={styles.linkRow}
                onPress={() => router.push('/(auth)/register')}>
                <View style={styles.linkIconWrap}>
                  <Sparkles size={17} color={Colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.linkTitle}>Đăng ký hồ sơ bệnh nhân mới</Text>
                  <Text style={styles.linkDesc}>Khởi tạo tài khoản mới và nhận mã bệnh nhân qua Email</Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>

              <View style={styles.inlineDivider} />

              <Pressable
                style={styles.linkRow}
                onPress={() => router.push('/(auth)/activate')}>
                <View style={styles.linkIconWrap}>
                  <IdCard size={17} color={Colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.linkTitle}>Đã từng khám tại phòng khám?</Text>
                  <Text style={styles.linkDesc}>
                    Kích hoạt từ Mã bệnh nhân có sẵn trên phiếu khám / hóa đơn
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardSafeView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, backgroundColor: '#ffffff' },
  heroHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 46,
    overflow: 'hidden',
  },
  decorCircleLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -50,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -25,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  navPillText: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },
  heroTextWrap: { marginTop: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  brandLabel: { fontSize: 12.5, fontWeight: '700', color: Colors.onPrimaryMuted },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#ffffff', letterSpacing: -0.3 },
  heroSubtitle: {
    fontSize: 13.5,
    color: Colors.onPrimaryMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  sheetBody: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 36,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.danger },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
    marginBottom: 7,
  },
  required: { color: Colors.danger },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 0,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  forgotText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009165',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtnText: { color: '#ffffff', fontSize: 15.5, fontWeight: '800' },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 26,
    marginBottom: 14,
  },
  orLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  orText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  secondaryActions: {
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  linkDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  inlineDivider: { height: 1, backgroundColor: '#f1f5f9' },
});

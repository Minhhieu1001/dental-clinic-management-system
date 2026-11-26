import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import IdCard from 'lucide-react-native/icons/id-card';
import Lock from 'lucide-react-native/icons/lock';
import Mail from 'lucide-react-native/icons/mail';
import Phone from 'lucide-react-native/icons/phone';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardSafeView } from '../../src/components/KeyboardSafeView';
import { OtpCodeInput } from '../../src/components/OtpCodeInput';
import { Colors } from '../../src/constants/theme';
import { authService } from '../../src/services/auth.service';

type ActivateStep = 'LOOKUP' | 'OTP' | 'SET_PASSWORD' | 'SUCCESS';

function utf8ByteLength(str: string): number {
  return unescape(encodeURIComponent(str)).length;
}

export default function PatientActivateScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ActivateStep>('LOOKUP');

  const [patientCode, setPatientCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [matchedPatientName, setMatchedPatientName] = useState('');
  const [activationId, setActivationId] = useState('');
  const [activationToken, setActivationToken] = useState('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState(0);

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!otpExpiresAt) return;
    const timer = setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [otpExpiresAt]);

  const canResend = countdown === 0;

  const startOtpSession = (nextActivationId: string, expiresAtStr: string) => {
    const parsed = Date.parse(expiresAtStr);
    const validTarget = Number.isNaN(parsed) ? Date.now() + 120000 : parsed;
    setActivationId(nextActivationId);
    setOtpExpiresAt(validTarget);
    setCountdown(Math.max(0, Math.ceil((validTarget - Date.now()) / 1000)));
    setOtp(['', '', '', '', '', '']);
    setActivationToken('');
    setMatchedPatientName('');
  };

  const handleLookupSubmit = async () => {
    if (inFlight.current) return;
    setError('');

    const normalizedCode = patientCode.trim().toUpperCase();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedCode) {
      setError('Vui lòng nhập Mã bệnh nhân đã được phòng khám cấp');
      return;
    }
    if (!normalizedPhone || !/^(?:0|\+?84)[0-9]{9}$/.test(normalizedPhone)) {
      setError('Số điện thoại không hợp lệ (nhập 10 chữ số bắt đầu bằng 0 hoặc +84)');
      return;
    }
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Vui lòng nhập địa chỉ Email hợp lệ để nhận mã OTP');
      return;
    }

    inFlight.current = true;
    setIsLoading(true);
    try {
      const res = await authService.requestActivation({
        patientCode: normalizedCode,
        phone: normalizedPhone,
        email: normalizedEmail,
      });
      setPatientCode(normalizedCode);
      setPhone(normalizedPhone);
      setEmail(normalizedEmail);
      startOtpSession(res.activationId, res.expiresAt);
      setCurrentStep('OTP');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Không đối soát được hồ sơ. Vui lòng kiểm tra lại Mã bệnh nhân và SĐT.'
      );
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    setError('');
    try {
      const res = await authService.resendActivationOtp(activationId);
      startOtpSession(res.activationId, res.expiresAt);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi lại mã OTP.');
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (inFlight.current) return;
    setError('');

    if (Date.now() >= otpExpiresAt) {
      setError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.');
      return;
    }
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    inFlight.current = true;
    setIsLoading(true);
    try {
      const res = await authService.verifyActivationOtp(activationId, code);
      setMatchedPatientName(res.fullName || 'Bệnh nhân');
      setActivationToken(res.activationToken);
      const tokenExp = Date.parse(res.tokenExpiresAt);
      setTokenExpiresAt(Number.isNaN(tokenExp) ? Date.now() + 300000 : tokenExp);
      setCurrentStep('SET_PASSWORD');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleSetPasswordSubmit = async () => {
    if (inFlight.current) return;
    setError('');

    if (!activationToken || Date.now() >= tokenExpiresAt) {
      setError('Phiên đặt mật khẩu đã hết hạn (quá 5 phút). Vui lòng tra cứu và xác thực lại.');
      setActivationToken('');
      setPassword('');
      setConfirmPassword('');
      setCurrentStep('LOOKUP');
      return;
    }
    if (!password || password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (utf8ByteLength(password) > 72) {
      setError('Mật khẩu không được vượt quá 72 byte UTF-8');
      return;
    }
    if (password !== confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp');
      return;
    }

    inFlight.current = true;
    setIsLoading(true);
    try {
      const res = await authService.completeActivation({
        activationId,
        activationToken,
        password,
        confirmPassword,
      });
      if (res?.patientCode) {
        setPatientCode(res.patientCode);
      }
      setActivationToken('');
      setPassword('');
      setConfirmPassword('');
      setOtpExpiresAt(0);
      setCurrentStep('SUCCESS');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể hoàn tất kích hoạt tài khoản.');
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  };

  const stepOrder: Record<ActivateStep, number> = {
    LOOKUP: 0,
    OTP: 1,
    SET_PASSWORD: 2,
    SUCCESS: 3,
  };
  const stepIndex = stepOrder[currentStep];

  return (
    <View style={styles.root}>
      <KeyboardSafeView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}>
          {/* Header Xanh Ngọc liền mạch kèm tiến trình 4 bước */}
          <SafeAreaView edges={['top']} style={styles.heroHeader}>
            <View style={styles.decorCircle} />

            <View style={styles.topNav}>
              <Pressable
                style={styles.navPill}
                onPress={() => router.replace('/(auth)/login')}>
                <ArrowLeft size={16} color="#ffffff" />
                <Text style={styles.navPillText}>Đăng nhập</Text>
              </Pressable>
              <Text style={styles.stepIndicatorText}>Bước {stepIndex + 1}/4</Text>
            </View>

            <Text style={styles.heroTitle}>Kích hoạt Hồ sơ có sẵn</Text>
            <Text style={styles.heroSubtitle}>
              {currentStep === 'LOOKUP'
                ? 'Liên kết tài khoản từ Mã bệnh nhân in trên phiếu khám hoặc hóa đơn của bạn'
                : currentStep === 'OTP'
                  ? 'Xác minh quyền sở hữu hồ sơ qua mã OTP gửi về Email'
                  : currentStep === 'SET_PASSWORD'
                    ? 'Thiết lập mật khẩu đăng nhập cho hồ sơ nha khoa của bạn'
                    : 'Hồ sơ nha khoa đã được kích hoạt thành công'}
            </Text>

            <View style={styles.progressSteps}>
              {['Tra cứu', 'Mã OTP', 'Mật khẩu', 'Hoàn tất'].map((lbl, idx) => {
                const active = idx <= stepIndex;
                return (
                  <View key={lbl} style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressBarSeg,
                        active && styles.progressBarSegActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.progressLabel,
                        active && { color: '#ffffff', fontWeight: '800' },
                      ]}>
                      {lbl}
                    </Text>
                  </View>
                );
              })}
            </View>
          </SafeAreaView>

          {/* Bề mặt trắng liền mạch duy nhất */}
          <View style={styles.sheetBody}>
            {/* STEP 1: LOOKUP */}
            {currentStep === 'LOOKUP' && (
              <View>
                {error ? (
                  <View style={styles.errorBanner}>
                    <CircleAlert size={16} color={Colors.danger} />
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
                    editable={!isLoading}
                    value={patientCode}
                    onChangeText={(val) => setPatientCode(val.toUpperCase())}
                  />
                </View>

                <Text style={styles.fieldLabel}>
                  Số điện thoại trong hồ sơ <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <Phone size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="0912345678"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={12}
                    editable={!isLoading}
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/[^0-9+]/g, ''))}
                  />
                </View>

                <Text style={styles.fieldLabel}>
                  Email nhận mã OTP <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <Mail size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="patient@gmail.com"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <Pressable
                  style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                  disabled={isLoading}
                  onPress={handleLookupSubmit}>
                  {isLoading ? (
                    <View style={styles.btnInner}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.primaryBtnText}>Đang đối soát hồ sơ...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <Text style={styles.primaryBtnText}>Tra cứu & Nhận mã OTP</Text>
                      <ChevronRight size={19} color="#fff" />
                    </View>
                  )}
                </Pressable>

                <View style={styles.bottomSwitch}>
                  <Text style={styles.switchHint}>Chưa từng khám tại Crown Dental?</Text>
                  <Pressable onPress={() => router.replace('/(auth)/register')}>
                    <Text style={styles.switchLink}>Đăng ký hồ sơ bệnh nhân mới →</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 2: OTP */}
            {currentStep === 'OTP' && (
              <View style={styles.centerSection}>
                <View style={styles.iconCircle}>
                  <Mail size={28} color={Colors.primary} />
                </View>
                <Text style={styles.centerHeading}>Nhập mã OTP xác thực</Text>
                <Text style={styles.centerDesc}>
                  Mã xác thực cho hồ sơ{' '}
                  <Text style={{ fontWeight: '800', color: Colors.text }}>{patientCode}</Text> đã gửi tới:
                </Text>
                <Text style={styles.emailHighlight}>{email}</Text>

                {error ? (
                  <View style={[styles.errorBanner, { width: '100%', marginTop: 14 }]}>
                    <CircleAlert size={16} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <OtpCodeInput value={otp} onChange={setOtp} disabled={isLoading} />

                {canResend ? (
                  <Pressable disabled={isLoading} onPress={handleResendOtp}>
                    <Text style={styles.resendActive}>
                      {isLoading ? 'Đang gửi lại...' : 'OTP đã hết hạn — Gửi lại mã OTP'}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.countdownText}>
                    OTP còn hiệu lực <Text style={styles.countdownBold}>{countdown}s</Text>
                  </Text>
                )}

                <Pressable
                  style={[
                    styles.primaryBtn,
                    { width: '100%' },
                    (isLoading || canResend || otp.join('').length < 6) && styles.btnDisabled,
                  ]}
                  disabled={isLoading || canResend || otp.join('').length < 6}
                  onPress={handleVerifyOtp}>
                  {isLoading ? (
                    <View style={styles.btnInner}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.primaryBtnText}>Đang xác thực OTP...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <Text style={styles.primaryBtnText}>Xác nhận mã OTP</Text>
                      <ChevronRight size={19} color="#fff" />
                    </View>
                  )}
                </Pressable>

                <Pressable
                  disabled={isLoading}
                  style={{ marginTop: 18 }}
                  onPress={() => {
                    setError('');
                    setCurrentStep('LOOKUP');
                  }}>
                  <Text style={styles.backStepText}>← Nhập lại Mã bệnh nhân / Số điện thoại</Text>
                </Pressable>
              </View>
            )}

            {/* STEP 3: SET PASSWORD */}
            {currentStep === 'SET_PASSWORD' && (
              <View>
                <View style={styles.matchedInlineRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {matchedPatientName ? matchedPatientName.charAt(0).toUpperCase() : 'B'}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.matchedName}>{matchedPatientName}</Text>
                    <Text style={styles.matchedMeta}>
                      Mã BN: <Text style={{ fontWeight: '800', color: Colors.primary }}>{patientCode}</Text> • {phone}
                    </Text>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBanner}>
                    <CircleAlert size={16} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Text style={styles.fieldLabel}>
                  Mật khẩu mới <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <Lock size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable hitSlop={10} onPress={() => setShowPassword((p) => !p)}>
                    {showPassword ? (
                      <EyeOff size={19} color={Colors.textSecondary} />
                    ) : (
                      <Eye size={19} color={Colors.textSecondary} />
                    )}
                  </Pressable>
                </View>

                <Text style={styles.fieldLabel}>
                  Xác nhận mật khẩu mới <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <Lock size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <Pressable hitSlop={10} onPress={() => setShowConfirmPassword((p) => !p)}>
                    {showConfirmPassword ? (
                      <EyeOff size={19} color={Colors.textSecondary} />
                    ) : (
                      <Eye size={19} color={Colors.textSecondary} />
                    )}
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                  disabled={isLoading}
                  onPress={handleSetPasswordSubmit}>
                  {isLoading ? (
                    <View style={styles.btnInner}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.primaryBtnText}>Đang kích hoạt...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <Text style={styles.primaryBtnText}>Hoàn tất Kích hoạt tài khoản</Text>
                      <ChevronRight size={19} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>
            )}

            {/* STEP 4: SUCCESS */}
            {currentStep === 'SUCCESS' && (
              <View style={styles.centerSection}>
                <View style={styles.successCircle}>
                  <CircleCheck size={38} color="#ffffff" />
                </View>
                <Text style={styles.centerHeading}>Kích hoạt thành công!</Text>
                <Text style={styles.centerDesc}>
                  Chúc mừng <Text style={{ fontWeight: '800', color: Colors.text }}>{matchedPatientName}</Text>. Hồ sơ nha khoa của bạn đã sẵn sàng sử dụng trực tuyến.
                </Text>

                <View style={styles.codeBanner}>
                  <Text style={styles.codeLabel}>MÃ BỆNH NHÂN ĐÃ LIÊN KẾT</Text>
                  <Text selectable style={styles.codeBig}>
                    {patientCode}
                  </Text>
                  <Text style={styles.codeMeta}>
                    {matchedPatientName} • {phone}
                  </Text>
                </View>

                <Pressable
                  style={[styles.primaryBtn, { width: '100%' }]}
                  onPress={() =>
                    router.replace({
                      pathname: '/(auth)/login',
                      params: { patientCode, phone },
                    })
                  }>
                  <View style={styles.btnInner}>
                    <Text style={styles.primaryBtnText}>Đăng nhập Cổng Bệnh Nhân ngay</Text>
                    <ChevronRight size={19} color="#fff" />
                  </View>
                </Pressable>
              </View>
            )}
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
    paddingBottom: 44,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -45,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  stepIndicatorText: { color: Colors.onPrimaryMuted, fontSize: 12.5, fontWeight: '800' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff' },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.onPrimaryMuted,
    marginTop: 5,
    lineHeight: 19,
  },
  progressSteps: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  progressItem: { flex: 1, gap: 5 },
  progressBarSeg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  progressBarSegActive: { backgroundColor: '#ffffff' },
  progressLabel: { fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.72)' },
  sheetBody: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 38,
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
  errorText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: Colors.danger },
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
  input: { flex: 1, fontSize: 14.5, fontWeight: '600', color: Colors.text, paddingVertical: 0 },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009165',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.55 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  bottomSwitch: { alignItems: 'center', marginTop: 22, gap: 4 },
  switchHint: { fontSize: 13, color: Colors.textSecondary },
  switchLink: { fontSize: 13.5, fontWeight: '800', color: Colors.primary },
  centerSection: { alignItems: 'center', paddingTop: 8 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  centerHeading: { fontSize: 21, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  centerDesc: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emailHighlight: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  resendActive: { fontSize: 13.5, fontWeight: '800', color: Colors.primary, marginVertical: 6 },
  countdownText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  countdownBold: { fontWeight: '800', color: Colors.primary },
  backStepText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  matchedInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  matchedName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  matchedMeta: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 2 },
  codeBanner: {
    width: '100%',
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: { fontSize: 11, fontWeight: '800', color: Colors.primaryDark, letterSpacing: 0.5 },
  codeBig: { fontSize: 24, fontWeight: '900', color: Colors.primary, letterSpacing: 1.2 },
  codeMeta: { fontSize: 13, fontWeight: '700', color: Colors.text },
});

import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Building2 from 'lucide-react-native/icons/building-2';
import Calendar from 'lucide-react-native/icons/calendar';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import Lock from 'lucide-react-native/icons/lock';
import Mail from 'lucide-react-native/icons/mail';
import MapPin from 'lucide-react-native/icons/map-pin';
import Phone from 'lucide-react-native/icons/phone';
import User from 'lucide-react-native/icons/user';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { BranchItem, clinicService } from '../../src/services/clinic.service';

type Step = 'FORM' | 'OTP' | 'SUCCESS';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

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
  const dateObj = new Date(yyyy, mm - 1, dd);
  if (
    dateObj.getFullYear() !== yyyy ||
    dateObj.getMonth() !== mm - 1 ||
    dateObj.getDate() !== dd
  ) {
    return null;
  }
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function utf8ByteLength(str: string): number {
  return unescape(encodeURIComponent(str)).length;
}

export default function PatientRegisterScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('FORM');

  const [fullName, setFullName] = useState('');
  const [birthDateDisplay, setBirthDateDisplay] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [branchId, setBranchId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState('');
  const [branchAttempt, setBranchAttempt] = useState(0);

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [generatedPatientCode, setGeneratedPatientCode] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setBranchesLoading(true);
    setBranchesError('');
    clinicService
      .getBranches()
      .then((list) => {
        if (!cancelled) {
          const active = list.filter((b) => !b.status || b.status === 'ACTIVE');
          setBranches(active);
          if (active.length === 1 && !branchId) {
            setBranchId(active[0].branchId);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBranchesError('Không tải được danh sách cơ sở khám. Chạm để thử lại.');
        }
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchAttempt]);

  useEffect(() => {
    if (!otpExpiresAt) return;
    const timer = setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [otpExpiresAt]);

  const selectedBranch = branches.find((b) => b.branchId === branchId);
  const canResend = countdown === 0;

  const startOtpCountdown = (expiresAtStr: string) => {
    const expiresAt = Date.parse(expiresAtStr);
    const validTarget = Number.isNaN(expiresAt) ? Date.now() + 120000 : expiresAt;
    setOtpExpiresAt(validTarget);
    setCountdown(Math.max(0, Math.ceil((validTarget - Date.now()) / 1000)));
    setOtp(['', '', '', '', '', '']);
  };

  const handleSubmitForm = async () => {
    if (inFlight.current) return;
    setError('');

    if (!branchId || !branches.some((b) => b.branchId === branchId)) {
      setError('Vui lòng chọn cơ sở đăng ký khám');
      return;
    }
    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ và tên');
      return;
    }
    const isoBirthDate = parseDdMmYyyyToIso(birthDateDisplay);
    if (!isoBirthDate) {
      setError('Ngày sinh không hợp lệ (nhập theo định dạng DD/MM/YYYY, ví dụ 15/08/2000)');
      return;
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (isoBirthDate > todayIso) {
      setError('Ngày sinh không được ở tương lai');
      return;
    }
    if (!phone.trim() || !/^(?:0|\+?84)[0-9]{9}$/.test(phone.trim())) {
      setError('Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0 (hoặc +84)');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Vui lòng nhập địa chỉ Email hợp lệ để nhận mã OTP');
      return;
    }
    if (!address.trim()) {
      setError('Vui lòng nhập Địa chỉ hiện tại');
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
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authService.registerPatient({
        fullName: fullName.trim(),
        dateOfBirth: isoBirthDate,
        gender,
        address: address.trim(),
        branchId,
        email: normalizedEmail,
        phone: phone.trim(),
        password,
        confirmPassword,
      });
      setRegistrationEmail(normalizedEmail);
      startOtpCountdown(res.expiresAt);
      setCurrentStep('OTP');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.');
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
      const res = await authService.resendRegistrationOtp(registrationEmail);
      startOtpCountdown(res.expiresAt);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (inFlight.current) return;
    setError('');

    if (Date.now() >= otpExpiresAt) {
      setError('Mã OTP đã hết hạn. Vui lòng bấm gửi lại mã mới.');
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
      const res = await authService.verifyRegistrationOtp(registrationEmail, code);
      setGeneratedPatientCode(res.patientCode);
      setPassword('');
      setConfirmPassword('');
      setOtpExpiresAt(0);
      setCurrentStep('SUCCESS');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  };

  const stepIndex = currentStep === 'FORM' ? 0 : currentStep === 'OTP' ? 1 : 2;

  return (
    <View style={styles.root}>
      <KeyboardSafeView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}>
          {/* Header Xanh Ngọc liền mạch kèm thanh bước tích hợp */}
          <SafeAreaView edges={['top']} style={styles.heroHeader}>
            <View style={styles.decorCircle} />

            <View style={styles.topNav}>
              <Pressable
                style={styles.navPill}
                onPress={() => router.replace('/(auth)/login')}>
                <ArrowLeft size={16} color="#ffffff" />
                <Text style={styles.navPillText}>Đăng nhập</Text>
              </Pressable>
              <Text style={styles.stepIndicatorText}>Bước {stepIndex + 1}/3</Text>
            </View>

            <Text style={styles.heroTitle}>Đăng ký Hồ sơ Bệnh nhân</Text>
            <Text style={styles.heroSubtitle}>
              {currentStep === 'FORM'
                ? 'Điền thông tin cá nhân để khởi tạo mã hồ sơ y tế điện tử'
                : currentStep === 'OTP'
                  ? 'Nhập mã xác thực OTP vừa gửi tới hộp thư Email của bạn'
                  : 'Hồ sơ điện tử của bạn đã sẵn sàng sử dụng'}
            </Text>

            {/* Thanh tiến độ 3 đoạn gọn trên nền xanh ngọc */}
            <View style={styles.progressSteps}>
              {['Thông tin', 'Xác thực OTP', 'Hoàn tất'].map((lbl, idx) => {
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

          {/* Bề mặt trắng liền mạch */}
          <View style={styles.sheetBody}>
            {/* STEP 1: FORM */}
            {currentStep === 'FORM' && (
              <View>
                {error ? (
                  <View style={styles.errorBanner}>
                    <CircleAlert size={16} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Text style={styles.fieldLabel}>
                  Cơ sở đăng ký khám <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                  style={styles.inputField}
                  disabled={branchesLoading || isLoading}
                  onPress={() => setBranchModalOpen(true)}>
                  <Building2 size={19} color={Colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.input,
                      !selectedBranch && { color: Colors.textMuted, fontWeight: '500' },
                    ]}>
                    {branchesLoading
                      ? 'Đang tải danh sách cơ sở...'
                      : selectedBranch
                        ? selectedBranch.branchName
                        : 'Chọn cơ sở phòng khám Crown Dental'}
                  </Text>
                  <ChevronDown size={18} color={Colors.textSecondary} />
                </Pressable>
                {branchesError ? (
                  <Pressable onPress={() => setBranchAttempt((n) => n + 1)}>
                    <Text style={styles.retryText}>{branchesError}</Text>
                  </Pressable>
                ) : null}

                <Text style={styles.fieldLabel}>
                  Họ và tên <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <User size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    placeholderTextColor={Colors.textMuted}
                    editable={!isLoading}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <Text style={styles.fieldLabel}>
                  Ngày sinh (DD/MM/YYYY) <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <Calendar size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ví dụ: 15/08/2000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!isLoading}
                    value={birthDateDisplay}
                    onChangeText={(val) => setBirthDateDisplay(formatDateTyping(val))}
                  />
                </View>

                <Text style={styles.fieldLabel}>
                  Giới tính <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.genderRow}>
                  {(
                    [
                      { key: 'MALE', label: 'Nam' },
                      { key: 'FEMALE', label: 'Nữ' },
                      { key: 'OTHER', label: 'Khác' },
                    ] as const
                  ).map((item) => {
                    const active = gender === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        style={[styles.genderPill, active && styles.genderPillActive]}
                        onPress={() => setGender(item.key)}>
                        <Text
                          style={[
                            styles.genderPillText,
                            active && styles.genderPillTextActive,
                          ]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>
                  Số điện thoại <Text style={styles.required}>*</Text>
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

                <Text style={styles.fieldLabel}>
                  Địa chỉ hiện tại <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <MapPin size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                    placeholderTextColor={Colors.textMuted}
                    editable={!isLoading}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                <Text style={styles.fieldLabel}>
                  Mật khẩu <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputField}>
                  <Lock size={19} color={Colors.primary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Tối thiểu 6 ký tự"
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
                  Xác nhận mật khẩu <Text style={styles.required}>*</Text>
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
                  onPress={handleSubmitForm}>
                  {isLoading ? (
                    <View style={styles.btnInner}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.primaryBtnText}>Đang gửi mã OTP...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <Text style={styles.primaryBtnText}>Tiếp tục & Nhận mã OTP</Text>
                      <ChevronRight size={19} color="#fff" />
                    </View>
                  )}
                </Pressable>

                <View style={styles.bottomSwitch}>
                  <Text style={styles.switchHint}>Đã có Mã bệnh nhân tại phòng khám?</Text>
                  <Pressable onPress={() => router.replace('/(auth)/activate')}>
                    <Text style={styles.switchLink}>Kích hoạt tài khoản có sẵn →</Text>
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
                <Text style={styles.centerHeading}>Xác thực Email của bạn</Text>
                <Text style={styles.centerDesc}>
                  Mã xác thực 6 chữ số đã được gửi tới địa chỉ:
                </Text>
                <Text style={styles.emailHighlight}>{registrationEmail}</Text>

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
                      {isLoading ? 'Đang gửi lại...' : 'Mã OTP đã hết hạn — Gửi lại mã mới'}
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
                      <Text style={styles.primaryBtnText}>Đang xác thực...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <Text style={styles.primaryBtnText}>Xác nhận & Hoàn tất đăng ký</Text>
                      <ChevronRight size={19} color="#fff" />
                    </View>
                  )}
                </Pressable>

                <Pressable
                  disabled={isLoading}
                  style={{ marginTop: 18 }}
                  onPress={() => {
                    setError('');
                    setCurrentStep('FORM');
                  }}>
                  <Text style={styles.backStepText}>← Quay lại chỉnh sửa thông tin</Text>
                </Pressable>
              </View>
            )}

            {/* STEP 3: SUCCESS */}
            {currentStep === 'SUCCESS' && (
              <View style={styles.centerSection}>
                <View style={styles.successCircle}>
                  <CircleCheck size={38} color="#ffffff" />
                </View>
                <Text style={styles.centerHeading}>Đăng ký thành công!</Text>
                <Text style={styles.centerDesc}>
                  Chào mừng <Text style={{ fontWeight: '800', color: Colors.text }}>{fullName}</Text> đến với Crown Dental.
                </Text>

                <View style={styles.codeBanner}>
                  <Text style={styles.codeLabel}>MÃ BỆNH NHÂN CỦA BẠN</Text>
                  <Text selectable style={styles.codeBig}>
                    {generatedPatientCode}
                  </Text>
                  <Text style={styles.codeMeta}>
                    SĐT: {phone} • {registrationEmail}
                  </Text>
                  <Text style={styles.codeNote}>
                    Hãy lưu lại Mã bệnh nhân ({generatedPatientCode}) để dùng khi đăng nhập ứng dụng.
                  </Text>
                </View>

                <Pressable
                  style={[styles.primaryBtn, { width: '100%' }]}
                  onPress={() =>
                    router.replace({
                      pathname: '/(auth)/login',
                      params: { patientCode: generatedPatientCode, phone },
                    })
                  }>
                  <View style={styles.btnInner}>
                    <Text style={styles.primaryBtnText}>Đăng nhập ngay với mã này</Text>
                    <ChevronRight size={19} color="#fff" />
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardSafeView>

      {/* Modal chọn cơ sở */}
      <Modal
        visible={branchModalOpen}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setBranchModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBranchModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Chọn cơ sở đăng ký khám</Text>
            <FlatList
              data={branches}
              keyExtractor={(item) => item.branchId}
              ListEmptyComponent={
                <Text style={styles.emptyBranchText}>Hiện chưa có cơ sở đang hoạt động.</Text>
              }
              renderItem={({ item }) => {
                const selected = item.branchId === branchId;
                return (
                  <Pressable
                    style={[styles.branchItem, selected && styles.branchItemSelected]}
                    onPress={() => {
                      setBranchId(item.branchId);
                      setBranchModalOpen(false);
                    }}>
                    <View style={styles.flex}>
                      <Text style={styles.branchItemName}>{item.branchName}</Text>
                      {item.address ? (
                        <Text style={styles.branchItemAddr}>{item.address}</Text>
                      ) : null}
                    </View>
                    {selected ? <Check size={18} color={Colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: 8,
    marginTop: 16,
  },
  progressItem: { flex: 1, gap: 5 },
  progressBarSeg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  progressBarSegActive: { backgroundColor: '#ffffff' },
  progressLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.72)' },
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
    marginTop: 13,
    marginBottom: 6,
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
    height: 50,
  },
  input: { flex: 1, fontSize: 14.5, fontWeight: '600', color: Colors.text, paddingVertical: 0 },
  retryText: { fontSize: 12, color: Colors.danger, fontWeight: '700', marginTop: 6 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderPill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  genderPillText: { fontSize: 13.5, fontWeight: '700', color: Colors.textSecondary },
  genderPillTextActive: { color: Colors.primaryDark },
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
  bottomSwitch: { alignItems: 'center', marginTop: 20, gap: 4 },
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
  codeNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '65%',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  emptyBranchText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', padding: 20 },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  branchItemSelected: { backgroundColor: Colors.primaryLight },
  branchItemName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  branchItemAddr: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

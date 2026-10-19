import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Clock,
  Shield,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import bgImage from '../assets/images/dental-light-bg.png';
import dentalShieldImg from '../assets/images/dental-security-shield.jpg';

// Motion variants for smooth slide-in
const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const stepTransition = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.25, ease: 'easeIn' } },
};

const childVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Steps: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);

  // OTP inputs refs
  const otpInputRefs = useRef([]);

  // Countdown timer for Step 2
  useEffect(() => {
    let timer;
    if (currentStep === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendActive(true);
    }
    return () => clearInterval(timer);
  }, [currentStep, countdown]);

  // Step 1: Submit Email
  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Định dạng email không hợp lệ');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(2);
      setCountdown(60);
      setIsResendActive(false);
      toast.success('Mã xác thực đã được gửi đến email của bạn!');
    }, 800);
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Step 2: Submit OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      toast.error('Vui lòng nhập đầy đủ mã OTP 6 chữ số');
      return;
    }

    setIsLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(3);
      toast.success('Xác thực mã OTP thành công!');
    }, 700);
  };

  // Resend OTP handler
  const handleResendOtp = () => {
    if (!isResendActive) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCountdown(60);
      setIsResendActive(false);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      toast.success('Đã gửi lại mã OTP mới!');
    }, 600);
  };

  // Step 3: Submit New Password
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
      toast.error('Mật khẩu mới phải bao gồm cả chữ và số');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    // Simulate password update
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(4);
      toast.success('Đổi mật khẩu thành công!');
    }, 800);
  };

  // Password validation checklist
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden flex flex-col justify-center selection:bg-teal-200 selection:text-teal-900">
      {/* Background Image & Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src={bgImage}
          alt="Dental Background"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/35 via-teal-900/15 to-white/95 backdrop-blur-[2px]" />
      </div>

      {/* Main Container: Single Unified Form Card */}
      <div className="relative z-10 w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-teal-950/20 backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Top Accent Gradient Bar across full card */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 z-20" />

        {/* ================= CỘT TRÁI (5/12): THÔNG TIN & HÌNH 3D NHA KHOA ================= */}
        <motion.div
          variants={slideFromLeft}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo & Clinic Name */}
          <div className="relative z-10 space-y-4">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25 ring-2 ring-white/20 group-hover:scale-105 transition-transform">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-teal-300 block">
                  Crown Dental Clinic
                </span>
                <span className="text-xs font-medium text-slate-300">
                  Trung tâm Nha khoa Kỹ thuật cao
                </span>
              </div>
            </Link>

            <div className="space-y-1.5 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Khôi phục <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-100">
                  quyền truy cập
                </span>
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống bảo vệ tài khoản và hồ sơ bệnh án nha khoa đa tầng theo tiêu chuẩn quốc tế.
              </p>
            </div>
          </div>

          {/* Middle 3D Shield Hero Image */}
          <div className="relative z-10 my-6 flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative group"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl shadow-teal-500/20 ring-4 ring-white/10 border border-teal-400/30 bg-teal-950">
                <img
                  src={dentalShieldImg}
                  alt="Dental Security 3D Shield"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900/90 text-teal-300 text-[9px] font-bold tracking-wider uppercase border border-teal-400/50 shadow-lg flex items-center gap-1 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Encrypted 256
              </div>
            </motion.div>
          </div>

          {/* Bottom Security Badges */}
          <div className="relative z-10 space-y-2 pt-2 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Mail size={12} />
              </div>
              <span className="text-[11px]">Xác thực OTP 6 số qua Email chính chủ</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <KeyRound size={12} />
              </div>
              <span className="text-[11px]">Mã hóa BCrypt chống dò quét mật khẩu</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
                <Clock size={12} />
              </div>
              <span className="text-[11px]">Hỗ trợ kỹ thuật 24/7: <b className="text-teal-300">1900 6868</b></span>
            </div>
          </div>
        </motion.div>

        {/* ================= CỘT PHẢI (7/12): FORM QUÊN MẬT KHẨU ================= */}
        <motion.div
          variants={slideFromRight}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 bg-white p-6 sm:p-9 flex flex-col justify-between"
        >
          <div>
            {/* Top Bar inside right form: Title & Security Status Tag */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Cổng cấp lại mật khẩu
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                <ShieldCheck size={13} className="text-teal-700" />
                <span>SSL 256-bit Secure</span>
              </div>
            </div>

            {/* Progress Stepper Indicator */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center justify-between">
                {/* Step 1 */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${currentStep === 1
                      ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30 ring-2 ring-teal-200'
                      : currentStep > 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-400'
                      }`}
                  >
                    {currentStep > 1 ? <Check size={14} /> : '1'}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${currentStep === 1 ? 'text-teal-900' : currentStep > 1 ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                    >
                      Nhập Email
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">Xác minh danh tính</span>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                {/* Step 2 */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${currentStep === 2
                      ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30 ring-2 ring-teal-200'
                      : currentStep > 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-400'
                      }`}
                  >
                    {currentStep > 2 ? <Check size={14} /> : '2'}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${currentStep === 2 ? 'text-teal-900' : currentStep > 2 ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                    >
                      Nhập mã OTP
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">Khóa 6 chữ số</span>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${currentStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                {/* Step 3 */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${currentStep === 3
                      ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30 ring-2 ring-teal-200'
                      : currentStep > 3
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-400'
                      }`}
                  >
                    {currentStep > 3 ? <Check size={14} /> : '3'}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${currentStep === 3 ? 'text-teal-900' : currentStep > 3 ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                    >
                      Mật khẩu mới
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">Hoàn tất bảo mật</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Tip Callout */}
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-teal-900">
              <div className="p-1 rounded-lg bg-teal-100 text-teal-700 shrink-0 mt-0.5">
                <Sparkles size={14} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-teal-900 font-bold">Hướng dẫn: </strong>
                {currentStep === 1 && 'Nhập đúng địa chỉ email đã đăng ký (Bác sĩ, Nhân viên hoặc Bệnh nhân) để nhận mã mở khóa OTP.'}
                {currentStep === 2 && 'Kiểm tra hộp thư đến hoặc mục thư rác (Spam) để lấy mã xác thực 6 số có hiệu lực trong 5 phút.'}
                {currentStep === 3 && 'Tạo mật khẩu mới có tối thiểu 8 ký tự, kết hợp chữ cái và số để đảm bảo độ an toàn cao nhất.'}
                {currentStep === 4 && 'Mật khẩu đã được cập nhật thành công! Bạn có thể đăng nhập ngay bây giờ.'}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {/* Form Content Steps with AnimatePresence */}
            <AnimatePresence mode="wait">
                {/* ================= BƯỚC 1: NHẬP EMAIL ================= */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <KeyRound size={22} className="text-teal-700" />
                        <span>Quên mật khẩu?</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Đừng lo lắng! Hãy nhập địa chỉ email đã đăng ký với phòng khám, hệ thống sẽ gửi một mã xác minh OTP 6 chữ số đến hòm thư của bạn.
                      </p>
                    </div>

                    <form onSubmit={handleSendEmail} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Địa chỉ Email tài khoản <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nhakhoa@crowndental.vn"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-700 focus:bg-white focus:ring-3 focus:ring-teal-700/10 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-900/20 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                      >
                        {isLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Đang kiểm tra & gửi mã...</span>
                          </>
                        ) : (
                          <>
                            <span>Gửi mã xác minh</span>
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="pt-2 text-center">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-800 transition-colors"
                      >
                        <ArrowLeft size={14} />
                        <span>Quay lại trang Đăng nhập</span>
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* ================= BƯỚC 2: NHẬP MÃ OTP ================= */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <ShieldCheck size={22} className="text-teal-700" />
                        <span>Xác thực mã bảo mật (OTP)</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Chúng tôi đã gửi mã xác thực 6 chữ số đến địa chỉ email:
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-xs font-bold text-teal-900">
                        <Mail size={13} className="text-teal-700" />
                        <span>{email}</span>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 text-center">
                          Nhập mã gồm 6 chữ số
                        </label>
                        <div className="flex justify-center gap-2.5 sm:gap-3" onPaste={handleOtpPaste}>
                          {otp.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => (otpInputRefs.current[idx] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-slate-200 text-center font-mono text-xl font-black text-slate-900 outline-none focus:border-teal-700 focus:bg-teal-50/20 focus:ring-3 focus:ring-teal-700/10 transition-all bg-white"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Resend OTP & Countdown */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-slate-500">Không nhận được mã?</span>
                        {isResendActive ? (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isLoading}
                            className="font-bold text-teal-800 hover:text-teal-900 cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                            <span>Gửi lại mã ngay</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            Gửi lại sau <span className="font-bold text-teal-700">{countdown}s</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || otp.join('').length < 6}
                        className="w-full py-3.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                      >
                        {isLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Đang xác thực mã...</span>
                          </>
                        ) : (
                          <>
                            <span>Xác thực & Tiếp tục</span>
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-800 transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>Đổi lại địa chỉ email khác</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ================= BƯỚC 3: ĐẶT MẬT KHẨU MỚI ================= */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    variants={stepTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <KeyRound size={22} className="text-teal-700" />
                        <span>Thiết lập mật khẩu mới</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Tạo mật khẩu bảo mật mới cho tài khoản của bạn để tiếp tục làm việc trên hệ thống.
                      </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      {/* Mật khẩu mới */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Mật khẩu mới <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập tối thiểu 8 ký tự (chữ & số)"
                            className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-700 focus:bg-white focus:ring-3 focus:ring-teal-700/10 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Xác nhận mật khẩu mới */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Xác nhận lại mật khẩu mới <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại chính xác mật khẩu mới"
                            className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-700 focus:bg-white focus:ring-3 focus:ring-teal-700/10 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Tiêu chí an toàn mật khẩu */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5 text-xs text-slate-600">
                        <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                          Tiêu chuẩn mật khẩu an toàn:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <Check size={12} className={hasMinLength ? 'text-emerald-600' : 'text-slate-300'} />
                            <span>Tối thiểu 8 ký tự</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <Check size={12} className={hasLetter ? 'text-emerald-600' : 'text-slate-300'} />
                            <span>Có chứa chữ cái</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <Check size={12} className={hasNumber ? 'text-emerald-600' : 'text-slate-300'} />
                            <span>Có chứa chữ số</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <Check size={12} className={isMatch ? 'text-emerald-600' : 'text-slate-300'} />
                            <span>Mật khẩu trùng khớp</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !hasMinLength || !hasLetter || !hasNumber || !isMatch}
                        className="w-full py-3.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                      >
                        {isLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Đang cập nhật mật khẩu...</span>
                          </>
                        ) : (
                          <>
                            <span>Cập nhật mật khẩu mới</span>
                            <CheckCircle2 size={16} />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ================= BƯỚC 4: THÀNH CÔNG ================= */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    variants={stepTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6 text-center py-4"
                  >
                    <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-8 ring-emerald-50 shadow-inner">
                      <CheckCircle2 size={36} />
                    </div>

                    <div className="space-y-2">
                      <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Khôi phục thành công
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Đổi mật khẩu thành công!
                      </h2>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Mật khẩu tài khoản của bạn đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới này để đăng nhập ngay bây giờ.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full py-3.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-900/20 hover:-translate-y-0.5"
                      >
                        <span>Đăng nhập ngay</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

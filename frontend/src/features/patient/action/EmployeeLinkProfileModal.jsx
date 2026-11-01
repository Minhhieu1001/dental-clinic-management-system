import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
  Link2,
  Mail,
  ShieldCheck,
  ArrowLeft,
  Clock,
  RotateCw,
  Info,
  Calendar,
  Phone,
  User,
  Users,
  CreditCard,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getRegisteredPatients, getPatients } from '../../../services/patient.service';
import {
  requestPatientRelationshipOtp,
  verifyPatientRelationshipOtp,
  getAllLinkedPatientRelationships,
} from '../../../services/patientRelationship.service';
import {
  RELATIONSHIP_LABELS,
  relationshipError,
  normalizePhone,
  isValidPhone,
} from '../../../utils/relationshipUtils';
import Warning from '../../../components/ui/Warning';

export default function EmployeeLinkProfileModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  // Step 1: Chọn hồ sơ & thông tin | Step 2: Nhập mã OTP xác thực
  const [step, setStep] = useState(1);

  // Danh sách từ API thật
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [linkedRelationships, setLinkedRelationships] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Cột Trái: Chọn tài khoản giám hộ (Hồ sơ đã đăng ký tài khoản) - MẶC ĐỊNH RỖNG
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [guardianQuery, setGuardianQuery] = useState('');
  const [isGuardianDropdownOpen, setIsGuardianDropdownOpen] = useState(false);

  // Cột Phải: Chọn hồ sơ cần liên kết (Tất cả bệnh nhân) - MẶC ĐỊNH RỖNG
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetQuery, setTargetQuery] = useState('');
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  // Mối quan hệ
  const [relationshipType, setRelationshipType] = useState('CHILD');
  const [notes, setNotes] = useState('');

  // OTP Session & Countdown
  const [session, setSession] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [totalOtpSeconds, setTotalOtpSeconds] = useState(120);
  const [otpRemaining, setOtpRemaining] = useState(120);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State cảnh báo Warning khi đang chờ OTP mà muốn tắt
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const otpInputRefs = useRef([]);
  const guardianDropdownRef = useRef(null);
  const targetDropdownRef = useRef(null);

  // 1. Tải danh sách dữ liệu thật từ database khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setErrorMessage('');
    setSession(null);
    setOtp(['', '', '', '', '', '']);
    setRelationshipType('CHILD');
    setNotes('');
    setIsWarningOpen(false);

    // ĐẶT RỖNG CẢ 2 BÊN THEO YÊU CẦU
    setSelectedGuardian(null);
    setGuardianQuery('');
    setIsGuardianDropdownOpen(false);

    setSelectedTarget(null);
    setTargetQuery('');
    setIsTargetDropdownOpen(false);
    setLinkedRelationships([]);

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [regData, allData, linkedData] = await Promise.all([
          getRegisteredPatients(),
          getPatients(),
          getAllLinkedPatientRelationships().catch((err) => {
            console.warn('Lỗi khi tải danh sách quan hệ đã liên kết:', err);
            return [];
          }),
        ]);

        const regList = Array.isArray(regData) ? regData : regData?.data || regData?.result || [];
        const allList = Array.isArray(allData) ? allData : allData?.data || allData?.result || [];
        const linkedList = Array.isArray(linkedData) ? linkedData : linkedData?.data || linkedData?.result || [];

        setRegisteredPatients(regList);
        setAllPatients(allList);
        setLinkedRelationships(linkedList);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu liên kết:', err);
        setErrorMessage('Không thể tải danh sách bệnh nhân từ hệ thống. Vui lòng thử lại sau.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen]);

  // Tự động kiểm tra trùng khớp giữa hồ sơ chính chủ và hồ sơ liên kết
  useEffect(() => {
    if (selectedGuardian && selectedTarget) {
      if (selectedGuardian.id === selectedTarget.id) {
        setErrorMessage('Hồ sơ chính chủ và hồ sơ liên kết không được trùng nhau.');
      } else if (errorMessage === 'Hồ sơ chính chủ và hồ sơ liên kết không được trùng nhau.') {
        setErrorMessage('');
      }
    }
  }, [selectedGuardian, selectedTarget]);

  // Map tra cứu nhanh thông tin bệnh nhân theo ID
  const patientByIdMap = useMemo(() => {
    const map = new Map();
    (allPatients || []).forEach((p) => {
      if (p.id) map.set(p.id, p);
    });
    (registeredPatients || []).forEach((p) => {
      if (p.id && !map.has(p.id)) map.set(p.id, p);
    });
    return map;
  }, [allPatients, registeredPatients]);

  // Map đối chiếu các hồ sơ đã được liên kết:
  // key: relatedPatientId -> thông tin hồ sơ bảo trợ (chủ hộ)
  const linkedPatientCodeMap = useMemo(() => {
    const map = new Map();
    (linkedRelationships || []).forEach((link) => {
      if (link.relatedPatientId && link.patientId) {
        const sponsor = patientByIdMap.get(link.patientId);
        const sponsorCode = sponsor?.patientCode || link.patientCode || '';
        map.set(link.relatedPatientId, {
          sponsorId: link.patientId,
          sponsorCode,
          sponsorName: sponsor?.fullName || '',
          relationshipType: link.relationshipType,
        });
      }
    });
    return map;
  }, [linkedRelationships, patientByIdMap]);

  // Đếm ngược thời gian OTP
  useEffect(() => {
    let timer;
    if (step === 2 && otpRemaining > 0) {
      timer = setInterval(() => {
        setOtpRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpRemaining]);

  // Click outside to close combobox dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (guardianDropdownRef.current && !guardianDropdownRef.current.contains(e.target)) {
        setIsGuardianDropdownOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(e.target)) {
        setIsTargetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format ngày sinh DD/MM/YYYY chuẩn, xử lý chuỗi ISO có 'T'
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Tính tuổi
  const calculateAge = (dob) => {
    if (!dob) return '';
    const clean = String(dob).split('T')[0];
    const birthYear = new Date(clean).getFullYear();
    if (isNaN(birthYear)) return '';
    const age = new Date().getFullYear() - birthYear;
    return `${age} tuổi`;
  };

  // Map giới tính Nam/Nữ
  const formatGender = (gender) => {
    if (gender === 'MALE') return 'Nam';
    if (gender === 'FEMALE') return 'Nữ';
    return gender || 'Chưa xác định';
  };

  // Lọc người giám hộ theo tên, mã BN, SĐT
  const filteredGuardians = useMemo(() => {
    if (!guardianQuery.trim()) return registeredPatients;
    const q = guardianQuery.toLowerCase().trim();
    return registeredPatients.filter((p) => {
      const matchName = (p.fullName || '').toLowerCase().includes(q);
      const matchCode = (p.patientCode || '').toLowerCase().includes(q);
      const matchPhone = (p.phone || p.phoneNumber || '').includes(q);
      return matchName || matchCode || matchPhone;
    });
  }, [registeredPatients, guardianQuery]);

  // Lọc hồ sơ liên kết theo tên, mã BN, SĐT (loại trừ chính chủ đang chọn)
  const filteredTargets = useMemo(() => {
    const targets = allPatients.filter((p) => !selectedGuardian || p.id !== selectedGuardian.id);
    if (!targetQuery.trim()) return targets;
    const q = targetQuery.toLowerCase().trim();
    return targets.filter((p) => {
      const matchName = (p.fullName || '').toLowerCase().includes(q);
      const matchCode = (p.patientCode || '').toLowerCase().includes(q);
      const matchPhone = (p.phone || p.phoneNumber || '').includes(q);
      return matchName || matchCode || matchPhone;
    });
  }, [allPatients, selectedGuardian, targetQuery]);

  // Kiểm tra số điện thoại trùng khớp giữa 2 hồ sơ
  const isPhoneMatched = useMemo(() => {
    if (!selectedGuardian || !selectedTarget) return false;
    const p1 = normalizePhone(selectedGuardian.phone || selectedGuardian.phoneNumber || '');
    const p2 = normalizePhone(selectedTarget.phone || selectedTarget.phoneNumber || '');
    return p1 && p2 && p1 === p2;
  }, [selectedGuardian, selectedTarget]);

  // Định dạng mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Phần trăm thời gian còn lại cho progress bar trên đầu xác thực
  const timerPercentage = totalOtpSeconds > 0 ? (otpRemaining / totalOtpSeconds) * 100 : 0;

  // Xử lý khi nhấn nút Đóng (X) hoặc nút Hủy: Nếu đang chờ OTP thì hiện Warning
  const handleRequestClose = () => {
    if (step === 2) {
      setIsWarningOpen(true);
    } else {
      onClose();
    }
  };

  // Xác nhận thoát từ modal Warning
  const handleConfirmExit = () => {
    setIsWarningOpen(false);
    setStep(1);
    setSession(null);
    setOtp(['', '', '', '', '', '']);
    onClose();
  };

  // ================= BƯỚC 1 -> BƯỚC 2: GỌI API 1: requestPatientRelationshipOtp =================
  const handleProceedToOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!selectedGuardian) {
      setErrorMessage('Vui lòng chọn tài khoản giám hộ (hồ sơ chính chủ).');
      return;
    }
    if (!selectedTarget) {
      setErrorMessage('Vui lòng chọn hồ sơ bệnh nhân cần liên kết.');
      return;
    }
    if (selectedGuardian.id === selectedTarget.id) {
      setErrorMessage('Hồ sơ chính chủ và hồ sơ liên kết không được trùng nhau.');
      return;
    }

    const guardianPhone = normalizePhone(selectedGuardian.phone || selectedGuardian.phoneNumber || '');
    const targetPhone = normalizePhone(selectedTarget.phone || selectedTarget.phoneNumber || '');

    if (!isValidPhone(guardianPhone)) {
      setErrorMessage('Số điện thoại hồ sơ chính chủ không hợp lệ.');
      return;
    }
    if (!isValidPhone(targetPhone)) {
      setErrorMessage('Số điện thoại hồ sơ người thân không hợp lệ.');
      return;
    }

    const email = selectedGuardian.email || selectedGuardian.user?.email;
    if (!email || !email.trim()) {
      setErrorMessage('Hồ sơ chính chủ chưa có email đăng ký để nhận mã OTP. Vui lòng cập nhật email tại phòng khám.');
      return;
    }

    const birthdayClean = String(selectedTarget.dateOfBirth).split('T')[0];
    if (!birthdayClean || isNaN(new Date(birthdayClean).getTime())) {
      setErrorMessage('Hồ sơ người thân chưa có ngày sinh hợp lệ.');
      return;
    }

    const payload = {
      patientId: selectedGuardian.id,
      patientPhone: guardianPhone,
      relatedPatientCode: (selectedTarget.patientCode || '').trim(),
      fullName: (selectedTarget.fullName || '').trim(),
      birthday: birthdayClean,
      phoneRelatedPatient: targetPhone,
      relationshipType: relationshipType || 'CHILD',
    };

    setIsSendingOtp(true);
    try {
      const response = await requestPatientRelationshipOtp(payload);
      const data = response?.data || response;

      if (!data?.requestId) {
        throw new Error('Không nhận được requestId từ máy chủ.');
      }

      const resendSeconds = data.resendAfterSeconds || 120;
      setTotalOtpSeconds(resendSeconds);
      setOtpRemaining(resendSeconds);

      setSession({
        requestId: data.requestId,
        payload,
        email,
      });

      setOtp(['', '', '', '', '', '']);
      setStep(2);
      toast.success(`Đã gửi mã OTP đến email ${email}!`);
    } catch (err) {
      console.error('Lỗi khi gửi OTP liên kết:', err);
      const msg = relationshipError(err, 'Không thể gửi mã OTP. Vui lòng kiểm tra lại thông tin.');
      setErrorMessage(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (otpRemaining > 0 || !session?.payload) return;
    setIsSendingOtp(true);
    setErrorMessage('');
    try {
      const response = await requestPatientRelationshipOtp(session.payload);
      const data = response?.data || response;
      const resendSeconds = data.resendAfterSeconds || 120;

      setTotalOtpSeconds(resendSeconds);
      setOtpRemaining(resendSeconds);
      setSession((prev) => ({ ...prev, requestId: data.requestId }));
      setOtp(['', '', '', '', '', '']);
      toast.success(`Đã gửi lại mã OTP tới ${session.email}`);
    } catch (err) {
      console.error('Lỗi khi gửi lại OTP:', err);
      const msg = relationshipError(err, 'Gửi lại OTP thất bại.');
      setErrorMessage(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ================= BƯỚC 2: GỌI API 2: verifyPatientRelationshipOtp =================
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const otpCode = otp.join('');
    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }
    if (!session?.requestId) {
      setErrorMessage('Phiên xác thực không hợp lệ. Vui lòng thử lại.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyPatientRelationshipOtp(session.requestId, otpCode);
      const resultData = response?.data || response;

      toast.success(
        `Liên kết thành công`,
        { icon: '✅', duration: 4000 }
      );

      if (onSuccess) {
        await onSuccess(resultData);
      }

      onClose();
    } catch (err) {
      console.error('Lỗi khi xác thực OTP:', err);
      const msg = relationshipError(err, 'Mã OTP không đúng hoặc đã hết hạn.');
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Xử lý 6 ô input OTP
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

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
      setOtp(pasteData.split(''));
      otpInputRefs.current[5]?.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* BACKDROP: CHỈ ĐÓNG KHI BẤM DẤU X (BỎ onClick Ở BACKDROP THEO YÊU CẦU) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px]"
          />

          {/* MODAL DIALOG CONTAINER CHUẨN ERP */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-4xl bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
          >
            {/* ================= HEADER MODAL ================= */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-teal-700 text-white flex items-center justify-center shadow-xs">
                  <Link2 size={16} className="stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {step === 1 ? 'Liên kết hồ sơ bệnh nhân' : 'Xác thực OTP qua Email Chủ Hộ'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {step === 1
                      ? 'Tìm kiếm và chọn người giám hộ cùng hồ sơ cần liên kết.'
                      : `Nhập mã xác thực 6 chữ số gửi tới email: ${session?.email || selectedGuardian?.email}`}
                  </p>
                </div>
              </div>

              {/* NÚT DẤU X ĐÓNG MODAL (KIỂM TRA CẢNH BÁO NẾU ĐANG CHỜ OTP) */}
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={isSendingOtp || isVerifying}
                className="w-7 h-7 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                title="Đóng modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* ================= THÔNG BÁO LỖI TRỰC TIẾP TRÊN FORM (KHÔNG DÙNG TOAST) ================= */}
            {errorMessage && (
              <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-rose-400 hover:text-rose-700 cursor-pointer p-0.5 rounded-sm hover:bg-rose-100"
                  title="Đóng thông báo lỗi"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* ================= BƯỚC 1: CHỌN HỒ SƠ LIÊN KẾT ================= */}
            {step === 1 && (
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                {/* 2 CỘT LIÊN KẾT */}
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

                  {/* CỘT TRÁI: TÀI KHOẢN GIÁM HỘ (GETREGISTEREDPATIENTS) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <User size={15} className="text-teal-700" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Tài khoản giám hộ
                      </h3>
                    </div>

                    <label className="block text-[11px] font-semibold text-slate-700">
                      Tìm và chọn tài khoản giám hộ <span className="text-rose-500">*</span>
                    </label>

                    {/* Combobox người giám hộ */}
                    <div className="relative" ref={guardianDropdownRef}>
                      <div className="relative flex items-center">
                        <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={guardianQuery}
                          onChange={(e) => {
                            setGuardianQuery(e.target.value);
                            setIsGuardianDropdownOpen(true);
                          }}
                          onFocus={() => setIsGuardianDropdownOpen(true)}
                          placeholder="Tìm theo số điện thoại, mã hoặc tên người giám hộ..."
                          className="w-full rounded-sm border border-slate-300 bg-white pl-8.5 pr-14 py-2 text-xs text-slate-800 font-medium focus:border-teal-700 focus:outline-none shadow-2xs"
                        />
                        {guardianQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGuardian(null);
                              setGuardianQuery('');
                              setIsGuardianDropdownOpen(true);
                            }}
                            className="absolute right-7 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Xóa lựa chọn"
                          >
                            <X size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsGuardianDropdownOpen(!isGuardianDropdownOpen)}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Dữ liệu từ tài khoản đã đăng ký (getRegisteredPatients).
                      </p>

                      {/* Dropdown người giám hộ */}
                      {isGuardianDropdownOpen && (
                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-sm border border-slate-200 bg-white shadow-xl py-1">
                          {filteredGuardians.length > 0 ? (
                            filteredGuardians.map((g) => (
                              <div
                                key={g.id}
                                onClick={() => {
                                  setSelectedGuardian(g);
                                  setGuardianQuery(`${g.fullName} — ${g.patientCode}`);
                                  setIsGuardianDropdownOpen(false);
                                }}
                                className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-teal-50 transition-colors ${selectedGuardian?.id === g.id ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-700'
                                  }`}
                              >
                                <div>
                                  <div className="font-bold">
                                    {g.fullName} — <span className="text-teal-700">{g.patientCode}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    SĐT: {g.phone || g.phoneNumber} • CCCD: {g.cccd || 'N/A'} • {formatGender(g.gender)}
                                  </div>
                                </div>
                                {selectedGuardian?.id === g.id && <Check size={14} className="text-teal-700" />}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-400 text-center">
                              Không tìm thấy tài khoản phù hợp
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* THẺ CHI TIẾT NGƯỜI GIÁM HỘ (VIEW THÔNG TIN LÊN UI) */}
                    {selectedGuardian ? (
                      <div className="rounded-sm border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                        {/* Header card */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-sm bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                              {(selectedGuardian.fullName || 'BN')
                                .split(' ')
                                .map((n) => n[0])
                                .slice(-2)
                                .join('')}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{selectedGuardian.fullName}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Đã xác minh
                          </span>
                        </div>

                        {/* Table grid thông tin */}
                        <div className="border-t border-slate-100 pt-2 text-xs space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Mã bệnh nhân</span>
                              <span className="font-bold text-teal-800">{selectedGuardian.patientCode}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Họ và tên</span>
                              <span className="font-bold text-slate-700">{selectedGuardian.fullName}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Số điện thoại</span>
                              <span className="font-semibold text-slate-700">
                                {selectedGuardian.phone || selectedGuardian.phoneNumber || 'Chưa cập nhật'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Ngày sinh</span>
                              <span className="font-semibold text-slate-700">
                                {formatDate(selectedGuardian.dateOfBirth)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Tuổi</span>
                              <span className="font-semibold text-slate-700">
                                {calculateAge(selectedGuardian.dateOfBirth)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Giới tính</span>
                              <span className="font-semibold text-slate-700">
                                {formatGender(selectedGuardian.gender)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px]">Email nhận OTP</span>
                            <span className="font-bold text-teal-800 break-all">
                              {selectedGuardian.email || selectedGuardian.user?.email || 'Chưa cập nhật email'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px]">Địa chỉ</span>
                            <span className="font-semibold text-slate-600 truncate block">
                              {selectedGuardian.address || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5 min-h-[160px]">
                        <User size={24} className="text-slate-300" />
                        <span className="font-medium text-slate-500">Chưa chọn tài khoản giám hộ</span>
                        <span className="text-[11px] text-slate-400">Tìm kiếm theo SĐT, mã BN hoặc họ tên ở trên</span>
                      </div>
                    )}
                  </div>

                  {/* ICON NỐI TRÒN Ở GIỮA 2 CỘT */}
                  <div className="hidden md:flex absolute left-1/2 top-44 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-300 shadow-sm text-teal-700 items-center justify-center z-10">
                    <Link2 size={14} />
                  </div>

                  {/* CỘT PHẢI: HỒ SƠ LIÊN KẾT (GETPATIENTS) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={15} className="text-teal-700" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Hồ sơ liên kết
                      </h3>
                    </div>

                    <label className="block text-[11px] font-semibold text-slate-700">
                      Tìm và chọn hồ sơ liên kết <span className="text-rose-500">*</span>
                    </label>

                    {/* Combobox hồ sơ cần liên kết */}
                    <div className="relative" ref={targetDropdownRef}>
                      <div className="relative flex items-center">
                        <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={targetQuery}
                          onChange={(e) => {
                            setTargetQuery(e.target.value);
                            setIsTargetDropdownOpen(true);
                          }}
                          onFocus={() => setIsTargetDropdownOpen(true)}
                          placeholder="Tìm theo số điện thoại, mã hoặc tên bệnh nhân..."
                          className="w-full rounded-sm border border-slate-300 bg-white pl-8.5 pr-14 py-2 text-xs text-slate-800 font-medium focus:border-teal-700 focus:outline-none shadow-2xs"
                        />
                        {targetQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTarget(null);
                              setTargetQuery('');
                              setIsTargetDropdownOpen(true);
                            }}
                            className="absolute right-7 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Xóa lựa chọn"
                          >
                            <X size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Dữ liệu từ danh sách tất cả bệnh nhân (getPatients).
                      </p>

                      {/* Dropdown hồ sơ liên kết */}
                      {isTargetDropdownOpen && (
                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-sm border border-slate-200 bg-white shadow-xl py-1">
                          {filteredTargets.length > 0 ? (
                            filteredTargets.map((t) => {
                              const linkedInfo = linkedPatientCodeMap.get(t.id);
                              return (
                                <div
                                  key={t.id}
                                  onClick={() => {
                                    setSelectedTarget(t);
                                    setTargetQuery(`${t.fullName} — ${t.patientCode}`);
                                    setIsTargetDropdownOpen(false);
                                  }}
                                  className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-b-0 ${selectedTarget?.id === t.id ? 'bg-teal-50/80 font-bold text-teal-800' : 'text-slate-700'
                                    }`}
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900">{t.fullName}</span>
                                      <span className="text-teal-700 font-mono font-bold">[{t.patientCode}]</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      SĐT: {t.phone || t.phoneNumber || 'N/A'} • {formatDate(t.dateOfBirth)} • {formatGender(t.gender)}
                                    </div>
                                  </div>

                                  {/* BÊN PHẢI: MÃ BỆNH NHÂN LIÊN KẾT MÀU CAM */}
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {linkedInfo?.sponsorCode && (
                                      <span
                                        className="px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1 font-mono"
                                        title={`Đã liên kết với: ${linkedInfo.sponsorName || linkedInfo.sponsorCode}`}
                                      >
                                        <Link2 size={11} className="text-amber-600" />
                                        <span>{linkedInfo.sponsorCode}</span>
                                      </span>
                                    )}
                                    {selectedTarget?.id === t.id && <Check size={14} className="text-teal-700 shrink-0" />}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-400 text-center">
                              Không tìm thấy bệnh nhân phù hợp
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* THẺ CHI TIẾT HỒ SƠ LIÊN KẾT (VIEW THÔNG TIN HOẶC PLACEHOLDER KHI CHƯA CHỌN) */}
                    {selectedTarget ? (
                      <div className="rounded-sm border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                        {/* Header card */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-sm bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center border border-sky-200">
                              {(selectedTarget.fullName || 'BN')
                                .split(' ')
                                .map((n) => n[0])
                                .slice(-2)
                                .join('')}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{selectedTarget.fullName}</span>
                          </div>

                          {linkedPatientCodeMap.has(selectedTarget.id) ? (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-300 font-mono">
                              <Link2 size={10} className="text-amber-600" />
                              Đã liên kết: {linkedPatientCodeMap.get(selectedTarget.id)?.sponsorCode}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-sm bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                              Hồ sơ bệnh nhân
                            </span>
                          )}
                        </div>

                        {/* Table grid thông tin */}
                        <div className="border-t border-slate-100 pt-2 text-xs space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Mã bệnh nhân</span>
                              <span className="font-bold text-teal-800">{selectedTarget.patientCode}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Họ và tên</span>
                              <span className="font-bold text-slate-700">{selectedTarget.fullName}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Số điện thoại</span>
                              <span className="font-semibold text-slate-700">
                                {selectedTarget.phone || selectedTarget.phoneNumber || 'Chưa cập nhật'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Ngày sinh</span>
                              <span className="font-semibold text-slate-700">
                                {formatDate(selectedTarget.dateOfBirth)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Tuổi</span>
                              <span className="font-semibold text-slate-700">
                                {calculateAge(selectedTarget.dateOfBirth)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Giới tính</span>
                              <span className="font-semibold text-slate-700">
                                {formatGender(selectedTarget.gender)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px]">Email</span>
                            <span className="font-semibold text-slate-500">
                              {selectedTarget.email || 'Chưa cập nhật'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px]">Địa chỉ</span>
                            <span className="font-semibold text-slate-600 truncate block">
                              {selectedTarget.address || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5 min-h-[160px]">
                        <Users size={24} className="text-slate-300" />
                        <span className="font-medium text-slate-500">Chưa chọn hồ sơ cần liên kết</span>
                        <span className="text-[11px] text-slate-400">Tìm kiếm theo SĐT, mã BN hoặc họ tên ở trên</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CHỌN MỐI QUAN HỆ */}
                <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/60 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Mối quan hệ bảo trợ <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => {
                      const isChecked = relationshipType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRelationshipType(key)}
                          className={`p-2 rounded-sm border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isChecked
                            ? 'border-teal-700 bg-teal-50 text-teal-800 ring-1 ring-teal-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          <span>{label}</span>
                          {isChecked && <Check size={12} className="text-teal-700" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* BANNER THÔNG BÁO XÁC MINH SỐ ĐIỆN THOẠI HOẶC CHƯA CHỌN ĐỦ */}
                {selectedGuardian && selectedTarget ? (
                  isPhoneMatched ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <span>Thông tin đã được hệ thống xác minh - Số điện thoại trùng khớp</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>
                        Lưu ý: Số điện thoại người giám hộ và bệnh nhân cần trùng khớp theo quy định phòng khám để tiến hành gửi OTP.
                      </span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                    <Info size={14} className="text-slate-400 shrink-0" />
                    <span>Vui lòng tìm và chọn cả 2 hồ sơ (Chính chủ & Người thân) để tiến hành liên kết.</span>
                  </div>
                )}
              </div>
            )}

            {/* ================= BƯỚC 2: MÀN HÌNH XÁC THỰC OTP (CÓ TIME TRÊN ĐẦU XÁC THỰC) ================= */}
            {step === 2 && (
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">

                {/* THANH ĐẾM NGƯỢC THỜI GIAN TRÊN ĐẦU XÁC THỰC (COUNTDOWN HEADER TIMER) */}
                <div className="rounded-sm border border-teal-200 bg-teal-50/80 p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-teal-900">
                      <Clock size={16} className="text-teal-700 animate-pulse" />
                      <span>Thời gian hiệu lực mã OTP:</span>
                    </div>
                    <div className="text-sm font-black text-teal-800 tracking-wider">
                      {formatTime(otpRemaining)}
                    </div>
                  </div>

                  {/* Thanh Progress Bar trực quan */}
                  <div className="w-full h-1.5 bg-teal-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${timerPercentage}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-teal-800 flex items-center justify-between">
                    <span>
                      Mã xác thực đã được gửi đến: <strong>{session?.email}</strong>
                    </span>
                    {otpRemaining === 0 && (
                      <span className="text-rose-600 font-bold">Mã đã hết hạn</span>
                    )}
                  </p>
                </div>

                {/* Mô tả nhập OTP */}
                <div className="text-center space-y-1 pt-1">
                  <div className="w-10 h-10 rounded-sm bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-2xs">
                    <Mail size={20} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    Nhập mã 6 chữ số từ email chủ hộ
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Vui lòng yêu cầu chủ hộ cung cấp mã OTP được gửi về hộp thư để hoàn tất thủ tục liên kết.
                  </p>
                </div>

                {/* 6 Ô NHẬP OTP */}
                <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-11 sm:w-11 sm:h-12 rounded-sm border-2 border-slate-300 text-center text-lg sm:text-xl font-bold text-slate-800 focus:border-teal-700 focus:bg-teal-50/20 focus:outline-none transition-all shadow-2xs"
                    />
                  ))}
                </div>

                {/* Nút gửi lại mã OTP */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpRemaining > 0 || isSendingOtp}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 disabled:opacity-40 disabled:hover:text-teal-700 cursor-pointer"
                  >
                    <RotateCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                    <span>{isSendingOtp ? 'Đang gửi...' : 'Gửi lại mã OTP qua Email'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= FOOTER MODAL ================= */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Link2 size={13} className="text-slate-400" />
                <span>Liên kết quyền xem, giữ riêng bệnh án từng người.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {step === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRequestClose}
                      disabled={isSendingOtp}
                      className="rounded-sm border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToOtp}
                      disabled={isSendingOtp || !selectedGuardian || !selectedTarget}
                      className="flex items-center gap-1.5 rounded-sm bg-teal-700 hover:bg-teal-800 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang gửi OTP...</span>
                        </>
                      ) : (
                        <>
                          <Link2 size={13} />
                          <span>Liên kết hồ sơ</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isVerifying}
                      className="flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <ArrowLeft size={13} />
                      <span>Quay lại</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifying || otp.join('').length !== 6}
                      className="flex items-center gap-1.5 rounded-sm bg-teal-700 hover:bg-teal-800 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang xác thực...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} />
                          <span>Xác nhận & Hoàn tất</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}

      {/* ================= MODAL CẢNH BÁO WARNING KHI MUỐN HỦY/THOÁT TRONG LÚC CHỜ OTP ================= */}
      <Warning
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        onConfirm={handleConfirmExit}
        title="Cảnh báo hủy phiên xác thực OTP"
        message="Hệ thống đang trong quá trình chờ xác thực mã OTP gửi về email. Nếu bạn thoát lúc này, phiên gửi OTP sẽ bị hủy và bạn phải thực hiện lại từ đầu."
        subMessage="Bạn có chắc chắn muốn dừng và thoát khỏi màn hình xác thực OTP?"
        confirmText="Xác nhận thoát"
        cancelText="Ở lại tiếp tục"
      />
    </AnimatePresence>
  );
}

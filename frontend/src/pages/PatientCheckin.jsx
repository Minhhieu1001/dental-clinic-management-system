import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  QrCode,
  User,
  Phone,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  Sparkles,
  Camera,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FileText,
  Printer,
  Share2,
  Info,
  ChevronRight,
  ShieldCheck,
  Building2,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientCheckin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [appointmentCode, setAppointmentCode] = useState('');
  const [branchName, setBranchName] = useState('Crown Dental Nam Kỳ Khởi Nghĩa - TP.HCM');

  // UI state machine: 'FORM' | 'SCANNING' | 'SUBMITTING' | 'SUCCESS'
  const [currentStep, setCurrentStep] = useState('FORM');
  const [ticketData, setTicketData] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Đọc params từ QR code trên URL (nếu có: ?code=APT-xxx&phone=09xxx&name=xxx)
  useEffect(() => {
    const codeParam = searchParams.get('code') || searchParams.get('appointmentCode') || '';
    const phoneParam = searchParams.get('phone') || searchParams.get('sdt') || '';
    const nameParam = searchParams.get('name') || searchParams.get('fullName') || '';
    const branchParam = searchParams.get('branch') || '';

    if (codeParam) setAppointmentCode(codeParam.toUpperCase());
    if (phoneParam) setPhoneNumber(phoneParam);
    if (nameParam) setFullName(nameParam);
    if (branchParam) setBranchName(branchParam);

    // Nếu URL có đủ cả 3 thông số từ mã QR cá nhân, gợi ý tự động xác nhận
    if (codeParam && phoneParam && nameParam) {
      toast.success('Đã nhận diện thông tin lịch hẹn từ mã QR!', { icon: '✨' });
    }
  }, [searchParams]);

  // Demo auto-fill data
  const handleFillDemoData = () => {
    setFullName('Lê Băng Châu');
    setPhoneNumber('0378995152');
    setAppointmentCode('APT-20261120-008');
    setFormErrors({});
    toast.success('Đã nạp thông tin lịch hẹn mẫu demo!');
  };

  // Validate form
  const validate = () => {
    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn';
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phoneNumber.trim().replace(/\s+/g, ''))) {
      errors.phoneNumber = 'Số điện thoại không đúng định dạng (10 số)';
    }
    if (!appointmentCode.trim()) {
      errors.appointmentCode = 'Vui lòng nhập mã lịch hẹn (VD: APT-20261120-008)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit check-in
  const handleCheckinSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập!');
      return;
    }

    setCurrentStep('SUBMITTING');

    // Giả lập đối soát dữ liệu lịch hẹn và tạo số thứ tự tiếp nhận
    setTimeout(() => {
      // Mock ticket data
      const randomTicketNum = Math.floor(Math.random() * 20) + 5;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN');

      setTicketData({
        ticketNumber: `A-${String(randomTicketNum).padStart(2, '0')}`,
        appointmentCode: appointmentCode.toUpperCase(),
        patientName: fullName.trim(),
        patientPhone: phoneNumber.trim(),
        doctorName: 'BS. CKI Nguyễn Thị Phương',
        room: 'Phòng Khám 102 - Ghế 02',
        serviceName: 'Khám tổng quát & Tư vấn điều trị',
        branchName: branchName,
        checkinTime: `${timeStr} - ${dateStr}`,
        estimatedWaitTime: 'Khoảng 5 - 10 phút',
        status: 'WAITING'
      });

      setCurrentStep('SUCCESS');
      toast.success('Check-in tiếp nhận thành công!');
    }, 1200);
  };

  // Giả lập quét camera QR
  const handleSimulateScan = () => {
    setCameraActive(true);
    setCurrentStep('SCANNING');

    // Giả lập quét thành công sau 2.5s
    setTimeout(() => {
      setCameraActive(false);
      setAppointmentCode('APT-20261120-008');
      setFullName('Lê Băng Châu');
      setPhoneNumber('0378995152');
      setCurrentStep('FORM');
      toast.success('Quét mã QR phiếu hẹn thành công!');
    }, 2500);
  };

  const handleReset = () => {
    setCurrentStep('FORM');
    setTicketData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/40 text-slate-900 flex flex-col items-center justify-between p-3 sm:p-6 font-sans">

      {/* Top Header Bar */}
      <header className="w-full max-w-xl flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 p-0.5 shadow-md shadow-teal-500/20 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Crown Dental"
              className="w-full h-full object-contain rounded-[10px] bg-white p-1"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span class="text-white font-black text-sm">CD</span>';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                Self Check-in Kiosk
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug">
              Nha Khoa Crown Dental
            </h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold text-slate-500 hover:text-teal-700 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-xl flex-1 flex flex-col justify-center">

        {/* STEP 1: FORM NHẬP THÔNG TIN CHECK-IN */}
        {currentStep === 'FORM' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all">

            {/* Banner Guide */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white p-5 sm:p-7 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute right-4 top-4 text-white/15">
                <QrCode className="w-24 h-24 stroke-[1.2]" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium mb-2.5 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tiếp nhận tự động 24/7</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1.5">
                  Xác Nhận & Check-in Lịch Hẹn
                </h2>
                <p className="text-teal-50 text-xs sm:text-sm leading-relaxed max-w-md">
                  Vui lòng đối chiếu thông tin phiếu hẹn đã đặt trước để nhận số thứ tự vào phòng khám.
                </p>
              </div>
            </div>

            {/* Quick Demo Fill & Scan Bar */}
            <div className="bg-teal-50/70 border-b border-teal-100 px-5 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-teal-800 font-medium">
                <Info className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Bạn có phiếu hẹn giấy hoặc mã QR?</span>
              </div>
              <button
                type="button"
                onClick={handleSimulateScan}
                className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-xs hover:bg-teal-50 transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                <span>Quét mã</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCheckinSubmit} className="p-5 sm:p-7 space-y-4 sm:space-y-5">

              {/* Field 1: Mã lịch hẹn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Mã Lịch Hẹn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={appointmentCode}
                    onChange={(e) => {
                      setAppointmentCode(e.target.value.toUpperCase());
                      if (formErrors.appointmentCode) setFormErrors(prev => ({ ...prev, appointmentCode: null }));
                    }}
                    placeholder="VD: APT-20261120-008"
                    className={`w-full pl-10 pr-24 py-3 bg-slate-50/80 border rounded-xl text-sm font-semibold tracking-wide text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 transition ${formErrors.appointmentCode
                        ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                        : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 focus:bg-white'
                      }`}
                  />
                  <div className="absolute inset-y-0 right-1.5 flex items-center">
                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="px-2 py-1 text-[11px] font-semibold text-teal-700 bg-teal-100/70 hover:bg-teal-100 rounded-lg transition"
                    >
                      Quét QR
                    </button>
                  </div>
                </div>
                {formErrors.appointmentCode && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.appointmentCode}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  * Mã được gửi qua tin nhắn SMS hoặc phiếu hẹn lúc quý khách đặt lịch.
                </p>
              </div>

              {/* Field 2: Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Họ và tên người khám <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: null }));
                    }}
                    placeholder="VD: Nguyễn Văn A hoặc Lê Băng Châu"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${formErrors.fullName
                        ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                        : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 focus:bg-white'
                      }`}
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              {/* Field 3: Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Số điện thoại đặt hẹn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (formErrors.phoneNumber) setFormErrors(prev => ({ ...prev, phoneNumber: null }));
                    }}
                    placeholder="VD: 0378 995 152"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${formErrors.phoneNumber
                        ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                        : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100 focus:bg-white'
                      }`}
                  />
                </div>
                {formErrors.phoneNumber && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Chi nhánh hiện tại */}
              <div className="pt-1">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700">Điểm tiếp nhận: </span>
                    <span className="text-slate-600">{branchName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-teal-200" />
                  <span>Xác Nhận & Lấy Số Khám Ngay</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleFillDemoData}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Điền mẫu demo nhanh</span>
                  </button>

                  <a
                    href="tel:19008059"
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cần trợ giúp? 1900 8059</span>
                  </a>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* STEP 2: CAMERA SCANNER SIMULATION */}
        {currentStep === 'SCANNING' && (
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 text-white text-center flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
            {/* Background scanning laser effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/10 to-transparent pointer-events-none animate-pulse" />

            <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-teal-400/80 rounded-2xl flex items-center justify-center mb-6 overflow-hidden bg-black/40 shadow-inner">
              {/* Corner markers */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-teal-400" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-teal-400" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-teal-400" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-teal-400" />

              {/* Animated scanning bar */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-lg shadow-teal-400 animate-bounce top-1/2 -translate-y-1/2" />

              <QrCode className="w-32 h-32 text-teal-400/30" />
              <div className="absolute bottom-3 text-[11px] font-medium text-teal-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                Đang nhận diện mã QR...
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              Đưa mã QR trên phiếu hẹn vào khung quét
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Hệ thống sẽ tự động quét và điền thông tin đặt lịch của bạn vào form xác minh.
            </p>

            <button
              onClick={() => setCurrentStep('FORM')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition"
            >
              Hủy quét / Nhập tay
            </button>
          </div>
        )}

        {/* STEP 3: SUBMITTING / VERIFYING ANIMATION */}
        {currentStep === 'SUBMITTING' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Đang xác minh lịch hẹn...
            </h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Hệ thống đang kết nối với cơ sở dữ liệu phòng khám, sắp xếp phòng khám và chuẩn bị số thứ tự cho bạn.
            </p>
          </div>
        )}

        {/* STEP 4: CHECK-IN THÀNH CÔNG (CHỈ THÔNG BÁO TIẾP NHẬN & CHỜ GỌI KHÁM, KHÔNG HIỆN BẤT KỲ THÔNG TIN LỊCH HẸN NÀO) */}
        {currentStep === 'SUCCESS' && (
          <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl shadow-teal-950/10 border border-slate-100 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-300">
            
            {/* Header Thành Công */}
            <div className="bg-gradient-to-b from-teal-50/90 via-emerald-50/40 to-white px-6 pt-10 pb-6 flex flex-col items-center">
              
              {/* Icon Checkmark lớn với hiệu ứng lan tỏa */}
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-60 pointer-events-none" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-teal-700/25 flex items-center justify-center ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-11 h-11 stroke-[2.5]" />
                </div>
              </div>

              {/* Tag Tiếp Nhận */}
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Tiếp Nhận Hoàn Tất
              </span>

              {/* Tiêu đề chính */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                Check-in Thành Công!
              </h2>

              {/* Banner Xin Vui Lòng Chờ Gọi Khám */}
              <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-teal-500/10 via-emerald-500/15 to-teal-500/10 border border-teal-300/80 px-5 py-2.5 rounded-2xl text-teal-900 font-extrabold text-base sm:text-lg shadow-2xs">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                </span>
                <span>Xin Vui Lòng Chờ Gọi Khám</span>
              </div>
            </div>

            {/* Nội dung hướng dẫn nhẹ nhàng */}
            <div className="px-6 pb-8 pt-2 space-y-5">
              
              <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/70 text-xs sm:text-sm text-slate-600 leading-relaxed text-center space-y-2">
                <p className="font-bold text-slate-800 text-sm">
                  Hệ thống đã ghi nhận quý khách có mặt tại phòng khám.
                </p>
                <p>
                  Quý khách vui lòng ngồi thư giãn tại sảnh chờ. Nhân viên y tế sẽ gọi tên quý khách vào phòng khám theo thứ tự tiếp nhận.
                </p>
              </div>

              {/* Lời nhắc quầy lễ tân */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Cần hỗ trợ? Vui lòng liên hệ quầy Lễ tân hoặc gọi 1900 8059</span>
              </div>

              {/* Nút hành động */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn Tất</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Check-in cho người đi cùng</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer / Copyright */}
      <footer className="w-full max-w-xl text-center pt-6 pb-2 text-[11px] text-slate-400">
        <p>© 2026 Crown Dental Clinic ERP. Tất cả quyền được bảo lưu.</p>
        <p className="mt-0.5">Hotline hỗ trợ: <strong className="text-slate-600">1900 8059</strong></p>
      </footer>

    </div>
  );
}

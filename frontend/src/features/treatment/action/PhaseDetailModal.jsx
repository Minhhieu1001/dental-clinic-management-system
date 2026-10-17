import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  Phone,
  User,
  ShieldAlert,
  Activity,
  Tag,
  Stethoscope,
  CalendarCheck,
  CheckCircle2,
  Clock4,
  Check,
  Plus,
  Edit3,
  Trash2,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TreatmentVisitModal } from './TreatmentVisitModal';
import { STATUS_PHASE_CONFIG as STATUS_CONFIG } from '../clinicalExaminationHelpers';

export function PhaseDetailModal({
  isOpen,
  onClose,
  phase = null,
  allPhases = [],
  patient = null,
  planInfo = {},
  loggedInDoctorName = '',
  onUpdatePhaseStatus,
  onSaveVisit,
  onToggleVisitStatus,
  onRemoveVisit,
}) {
  const [isFullscreen, setIsFullscreen] = useState(true);

  // State Modal Thêm / Cập nhật buổi khám (sử dụng TreatmentVisitModal riêng)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitModalMode, setVisitModalMode] = useState('ADD'); // 'ADD' | 'EDIT'
  const [targetVisitData, setTargetVisitData] = useState(null);

  // Đóng modal khi đổi phase
  useEffect(() => {
    if (isOpen) {
      setIsVisitModalOpen(false);
    }
  }, [isOpen, phase]);

  // Phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lấy dữ liệu giai đoạn đang chọn từ allPhases để đồng bộ trạng thái realtime
  const currentPhase = useMemo(() => {
    return (
      allPhases.find((p) => String(p.phase_id) === String(phase?.phase_id)) ||
      phase ||
      allPhases[0] ||
      {}
    );
  }, [allPhases, phase]);

  const currentServices = currentPhase.treatment_services || [];
  const currentVisits = currentPhase.treatment_visits || [];

  // Tính chi phí giai đoạn
  const phaseSubtotal = currentServices.reduce(
    (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 1),
    0
  );

  // Tiến độ buổi khám
  const completedVisitsCount = currentVisits.filter((v) => v.status === 'COMPLETED').length;

  // Formatters
  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Chưa xác định';
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    try {
      const birth = new Date(dob);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? `${age} tuổi` : null;
    } catch {
      return null;
    }
  };

  const currentStatusCfg = STATUS_CONFIG[currentPhase.status] || STATUS_CONFIG.PENDING;

  // Helper tách và hiển thị răng: thẳng hàng 3 item rồi tự động xuống hàng, không bị đè chữ
  const renderToothBadges = (toothNumberStr) => {
    if (!toothNumberStr) {
      return (
        <span className="px-2 py-0.5 font-bold rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs whitespace-nowrap">
          Toàn hàm
        </span>
      );
    }

    const str = String(toothNumberStr).trim();
    if (str.toLowerCase() === 'toàn hàm' || str.toLowerCase() === 'th') {
      return (
        <span className="px-2 py-0.5 font-bold rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs whitespace-nowrap">
          Toàn hàm
        </span>
      );
    }

    // Tách theo dấu phẩy hoặc chấm phẩy
    let parts = str
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Nếu không có dấu phẩy mà phân tách bởi khoảng trắng (ví dụ "R11 R18")
    if (parts.length === 1 && /\s+/.test(parts[0]) && /R\d+/i.test(parts[0])) {
      const sub = parts[0].split(/\s+/).map((t) => t.trim()).filter(Boolean);
      if (sub.length > 1) parts = sub;
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[125px] mx-auto">
        {parts.map((tooth, idx) => (
          <span
            key={idx}
            className="inline-flex items-center justify-center px-1.5 py-0.5 font-bold rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px] whitespace-nowrap shadow-2xs shrink-0"
          >
            {tooth}
          </span>
        ))}
      </div>
    );
  };

  // In phiếu điều trị
  const handlePrint = () => {
    window.print();
  };

  // 1. CẬP NHẬT TRẠNG THÁI GIAI ĐOẠN KHI KẾT THÚC / ĐANG TIẾN HÀNH
  const handleChangePhaseStatus = (newStatus) => {
    if (!currentPhase.phase_id) return;
    if (onUpdatePhaseStatus) {
      onUpdatePhaseStatus(currentPhase.phase_id, newStatus);
    }
  };

  const handleCompletePhase = () => {
    if (!currentPhase.phase_id) return;
    if (currentPhase.status === 'COMPLETED') {
      toast('Giai đoạn này đã ở trạng thái hoàn thành', { icon: 'ℹ️' });
      return;
    }
    if (onUpdatePhaseStatus) {
      onUpdatePhaseStatus(currentPhase.phase_id, 'COMPLETED');
      toast.success(`Đã nghiệm thu và hoàn tất ${currentPhase.phase_name}!`, {
        icon: '✓',
      });
    }
  };

  // 2. MỞ MODAL TẠO BUỔI KHÁM MỚI (Tự động đếm thứ tự, không cho sửa)
  const handleOpenAddVisitModal = () => {
    const nextOrder = currentVisits.length + 1;
    setVisitModalMode('ADD');
    setTargetVisitData({
      visitOrder: nextOrder,
      visitName: `Buổi ${nextOrder}: `,
      start_date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      clinical_notes: '',
      assigned_dentist: loggedInDoctorName || planInfo.dentistName || '',
    });
    setIsVisitModalOpen(true);
  };

  // 3. MỞ MODAL CẬP NHẬT KẾT QUẢ BUỔI KHÁM
  const handleOpenEditVisitModal = (visit) => {
    setVisitModalMode('EDIT');
    setTargetVisitData(visit);
    setIsVisitModalOpen(true);
  };

  const handleQuickChangeVisitStatus = (visitId, newStatus) => {
    if (onToggleVisitStatus) {
      onToggleVisitStatus(currentPhase.phase_id, visitId, newStatus);
      toast.success(`Đã đổi trạng thái buổi khám sang "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
    }
  };

  const handleDeleteVisit = (visitId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa buổi điều trị này không?')) {
      if (onRemoveVisit) {
        onRemoveVisit(currentPhase.phase_id, visitId);
        toast.success('Đã xóa buổi điều trị!');
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="phase-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm overflow-hidden"
        >
          <motion.div
            key="phase-detail-workspace"
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col bg-slate-100 overflow-hidden shadow-2xl ${isFullscreen ? 'fixed inset-0 w-screen h-screen rounded-none' : 'w-full max-w-7xl h-[95vh] rounded-xl border border-slate-300'
              }`}
          >
            {/* ================= 1. TOP APP BAR ================= */}
            <header className="bg-slate-900 text-white px-4 py-2.5 sm:px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-md flex items-center justify-center bg-teal-600 text-white font-bold text-xs shrink-0">
                  <Stethoscope size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">

                  </div>
                  <h2 className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-300">{planInfo.planName || 'Kế hoạch điều trị'}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-teal-300">{currentPhase.phase_name}</span>
                  </h2>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  title="In phiếu điều trị"
                >
                  <Printer size={13} className="text-teal-400" />
                  <span>In phiếu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center h-8 w-8 rounded bg-rose-950/60 hover:bg-rose-700 text-rose-200 hover:text-white border border-rose-800 transition-colors cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {/* ================= 2. TIMELINE TIẾN TRÌNH CÁC GIAI ĐOẠN ================= */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 sm:px-5 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-2.5 min-w-max py-0.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  Lộ trình:
                </span>

                {allPhases.map((p, idx) => {
                  const isCurrent = String(p.phase_id) === String(currentPhase.phase_id);
                  const isCompleted = p.status === 'COMPLETED';

                  return (
                    <React.Fragment key={p.phase_id || idx}>
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-all select-none ${isCurrent
                          ? 'bg-teal-700 text-white border-teal-400 font-bold shadow-xs'
                          : isCompleted
                            ? 'bg-slate-800 text-emerald-300 border-emerald-700/60'
                            : 'bg-slate-800/40 text-slate-400 border-slate-700/50 opacity-60'
                          }`}
                        title={
                          isCurrent
                            ? 'Giai đoạn bạn đang thực hiện can thiệp'
                            : `Giai đoạn ${p.phase_order}: ${p.phase_name}`
                        }
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${isCurrent
                            ? 'bg-white text-teal-900'
                            : isCompleted
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-700 text-slate-300'
                            }`}
                        >
                          {isCompleted ? '✓' : p.phase_order || idx + 1}
                        </span>

                        <span className="truncate max-w-[220px]">
                          {p.phase_name}
                        </span>

                        {isCurrent ? (
                          <span className="bg-teal-950 text-teal-200 text-[10px] px-1.5 py-0.5 rounded font-bold border border-teal-400/60">
                            Đang ở giai đoạn này
                          </span>
                        ) : (
                          <span className="text-[11px] opacity-80">
                            ({isCompleted ? 'Đã xong' : p.status === 'IN_PROGRESS' ? 'Đang chạy' : 'Chờ'})
                          </span>
                        )}
                      </div>

                      {idx < allPhases.length - 1 && (
                        <div className="h-px w-4 bg-slate-700 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ================= 3. THÔNG TIN CHA TINH GỌN (BỆNH NHÂN & KẾ HOẠCH) ================= */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 sm:px-5 shrink-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs items-center">
                {/* Thông tin bệnh nhân cha */}
                <div className="lg:col-span-6 flex items-center gap-3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-2 lg:pb-0 pr-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200">
                    {patient?.fullName ? patient.fullName.charAt(0).toUpperCase() : 'BN'}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {patient?.fullName || 'Bệnh nhân'}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {patient?.patientCode || 'PA-CHUA-CO-MA'}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {patient?.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                        {calculateAge(patient?.dateOfBirth) && ` · ${calculateAge(patient?.dateOfBirth)}`}
                        {patient?.phone && ` · SĐT: ${patient.phone}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {patient?.allergies ? (
                        <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-semibold">
                          <ShieldAlert size={12} className="text-rose-600" />
                          Dị ứng: {patient.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Không dị ứng thuốc</span>
                      )}
                      {patient?.systemicDisease && (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                          <Activity size={12} className="text-amber-600" />
                          Bệnh nền: {patient.systemicDisease}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thông tin kế hoạch điều trị cha */}
                <div className="lg:col-span-6 flex items-center justify-between gap-3 pl-0 lg:pl-1 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">
                        {planInfo.planName || 'Kế hoạch điều trị'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span>BS: <strong className="text-slate-700">{planInfo.dentistName || 'Chưa phân công'}</strong></span>
                      <span>Lộ trình: <strong className="text-slate-700">{formatDateDisplay(planInfo.startDate)} &rarr; {formatDateDisplay(planInfo.endDate)}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 font-medium block">Kinh phí toàn phác đồ</span>
                    <span className="font-bold text-teal-800 text-sm">
                      {formatCurrency(planInfo.estimatedCost || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 4. KHÔNG GIAN ĐIỀU TRỊ CHÍNH ================= */}
            <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 space-y-4 bg-slate-100">
              {/* BANNER THAO TÁC GIAI ĐOẠN ĐANG CHỌN */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-teal-700 text-white font-extrabold text-base shrink-0">
                      {currentPhase.phase_order || 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">
                          {currentPhase.phase_name}
                        </h3>
                        <span className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          {currentPhase.treatmentType || 'Tổng quát'}
                        </span>
                        {currentPhase.estimated_duration && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded">
                            <Clock4 size={12} className="text-slate-500" />
                            {currentPhase.estimated_duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BỘ ĐIỀU KHIỂN TRẠNG THÁI GIAI ĐOẠN & NÚT HOÀN TẤT GIAI ĐOẠN */}
                  <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-50 p-1.5 rounded-lg border border-slate-200 shrink-0">
                    <span className="text-xs font-semibold text-slate-600">Trạng thái:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                      {[
                        { value: 'PENDING', label: 'Chờ thực hiện', active: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' },
                        { value: 'IN_PROGRESS', label: 'Đang điều trị', active: 'bg-blue-100 text-blue-900 border-blue-300 font-bold' },
                        { value: 'COMPLETED', label: 'Đã hoàn thành', active: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' },
                      ].map((st) => (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => handleChangePhaseStatus(st.value)}
                          className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer font-medium ${currentPhase.status === st.value
                            ? `${st.active} shadow-2xs`
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {currentPhase.status !== 'COMPLETED' ? (
                      <button
                        type="button"
                        onClick={handleCompletePhase}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer ml-1 shadow-2xs"
                        title="Nghiệm thu kết thúc giai đoạn điều trị này"
                      >
                        <CheckCircle2 size={14} />
                        <span>Hoàn tất giai đoạn</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded ml-1">
                        <Check size={14} className="text-emerald-600" />
                        <span>Đã hoàn thành</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tóm tắt: Dịch vụ, Buổi điều trị, Chi phí */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Dịch vụ chỉ định:</span>
                    <strong className="text-slate-800 text-sm font-bold">{currentServices.length} dịch vụ</strong>
                  </div>
                  <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Tiến độ buổi điều trị:</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {completedVisitsCount}/{currentVisits.length} hoàn thành
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-md border border-teal-200 bg-teal-50/60 flex items-center justify-between">
                    <span className="text-teal-800 font-semibold">Chi phí giai đoạn này:</span>
                    <strong className="text-teal-900 text-sm font-bold">
                      {formatCurrency(phaseSubtotal)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* BỐ CỤC 2 KHỐI LÀM VIỆC CHÍNH */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* KHỐI 1: DANH MỤC DỊCH VỤ ĐÃ CHỈ ĐỊNH (lg:col-span-5) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Tag size={15} className="text-teal-700" />
                      <h4 className="text-xs font-bold text-slate-900">
                        1. Danh mục dịch vụ nha khoa đang thực hiện
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      ({currentServices.length} dịch vụ)
                    </span>
                  </div>

                  {currentServices.length === 0 ? (
                    <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                      Chưa có dịch vụ nào trong giai đoạn này.
                    </div>
                  ) : (
                    <div className="rounded border border-slate-200 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                            <th className="py-2.5 px-2 text-center w-8">#</th>
                            <th className="py-2.5 px-2 text-center w-36 min-w-[120px]">Vị trí răng</th>
                            <th className="py-2.5 px-2.5">Dịch vụ</th>
                            <th className="py-2.5 px-2 text-center w-12">SL</th>
                            <th className="py-2.5 px-2.5 text-right w-28">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentServices.map((srv, sIdx) => {
                            const itemTotal =
                              (Number(srv.price) || 0) * (Number(srv.quantity) || 1);
                            return (
                              <tr key={srv.treatmentServicesId || sIdx} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-2 text-center text-slate-400 font-medium">
                                  {sIdx + 1}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  {renderToothBadges(srv.toothNumber)}
                                </td>
                                <td className="py-2.5 px-2.5 font-semibold text-slate-900 leading-snug">
                                  {srv.service_name}
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-semibold text-slate-700">
                                  {srv.quantity || 1}
                                </td>
                                <td className="py-2.5 px-2.5 text-right font-bold text-teal-800">
                                  {formatCurrency(itemTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                            <td colSpan={4} className="py-2.5 px-2.5 text-right text-slate-600">
                              Tổng chi phí:
                            </td>
                            <td className="py-2.5 px-2.5 text-right text-teal-900 font-bold text-sm">
                              {formatCurrency(phaseSubtotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* KHỐI 2: LỘ TRÌNH, TẠO BUỔI KHÁM & CẬP NHẬT KẾT QUẢ (lg:col-span-7) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CalendarCheck size={15} className="text-indigo-700" />
                      <h4 className="text-xs font-bold text-slate-900">
                        2. Lộ trình & thực hiện các buổi điều trị
                      </h4>
                    </div>

                    {/* NÚT TẠO BUỔI KHÁM MỚI */}
                    {/* NÚT TẠO BUỔI KHÁM MỚI (MỞ MODAL) */}
                    <button
                      type="button"
                      onClick={handleOpenAddVisitModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                      <Plus size={14} />
                      <span>Tạo buổi khám mới</span>
                    </button>
                  </div>

                  {/* DANH SÁCH CÁC BUỔI ĐIỀU TRỊ */}
                  {currentVisits.length === 0 ? (
                    <div className="rounded border border-dashed border-indigo-200 bg-indigo-50/20 p-6 text-center text-xs text-indigo-700">
                      Chưa có buổi điều trị nào. Nhấp "+ Tạo buổi khám mới" để lên lịch thực hiện.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentVisits.map((visit, vIdx) => {
                        return (
                          <div
                            key={visit.visitId || vIdx}
                            className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5 hover:border-indigo-300 transition-colors shadow-2xs"
                          >
                            {/* Header Buổi khám: Thiết kế chuẩn ERP phân tầng rõ rệt, không bao giờ bị rớt item */}
                            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                              {/* Cột trái: Số thứ tự + Tên buổi + Metadata Ngày & Bác sĩ */}
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <span className="h-6 w-6 rounded-full flex items-center justify-center bg-indigo-700 text-white font-extrabold text-xs shrink-0 shadow-2xs mt-0.5">
                                  {visit.visitOrder || vIdx + 1}
                                </span>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-slate-900 text-sm leading-snug truncate" title={visit.visitName}>
                                    {visit.visitName}
                                  </h5>
                                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium mt-1">
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar size={11} className="text-slate-400 shrink-0" />
                                      <span>{formatDateDisplay(visit.start_date)}</span>
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <User size={11} className="text-indigo-500 shrink-0" />
                                      <span className="truncate max-w-[160px]">{visit.assigned_dentist || planInfo.dentistName || 'Chưa phân công'}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Cột phải: Bộ 3 nút trạng thái + Nút Xóa (Kích thước cố định, không rớt dòng) */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
                                  {[
                                    { key: 'PENDING', label: 'Chờ khám', active: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' },
                                    { key: 'IN_PROGRESS', label: 'Đang làm', active: 'bg-blue-100 text-blue-900 border-blue-300 font-bold' },
                                    { key: 'COMPLETED', label: 'Hoàn tất', active: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' },
                                  ].map((s) => (
                                    <button
                                      key={s.key}
                                      type="button"
                                      onClick={() => handleQuickChangeVisitStatus(visit.visitId, s.key)}
                                      className={`px-2 py-0.5 text-[11px] rounded border transition-colors cursor-pointer ${visit.status === s.key
                                          ? `${s.active} shadow-2xs`
                                          : 'border-transparent text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteVisit(visit.visitId)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Xóa buổi này"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Ghi chú kết quả thao tác lâm sàng */}
                            <div className="bg-white p-3 rounded-md border border-slate-200 text-xs space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-800">
                                  <Stethoscope size={13} className="text-teal-600 shrink-0" />
                                  <span>Kết quả thao tác lâm sàng:</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVisitModal(visit)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Edit3 size={12} />
                                  <span>{visit.clinical_notes ? 'Cập nhật kết quả' : 'Ghi nhận kết quả'}</span>
                                </button>
                              </div>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-normal">
                                {visit.clinical_notes || (
                                  <span className="text-slate-400 italic">
                                    Chưa ghi nhận kết quả thao tác. Nhấp "Ghi nhận kết quả" để nhập chi tiết diễn biến thủ thuật và dặn dò.
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* ================= 5. FOOTER ================= */}
            <footer className="bg-white px-4 py-2.5 sm:px-5 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                Đang can thiệp: <strong className="text-slate-800">{currentPhase.phase_name}</strong>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xs hidden sm:inline">
                  Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px]">ESC</kbd> để đóng
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Đóng không gian điều trị
                </button>
              </div>
            </footer>

            {/* ================= MODAL THÊM / CẬP NHẬT BUỔI KHÁM (FILE RIÊNG BIỆT) ================= */}
            <TreatmentVisitModal
              isOpen={isVisitModalOpen}
              onClose={() => setIsVisitModalOpen(false)}
              mode={visitModalMode}
              currentPhase={currentPhase}
              initialData={targetVisitData}
              loggedInDoctorName={loggedInDoctorName || planInfo.dentistName}
              onSaveVisit={onSaveVisit}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PhaseDetailModal;

import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Stethoscope,
  ChevronRight,
  ExternalLink,
  Activity,
  X,
  Layers,
  User,
  Info,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Hash,
  Maximize2,
  Printer,
  Building2,
  MapPin,
  Image,
  RefreshCw,
} from 'lucide-react';
import { getToothStatuses } from '../../../../services/systemDictionary.service';
import { getXrayAnalysisHistory } from '../../../../services/xrayAi.service';

// =========================================================================
// 1. MAPPING DICTIONARIES ĐỔI TRẠNG THÁI DB SANG TIẾNG VIỆT THÂN THIỆN (ERP STYLE)
// =========================================================================

// Map mức độ nghiêm trọng chẩn đoán
export const DIAGNOSIS_LEVEL_MAP = {
  MILD: {
    label: 'Nhẹ',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  MODERATE: {
    label: 'Trung bình',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
  },
  SEVERE: {
    label: 'Nghiêm trọng',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
  },
  ENAMEL: {
    label: 'Men răng',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
  },
  DENTIN: {
    label: 'Ngà răng',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  NEAR_PULP: {
    label: 'Cận tủy',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 font-medium',
  },
  PULP: {
    label: 'Tủy răng',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
  },
};

// Map độ sâu tổn thương răng
export const CARIES_DEPTH_MAP = {
  ENAMEL: 'Men răng',
  DENTIN: 'Ngà răng',
  NEAR_PULP: 'Sát tủy răng',
  PULP: 'Tủy răng',
  SUPERFICIAL: 'Nông',
  DEEP: 'Sâu',
  NONE: 'Không sâu',
};

// Map vị trí mặt răng tổn thương
export const CARIES_LOCATION_MAP = {
  OCCLUSAL: 'Mặt nhai',
  MESIAL: 'Mặt gần',
  DISTAL: 'Mặt xa',
  BUCCAL: 'Mặt ngoài (má)',
  LINGUAL: 'Mặt trong (lưỡi)',
  PALATAL: 'Mặt khẩu cái',
  CERVICAL: 'Cổ răng',
  WHOLE_CROWN: 'Toàn thân răng',
};

// Map trạng thái Kế hoạch điều trị
export const PLAN_STATUS_MAP = {
  COMPLETED: {
    label: 'ĐÃ HOÀN THÀNH',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-600',
  },
  IN_PROGRESS: {
    label: 'ĐANG ĐIỀU TRỊ',
    bg: 'bg-sky-50 text-sky-800 border-sky-300',
    dot: 'bg-sky-600',
  },
  PENDING: {
    label: 'CHỜ ĐIỀU TRỊ',
    bg: 'bg-amber-50 text-amber-800 border-amber-300',
    dot: 'bg-amber-600',
  },
  NEW: {
    label: 'MỚI TẠO',
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    dot: 'bg-indigo-600',
  },
  CANCELLED: {
    label: 'ĐÃ HỦY',
    bg: 'bg-rose-50 text-rose-800 border-rose-300',
    dot: 'bg-rose-600',
  },
};

// Map trạng thái Giai đoạn điều trị
export const PHASE_STATUS_MAP = {
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    className: 'bg-sky-50 text-sky-800 border-sky-300 font-semibold',
  },
  PENDING: {
    label: 'Chờ thực hiện',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-800 border-rose-300',
  },
};

// Map trạng thái Buổi hẹn / Điều trị
export const VISIT_STATUS_MAP = {
  PENDING: {
    label: 'Chờ khám',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'bg-blue-50 text-blue-800 border-blue-300',
  },
  WAITING: {
    label: 'Chờ vào phòng',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  CALLED: {
    label: 'Đã gọi vào',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-300',
  },
  IN_PROGRESS: {
    label: 'Đang điều trị',
    className: 'bg-sky-50 text-sky-800 border-sky-300 font-medium',
  },
  COMPLETED: {
    label: 'Hoàn tất',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-800 border-rose-300',
  },
  SCHEDULED: {
    label: 'Đã hẹn ngày',
    className: 'bg-teal-50 text-teal-800 border-teal-300',
  },
  MISSED: {
    label: 'Vắng mặt',
    className: 'bg-red-50 text-red-800 border-red-300',
  },
};

// Map thể loại điều trị
export const TREATMENT_TYPE_MAP = {
  ORTHODONTICS: 'Chỉnh nha - Niềng răng',
  ENDODONTICS: 'Nội nha - Chữa tủy',
  PERIODONTICS: 'Nha chu - Chăm sóc nướu',
  PROSTHODONTICS: 'Phục hình răng sứ',
  ORAL_SURGERY: 'Tiểu phẫu - Nhổ răng',
  GENERAL: 'Nha khoa tổng quát',
  COSMETIC: 'Nha khoa thẩm mỹ',
  RESTORATIVE: 'Trám răng phục hồi',
  IMPLANT: 'Cấy ghép Implant',
  PREVENTIVE: 'Dự phòng & Vệ sinh',
};

// =========================================================================
// 2. CÁC HÀM FORMAT TIỆN ÍCH
// =========================================================================

export const formatVND = (value) => {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return null;
  return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' đ';
};

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const formatTimeDisplay = (dateStr) => {
  if (!dateStr) return '';
  try {
    const str = String(dateStr);
    if (str.includes('T')) {
      return str.split('T')[1].substring(0, 5);
    }
    return '';
  } catch {
    return '';
  }
};

export const getDiagnosisLevelInfo = (level) => {
  const l = String(level || '').toUpperCase();
  return (
    DIAGNOSIS_LEVEL_MAP[l] || {
      label: level || 'Tiêu chuẩn',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    }
  );
};

export const getPlanStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  return (
    PLAN_STATUS_MAP[s] || {
      label: status || 'CHỜ XỬ LÝ',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-500',
    }
  );
};

export const getPhaseStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  return (
    PHASE_STATUS_MAP[s] || {
      label: status || 'Chờ thực hiện',
      className: 'bg-slate-100 text-slate-600 border-slate-300',
    }
  );
};

export const getVisitStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  return (
    VISIT_STATUS_MAP[s] || {
      label: status || 'Chờ thực hiện',
      className: 'bg-slate-100 text-slate-600 border-slate-300',
    }
  );
};

export const formatTreatmentType = (type) => {
  if (!type) return '';
  const upper = String(type).toUpperCase();
  return TREATMENT_TYPE_MAP[upper] || type;
};

// =========================================================================
// 3. COMPONENT CHÍNH: MODAL FULL-SCREEN ERP STYLE
// =========================================================================

export const TreatmentHistoryDetailModal = ({
  isOpen,
  onClose,
  record,
  patient,
  onOpenPlan,
}) => {
  const [toothStatuses, setToothStatuses] = useState([]);
  const [xrayAnalyses, setXrayAnalyses] = useState([]);
  const [loadingXrays, setLoadingXrays] = useState(false);
  const [xrayError, setXrayError] = useState(false);
  const [previewXrayUrl, setPreviewXrayUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getToothStatuses()
      .then((response) => {
        if (isMounted) setToothStatuses(Array.isArray(response?.data) ? response.data : []);
      })
      .catch((error) => console.warn('Không thể tải màu tình trạng răng:', error));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !record) {
      setXrayAnalyses([]);
      setXrayError(false);
      setPreviewXrayUrl(null);
      return undefined;
    }

    let isMounted = true;
    const examId = record.examinationResultId || record.rawExam?.id || null;
    const medRecordId = record.medicalRecordId || record.rawExam?.medicalRecordId || null;

    if (!examId && !medRecordId) {
      setXrayAnalyses([]);
      setXrayError(false);
      return undefined;
    }

    setLoadingXrays(true);
    setXrayError(false);

    const fetchXrays = async () => {
      try {
        let list = [];
        if (examId) {
          list = await getXrayAnalysisHistory({ examinationResultId: examId }).catch(() => []);
        }
        if ((!Array.isArray(list) || list.length === 0) && medRecordId) {
          list = await getXrayAnalysisHistory({ medicalRecordId: medRecordId });
        }
        if (isMounted) {
          setXrayAnalyses(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('Không thể tải danh sách phim X-quang:', err);
        if (isMounted) {
          setXrayAnalyses([]);
          setXrayError(true);
        }
      } finally {
        if (isMounted) {
          setLoadingXrays(false);
        }
      }
    };

    fetchXrays();
    return () => {
      isMounted = false;
    };
  }, [isOpen, record]);

  // Đóng bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const planStatus = getPlanStatusBadge(record.status);
  const patientDisplayName = patient?.fullName || patient?.patientName || 'Bệnh nhân';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
      {/* Container Full Screen 100vw x 100vh - ERP Window Style */}
      <div
        className="w-screen h-screen flex flex-col bg-slate-100 text-slate-800 select-text overflow-hidden animate-[erpModalIn_0.18s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        style={{
          animation: 'erpModalIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <style>{`
          @keyframes erpModalIn {
            from {
              opacity: 0;
              transform: scale(0.995) translateY(4px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>

        {/* ========================================================================= */}
        {/* TOP BAR 1: THANH TIÊU ĐỀ HỆ THỐNG ERP */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-teal-800 text-white border-b border-teal-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center bg-teal-950 text-teal-200 font-black text-xs rounded border border-teal-700/60 shadow-inner">
              HIS
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-white">
                HỒ SƠ BỆNH ÁN & CHI TIẾT KẾ HOẠCH ĐIỀU TRỊ
              </h2>
              <span className="text-xs text-teal-300">|</span>
              <span className="font-mono text-xs text-teal-200 bg-teal-900/90 px-2 py-0.5 rounded border border-teal-700/80">
                CASE-ID: {String(record.id || '').slice(0, 10).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-teal-100 hover:text-white hover:bg-teal-700/80 transition-colors cursor-pointer"
              title="Đóng cửa sổ (ESC)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOP BAR 2: DẢI THÔNG TIN BỆNH NHÂN (PATIENT HEADER BAR) - DENSE ERP */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-slate-200 border-b border-slate-300 text-xs shrink-0">
          {/* Họ tên bệnh nhân */}
          <div className="bg-white p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bệnh nhân
            </span>
            <p className="font-bold text-slate-900 text-sm truncate">
              {patientDisplayName}
            </p>
          </div>

          {/* Mã bệnh nhân */}
          <div className="bg-white p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mã hồ sơ (PID)
            </span>
            <p className="font-mono font-bold text-teal-700">
              {patient?.patientCode || 'N/A'}
            </p>
          </div>

          {/* Điện thoại */}
          <div className="bg-white p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Số điện thoại
            </span>
            <p className="font-semibold text-slate-800">
              {patient?.phone || 'Chưa cập nhật'}
            </p>
          </div>

          {/* Giới tính / Năm sinh */}
          <div className="bg-white p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Giới tính / Ngày sinh
            </span>
            <p className="font-semibold text-slate-800">
              {patient?.gender === 'MALE' ? 'Nam' : patient?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
              {patient?.dateOfBirth ? ` · ${formatDateDisplay(patient.dateOfBirth)}` : ''}
            </p>
          </div>

          {/* Thời gian khám */}
          <div className="bg-white p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ngày khám
            </span>
            <p className="font-semibold text-slate-800">
              {formatDateDisplay(record.startDate)} {formatTimeDisplay(record.startDate)}
            </p>
          </div>

          {/* Bác sĩ phụ trách */}
          <div className="bg-white p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bác sĩ điều trị
            </span>
            <p className="font-bold text-slate-900 truncate">
              {record.dentistName || 'Chưa phân công'}
            </p>
          </div>

          {/* Trạng thái kế hoạch */}
          <div className="bg-white p-2.5 space-y-0.5 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Trạng thái phác đồ
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 ${planStatus.dot}`} />
              <span className={`px-2 py-0.5 border text-[11px] font-bold tracking-tight ${planStatus.bg}`}>
                {planStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NỘI DUNG CHÍNH (MAIN WORKSPACE): 2 CỘT FULL HEIGHT, CHIA NGĂN ERP */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-full items-start">
            {/* ===================================================================== */}
            {/* CỘT TRÁI (5/12 CỘT): LÂM SÀNG, CHẨN ĐOÁN & BẢNG RĂNG */}
            {/* ===================================================================== */}
            <div className="lg:col-span-5 space-y-3">
              {/* PANEL 1: LÝ DO KHÁM & CHẨN ĐOÁN LÂM SÀNG */}
              <div className="bg-white border border-slate-300 shadow-none">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-300 font-bold text-xs uppercase tracking-wide text-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-teal-700" />
                    <span>1. Thông Tin Khám Lâm Sàng</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-normal">
                    LÂM SÀNG
                  </span>
                </div>

                <div className="p-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Bác sĩ khám:</span>
                      <strong className="text-slate-900">{record.dentistName || 'Chưa phân công'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ngày ghi nhận:</span>
                      <strong className="text-slate-800">{formatDateDisplay(record.startDate)}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/60 p-3 text-sm">
                      <p className="flex items-start gap-2">
                        <Building2 size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
                        <span>Tên cơ sở: <strong className="text-teal-800">{record.branchName || 'Chưa có thông tin cơ sở'}</strong></span>
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
                        <span className="break-words">Địa chỉ: {record.addressBranch || 'Chưa có thông tin địa chỉ'}</span>
                      </p>
                    </div>
                    <span className="text-slate-400 block text-[11px]">Lý do khám / Triệu chứng lâm sàng:</span>
                    <p className="font-semibold text-slate-900 bg-slate-50 p-2 border border-slate-200 mt-1">
                      {record.chiefComplaint || 'Khám răng hàm mặt'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PANEL 2: BẢNG GHI NHẬN TÌNH TRẠNG TỪNG RĂNG - ERP DENTAL CHART (ĐƯA LÊN TRÊN) */}
              <div className="bg-white border border-slate-300 shadow-none">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-300 font-bold text-xs uppercase tracking-wide text-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-teal-700" />
                    <span>Chi Tiết Tình Trạng Từng Răng</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.2">
                    {Array.isArray(record.toothRecords) ? record.toothRecords.length : 0} RĂNG
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold text-[11px]">
                        <th className="py-1.5 px-2.5 border-r border-slate-200 w-20">Răng</th>
                        <th className="py-1.5 px-2.5 border-r border-slate-200">Tình trạng</th>
                        <th className="py-1.5 px-2.5 border-r border-slate-200">Mặt răng</th>
                        <th className="py-1.5 px-2.5">Nướu / Mô mềm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Array.isArray(record.toothRecords) && record.toothRecords.length > 0 ? (
                        record.toothRecords.map((tr, idx) => {
                          const toothStatus = tr.toothStatus || '-';
                          const apiStatus = toothStatuses.find((item) => item.label === toothStatus);
                          const statusStyle = apiStatus?.color
                            ? {
                              backgroundColor: `${apiStatus.color}20`,
                              borderColor: apiStatus.color,
                              color: apiStatus.color,
                            }
                            : undefined;
                          const locLabel = CARIES_LOCATION_MAP[String(tr.cariesLocation || '').toUpperCase()] || tr.cariesLocation;

                          return (
                            <tr key={tr.id || idx} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 border-r border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                                {tr.toothNumber}
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-200">
                                <span
                                  className="px-2 py-0.5 border text-[11px] bg-slate-100 text-slate-700 border-slate-300"
                                  style={statusStyle}
                                >
                                  {toothStatus}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                                {locLabel || '-'}
                              </td>
                              <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                                {tr.gingivalCondition || '-'}
                                {tr.notes && <span className="block text-slate-400 italic">{tr.notes}</span>}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400 italic">
                            Chưa có dữ liệu ghi nhận tình trạng răng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PANEL 3: BẢNG DANH SÁCH CHẨN ĐOÁN (ICD-10) - ERP DATA TABLE (ĐƯA XUỐNG DƯỚI) */}
              <div className="bg-white border border-slate-300 shadow-none">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-300 font-bold text-xs uppercase tracking-wide text-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-indigo-700" />
                    <span>Chẩn Đoán Của Bác Sĩ (ICD-10)</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.2">
                    {Array.isArray(record.diagnoses) ? record.diagnoses.length : 0} MỤC
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold text-[11px]">
                        <th className="py-1.5 px-2.5 border-r border-slate-200 w-20 sm:w-24 whitespace-nowrap">Vị trí</th>
                        <th className="py-1.5 px-2.5 border-r border-slate-200 min-w-[180px]">Mã & Tên chẩn đoán</th>
                        <th className="py-1.5 px-2.5 border-r border-slate-200 w-28 sm:w-32 text-center whitespace-nowrap">Mức độ</th>
                        <th className="py-1.5 px-2.5 min-w-[100px]">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Array.isArray(record.diagnoses) && record.diagnoses.length > 0 ? (
                        record.diagnoses.map((diag, idx) => {
                          const code = diag.diagnosisCode || diag.code || '';
                          const diagnosisName = diag.primaryDiagnosis || diag.name || diag.label || diag.diagnosis || 'Chẩn đoán xác định';
                          const levelInfo = getDiagnosisLevelInfo(diag.level);

                          return (
                            <tr key={diag.id || idx} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-indigo-900 font-mono whitespace-nowrap">
                                {diag.toothPosition ? `Răng ${diag.toothPosition}` : 'Toàn hàm'}
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-900 leading-snug break-words">
                                {code && <span className="font-mono text-indigo-700 mr-1.5 font-bold">[{code}]</span>}
                                <span>{diagnosisName}</span>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-200 text-center whitespace-nowrap">
                                {diag.level ? (
                                  <span className={`inline-block px-2.5 py-0.5 border text-[11px] font-bold whitespace-nowrap rounded ${levelInfo.badgeClass}`}>
                                    {levelInfo.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-2 px-2.5 text-slate-600 text-[11px] leading-snug break-words">
                                <span>{diag.diagnosticNotes || '-'}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400 italic">
                            Chưa ghi nhận danh mục chẩn đoán.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PANEL 4: DANH MỤC HÌNH ẢNH PHIM X-QUANG (GỌI API NHƯ BÊN ADMIN) */}
              <div className="bg-white border border-slate-300 shadow-none">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-300 font-bold text-xs uppercase tracking-wide text-slate-800">
                  <div className="flex items-center gap-2">
                    <Image size={14} className="text-teal-700" />
                    <span>Hình Ảnh Phim X-Quang</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.2">
                    {xrayAnalyses.length} PHIM
                  </span>
                </div>

                <div className="p-3">
                  {loadingXrays ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                      <RefreshCw size={14} className="animate-spin text-teal-600" />
                      <span>Đang tải hình ảnh phim X-quang từ hệ thống...</span>
                    </div>
                  ) : xrayError ? (
                    <p className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      Không tải được phim X-quang. Vui lòng mở lại hồ sơ để thử lại.
                    </p>
                  ) : xrayAnalyses.length === 0 ? (
                    <div className="rounded border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-xs text-slate-500">
                      <Image className="mx-auto mb-2 text-teal-700" size={24} />
                      <p className="font-semibold">Hồ sơ này chưa có phim X-quang đã lưu.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {xrayAnalyses.map((item, index) => {
                        const analyzedTime = item.analyzedAt || item.captureDate;
                        const formattedAnalyzedTime = analyzedTime
                          ? new Date(analyzedTime).toLocaleString('vi-VN')
                          : 'Chưa rõ ngày';
                        const examDateStr = item.examinationDate
                          ? new Date(item.examinationDate).toLocaleString('vi-VN')
                          : formatDateDisplay(record.startDate);
                        const planLabel = item.treatmentPlanName?.trim()
                          ? `${item.treatmentPlanName.trim()} (đợt khám ${examDateStr})`
                          : `${record.planName || 'Chưa có kế hoạch điều trị'} (đợt khám ${examDateStr})`;

                        return (
                          <div
                            key={item.analysisId || index}
                            className="overflow-hidden rounded border border-slate-200 bg-white flex flex-col"
                          >
                            <div
                              onClick={() => item.imageUrl && setPreviewXrayUrl(item.imageUrl)}
                              className={`relative flex min-h-44 items-center justify-center bg-slate-900 ${item.imageUrl ? 'cursor-zoom-in group' : ''}`}
                              title={item.imageUrl ? 'Nhấn để phóng to phim X-quang' : ''}
                            >
                              {item.imageUrl ? (
                                <>
                                  <img
                                    src={item.imageUrl}
                                    alt={`Phim X-quang thuộc ${planLabel}`}
                                    className="max-h-56 w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                  />
                                  <span className="absolute bottom-2 right-2 rounded bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <Maximize2 size={10} /> Xem lớn
                                  </span>
                                </>
                              ) : (
                                <p className="p-4 text-center text-xs text-slate-300">Chưa có ảnh X-quang.</p>
                              )}
                            </div>
                            <div className="space-y-1 p-2.5 text-xs text-slate-700 border-t border-slate-100">
                              <p>
                                <span className="font-semibold">Ngày phân tích:</span> {formattedAnalyzedTime}
                              </p>
                              <p className="line-clamp-2">
                                <span className="font-semibold">Đợt điều trị:</span> {planLabel}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CỘT PHẢI (7/12 CỘT): KẾ HOẠCH ĐIỀU TRỊ, CÁC GIAI ĐOẠN, DỊCH VỤ & BUỔI ĐIỀU TRỊ */}
            {/* ===================================================================== */}
            <div className="lg:col-span-7 space-y-3">
              {/* PANEL 4: TỔNG QUAN PHÁC ĐỒ & CHI PHÍ DỰ KIẾN */}
              <div className="bg-white border border-slate-300 shadow-none">
                <div className="flex items-center justify-between px-3 py-2 bg-teal-800 text-white font-bold text-xs uppercase tracking-wide border-b border-teal-900">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-teal-200" />
                    <span className="text-white">2. Kế Hoạch Điều Trị & Phác Đồ Tiến Độ</span>
                  </div>
                  <span className="text-teal-200 text-xs font-mono font-bold bg-teal-900/80 px-2 py-0.5 rounded border border-teal-700">
                    {Array.isArray(record.phases) ? record.phases.length : 0} GIAI ĐOẠN
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between gap-4 border-b border-slate-200 flex-wrap">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tên phác đồ / Kế hoạch
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {record.planName || 'Kế hoạch điều trị'}
                    </h3>
                    {record.planDescription && (
                      <p className="text-xs text-slate-600">
                        {record.planDescription}
                      </p>
                    )}
                  </div>

                  {record.estimatedCost && (
                    <div className="text-right bg-slate-50 p-2.5 border border-slate-300 min-w-44">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Tổng chi phí dự kiến
                      </span>
                      <span className="text-lg font-mono font-bold text-teal-800">
                        {formatVND(record.estimatedCost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL 5: DANH SÁCH CÁC GIAI ĐOẠN (PHASES) VỚI CÁC BẢNG DỊCH VỤ & BUỔI HẸN */}
              <div className="space-y-3">
                {Array.isArray(record.phases) && record.phases.length > 0 ? (
                  record.phases.map((phase, pIdx) => {
                    const phaseBadge = getPhaseStatusBadge(phase.status);
                    const treatmentTypeName = formatTreatmentType(phase.treatmentType);

                    // Tính tổng tiền các dịch vụ trong giai đoạn
                    const phaseTotal = (phase.treatmentServices || []).reduce(
                      (sum, s) => sum + Number(s.totalAmount || (Number(s.price || 0) * Number(s.quantity || 1))),
                      0
                    );

                    return (
                      <div
                        key={phase.id || pIdx}
                        className="bg-white border border-slate-300 shadow-none space-y-0"
                      >
                        {/* Phase Header Bar */}
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-300 font-bold text-xs flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 bg-teal-800 text-white flex items-center justify-center font-bold text-[11px]">
                              {phase.phaseOrder || pIdx + 1}
                            </span>
                            <span className="text-slate-900 uppercase font-bold tracking-wide">
                              {phase.phaseName || `Giai đoạn ${pIdx + 1}`}
                            </span>
                            {treatmentTypeName && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.2 border border-slate-300">
                                {treatmentTypeName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {phase.estimatedDuration && (
                              <span className="text-[11px] text-slate-600 bg-white px-2 py-0.2 border border-slate-300 font-medium">
                                Thời lượng: {phase.estimatedDuration}
                              </span>
                            )}
                            {(phase.expectedStartDate || phase.expectedEndDate) && (
                              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.2 border border-teal-200 font-medium">
                                Dự kiến: {phase.expectedStartDate ? String(phase.expectedStartDate).split('T')[0] : '...'} ➔ {phase.expectedEndDate ? String(phase.expectedEndDate).split('T')[0] : '...'}
                              </span>
                            )}
                            <span className={`px-2 py-0.2 border text-[11px] ${phaseBadge.className}`}>
                              {phaseBadge.label}
                            </span>
                          </div>
                        </div>

                        {phase.description && (
                          <div className="px-3 py-1.5 bg-slate-50/70 border-b border-slate-200 text-xs text-slate-600 italic">
                            Chỉ định: {phase.description}
                          </div>
                        )}

                        {/* BẢNG DỊCH VỤ THỰC HIỆN TRONG GIAI ĐOẠN - ERP TABLE */}
                        <div className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="uppercase text-[11px] tracking-wider text-slate-500">
                              Danh mục kỹ thuật & dịch vụ ({Array.isArray(phase.treatmentServices) ? phase.treatmentServices.length : 0})
                            </span>
                          </div>

                          <div className="overflow-x-auto border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                                  <th className="py-1 px-2 border-r border-slate-200 w-10 text-center">STT</th>
                                  <th className="py-1 px-2 border-r border-slate-200">Tên dịch vụ kỹ thuật</th>
                                  <th className="py-1 px-2 border-r border-slate-200 w-24 text-center">Vị trí răng</th>
                                  <th className="py-1 px-2 border-r border-slate-200 w-14 text-center">SL</th>
                                  <th className="py-1 px-2 border-r border-slate-200 w-28 text-right">Đơn giá</th>
                                  <th className="py-1 px-2 w-32 text-right">Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {Array.isArray(phase.treatmentServices) && phase.treatmentServices.length > 0 ? (
                                  phase.treatmentServices.map((srv, sIdx) => {
                                    const itemTotal = Number(srv.totalAmount || (Number(srv.price || 0) * Number(srv.quantity || 1)));

                                    return (
                                      <tr key={srv.id || sIdx} className="hover:bg-slate-50">
                                        <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono text-slate-500">
                                          {sIdx + 1}
                                        </td>
                                        <td className="py-1.5 px-2 border-r border-slate-200 font-semibold text-slate-900">
                                          {srv.serviceName || 'Dịch vụ nha khoa'}
                                        </td>
                                        <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono font-medium text-indigo-900">
                                          {srv.toothNumber ? `Răng ${srv.toothNumber}` : '-'}
                                        </td>
                                        <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono">
                                          {srv.quantity || 1}
                                        </td>
                                        <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono text-slate-700">
                                          {formatVND(srv.price) || '-'}
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                                          {formatVND(itemTotal)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="p-2 text-center text-slate-400 italic text-[11px]">
                                      Chưa gán dịch vụ chi tiết cho giai đoạn này.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              {phaseTotal > 0 && (
                                <tfoot>
                                  <tr className="bg-slate-50 border-t border-slate-300 font-bold">
                                    <td colSpan={5} className="py-1 px-2 text-right uppercase text-[11px] text-slate-600">
                                      Tổng cộng giai đoạn:
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono text-teal-800">
                                      {formatVND(phaseTotal)}
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>

                        {/* BẢNG CÁC BUỔI ĐIỀU TRỊ (TREATMENT VISITS) TRONG GIAI ĐOẠN - ERP TABLE */}
                        <div className="p-3 pt-0 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="uppercase text-[11px] tracking-wider text-slate-500">
                              Lịch hẹn & buổi điều trị ({Array.isArray(phase.treatmentVisits) ? phase.treatmentVisits.length : 0} buổi)
                            </span>
                          </div>

                          <div className="overflow-x-auto border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                                  <th className="py-1 px-2 border-r border-slate-200 w-28">Buổi hẹn</th>
                                  <th className="py-1 px-2 border-r border-slate-200 w-28">Ngày hẹn</th>
                                  <th className="py-1 px-2 border-r border-slate-200 w-36">Bác sĩ thực hiện</th>
                                  <th className="py-1 px-2 border-r border-slate-200 w-28 text-center">Trạng thái</th>
                                  <th className="py-1 px-2">Ghi chú thủ thuật / Diễn tiến</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {Array.isArray(phase.treatmentVisits) && phase.treatmentVisits.length > 0 ? (
                                  phase.treatmentVisits.map((visit, vIdx) => {
                                    const vBadge = getVisitStatusBadge(visit.status);
                                    const vDate = visit.startDate || visit.appointmentDate;

                                    return (
                                      <tr key={visit.visitId || visit.id || vIdx} className="hover:bg-slate-50">
                                        <td className="py-1.5 px-2 border-r border-slate-200 font-bold text-slate-800">
                                          {visit.visitName || `Buổi ${vIdx + 1}`}
                                        </td>
                                        <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-mono">
                                          {formatDateDisplay(vDate)}
                                        </td>
                                        <td className="py-1.5 px-2 border-r border-slate-200 font-medium text-slate-900">
                                          {visit.assignedDentist || 'Chưa chỉ định'}
                                        </td>
                                        <td className="py-1.5 px-2 border-r border-slate-200 text-center">
                                          <span className={`px-2 py-0.2 border text-[10.5px] ${vBadge.className}`}>
                                            {vBadge.label}
                                          </span>
                                        </td>
                                        <td className="py-1.5 px-2 text-slate-600 text-[11px]">
                                          {visit.clinicalNotes || visit.notes || '-'}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="p-2 text-center text-slate-400 italic text-[11px]">
                                      Chưa có lịch buổi điều trị nào được thiết lập.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-slate-300 p-6 text-center text-slate-400 italic">
                    Chưa có thông tin giai đoạn điều trị nào cho kế hoạch này.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox phóng to phim X-quang */}
        {previewXrayUrl && (
          <div
            onClick={() => setPreviewXrayUrl(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xs"
          >
            <button
              type="button"
              onClick={() => setPreviewXrayUrl(null)}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-rose-600 transition-colors cursor-pointer"
              title="Đóng ảnh (ESC)"
            >
              <X size={20} />
            </button>
            <img
              src={previewXrayUrl}
              alt="Phim X-quang phóng to"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl border border-slate-700"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentHistoryDetailModal;

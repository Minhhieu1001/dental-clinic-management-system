import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Plus,
  Trash2,
  Printer,
  Eye,
  Pencil,
  RefreshCw,
  Phone,
  AlertCircle,
  Activity,
  Calendar,
  MapPin,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  FileText,
  List,
  CalendarDays,
  UserCheck,
  Bell,
  Sparkles,
  TrendingUp,
  ChevronRight,
  User,
  ShieldAlert,
  BarChart3,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../../hooks/useAuth';
import PatientSearchBar from '../../../components/ui/search/PatientSearchBar';
import CreateFollowUpModal from './components/CreateFollowUpModal';
import FollowUpDetailModal from './components/FollowUpDetailModal';
import FollowUpPrintModal from './components/FollowUpPrintModal';
import FollowUpCalendarView from './components/FollowUpCalendarView';
import DeleteConfirmModal from '../../prescriptions/dentist/components/DeleteConfirmModal';
import SelectPatientModal from '../../billing/employee/action/SelectPatientModal';

import {
  getPatients,
  getPatientsByPhone,
} from '../../../services/patient.service';
import {
  getMedicalRecordsByPatientCode,
  getMedicalRecordsByPatientId,
} from '../../../services/medicalRecord.service';
import {
  getExaminationResultsByMedicalRecordId,
} from '../../../services/examinationResult.service';
import {
  getFollowUpAppointments,
  getFollowUpAppointmentById,
  createFollowUpAppointment,
  updateFollowUpAppointment,
  deleteFollowUpAppointment,
} from '../../../services/followUpAppointment.service';

const getInitials = (name) => {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthYear = new Date(dob).getFullYear();
  if (isNaN(birthYear)) return '';
  return `${new Date().getFullYear() - birthYear}`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTimeBadgeInfo = (dateStr, status) => {
  if (status === false) {
    return { text: 'Đã hủy', color: 'bg-rose-100 text-rose-700 border-rose-200' };
  }
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  if (isNaN(target.getTime())) return null;

  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Đã qua ngày', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  if (diffDays === 0) {
    return { text: 'Hôm nay', color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse' };
  }
  if (diffDays === 1) {
    return { text: 'Ngày mai', color: 'bg-sky-100 text-sky-800 border-sky-300 font-bold' };
  }
  if (diffDays <= 7) {
    return { text: `Còn ${diffDays} ngày`, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
  return { text: 'Sắp tới', color: 'bg-teal-50 text-teal-700 border-teal-200' };
};

export default function FollowUpAppointment() {
  const { user, isEmployee } = useAuth();
  const isEmployeeRole = isEmployee || user?.role === 'EMPLOYEE';
  const location = useLocation();
  const navigate = useNavigate();

  // 1. View Mode State: 'list' (Bảng danh sách) | 'calendar' (Lịch tháng)
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'PAST' | 'CANCELLED'

  // 2. Patient State
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatientOptions, setLoadingPatientOptions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);

  // 3. Clinical Context: Medical records & Examination sessions (Đợt khám)
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activeMedicalRecord, setActiveMedicalRecord] = useState(null);
  const [treatmentSessions, setTreatmentSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('ALL');
  const [loadingSessions, setLoadingSessions] = useState(false);

  // 4. Follow-up Appointments Data & Sorting State
  const [followUps, setFollowUps] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc': Ngày hẹn gần nhất trước, 'desc': Xa nhất trước

  // 5. Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [presetDate, setPresetDate] = useState(null); // Click on calendar date prefill
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState(null);

  // 6. Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingFollowUp, setDeletingFollowUp] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // 7. Duplicate Patients Modal State
  const [duplicatePatients, setDuplicatePatients] = useState([]);
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);

  // Load patients list for dropdown
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoadingPatientOptions(true);
    try {
      const data = await getPatients();
      setPatientOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Cannot load patients list:', err);
    } finally {
      setLoadingPatientOptions(false);
    }
  };

  // When patient is selected, load clinical sessions and follow-up appointments table
  useEffect(() => {
    if (!selectedPatient) {
      setMedicalRecords([]);
      setActiveMedicalRecord(null);
      setTreatmentSessions([]);
      setSelectedSessionId('ALL');
      setFollowUps([]);
      return;
    }

    loadPatientClinicalData(selectedPatient);
  }, [selectedPatient]);

  const loadPatientClinicalData = async (pat) => {
    setLoadingSessions(true);
    setLoadingFollowUps(true);
    try {
      // 1. Fetch Medical Records
      let records = [];
      if (pat.patientCode) {
        records = await getMedicalRecordsByPatientCode(pat.patientCode);
      } else if (pat.id) {
        records = await getMedicalRecordsByPatientId(pat.id);
      }

      const recs = Array.isArray(records) ? records : (records ? [records] : []);
      setMedicalRecords(recs);
      const activeRec = recs[0] || null;
      setActiveMedicalRecord(activeRec);

      // 2. Fetch Examination Results (Đợt khám)
      if (activeRec && activeRec.id) {
        const exams = await getExaminationResultsByMedicalRecordId(activeRec.id);
        const list = Array.isArray(exams) ? exams : [];
        setTreatmentSessions(list);
        if (list.length > 0) {
          setSelectedSessionId(list[0].id);
        } else {
          setSelectedSessionId('ALL');
        }
      } else {
        setTreatmentSessions([]);
        setSelectedSessionId('ALL');
      }

      // 3. Fetch Follow-Up Appointments of this patient
      await reloadFollowUps(pat.id, pat.patientCode);
    } catch (err) {
      console.error('Error loading patient clinical data:', err);
      toast.error('Lỗi khi tải dữ liệu bệnh án');
    } finally {
      setLoadingSessions(false);
      setLoadingFollowUps(false);
    }
  };

  const reloadFollowUps = async (patientId, patientCode, showSpinner = false) => {
    if (showSpinner) {
      setLoadingFollowUps(true);
    }
    try {
      const data = await getFollowUpAppointments({ patientId, patientCode });
      setFollowUps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error fetching follow-up appointments:', err);
    } finally {
      setLoadingFollowUps(false);
    }
  };

  // Currently selected treatment session
  const selectedSession = useMemo(() => {
    if (!selectedSessionId || selectedSessionId === 'ALL') return treatmentSessions[0] || null;
    return treatmentSessions.find((s) => String(s.id) === String(selectedSessionId)) || treatmentSessions[0] || null;
  }, [treatmentSessions, selectedSessionId]);

  // Filter follow-up appointments by selected treatment session & status KPI filter
  const displayedFollowUps = useMemo(() => {
    let list = followUps;
    if (selectedSessionId && selectedSessionId !== 'ALL') {
      list = list.filter(
        (item) => item.examinationResultId && String(item.examinationResultId) === String(selectedSessionId)
      );
    }
    const now = new Date();
    if (statusFilter === 'UPCOMING') {
      list = list.filter((item) => {
        if (!item || item.status === false) return false;
        if (!item.followUpDate) return false;
        const d = new Date(item.followUpDate);
        return !isNaN(d.getTime()) && d >= now;
      });
    } else if (statusFilter === 'PAST') {
      list = list.filter((item) => {
        if (!item || item.status === false) return false;
        if (!item.followUpDate) return false;
        const d = new Date(item.followUpDate);
        return !isNaN(d.getTime()) && d < now;
      });
    } else if (statusFilter === 'CANCELLED') {
      list = list.filter((item) => item && item.status === false);
    }

    return [...list].sort((a, b) => {
      const timeA = new Date(a.followUpDate || 0).getTime() || 0;
      const timeB = new Date(b.followUpDate || 0).getTime() || 0;
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [followUps, selectedSessionId, statusFilter, sortOrder]);

  // Calculate statistics metrics
  const stats = useMemo(() => {
    const total = followUps.length;
    const now = new Date();
    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    followUps.forEach((f) => {
      if (f.status === false) {
        cancelled++;
      } else if (f.followUpDate) {
        const d = new Date(f.followUpDate);
        if (!isNaN(d.getTime())) {
          if (d >= now) upcoming++;
          else past++;
        }
      }
    });

    return { total, upcoming, past, cancelled };
  }, [followUps]);

  // Doctor in charge
  const doctorName = useMemo(() => {
    return selectedSession?.dentistName || user?.fullName || user?.username || '';
  }, [selectedSession, user]);

  // Handlers for Patient Search
  const handleSelectPatient = (pat) => {
    setSelectedPatient(pat);
    toast.success(`Đã chọn bệnh nhân ${pat.fullName || pat.patientCode}`);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPhoneSearchQuery('');
  };

  const handleSearchPhone = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const phone = (phoneSearchQuery || '').trim();
    if (!phone) {
      toast.error('Vui lòng nhập số điện thoại cần tìm');
      return;
    }

    setSearchingPhone(true);
    try {
      const results = await getPatientsByPhone(phone);
      const list = Array.isArray(results) ? results : (results ? [results] : []);
      if (list.length === 0) {
        toast.error(`Không tìm thấy bệnh nhân nào với SĐT: ${phone}`);
      } else if (list.length === 1) {
        handleSelectPatient(list[0]);
      } else {
        setDuplicatePatients(list);
        setIsSelectPatientModalOpen(true);
      }
    } catch (err) {
      toast.error('Lỗi khi tìm kiếm bệnh nhân');
    } finally {
      setSearchingPhone(false);
    }
  };

  // Handler: Open Create Modal
  const handleOpenCreateModal = () => {
    setModalType('create');
    setEditingFollowUp(null);
    setPresetDate(null);
    setIsCreateModalOpen(true);
  };

  // Handler: Open Create Modal with a prefilled date from calendar cell
  const handleAddNewOnDate = (date) => {
    setModalType('create');
    setEditingFollowUp(null);
    setPresetDate(date);
    setIsCreateModalOpen(true);
  };

  // Handler: Open Edit Modal
  const handleEditFollowUp = async (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setModalType('edit');
    setEditingFollowUp(item);
    setPresetDate(null);
    setIsCreateModalOpen(true);

    if (item?.id) {
      try {
        const full = await getFollowUpAppointmentById(item.id);
        if (full) setEditingFollowUp(full);
      } catch (err) {
        console.warn('Could not fetch full follow up details', err);
      }
    }
  };

  // Handler: Save or Update Follow-up Appointment
  const handleSaveFollowUp = async (followUpData, editId) => {
    try {
      const targetId = editId || (modalType === 'edit' ? editingFollowUp?.id : null);
      const payload = {
        ...followUpData,
        examinationResultId: followUpData.examinationResultId || (selectedSessionId !== 'ALL' ? selectedSessionId : null),
        patientId: selectedPatient?.id,
        patientCode: selectedPatient?.patientCode,
      };

      let result;
      if (targetId) {
        result = await updateFollowUpAppointment(targetId, payload);
        toast.success('Cập nhật lịch tái khám thành công!');
        if (result) {
          setFollowUps((prev) =>
            prev.map((f) => (String(f.id) === String(targetId) ? { ...f, ...result } : f))
          );
        }
      } else {
        result = await createFollowUpAppointment(payload);
        toast.success('Đã lên lịch tái khám & gửi thông báo thành công!');
        if (result) {
          setFollowUps((prev) => [result, ...prev]);
        }
      }

      await reloadFollowUps(selectedPatient?.id, selectedPatient?.patientCode, false);
    } catch (err) {
      console.error('Save follow up error:', err);
      toast.error('Có lỗi xảy ra khi lưu lịch tái khám');
    }
  };

  // Handler: Click Delete button
  const handleDeleteClick = (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDeletingFollowUp(item);
    setIsDeleteModalOpen(true);
  };

  // Handler: Confirm Delete in Modal
  const handleConfirmDelete = async () => {
    if (!deletingFollowUp) return;
    setDeletingLoading(true);
    try {
      await deleteFollowUpAppointment(deletingFollowUp.id);
      toast.success('Đã xóa lịch tái khám thành công');
      setFollowUps((prev) => prev.filter((p) => String(p.id) !== String(deletingFollowUp.id)));
      setIsDeleteModalOpen(false);
      setDeletingFollowUp(null);
    } catch (err) {
      console.error('Delete follow up error:', err);
      toast.error('Lỗi khi xóa lịch tái khám');
    } finally {
      setDeletingLoading(false);
    }
  };

  // Handler: Open Detail
  const handleViewDetail = (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActiveFollowUp(item);
    setIsDetailModalOpen(true);
  };

  // Handler: Open Print
  const handlePrint = (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActiveFollowUp(item);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1550px] px-2 sm:px-4 py-3 space-y-3 text-slate-800 text-xs font-sans">
      {/* 1. Header Hero Banner - Light & Minimal */}
      <div className="rounded-sm bg-white p-4 sm:p-4.5 text-slate-800 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              <CalendarCheck size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-slate-500 font-bold text-xs sm:text-sm">
                  <Calendar size={15} className="text-slate-400" />
                  Lịch hẹn
                </span>
                <ChevronRight size={14} className="text-slate-400" />
                <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                  <CalendarCheck size={18} className="text-teal-700" />
                  <span>Lịch tái khám</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 ml-1">
                  Crown Dental
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Theo dõi tiến độ điều trị, nhắc lịch và chăm sóc tái khám theo từng giai đoạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {!isEmployeeRole && selectedPatient && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={15} />
                <span>Lên lịch tái khám mới</span>
              </button>
            )}
          </div>
        </div>

        {/* MÔ HÌNH PHÂN BỔ & TỶ LỆ TRẠNG THÁI LỊCH TÁI KHÁM (PROGRESS CHART MODEL) */}
        {selectedPatient && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-800 uppercase tracking-wide text-[11px]">
                <BarChart3 size={15} className="text-teal-700" />
                <span>TỔNG QUAN LỊCH TÁI KHÁM BỆNH NHÂN</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Cập nhật thời gian thực
              </span>
            </div>

            {/* Dynamic Stacked Distribution Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>Tỷ lệ phân bổ lịch hẹn theo trạng thái</span>
                <span className="font-extrabold text-slate-800">
                  100% ({stats.total} lịch tái khám)
                </span>
              </div>

              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200 shadow-2xs">
                {stats.total === 0 ? (
                  <div className="h-full w-full bg-slate-200/80 rounded-full" title="Chưa có lịch tái khám nào" />
                ) : (
                  <>
                    {stats.upcoming > 0 && (
                      <div
                        style={{ width: `${(stats.upcoming / stats.total) * 100}%` }}
                        className="h-full bg-gradient-to-r from-sky-400 to-teal-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                        title={`Sắp tới: ${stats.upcoming} (${Math.round((stats.upcoming / stats.total) * 100)}%)`}
                      />
                    )}
                    {stats.past > 0 && (
                      <div
                        style={{ width: `${(stats.past / stats.total) * 100}%` }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                        title={`Đã qua ngày: ${stats.past} (${Math.round((stats.past / stats.total) * 100)}%)`}
                      />
                    )}
                    {stats.cancelled > 0 && (
                      <div
                        style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                        title={`Đã hủy: ${stats.cancelled} (${Math.round((stats.cancelled / stats.total) * 100)}%)`}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Metric Cards Grid below the progress bar (Interactive Filters) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs select-none">
              {/* Card 1: Tất cả */}
              <div
                onClick={() => setStatusFilter('ALL')}
                className={`rounded-sm p-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.01] ${
                  statusFilter === 'ALL'
                    ? 'bg-teal-50/90 border-teal-600 ring-2 ring-teal-600'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                }`}
                title="Nhấp để lọc xem tất cả cuộc hẹn"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">TỔNG LỊCH HẸN</div>
                    <div className="text-xs font-extrabold text-slate-900">{stats.total} cuộc hẹn</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">100%</span>
              </div>

              {/* Card 2: Sắp tới */}
              <div
                onClick={() => setStatusFilter('UPCOMING')}
                className={`rounded-sm p-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.01] ${
                  statusFilter === 'UPCOMING'
                    ? 'bg-sky-100/90 border-sky-600 ring-2 ring-sky-600'
                    : 'bg-sky-50/50 border-sky-200/80 hover:bg-sky-100/60'
                }`}
                title="Nhấp để lọc danh sách lịch tái khám sắp tới"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-sky-800 uppercase font-bold">SẮP TỚI</div>
                    <div className="text-xs font-extrabold text-sky-950">{stats.upcoming} lịch tái khám</div>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-sky-700 bg-white px-1.5 py-0.5 rounded border border-sky-200">
                  {stats.total > 0 ? Math.round((stats.upcoming / stats.total) * 100) : 0}%
                </span>
              </div>

              {/* Card 3: Đã qua ngày */}
              <div
                onClick={() => setStatusFilter('PAST')}
                className={`rounded-sm p-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.01] ${
                  statusFilter === 'PAST'
                    ? 'bg-emerald-100/90 border-emerald-600 ring-2 ring-emerald-600'
                    : 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-100/60'
                }`}
                title="Nhấp để lọc danh sách lịch tái khám đã qua ngày"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-emerald-800 uppercase font-bold">ĐÃ QUA NGÀY</div>
                    <div className="text-xs font-extrabold text-emerald-950">{stats.past} hoàn tất</div>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  {stats.total > 0 ? Math.round((stats.past / stats.total) * 100) : 0}%
                </span>
              </div>

              {/* Card 4: Đã hủy */}
              <div
                onClick={() => setStatusFilter('CANCELLED')}
                className={`rounded-sm p-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.01] ${
                  statusFilter === 'CANCELLED'
                    ? 'bg-rose-100/90 border-rose-600 ring-2 ring-rose-600'
                    : 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/60'
                }`}
                title="Nhấp để lọc danh sách lịch tái khám đã bị hủy"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-rose-800 uppercase font-bold">ĐÃ HỦY</div>
                    <div className="text-xs font-extrabold text-rose-950">{stats.cancelled} lịch hủy</div>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                  {stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Patient Search Bar & Detailed Clinical Info Strip */}
      <div className="rounded-sm border border-slate-300 bg-white shadow-2xs overflow-hidden">
        {/* TẦNG 1: SEARCH BAR DÙNG CHUNG */}
        <PatientSearchBar
          patientOptions={patientOptions}
          loadingPatientOptions={loadingPatientOptions}
          selectedPatient={selectedPatient}
          onSelectPatient={handleSelectPatient}
          onClearPatient={handleClearPatient}
          phoneSearchQuery={phoneSearchQuery}
          setPhoneSearchQuery={setPhoneSearchQuery}
          onSearchPhone={handleSearchPhone}
          searchingPhone={searchingPhone}
          hasPatient={Boolean(selectedPatient)}
          selectLabel="Chọn nhanh bệnh nhân theo Số điện thoại:"
          inputLabel="Hoặc nhập số điện thoại cần tìm:"
          selectPlaceholder="-- Chọn bệnh nhân từ danh sách (SĐT — Họ tên) --"
          inputPlaceholder="Nhập SĐT..."
          showBorder={false}
          className="p-3 bg-slate-50/90 border-b border-slate-200"
        />

        {/* TẦNG 2: THÔNG TIN BỆNH NHÂN & BỘ CHỌN ĐỢT KHÁM */}
        {selectedPatient && (
          <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border-l-4 border-l-teal-700">
            {/* Bệnh nhân Entity */}
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-700 to-emerald-800 flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-teal-200">
                  {getInitials(selectedPatient.fullName)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div className="space-y-1 text-xs min-w-0">
                {/* Dòng 1: Họ tên + Mã BN + Giới tính */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900 truncate">
                    {selectedPatient.fullName}
                  </h2>
                  {selectedPatient.patientCode && (
                    <span className="rounded-sm bg-teal-100 text-teal-900 border border-teal-300 text-[11px] font-extrabold px-2 py-0.5 tracking-wide font-mono">
                      {selectedPatient.patientCode}
                    </span>
                  )}
                  <span className="text-slate-600 font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                    {selectedPatient.gender === 'FEMALE' ? '♀ Nữ' : selectedPatient.gender === 'MALE' ? '♂ Nam' : selectedPatient.gender || ''}
                  </span>
                </div>

                {/* Dòng 2: Ngày sinh (Tuổi) + SĐT + Email */}
                <div className="flex items-center gap-3 text-slate-600 flex-wrap text-[11px]">
                  {(selectedPatient.dateOfBirth || selectedPatient.dob) && (
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar size={12} className="text-teal-700 shrink-0" />
                      <span>
                        Ngày sinh: <strong className="text-slate-800">{formatDateDisplay(selectedPatient.dateOfBirth || selectedPatient.dob)}</strong>
                        {calculateAge(selectedPatient.dateOfBirth || selectedPatient.dob) && (
                          <span className="text-slate-500 font-normal"> ({calculateAge(selectedPatient.dateOfBirth || selectedPatient.dob)} tuổi)</span>
                        )}
                      </span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-medium">
                    <Phone size={12} className="text-slate-500 shrink-0" />
                    <span>SĐT: <strong className="text-slate-900">{selectedPatient.phone || selectedPatient.phoneNumber || 'Chưa có SĐT'}</strong></span>
                  </span>
                </div>

                {/* Dòng 3: Địa chỉ & Bệnh nền */}
                <div className="flex items-center gap-3 text-slate-600 flex-wrap text-[11px]">
                  {selectedPatient.address && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin size={12} className="text-teal-700 shrink-0" />
                      <span className="truncate max-w-lg" title={selectedPatient.address}>
                        Địa chỉ: <strong className="text-slate-800 font-medium">{selectedPatient.address}</strong>
                      </span>
                    </span>
                  )}
                  {selectedPatient.allergies ? (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 font-bold">
                      <AlertCircle size={12} className="text-rose-600" />
                      Dị ứng: {selectedPatient.allergies}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Không dị ứng thuốc</span>
                  )}
                  {(selectedPatient.systemicDisease || selectedPatient.medicalHistory) && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 font-bold">
                      <Activity size={12} className="text-amber-600" />
                      Bệnh nền: {selectedPatient.systemicDisease || selectedPatient.medicalHistory}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bộ chọn Đợt khám (Treatment Session Selector) */}
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 bg-slate-100/80 p-2 rounded-sm border border-slate-300 shadow-2xs">
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap flex items-center gap-1.5">
                <CalendarCheck size={15} className="text-teal-700" />
                <span>Đợt khám:</span>
              </span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden cursor-pointer"
              >
                <option value="ALL">-- Tất cả các đợt ({treatmentSessions.length} đợt) --</option>
                {treatmentSessions.map((s, idx) => (
                  <option key={s.id || idx} value={s.id}>
                    Đợt {treatmentSessions.length - idx} — {formatDateDisplay(s.examinationDate || s.createdAt) || 'Chưa rõ ngày'} {s.chiefComplaint ? `(${s.chiefComplaint})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN CONTAINER: DUAL VIEW MODE TOOLBAR & CONTENT */}
      <div className="border border-slate-300 bg-white shadow-2xs rounded-sm overflow-hidden">
        {/* Table/Calendar Toolbar Header */}
        <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarCheck size={16} className="text-teal-700" />
            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
              {viewMode === 'list' ? 'DANH SÁCH LỊCH TÁI KHÁM' : 'LỊCH TÁI KHÁM THEO THÁNG'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* VIEW MODE TOGGLE SWITCHER (Danh sách / Lịch) */}
            <div className="flex items-center bg-slate-200/90 p-0.5 rounded-sm border border-slate-300 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-extrabold rounded-sm transition-all cursor-pointer ${viewMode === 'list'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                  }`}
                title="Chuyển sang chế độ Xem Danh Sách"
              >
                <List size={13} />
                <span>Danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-extrabold rounded-sm transition-all cursor-pointer ${viewMode === 'calendar'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                  }`}
                title="Chuyển sang chế độ xem Lịch tháng"
              >
                <CalendarDays size={13} />
                <span>Lịch</span>
              </button>
            </div>

            {/* Bộ chọn Sắp xếp theo ngày (chỉ hiển thị khi xem Danh sách) */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-sm px-2.5 py-1 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 whitespace-nowrap">
                  <ArrowUpDown size={13} className="text-teal-700" />
                  Sắp xếp:
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="text-[11px] font-bold text-slate-900 bg-transparent border-none outline-hidden cursor-pointer py-0 pr-1"
                >
                  <option value="asc">Ngày hẹn: Gần nhất trước</option>
                  <option value="desc">Ngày hẹn: Xa nhất trước</option>
                </select>
              </div>
            )}

            {selectedPatient && (
              <button
                type="button"
                onClick={() => reloadFollowUps(selectedPatient.id, selectedPatient.patientCode, true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-teal-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm cursor-pointer shadow-2xs transition-colors"
                title="Tải lại danh sách"
              >
                <RefreshCw size={13} className={loadingFollowUps ? 'animate-spin text-teal-600' : 'text-slate-500'} />
                <span>Làm mới</span>
              </button>
            )}
          </div>
        </div>

        {/* CONTENT VIEW SWITCHING */}
        {viewMode === 'calendar' ? (
          /* DẠNG LỊCH THÁNG (CALENDAR VIEW) */
          <FollowUpCalendarView
            followUps={displayedFollowUps}
            selectedPatient={selectedPatient}
            onSelectFollowUp={handleViewDetail}
            onEditFollowUp={handleEditFollowUp}
            onAddNewOnDate={handleAddNewOnDate}
            isEmployee={isEmployeeRole}
          />
        ) : (
          /* DẠNG DANH SÁCH BẢNG (LIST TABLE VIEW) */
          <>
            <div className="overflow-x-auto min-h-[320px]">
              <table className="w-full border-collapse text-left text-xs table-fixed">
                <thead className="bg-slate-100/90 text-slate-600 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider select-none border-b border-slate-300 whitespace-nowrap">
                  <tr>
                    <th className="w-[42px] py-2.5 px-1.5 text-center border-r border-slate-200/80">STT</th>
                    <th className="w-[170px] sm:w-[185px] py-2.5 px-2.5 border-r border-slate-200/80">Thời gian tái khám</th>
                    <th className="w-[110px] sm:w-[125px] py-2.5 px-2 border-r border-slate-200/80">Đợt khám</th>
                    <th className="w-[145px] sm:w-[170px] py-2.5 px-2 border-r border-slate-200/80">Bác sĩ phụ trách</th>
                    <th className="w-[145px] sm:w-[170px] py-2.5 px-2 border-r border-slate-200/80">Lý do tái khám</th>
                    <th className="py-2.5 px-2 border-r border-slate-200/80">Ghi chú & Lời dặn</th>
                    <th className="w-[100px] sm:w-[115px] py-2.5 px-1.5 text-center border-r border-slate-200/80">Trạng thái</th>
                    <th className="w-[80px] sm:w-[90px] py-2.5 px-1 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 border-b border-slate-200">
                  {loadingFollowUps && followUps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-teal-600" />
                        <p className="font-semibold text-slate-600">Đang tải danh sách lịch tái khám...</p>
                      </td>
                    </tr>
                  ) : !selectedPatient ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-2">
                          <CalendarCheck size={42} className="mx-auto text-slate-300" />
                          <p className="font-bold text-slate-700 text-sm">Chưa chọn bệnh nhân</p>
                          <p className="text-[11px] text-slate-500">
                            Vui lòng tìm kiếm bằng Số điện thoại hoặc chọn bệnh nhân từ thanh công cụ ở trên để quản lý danh sách lịch tái khám.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : followUps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-3">
                          <FileText size={42} className="mx-auto text-slate-300" />
                          <p className="font-bold text-slate-700 text-sm">Bệnh nhân chưa có lịch tái khám nào</p>
                          <p className="text-[11px] text-slate-500">
                            {!isEmployeeRole
                              ? 'Nhấp vào nút "Lên lịch tái khám mới" ở trên để tạo và tự động gửi thông báo cho bệnh nhân này.'
                              : 'Bệnh nhân chưa được bác sĩ chỉ định lịch tái khám nào.'}
                          </p>
                          {!isEmployeeRole && (
                            <button
                              type="button"
                              onClick={handleOpenCreateModal}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm shadow-sm transition-colors cursor-pointer"
                            >
                              <Plus size={14} /> Lên lịch tái khám ngay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : displayedFollowUps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-2">
                          <CalendarCheck size={32} className="mx-auto text-slate-300" />
                          <p className="font-bold text-slate-700">Đợt khám này chưa có lịch tái khám nào</p>
                          <p className="text-[11px] text-slate-500">
                            Bệnh nhân có lịch tái khám ở các đợt khác.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSessionId('ALL');
                                setStatusFilter('ALL');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm cursor-pointer transition-colors"
                            >
                              Xem tất cả các đợt
                            </button>
                            {!isEmployeeRole && (
                              <button
                                type="button"
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm cursor-pointer transition-colors"
                              >
                                <Plus size={13} /> Lên lịch cho đợt này
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedFollowUps.map((item, idx) => {
                      const badgeInfo = getTimeBadgeInfo(item.followUpDate, item.status);
                      return (
                        <tr
                          key={item.id || idx}
                          onDoubleClick={() => handleViewDetail(item)}
                          className="border-b border-slate-200 hover:bg-teal-50/40 cursor-pointer transition-colors duration-150 group"
                          title="Nhấp đúp chuột để xem chi tiết phiếu tái khám"
                        >
                          <td className="py-2.5 px-1.5 text-center font-bold text-slate-500 border-r border-slate-200/70 align-middle text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-2.5 border-r border-slate-200/70 align-middle">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-slate-900 font-bold text-[11px] sm:text-xs whitespace-nowrap">
                                <Clock size={12} className="text-teal-700 shrink-0" />
                                <span>{formatDateTime(item.followUpDate)}</span>
                              </div>
                              {badgeInfo && (
                                <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded-sm border whitespace-nowrap ${badgeInfo.color}`}>
                                  {badgeInfo.text}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200/70 align-middle whitespace-nowrap">
                            {item.examinationDate ? (
                              <span className="inline-block font-semibold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-sm border border-slate-200 text-[10px] sm:text-[11px] whitespace-nowrap truncate max-w-full">
                                Đợt: {formatDateDisplay(item.examinationDate)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px] sm:text-[11px] whitespace-nowrap">Tái khám định kỳ</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-slate-800 font-medium border-r border-slate-200/70 align-middle">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[9px] font-bold shrink-0 border border-teal-200">
                                BS
                              </div>
                              <span className="truncate font-semibold text-slate-800 text-[11px] sm:text-xs" title={item.dentistName || doctorName || 'Bác sĩ phụ trách'}>
                                {item.dentistName || doctorName || 'Bác sĩ phụ trách'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200/70 align-middle">
                            <span className="font-semibold text-slate-800 text-[11px] sm:text-xs block truncate" title={item.reason || 'Tái khám kiểm tra định kỳ'}>
                              {item.reason || 'Tái khám kiểm tra định kỳ'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200/70 align-middle">
                            <span className="text-slate-700 text-[11px] sm:text-xs block truncate" title={item.note || ''}>
                              {item.note || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-1.5 text-center border-r border-slate-200/70 align-middle whitespace-nowrap">
                            {item.status !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                <span>Xác nhận</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-50 text-rose-800 border border-rose-300 font-bold text-[10px] whitespace-nowrap">
                                <XCircle size={11} className="text-rose-600 shrink-0" />
                                <span>Đã hủy</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-1 text-center align-middle">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={(e) => handleViewDetail(item, e)}
                                className="p-1 text-slate-600 hover:text-teal-800 hover:bg-teal-100/70 rounded-sm cursor-pointer transition-colors"
                                title="Xem chi tiết phiếu tái khám"
                              >
                                <Eye size={13} />
                              </button>
                              {!isEmployeeRole && (
                                <button
                                  type="button"
                                  onClick={(e) => handleEditFollowUp(item, e)}
                                  className="p-1 text-slate-600 hover:text-teal-800 hover:bg-teal-100/70 rounded-sm cursor-pointer transition-colors"
                                  title="Chỉnh sửa lịch tái khám"
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handlePrint(item, e)}
                                className="p-1 text-slate-600 hover:text-teal-800 hover:bg-teal-100/70 rounded-sm cursor-pointer transition-colors"
                                title="In giấy hẹn tái khám"
                              >
                                <Printer size={13} />
                              </button>
                              {!isEmployeeRole && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteClick(item, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-sm cursor-pointer transition-colors"
                                  title="Xóa lịch tái khám"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer status */}
            {selectedPatient && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Hiển thị <strong>{displayedFollowUps.length}</strong> / <strong>{followUps.length}</strong> lịch tái khám của bệnh nhân <strong className="text-slate-900">{selectedPatient.fullName}</strong>
                  {(selectedSessionId !== 'ALL' || statusFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSessionId('ALL');
                        setStatusFilter('ALL');
                      }}
                      className="ml-2 text-teal-800 font-bold hover:underline cursor-pointer"
                    >
                      (Xem tất cả các đợt)
                    </button>
                  )}
                </span>
                <span className="italic">Nhấp đúp chuột vào bất kỳ dòng nào để xem chi tiết phiếu hẹn</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. MODAL 1: LÊN LỊCH / CHỈNH SỬA LỊCH TÁI KHÁM */}
      <CreateFollowUpModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingFollowUp(null);
          setPresetDate(null);
        }}
        onSaveFollowUp={handleSaveFollowUp}
        currentDoctorName={doctorName}
        patient={selectedPatient}
        treatmentSessions={treatmentSessions}
        selectedSessionId={selectedSessionId}
        type={modalType}
        followUpData={editingFollowUp}
        presetDate={presetDate}
      />

      {/* 5. MODAL 2: XEM CHI TIẾT LỊCH TÁI KHÁM */}
      <FollowUpDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        followUp={activeFollowUp}
        patient={selectedPatient}
        selectedSession={selectedSession}
        onPrint={(item) => {
          setIsDetailModalOpen(false);
          setActiveFollowUp(item);
          setIsPrintModalOpen(true);
        }}
      />

      {/* 6. MODAL 3: IN GIẤY HẸN TÁI KHÁM */}
      <FollowUpPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        followUp={activeFollowUp}
        patient={selectedPatient}
        selectedSession={selectedSession}
      />

      {/* 7. MODAL 4: XÁC NHẬN XÓA LỊCH TÁI KHÁM */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingFollowUp(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
        title="Xác nhận xóa lịch tái khám"
        message="Bạn có chắc chắn muốn xóa lịch tái khám này không? Thao tác này sẽ không thể khôi phục."
        itemName={
          deletingFollowUp
            ? `Lịch hẹn ngày ${formatDateTime(deletingFollowUp.followUpDate)} — ${deletingFollowUp.reason || 'Tái khám'}`
            : ''
        }
      />

      {/* 8. MODAL 5: CHỌN HỒ SƠ BỆNH NHÂN TRÙNG SĐT */}
      <SelectPatientModal
        open={isSelectPatientModalOpen}
        onClose={() => setIsSelectPatientModalOpen(false)}
        patients={duplicatePatients}
        phoneKeyword={phoneSearchQuery}
        onSelectPatient={(patient) => {
          handleSelectPatient(patient);
          setIsSelectPatientModalOpen(false);
        }}
      />
    </div>
  );
}


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
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../../hooks/useAuth';
import PatientSearchBar from '../../../components/ui/search/PatientSearchBar';
import CreateFollowUpModal from './components/CreateFollowUpModal';
import FollowUpDetailModal from './components/FollowUpDetailModal';
import FollowUpPrintModal from './components/FollowUpPrintModal';
import DeleteConfirmModal from '../../prescriptions/dentist/components/DeleteConfirmModal';

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

export default function FollowUpAppointment() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Patient State
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatientOptions, setLoadingPatientOptions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);

  // 2. Clinical Context: Medical records & Examination sessions (Đợt khám)
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activeMedicalRecord, setActiveMedicalRecord] = useState(null);
  const [treatmentSessions, setTreatmentSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('ALL');
  const [loadingSessions, setLoadingSessions] = useState(false);

  // 3. Follow-up Appointments Table State
  const [followUps, setFollowUps] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc': Ngày hẹn gần nhất trước, 'desc': Ngày hẹn xa nhất trước

  // 4. Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState(null);

  // 5. Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingFollowUp, setDeletingFollowUp] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

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

  // Filter follow-up appointments by selected treatment session and sort by date smoothly
  const displayedFollowUps = useMemo(() => {
    let list = followUps;
    if (selectedSessionId && selectedSessionId !== 'ALL') {
      list = list.filter(
        (item) => item.examinationResultId && String(item.examinationResultId) === String(selectedSessionId)
      );
    }
    return [...list].sort((a, b) => {
      const timeA = new Date(a.followUpDate || 0).getTime() || 0;
      const timeB = new Date(b.followUpDate || 0).getTime() || 0;
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [followUps, selectedSessionId, sortOrder]);

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
      } else {
        handleSelectPatient(list[0]);
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
    setIsCreateModalOpen(true);
  };

  // Handler: Open Edit Modal
  const handleEditFollowUp = async (item, e) => {
    if (e) e.stopPropagation();
    setModalType('edit');
    setEditingFollowUp(item);
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

      // Reload ngầm để đồng bộ dữ liệu mà không làm giật bảng
      await reloadFollowUps(selectedPatient?.id, selectedPatient?.patientCode, false);
    } catch (err) {
      console.error('Save follow up error:', err);
      toast.error('Có lỗi xảy ra khi lưu lịch tái khám');
    }
  };

  // Handler: Click Delete button
  const handleDeleteClick = (item, e) => {
    if (e) e.stopPropagation();
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
    if (e) e.stopPropagation();
    setActiveFollowUp(item);
    setIsDetailModalOpen(true);
  };

  // Handler: Open Print
  const handlePrint = (item, e) => {
    if (e) e.stopPropagation();
    setActiveFollowUp(item);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1550px] px-2 sm:px-3 py-2 space-y-2 text-slate-800 text-xs font-sans">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
            <CalendarCheck size={20} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              QUẢN LÝ LỊCH TÁI KHÁM BỆNH NHÂN
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Theo dõi, hẹn tái khám và tự động gửi thông báo Email & SMS cho bệnh nhân
            </p>
          </div>
        </div>

        {selectedPatient && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Lên lịch tái khám mới</span>
          </button>
        )}
      </div>

      {/* 2. Patient Search Bar & Patient Info Strip (Thiết kế chuẩn nghiệp vụ giống Đơn thuốc) */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
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
          className="p-3 bg-slate-50/80 border-b border-slate-200"
        />

        {/* TẦNG 2: THÔNG TIN BỆNH NHÂN & BỘ CHỌN ĐỢT KHÁM */}
        {selectedPatient && (
          <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
            {/* Bệnh nhân Entity */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-2xs border-2 border-teal-200">
                  {getInitials(selectedPatient.fullName)}
                </div>
              </div>
              <div className="space-y-0.5 text-xs min-w-0">
                {/* Dòng 1: Họ tên + Mã BN + Giới tính */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    {selectedPatient.fullName}
                  </h2>
                  {selectedPatient.patientCode && (
                    <span className="rounded bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-extrabold px-2 py-0.5">
                      {selectedPatient.patientCode}
                    </span>
                  )}
                  <span className="text-slate-500 font-semibold text-[11px]">
                    {selectedPatient.gender === 'FEMALE' ? '♀ Nữ' : selectedPatient.gender === 'MALE' ? '♂ Nam' : selectedPatient.gender || ''}
                  </span>
                </div>

                {/* Dòng 2: Ngày sinh (Tuổi) + SĐT */}
                <div className="flex items-center gap-3 text-slate-600 flex-wrap text-[11px] pt-0.5">
                  {(selectedPatient.dateOfBirth || selectedPatient.dob) && (
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar size={11} className="text-teal-700" />
                      <span>
                        Ngày sinh: <strong className="text-slate-700">{formatDateDisplay(selectedPatient.dateOfBirth || selectedPatient.dob)}</strong>
                        {calculateAge(selectedPatient.dateOfBirth || selectedPatient.dob) && (
                          <span className="text-slate-500 font-normal"> ({calculateAge(selectedPatient.dateOfBirth || selectedPatient.dob)} tuổi)</span>
                        )}
                      </span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-medium">
                    <Phone size={11} className="text-slate-400" />
                    <span>SĐT: <strong className="text-slate-700">{selectedPatient.phone || selectedPatient.phoneNumber || 'Chưa có SĐT'}</strong></span>
                  </span>
                </div>

                {/* Dòng 3: Địa chỉ */}
                {selectedPatient.address && (
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-0.5">
                    <MapPin size={11} className="text-teal-700 shrink-0" />
                    <span className="truncate max-w-xl" title={selectedPatient.address}>
                      Địa chỉ: <strong className="text-slate-700 font-medium">{selectedPatient.address}</strong>
                    </span>
                  </div>
                )}

                {/* Dòng 4: Dị ứng & Bệnh nền */}
                <div className="flex items-center gap-3 text-slate-600 flex-wrap text-[11px] pt-0.5">
                  {selectedPatient.allergies ? (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 font-bold">
                      <AlertCircle size={11} className="text-rose-600" />
                      Dị ứng: {selectedPatient.allergies}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">Không dị ứng thuốc</span>
                  )}
                  {(selectedPatient.systemicDisease || selectedPatient.medicalHistory) && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 font-bold">
                      <Activity size={11} className="text-amber-600" />
                      Bệnh nền: {selectedPatient.systemicDisease || selectedPatient.medicalHistory}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bộ chọn Đợt khám (Treatment Session Selector) */}
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                <CalendarCheck size={14} className="text-teal-700" />
                <span>Đợt khám:</span>
              </span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-teal-600 outline-hidden cursor-pointer"
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

      {/* 3. MAIN SCREEN: BẢNG DANH SÁCH LỊCH TÁI KHÁM */}
      <div className="border border-slate-300 bg-white shadow-2xs rounded-sm overflow-hidden">
        {/* Table Header toolbar */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarCheck size={15} className="text-teal-700" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              DANH SÁCH LỊCH TÁI KHÁM ({displayedFollowUps.length} LỊCH)
            </span>
            {selectedSessionId !== 'ALL' && (
              <span className="normal-case text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200">
                Đang lọc theo đợt khám
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Bộ chọn Sắp xếp theo ngày */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-sm px-2 py-0.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 whitespace-nowrap">
                <ArrowUpDown size={12} className="text-teal-700" />
                Sắp xếp:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-[11px] font-semibold text-slate-800 bg-transparent border-none outline-hidden cursor-pointer py-0.5 pr-1"
              >
                <option value="asc">Ngày hẹn: Gần nhất trước</option>
                <option value="desc">Ngày hẹn: Xa nhất trước</option>
              </select>
            </div>

            {selectedPatient && (
              <button
                type="button"
                onClick={() => reloadFollowUps(selectedPatient.id, selectedPatient.patientCode, true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-teal-800 cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw size={12} className={loadingFollowUps ? 'animate-spin' : ''} />
                Làm mới
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-300 text-slate-700 font-bold text-[11px] select-none border-b border-slate-300">
              <tr>
                <th className="w-12 py-2.5 px-3 text-center border-r border-slate-300">STT</th>
                <th className="w-48 py-2.5 px-3 border-r border-slate-300">Thời gian tái khám</th>
                <th className="w-40 py-2.5 px-3 border-r border-slate-300">Đợt khám</th>
                <th className="w-44 py-2.5 px-3 border-r border-slate-300">Bác sĩ phụ trách</th>
                <th className="w-56 py-2.5 px-3 border-r border-slate-300 min-w-[200px]">Lý do tái khám</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Ghi chú & Lời dặn</th>
                <th className="w-32 py-2.5 px-3 text-center border-r border-slate-300">Trạng thái</th>
                <th className="w-28 py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {loadingFollowUps && followUps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-teal-600" />
                    Đang tải danh sách lịch tái khám...
                  </td>
                </tr>
              ) : !selectedPatient ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <CalendarCheck size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 mb-1">Chưa chọn bệnh nhân</p>
                    <p className="text-[11px] text-slate-400">Vui lòng tìm hoặc chọn bệnh nhân từ thanh tìm kiếm ở trên để xem lịch tái khám.</p>
                  </td>
                </tr>
              ) : followUps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 mb-1">Bệnh nhân chưa có lịch tái khám nào</p>
                    <p className="text-[11px] text-slate-400 mb-3">Nhấp vào nút "Lên lịch tái khám mới" ở trên để hẹn ngày tái khám cho bệnh nhân này.</p>
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer"
                    >
                      <Plus size={13} /> Lên lịch tái khám ngay
                    </button>
                  </td>
                </tr>
              ) : displayedFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarCheck size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 mb-1">
                      Đợt khám này chưa có lịch tái khám nào
                    </p>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Bệnh nhân có <strong>{followUps.length}</strong> lịch tái khám ở các đợt khác.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId('ALL')}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm cursor-pointer transition-colors"
                      >
                        Xem tất cả các đợt ({followUps.length} lịch)
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm cursor-pointer transition-colors"
                      >
                        <Plus size={13} /> Lên lịch cho đợt này
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedFollowUps.map((item, idx) => {
                  return (
                    <tr
                      key={item.id || idx}
                      onDoubleClick={() => handleViewDetail(item)}
                      className="hover:bg-teal-50/40 cursor-pointer transition-colors duration-150"
                      title="Nhấp đúp chuột để xem chi tiết phiếu tái khám"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal-900 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-teal-700 shrink-0" />
                          <span>{formatDateTime(item.followUpDate)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                        {item.examinationDate ? (
                          <span className="font-semibold text-slate-800">
                            Đợt: {formatDateDisplay(item.examinationDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Định kỳ</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold border-r border-slate-200">
                        {item.dentistName || doctorName || 'Bác sĩ phụ trách'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {item.reason || 'Tái khám kiểm tra định kỳ'}
                      </td>
                      <td
                        className="py-2.5 px-3 text-slate-600 border-r border-slate-200 truncate max-w-xs"
                        title={item.note || ''}
                      >
                        {item.note || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        {item.status !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 size={11} /> Xác nhận
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                            <XCircle size={11} /> Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleEditFollowUp(item, e)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-sm cursor-pointer"
                            title="Chỉnh sửa lịch tái khám"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handlePrint(item, e)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-sm cursor-pointer"
                            title="In giấy hẹn tái khám"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(item, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm cursor-pointer"
                            title="Xóa lịch tái khám"
                          >
                            <Trash2 size={15} />
                          </button>
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
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Hiển thị <strong>{displayedFollowUps.length}</strong> / <strong>{followUps.length}</strong> lịch tái khám của bệnh nhân <strong>{selectedPatient.fullName}</strong>
              {selectedSessionId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedSessionId('ALL')}
                  className="ml-2 text-teal-700 font-semibold hover:underline cursor-pointer"
                >
                  (Xem tất cả các đợt)
                </button>
              )}
            </span>
            <span>Nhấp đúp chuột vào bất kỳ dòng nào để xem chi tiết phiếu hẹn</span>
          </div>
        )}
      </div>

      {/* 4. MODAL 1: LÊN LỊCH / CHỈNH SỬA LỊCH TÁI KHÁM */}
      <CreateFollowUpModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingFollowUp(null);
        }}
        onSaveFollowUp={handleSaveFollowUp}
        currentDoctorName={doctorName}
        patient={selectedPatient}
        treatmentSessions={treatmentSessions}
        selectedSessionId={selectedSessionId}
        type={modalType}
        followUpData={editingFollowUp}
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
    </div>
  );
}

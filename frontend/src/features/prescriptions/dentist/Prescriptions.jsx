import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Eye,
  Pencil,
  RefreshCw,
  Phone,
  AlertCircle,
  Activity,
  CalendarCheck,
  Calendar,
  MapPin,
  Pill,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../../hooks/useAuth';
import PatientSearchBar from '../../../components/ui/search/PatientSearchBar';
import CreatePrescriptionModal from './components/CreatePrescriptionModal';
import PrescriptionDetailModal from './components/PrescriptionDetailModal';
import PrescriptionPrintModal from './components/PrescriptionPrintModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

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
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '../../../services/prescription.service';

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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAdvicePreview = (htmlStr) => {
  if (!htmlStr) return '';
  if (!/[<>&]/.test(htmlStr)) return htmlStr;
  try {
    const formatted = htmlStr
      .replace(/<li[^>]*>/gi, ' • ')
      .replace(/<\/li>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ');
    const doc = new DOMParser().parseFromString(formatted, 'text/html');
    const text = doc.body.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  } catch {
    return htmlStr
      .replace(/<li[^>]*>/gi, ' • ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
};


export default function Prescriptions() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Patient State
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatientOptions, setLoadingPatientOptions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);

  // 2. Clinical Context: Medical records & Examination sessions
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activeMedicalRecord, setActiveMedicalRecord] = useState(null);
  const [treatmentSessions, setTreatmentSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('ALL');
  const [loadingSessions, setLoadingSessions] = useState(false);

  // 3. Prescriptions Table State
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc': Mới nhất, 'asc': Cũ nhất

  // 4. Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activePrescription, setActivePrescription] = useState(null);

  // 5. Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPrescription, setDeletingPrescription] = useState(null);
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

  // When patient is selected, load clinical sessions and prescriptions table
  useEffect(() => {
    if (!selectedPatient) {
      setMedicalRecords([]);
      setActiveMedicalRecord(null);
      setTreatmentSessions([]);
      setSelectedSessionId('ALL');
      setPrescriptions([]);
      return;
    }

    loadPatientClinicalData(selectedPatient);
  }, [selectedPatient]);

  const loadPatientClinicalData = async (pat) => {
    setLoadingSessions(true);
    setLoadingPrescriptions(true);
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

      // 3. Fetch Prescriptions of this patient
      await reloadPrescriptions(pat.id, pat.patientCode);
    } catch (err) {
      console.error('Error loading patient clinical data:', err);
      toast.error('Lỗi khi tải dữ liệu bệnh án');
    } finally {
      setLoadingSessions(false);
      setLoadingPrescriptions(false);
    }
  };

  const reloadPrescriptions = async (patientId, patientCode, showSpinner = false) => {
    if (showSpinner) {
      setLoadingPrescriptions(true);
    }
    try {
      const data = await getPrescriptions({ patientId, patientCode });
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error fetching prescriptions:', err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Currently selected treatment session
  const selectedSession = useMemo(() => {
    if (!selectedSessionId || selectedSessionId === 'ALL') return treatmentSessions[0] || null;
    return treatmentSessions.find((s) => String(s.id) === String(selectedSessionId)) || treatmentSessions[0] || null;
  }, [treatmentSessions, selectedSessionId]);

  // Filter prescriptions by selected treatment session and sort by date smoothly
  const displayedPrescriptions = useMemo(() => {
    let list = prescriptions;
    if (selectedSessionId && selectedSessionId !== 'ALL') {
      list = list.filter(
        (rx) => rx.examinationResultId && String(rx.examinationResultId) === String(selectedSessionId)
      );
    }
    return [...list].sort((a, b) => {
      const timeA = new Date(a.prescriptionDate || a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.prescriptionDate || b.createdAt || 0).getTime() || 0;
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [prescriptions, selectedSessionId, sortOrder]);

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
    setEditingPrescription(null);
    setIsCreateModalOpen(true);
  };

  // Handler: Open Edit Modal
  const handleEditPrescription = async (rx, e) => {
    if (e) e.stopPropagation();
    setModalType('edit');
    setEditingPrescription(rx);
    setIsCreateModalOpen(true);

    if (rx?.id && (!rx.prescriptionDetails || rx.prescriptionDetails.length === 0)) {
      try {
        const full = await getPrescriptionById(rx.id);
        if (full) setEditingPrescription(full);
      } catch (err) {
        console.warn('Could not fetch full prescription details', err);
      }
    }
  };

  // Handler: Save or Update Prescription
  const handleSavePrescription = async (prescriptionData, editId) => {
    try {
      const targetId = editId || (modalType === 'edit' ? editingPrescription?.id : null);
      const payload = {
        ...prescriptionData,
        examinationResultId: selectedSession?.id || null,
        patientId: selectedPatient?.id,
        patientCode: selectedPatient?.patientCode,
      };

      let result;
      if (targetId) {
        result = await updatePrescription(targetId, payload);
        toast.success('Cập nhật đơn thuốc thành công!');
        if (result) {
          setPrescriptions((prev) =>
            prev.map((p) => (String(p.id) === String(targetId) ? { ...p, ...result } : p))
          );
        }
      } else {
        result = await createPrescription(payload);
        toast.success('Kê đơn thuốc thành công!');
        if (result) {
          setPrescriptions((prev) => [result, ...prev]);
        }
      }

      // Reload ngầm để đồng bộ dữ liệu mà không làm giật bảng
      await reloadPrescriptions(selectedPatient?.id, selectedPatient?.patientCode, false);
    } catch (err) {
      console.error('Save prescription error:', err);
      toast.error('Có lỗi xảy ra khi lưu đơn thuốc');
    }
  };

  // Handler: Click Delete button (open custom confirmation modal)
  const handleDeleteClick = (rx, e) => {
    if (e) e.stopPropagation();
    setDeletingPrescription(rx);
    setIsDeleteModalOpen(true);
  };

  // Handler: Confirm Delete in Modal
  const handleConfirmDelete = async () => {
    if (!deletingPrescription) return;
    setDeletingLoading(true);
    try {
      await deletePrescription(deletingPrescription.id);
      toast.success('Đã xóa đơn thuốc thành công');
      setPrescriptions((prev) => prev.filter((p) => String(p.id) !== String(deletingPrescription.id)));
      setIsDeleteModalOpen(false);
      setDeletingPrescription(null);
    } catch (err) {
      console.error('Delete prescription error:', err);
      toast.error('Lỗi khi xóa đơn thuốc');
    } finally {
      setDeletingLoading(false);
    }
  };

  // Handler: Open Detail
  const handleViewDetail = (rx, e) => {
    if (e) e.stopPropagation();
    setActivePrescription(rx);
    setIsDetailModalOpen(true);
  };

  // Handler: Open Print
  const handlePrint = (rx, e) => {
    if (e) e.stopPropagation();
    setActivePrescription(rx);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1550px] px-2 sm:px-3 py-2 space-y-2 text-slate-800 text-xs">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Pill className="text-teal-700" size={20} />
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            QUẢN LÝ ĐƠN THUỐC BỆNH NHÂN
          </h1>
        </div>

        {selectedPatient && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Kê đơn thuốc mới</span>
          </button>
        )}
      </div>

      {/* 2. Patient Search Bar & Patient Info Strip (Thiết kế đồng bộ Kế hoạch điều trị) */}
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

        {/* TẦNG 2: THÔNG TIN BỆNH NHÂN & ĐỢT KHÁM (Không có phần chẩn đoán dư thừa) */}
        {selectedPatient && (
          <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
            {/* Bệnh nhân Entity */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-2xs border-2 border-teal-200">
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

                {/* Dòng 3: Địa chỉ xuống dòng riêng */}
                {selectedPatient.address && (
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-0.5">
                    <MapPin size={11} className="text-teal-700 shrink-0" />
                    <span className="truncate max-w-xl" title={selectedPatient.address}>
                      Địa chỉ: <strong className="text-slate-700 font-medium">{selectedPatient.address}</strong>
                    </span>
                  </div>
                )}

                {/* Dòng 3: Dị ứng & Bệnh nền */}
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

      {/* 3. MAIN SCREEN: BẢNG DANH SÁCH ĐƠN THUỐC */}
      <div className="border border-slate-300 bg-white shadow-2xs rounded-sm overflow-hidden">
        {/* Table Header toolbar */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText size={15} className="text-teal-700" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              DANH SÁCH ĐƠN THUỐC ĐÃ KÊ ({displayedPrescriptions.length} ĐƠN)
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
                <option value="desc">Ngày kê: Mới nhất</option>
                <option value="asc">Ngày kê: Cũ nhất</option>
              </select>
            </div>

            {selectedPatient && (
              <button
                type="button"
                onClick={() => reloadPrescriptions(selectedPatient.id, selectedPatient.patientCode, true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-teal-800 cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw size={12} className={loadingPrescriptions ? 'animate-spin' : ''} />
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
                <th className="w-24 py-2.5 px-3 border-r border-slate-300">Mã đơn</th>
                <th className="w-36 py-2.5 px-3 border-r border-slate-300">Ngày kê</th>
                <th className="w-48 px-3 border-r border-slate-300 min-w-[220px]">Tên đơn thuốc</th>
                <th className="w-48 py-2.5 px-3 border-r border-slate-300">Bác sĩ kê đơn</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Lời dặn</th>
                <th className="w-28 py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {loadingPrescriptions && prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-teal-600" />
                    Đang tải danh sách đơn thuốc...
                  </td>
                </tr>
              ) : !selectedPatient ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Pill size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 mb-1">Chưa chọn bệnh nhân</p>
                    <p className="text-[11px] text-slate-400">Vui lòng tìm hoặc chọn bệnh nhân từ thanh tìm kiếm ở trên để xem đơn thuốc.</p>
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 mb-1">Bệnh nhân chưa có đơn thuốc nào</p>
                    <p className="text-[11px] text-slate-400 mb-3">Nhấp vào nút "Kê đơn thuốc mới" ở trên để bắt đầu kê đơn cho bệnh nhân này.</p>
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer"
                    >
                      <Plus size={13} /> Kê đơn thuốc ngay
                    </button>
                  </td>
                </tr>
              ) : displayedPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 mb-1">
                      Đợt khám này chưa có đơn thuốc nào
                    </p>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Bệnh nhân có <strong>{prescriptions.length}</strong> đơn thuốc ở các đợt khám khác.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId('ALL')}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm cursor-pointer transition-colors"
                      >
                        Xem tất cả các đợt ({prescriptions.length} đơn)
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm cursor-pointer transition-colors"
                      >
                        <Plus size={13} /> Kê đơn cho đợt này
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedPrescriptions.map((rx, idx) => {
                  return (
                    <tr
                      key={rx.id || idx}
                      onDoubleClick={() => handleViewDetail(rx)}
                      className="hover:bg-teal-50/40 cursor-pointer transition-colors duration-150"
                      title="Nhấp đúp chuột để xem chi tiết đơn thuốc"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 border-r border-slate-200">
                        {rx.prescriptionCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                        {formatDateTime(rx.prescriptionDate || rx.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {rx.prescriptionName || 'Đơn thuốc điều trị'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                        {rx.prescriber || 'Nha sĩ'}
                      </td>
                      <td
                        className="py-2.5 px-3 text-slate-600 border-r border-slate-200 truncate max-w-xs"
                        title={formatAdvicePreview(rx.doctorAdvice || rx.advice || '')}
                      >
                        {formatAdvicePreview(rx.doctorAdvice || rx.advice || '') || (selectedSession?.chiefComplaint ? `Đợt: ${selectedSession.chiefComplaint}` : '—')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleEditPrescription(rx, e)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-sm cursor-pointer"
                            title="Chỉnh sửa đơn thuốc"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handlePrint(rx, e)}
                            className="p-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-sm cursor-pointer"
                            title="In đơn thuốc"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(rx, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm cursor-pointer"
                            title="Xóa đơn thuốc"
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
              Hiển thị <strong>{displayedPrescriptions.length}</strong> / <strong>{prescriptions.length}</strong> đơn thuốc của bệnh nhân <strong>{selectedPatient.fullName}</strong>
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
            <span>Nhấp đúp chuột vào bất kỳ dòng nào để xem bảng chi tiết đơn thuốc</span>
          </div>
        )}
      </div>

      {/* 4. MODAL 1: KÊ ĐƠN / CHỈNH SỬA ĐƠN THUỐC */}
      <CreatePrescriptionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPrescription(null);
        }}
        onSavePrescription={handleSavePrescription}
        currentDoctorName={doctorName}
        patient={selectedPatient}
        type={modalType}
        prescriptionData={editingPrescription}
      />

      {/* 5. MODAL 2: XEM CHI TIẾT ĐƠN THUỐC DẠNG TABLE */}
      <PrescriptionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        prescription={activePrescription}
        patient={selectedPatient}
        onPrint={(rx) => {
          setIsDetailModalOpen(false);
          setActivePrescription(rx);
          setIsPrintModalOpen(true);
        }}
      />

      {/* 6. MODAL 3: IN ĐƠN THUỐC Y TẾ */}
      <PrescriptionPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        prescription={activePrescription}
        patient={selectedPatient}
        selectedSession={selectedSession}
      />

      {/* 7. MODAL 4: XÁC NHẬN XÓA ĐƠN THUỐC (Custom Modal, không dùng alert/confirm) */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingPrescription(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
        title="Xác nhận xóa đơn thuốc"
        message="Bạn có chắc chắn muốn xóa đơn thuốc này khỏi danh sách không? Thao tác này sẽ không thể khôi phục."
        itemName={
          deletingPrescription
            ? `${deletingPrescription.prescriptionName || 'Đơn thuốc'} — ${deletingPrescription.id ? String(deletingPrescription.id).slice(0, 8).toUpperCase() : ''}`
            : ''
        }
      />
    </div>
  );
}

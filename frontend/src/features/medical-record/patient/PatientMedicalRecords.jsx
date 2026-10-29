import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Activity,
  Layers,
  Pill,
  Image,
  Printer,
  FileText,
  Calendar,
  Stethoscope,
  RefreshCw,
  FolderOpen,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import Loading from '../../../components/ui/Loading';

// Services
import {
  getMedicalRecordsByPatientId,
  getMedicalRecordById
} from '../../../services/medicalRecord.service';
import { getExaminationResultsByMedicalRecordId } from '../../../services/examinationResult.service';
import { getTreatmentPlansByPatientId } from '../../../services/treatmentPlan.service';
import { getPrescriptions } from '../../../services/prescription.service';
import { getPatientById } from '../../../services/patient.service';
import { getDentistsList } from '../../../services/dentist.service';

// Tabs & Dictionaries
import PatientInfoTab from './tabs/PatientInfoTab';
import ClinicalHistoryTab from '../admin/components/tabs/ClinicalHistoryTab';
import TreatmentPlanTab from '../admin/components/tabs/TreatmentPlanTab';
import PrescriptionTab from '../admin/components/tabs/PrescriptionTab';
import DentalImagesTab from '../admin/components/tabs/DentalImagesTab';
import { formatDateDisplay } from '../admin/components/medicalRecordDictionaries';

export default function PatientMedicalRecords() {
  const { user, isLoading: authLoading } = useAuth();
  const patientId = user?.patientId || user?.id;

  // State danh sách hồ sơ của bệnh nhân
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);

  // State Tabs dữ liệu: mặc định mở Tab thông tin cá nhân
  const [activeTab, setActiveTab] = useState('patient_info'); // 'patient_info' | 'clinical_history' | 'treatment_plan' | 'prescriptions' | 'images'
  const [detailExams, setDetailExams] = useState([]);
  const [detailPlans, setDetailPlans] = useState([]);
  const [detailPrescriptions, setDetailPrescriptions] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);


  //#region callAPI
  // 1. Gọi 4 API chi tiết cho 1 hồ sơ bệnh án (tương tự bên Admin)
  const loadRecordDetail = useCallback(async (rec, patInfo) => {
    if (!rec) return;
    setLoadingDetail(true);

    try {
      const recordId = rec.id || rec.medicalRecordId;
      const targetPatientId = rec.patientId || patInfo?.id || patientId;

      // Gọi song song 4 API
      const [singleRecordRes, examsRes, plansRes, presRes] = await Promise.allSettled([
        recordId ? getMedicalRecordById(recordId).catch(() => null) : Promise.resolve(null),
        recordId ? getExaminationResultsByMedicalRecordId(recordId).catch(() => []) : Promise.resolve([]),
        targetPatientId ? getTreatmentPlansByPatientId(targetPatientId).catch(() => []) : Promise.resolve([]),
        targetPatientId ? getPrescriptions({ patientId: targetPatientId }).catch(() => []) : Promise.resolve([])
      ]);

      // Cập nhật thông tin chi tiết hồ sơ
      let fullRec = { ...rec };
      if (singleRecordRes.status === 'fulfilled' && singleRecordRes.value) {
        const data = singleRecordRes.value?.data || singleRecordRes.value;
        if (data && typeof data === 'object') {
          fullRec = {
            ...fullRec,
            ...data,
            allergies: data.allergies || fullRec.allergies || patInfo?.allergies || '',
            systemicDiseases: data.systemicDisease
              ? [data.systemicDisease]
              : fullRec.systemicDiseases || (patInfo?.systemicDisease ? [patInfo.systemicDisease] : []),
            currentMedications: data.currentMedications || fullRec.currentMedications || patInfo?.currentMedications || '',
            surgicalHistory: data.surgicalHistory || fullRec.surgicalHistory || patInfo?.surgicalHistory || ''
          };
        }
      }
      setSelectedRecord(fullRec);

      // Tab 1: Lịch sử khám lâm sàng & kết quả khám
      let loadedExams = [];
      if (examsRes.status === 'fulfilled') {
        const rawEx = examsRes.value?.data || examsRes.value;
        if (Array.isArray(rawEx)) loadedExams = rawEx;
      }
      setDetailExams(loadedExams);

      // Tab 2: Kế hoạch điều trị & phân giai đoạn
      let loadedPlans = [];
      if (plansRes.status === 'fulfilled') {
        const rawPlans = plansRes.value?.data || plansRes.value;
        if (Array.isArray(rawPlans)) loadedPlans = rawPlans;
      }
      setDetailPlans(loadedPlans);

      // Tab 3: Đơn thuốc đã kê
      let loadedPrescriptions = [];
      if (presRes.status === 'fulfilled') {
        const rawPres = presRes.value?.data || presRes.value;
        if (Array.isArray(rawPres)) {
          loadedPrescriptions = rawPres;
        } else if (rawPres?.items && Array.isArray(rawPres.items)) {
          loadedPrescriptions = rawPres.items;
        }
      }
      setDetailPrescriptions(loadedPrescriptions);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết hồ sơ bệnh án:', err);
      toast.error('Không thể tải chi tiết hồ sơ bệnh án!');
    } finally {
      setLoadingDetail(false);
    }
  }, [patientId]);

  // 2. Nạp danh sách hồ sơ bệnh án ban đầu của bệnh nhân
  const fetchPatientRecords = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [recordsRes, patientRes, dentistsRes] = await Promise.allSettled([
        getMedicalRecordsByPatientId(patientId).catch(() => []),
        getPatientById(patientId).catch(() => null),
        getDentistsList().catch(() => [])
      ]);

      const rawRecords = recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value) ? recordsRes.value : [];
      const pat = patientRes.status === 'fulfilled' ? (patientRes.value?.data || patientRes.value) : null;
      setPatientInfo(pat);

      const rawDentists = dentistsRes.status === 'fulfilled' && Array.isArray(dentistsRes.value?.data || dentistsRes.value)
        ? (dentistsRes.value?.data || dentistsRes.value)
        : [];

      const dentistMap = new Map();
      rawDentists.forEach((d) => {
        if (d.id) dentistMap.set(String(d.id), d.fullName || d.name || d.dentistName);
        if (d.dentistId) dentistMap.set(String(d.dentistId), d.fullName || d.name || d.dentistName);
      });

      // Chuẩn hóa dữ liệu hồ sơ bệnh án
      const normalized = rawRecords.map((rec) => {
        const displayCode = rec.medicalRecordCode || rec.recordCode || (rec.id ? `HSBA-${String(rec.id).replace(/-/g, '').slice(0, 6).toUpperCase()}` : 'HSBA-00001');
        const dentistName = rec.dentistName || dentistMap.get(String(rec.dentistId || rec.doctorId || '')) || 'BS. Nha khoa';

        return {
          ...rec,
          id: rec.id || rec.medicalRecordId,
          recordCode: displayCode,
          patientId: patientId,
          patientCode: rec.patientCode || pat?.patientCode || user?.username || 'PA-CHƯA CẤP',
          patientName: rec.patientName || pat?.fullName || user?.fullName || 'Bệnh nhân',
          phone: rec.patientPhone || pat?.phone || pat?.phoneNumber || '',
          email: rec.patientEmail || pat?.email || user?.email || '',
          gender: rec.patientGender || pat?.gender || 'OTHER',
          dateOfBirth: rec.patientDob || pat?.dateOfBirth,
          cccd: rec.patientCccd || pat?.cccd || '',
          address: rec.patientAddress || pat?.address || '',
          allergies: rec.allergies || pat?.allergies || '',
          systemicDiseases: rec.systemicDisease ? [rec.systemicDisease] : (pat?.systemicDiseases || (pat?.systemicDisease ? [pat.systemicDisease] : [])),
          currentMedications: rec.currentMedications || pat?.currentMedications || '',
          surgicalHistory: rec.surgicalHistory || pat?.surgicalHistory || '',
          dentistName: dentistName,
          dentistId: rec.dentistId || rec.doctorId,
          createdAt: rec.recordDate || rec.createdAt || new Date().toISOString(),
          status: rec.status || 'ACTIVE',
          avatar: pat?.avatar || user?.avatarUrl || null
        };
      });

      // Sắp xếp hồ sơ mới nhất lên trước
      normalized.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRecords(normalized);

      // Tự động mở hồ sơ đầu tiên
      if (normalized.length > 0) {
        setSelectedRecord(normalized[0]);
        loadRecordDetail(normalized[0], pat);
      }
    } catch (err) {
      console.error('Lỗi khi nạp danh sách hồ sơ:', err);
      toast.error('Không thể tải danh sách hồ sơ bệnh án!');
    } finally {
      setLoading(false);
    }
  }, [patientId, user, loadRecordDetail]);

  useEffect(() => {
    if (authLoading) return;
    fetchPatientRecords();
  }, [authLoading, fetchPatientRecords]);

  // Xử lý khi bệnh nhân chọn hồ sơ khác
  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
    loadRecordDetail(record, patientInfo);
  };
  //#endregion

  // Trạng thái Loading ban đầu
  if (loading || authLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center rounded-3xl border border-slate-200/90 bg-white shadow-sm p-12">
        <Loading
          title="Đang tải hồ sơ bệnh án của bạn..."
          subtitle="Vui lòng đợi trong giây lát, hệ thống đang đồng bộ dữ liệu khám"
          size="lg"
        />
      </div>
    );
  }

  // Trường hợp bệnh nhân chưa có hồ sơ bệnh án nào
  if (records.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white p-12 shadow-sm text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200/70 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
          <FileText size={32} />
        </div>
        <h3 className="text-lg font-black text-slate-900">Chưa có hồ sơ bệnh án</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Bạn hiện chưa có hồ sơ bệnh án nào tại phòng khám Crown Dental.
          Sau khi hoàn thành buổi khám đầu tiên tại phòng khám, toàn bộ thông tin bệnh án, chẩn đoán, phác đồ điều trị và đơn thuốc sẽ xuất hiện tại đây.
        </p>
        <button
          type="button"
          onClick={fetchPatientRecords}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-colors cursor-pointer"
        >
          <RefreshCw size={15} />
          <span>Kiểm tra lại dữ liệu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ================= THANH CHỌN HỒ SƠ NẾU CÓ NHIỀU HỒ SƠ ================= */}
      {records.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <FolderOpen size={14} className="text-teal-700" /> Chọn hồ sơ:
          </span>
          {records.map((rec) => {
            const isSelected = selectedRecord?.id === rec.id;
            return (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleSelectRecord(rec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${isSelected
                  ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-200'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <span>{rec.recordCode}</span>
                <span className="text-[10px] opacity-80">({formatDateDisplay(rec.createdAt)})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ================= MAIN TABS CONTAINER: GIAO DIỆN TOÀN MÀN HÌNH ================= */}
      <div className="rounded-lg border border-slate-200/90 bg-white overflow-hidden flex flex-col min-h-[580px]">

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 pt-2 border-b border-slate-200 bg-white shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
          {/* TAB 1: Thông tin cá nhân & Bệnh án */}
          <button
            type="button"
            onClick={() => setActiveTab('patient_info')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'patient_info'
              ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-slate-100/70'
              }`}
          >
            <User size={15} className="shrink-0" />
            <span>1. Thông tin cá nhân</span>
          </button>

          {/* TAB 2: Lịch sử khám & Triệu chứng răng */}
          <button
            type="button"
            onClick={() => setActiveTab('clinical_history')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'clinical_history'
              ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-slate-100/70'
              }`}
          >
            <Activity size={15} className="shrink-0" />
            <span>2. Lịch sử khám & triệu chứng răng</span>
          </button>

          {/* TAB 3: Kế hoạch điều trị */}
          <button
            type="button"
            onClick={() => setActiveTab('treatment_plan')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'treatment_plan'
              ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-slate-100/70'
              }`}
          >
            <Layers size={15} className="shrink-0" />
            <span>3. Kế hoạch điều trị</span>
          </button>

          {/* TAB 4: Đơn thuốc */}
          <button
            type="button"
            onClick={() => setActiveTab('prescriptions')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'prescriptions'
              ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-slate-100/70'
              }`}
          >
            <Pill size={15} className="shrink-0" />
            <span>4. Đơn thuốc</span>
          </button>

          {/* TAB 5: Danh mục hình ảnh X-Quang */}
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'images'
              ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-700 hover:bg-slate-100/70'
              }`}
          >
            <Image size={15} className="shrink-0" />
            <span>5. Hình ảnh X-Quang</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="min-w-0 flex-1 p-3 sm:p-4 overflow-y-auto relative bg-white min-h-[460px]">
          {loadingDetail && (
            <Loading
              overlay={true}
              title="Đang tải dữ liệu chi tiết hồ sơ..."
              subtitle="Truy xuất lịch sử khám, phác đồ điều trị và đơn thuốc"
              size="md"
            />
          )}

          {/* TAB 1: THÔNG TIN CÁ NHÂN & TIỀN SỬ Y TẾ */}
          {activeTab === 'patient_info' && (
            <PatientInfoTab selectedRecord={selectedRecord} />
          )}

          {/* TAB 2: LỊCH SỬ KHÁM */}
          {activeTab === 'clinical_history' && (
            <ClinicalHistoryTab detailExams={detailExams} selectedRecord={selectedRecord} />
          )}

          {/* TAB 3: KẾ HOẠCH ĐIỀU TRỊ */}
          {activeTab === 'treatment_plan' && (
            <TreatmentPlanTab detailPlans={detailPlans} selectedRecord={selectedRecord} />
          )}

          {/* TAB 4: ĐƠN THUỐC */}
          {activeTab === 'prescriptions' && (
            <PrescriptionTab detailPrescriptions={detailPrescriptions} selectedRecord={selectedRecord} />
          )}

          {/* TAB 5: HÌNH ẢNH */}
          {activeTab === 'images' && (
            <DentalImagesTab />
          )}
        </div>

      </div>
    </div>
  );
}

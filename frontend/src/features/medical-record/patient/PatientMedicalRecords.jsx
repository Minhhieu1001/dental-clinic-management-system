import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Layers, Pill, Image, ChevronDown, Users, Link2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import Loading from '../../../components/ui/Loading';
import { getMedicalRecordsByPatientId, getMedicalRecordById } from '../../../services/medicalRecord.service';
import { getExaminationResultsByMedicalRecordId } from '../../../services/examinationResult.service';
import { getTreatmentPlansByPatientId } from '../../../services/treatmentPlan.service';
import { getPrescriptions } from '../../../services/prescription.service';
import { getPatientById } from '../../../services/patient.service';
import { deletePatientRelationship, getListPatientRelationship } from '../../../services/patientRelationship.service';
import PatientInfoTab from './tabs/PatientInfoTab';
import ClinicalHistoryTab from '../admin/components/tabs/ClinicalHistoryTab';
import TreatmentPlanTab from '../admin/components/tabs/TreatmentPlanTab';
import PrescriptionTab from '../admin/components/tabs/PrescriptionTab';
import DentalImagesTab from '../admin/components/tabs/DentalImagesTab';
import LinkedProfilesModal from './components/LinkedProfilesModal';
import LinkProfileModal from './components/LinkProfileModal';
import { RELATIONSHIP_LABELS } from '../../../utils/relationshipUtils';

const unwrap = (response) => response?.data ?? response;
const showListError = (error) => toast.error(error.response?.data?.message || 'Không thể tải danh sách hồ sơ. Vui lòng thử lại.');

export default function PatientMedicalRecords() {
  const { user, isLoading: authLoading } = useAuth();
  if (authLoading) return <Loading title="Đang tải tài khoản..." />;
  if (!user?.id) return <p className="p-8 text-center">Vui lòng đăng nhập để xem hồ sơ bệnh án.</p>;
  return <PatientMedicalRecordsContent key={user.id} user={user} />;
}

function PatientMedicalRecordsContent({ user }) {
  const [familyProfiles, setFamilyProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [primaryPatient, setPrimaryPatient] = useState(null);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(false);
  const profilesRequest = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLinkedModalOpen, setIsLinkedModalOpen] = useState(false);
  const [isLinkNewModalOpen, setIsLinkNewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('patient_info');
  const [view, setView] = useState(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const selectedPatientId = activeProfile?.patientId;
  const currentView = view?.patientId === selectedPatientId ? view : null;
  const selectedRecord = currentView?.record ?? null;
  const detailExams = currentView?.exams ?? [];
  const detailPlans = currentView?.plans ?? [];
  const detailPrescriptions = currentView?.prescriptions ?? [];
  const loadingDetail = Boolean(selectedPatientId && !currentView);

  const refreshProfiles = useCallback(async (preferredId) => {
    const request = Symbol();
    profilesRequest.current = request;
    setProfilesLoading(true);
    try {
      const profiles = unwrap(await getListPatientRelationship());
      if (!Array.isArray(profiles)) throw new Error('Invalid profile list');
      if (request !== profilesRequest.current) return;
      setFamilyProfiles(profiles);
      setActiveProfile((current) => profiles.find((profile) => profile.patientId === (preferredId || current?.patientId))
        || profiles.find((profile) => profile.isPrimary) || null);
      setProfilesError(false);
    } catch (error) {
      if (request === profilesRequest.current) setProfilesError(true);
      throw error;
    } finally {
      if (request === profilesRequest.current) setProfilesLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = Symbol();
    profilesRequest.current = request;
    getListPatientRelationship().then((response) => {
      if (request !== profilesRequest.current) return;
      const profiles = unwrap(response);
      if (!Array.isArray(profiles)) throw new Error('Invalid profile list');
      setFamilyProfiles(profiles);
      setActiveProfile(profiles.find((profile) => profile.isPrimary) || null);
      setProfilesError(false);
    }).catch((error) => {
      if (request !== profilesRequest.current) return;
      setProfilesError(true);
      showListError(error);
    }).finally(() => {
      if (request === profilesRequest.current) setProfilesLoading(false);
    });
    return () => { profilesRequest.current = null; };
  }, [user.id]);

  // Đồng bộ thông tin đầy đủ của hồ sơ chính chủ từ 1 nguồn duy nhất (dùng chung cho các modal)
  useEffect(() => {
    const primaryId = familyProfiles.find((profile) => profile.isPrimary)?.patientId;
    if (!primaryId) return;
    let cancelled = false;
    getPatientById(primaryId)
      .then((res) => {
        if (!cancelled) setPrimaryPatient(unwrap(res));
      })
      .catch((err) => console.error('Không thể tải thông tin bệnh nhân chính chủ:', err));
    return () => { cancelled = true; };
  }, [familyProfiles]);

  // Reload all clinical data for the selected patient; ignore responses from previous selections.
  useEffect(() => {
    if (!selectedPatientId) return;
    let cancelled = false;
    async function load() {
      try {
        const [patientResult, recordsResult] = await Promise.all([
          getPatientById(selectedPatientId), getMedicalRecordsByPatientId(selectedPatientId)
        ]);
        const patient = unwrap(patientResult);
        const records = unwrap(recordsResult);
        const first = Array.isArray(records) ? records[0] : null;
        const recordId = first?.id || first?.medicalRecordId;
        const results = await Promise.allSettled([
          recordId ? getMedicalRecordById(recordId) : Promise.resolve(null),
          recordId ? getExaminationResultsByMedicalRecordId(recordId) : Promise.resolve([]),
          getTreatmentPlansByPatientId(selectedPatientId),
          getPrescriptions({ patientId: selectedPatientId })
        ]);
        if (cancelled) return;
        const value = (index, fallback) => results[index].status === 'fulfilled' ? (unwrap(results[index].value) ?? fallback) : fallback;
        const record = value(0, first || {});
        const prescriptions = value(3, []);
        setView({
          patientId: selectedPatientId,
          record: {
            ...patient, ...record, id: recordId || null, patientId: selectedPatientId,
            patientName: patient.fullName, patientCode: patient.patientCode,
            recordCode: record.medicalRecordCode || record.recordCode || '',
            systemicDiseases: patient.systemicDisease ? [patient.systemicDisease] : []
          },
          exams: value(1, []), plans: value(2, []),
          prescriptions: Array.isArray(prescriptions) ? prescriptions : (prescriptions.items || [])
        });
        if (results.some((result) => result.status === 'rejected')) toast.error('Một số dữ liệu khám chưa tải được. Vui lòng thử lại.');
      } catch (error) {
        if (cancelled) return;
        setView({ patientId: selectedPatientId, error: true });
        toast.error(error.response?.data?.message || 'Không thể tải bệnh án của hồ sơ đã chọn');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedPatientId, reloadVersion]);

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
    setActiveTab('patient_info');
    setIsDropdownOpen(false);
  };

  const handleLinkSuccess = async () => {
    try { await refreshProfiles(); }
    catch (error) { showListError(error); }
  };

  const handleUnlinkProfile = async (relationshipId) => {
    await deletePatientRelationship(relationshipId);
    setFamilyProfiles((profiles) => profiles.filter((profile) => profile.relationshipId !== relationshipId));
    setActiveProfile((profile) => profile?.relationshipId === relationshipId
      ? familyProfiles.find((item) => item.isPrimary) || null : profile);
    try { await refreshProfiles(); }
    catch (error) { showListError(error); }
  };

  if (profilesLoading && !familyProfiles.length) {
    return <Loading title="Đang tải danh sách hồ sơ..." />;
  }
  if (!familyProfiles.length) {
    return <div className="p-8 text-center space-y-4">
      <p>{profilesError ? 'Không thể tải danh sách hồ sơ.' : 'Tài khoản chưa có hồ sơ bệnh nhân.'}</p>
      <button type="button" onClick={() => refreshProfiles().catch(showListError)} className="text-teal-700 underline">Thử lại</button>
    </div>;
  }
  const linkedCount = familyProfiles.filter((p) => !p.isPrimary).length;

  return (
    <div className="space-y-4">

      {/* ================= KHỐI DUY NHẤT: HEADER + TABS + NỘI DUNG ================= */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden flex flex-col min-h-[620px] transition-all duration-300">

        {/* PHẦN ĐẦU KHỐI: HEADER HỒ SƠ & THANH CÔNG CỤ LIÊN KẾT */}
        <div className="px-4 sm:px-7 py-3.5 sm:py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-gradient-to-r from-teal-50/40 via-white to-white">
          <div className="space-y-0.5">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-teal-600 block">
              HỒ SƠ SỨC KHỎE
            </span>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Hồ sơ bệnh án
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Quản lý và theo dõi hồ sơ của bạn và người thân
            </p>
          </div>

          {/* Thanh công cụ: 3 khối bằng nhau, bo sm, không dạng viên thuốc */}
          <div className="grid grid-cols-2 sm:grid-cols-3 items-center gap-2 sm:gap-2.5 w-full sm:w-auto">

            {/* 1. Dropdown Switcher Profile */}
            <div className="col-span-2 sm:col-span-1 relative w-full sm:w-44 md:w-48">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="w-full h-11 bg-white border border-slate-200/90 rounded-sm px-2.5 sm:px-3 flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-sm bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center shrink-0">
                    {activeProfile?.fullName?.split(' ').map((n) => n[0]).slice(-2).join('') || 'VN'}
                  </div>
                  <div className="text-left min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 leading-tight truncate">
                      {activeProfile?.fullName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {activeProfile?.isPrimary ? 'Bản thân - Đang xem' : `${RELATIONSHIP_LABELS[activeProfile?.relationshipType] || activeProfile?.relationshipLabel || activeProfile?.relationship || 'Người thân'} - Đang xem`}
                    </p>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Menu Dropdown danh sách hồ sơ với Framer Motion mượt mà */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 left-0 sm:left-auto mt-1.5 w-full sm:w-64 bg-white rounded-sm shadow-xl border border-slate-200 py-1.5 z-40"
                    >
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Chọn hồ sơ hiển thị
                      </div>
                      {familyProfiles.map((p) => {
                        const isSelected = (activeProfile?.patientId === p.patientId) || (activeProfile?.patientCode === p.patientCode);
                        return (
                          <button
                            key={p.patientId || p.patientCode}
                            type="button"
                            onClick={() => handleSelectProfile(p)}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-teal-50/70 text-teal-900 font-bold' : 'text-slate-700'
                              }`}
                          >
                            <div className={`w-6.5 h-6.5 rounded-sm flex items-center justify-center text-xs font-bold shrink-0 ${p.isPrimary ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                              {p.fullName?.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs truncate">{p.fullName}</p>
                              <p className="text-[10px] text-slate-400">{p.isPrimary ? 'Bản thân (Chính chủ)' : (RELATIONSHIP_LABELS[p.relationshipType] || p.relationshipLabel || p.relationship)}</p>
                            </div>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0"></span>
                            )}
                          </button>
                        );
                      })}

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsLinkNewModalOpen(true);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Liên kết thêm hồ sơ người thân...</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Nút "Quản lý liên kết" */}
            <div className="col-span-1 w-full sm:w-44 md:w-48">
              <button
                type="button"
                onClick={() => { setIsLinkedModalOpen(true); refreshProfiles().catch(showListError); }}
                className="w-full h-11 bg-white border border-teal-300 text-teal-700 hover:bg-teal-50/70 hover:border-teal-400 rounded-sm px-2.5 sm:px-3 flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                <Users size={15} className="text-teal-600 shrink-0" />
                <span className="truncate">Quản lý</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-teal-100/90 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {linkedCount}
                </span>
              </button>
            </div>

            {/* 3. Nút "Liên kết hồ sơ" */}
            <div className="col-span-1 w-full sm:w-44 md:w-48">
              <button
                type="button"
                onClick={() => setIsLinkNewModalOpen(true)}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-sm px-2.5 sm:px-3 flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                <Link2 size={14} className="shrink-0" />
                <span className="truncate">Liên kết hồ sơ</span>
              </button>
            </div>

          </div>
        </div>

        {/* PHẦN GIỮA KHỐI: THANH TABS ĐIỀU HƯỚNG (Ẩn thanh cuộn xấu xí) */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-5 pt-1.5 sm:pt-2 border-b border-slate-200/80 bg-slate-50/60 shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
          {/* TAB 1: Thông tin cá nhân & Bệnh án */}
          <button
            type="button"
            onClick={() => setActiveTab('patient_info')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${activeTab === 'patient_info'
              ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100/70'
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
              ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100/70'
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
              ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100/70'
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
              ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100/70'
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
              ? 'border-teal-600 text-teal-700 bg-white shadow-2xs rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100/70'
              }`}
          >
            <Image size={15} className="shrink-0" />
            <span>5. Hình ảnh X-Quang</span>
          </button>
        </div>

        {/* PHẦN DƯỚI KHỐI: NỘI DUNG CHI TIẾT TABS */}
        <div className="min-w-0 flex-1 p-3 sm:p-5 overflow-y-auto relative bg-white min-h-[460px]">
          {loadingDetail && (
            <Loading
              overlay={true}
              title="Đang tải dữ liệu chi tiết hồ sơ..."
              subtitle="Truy xuất lịch sử khám, phác đồ điều trị và đơn thuốc"
              size="md"
            />
          )}

          {currentView?.error && (
            <div role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">
              <p>Không thể tải bệnh án của hồ sơ đã chọn.</p>
              <button type="button" className="mt-2 underline" onClick={() => { setView(null); setReloadVersion((value) => value + 1); }}>Thử lại</button>
            </div>
          )}
          {/* TAB 1: THÔNG TIN CÁ NHÂN & TIỀN SỬ Y TẾ */}
          {!currentView?.error && activeTab === 'patient_info' && (
            <PatientInfoTab selectedRecord={selectedRecord} />
          )}

          {/* TAB 2: LỊCH SỬ KHÁM */}
          {!currentView?.error && activeTab === 'clinical_history' && (
            <ClinicalHistoryTab detailExams={detailExams} selectedRecord={selectedRecord} />
          )}

          {/* TAB 3: KẾ HOẠCH ĐIỀU TRỊ */}
          {!currentView?.error && activeTab === 'treatment_plan' && (
            <TreatmentPlanTab detailPlans={detailPlans} selectedRecord={selectedRecord} />
          )}

          {/* TAB 4: ĐƠN THUỐC */}
          {!currentView?.error && activeTab === 'prescriptions' && (
            <PrescriptionTab detailPrescriptions={detailPrescriptions} selectedRecord={selectedRecord} />
          )}

          {/* TAB 5: HÌNH ẢNH */}
          {!currentView?.error && activeTab === 'images' && (
            <DentalImagesTab />
          )}
        </div>

      </div>

      {/* ================= MODAL QUẢN LÝ DANH SÁCH HỒ SƠ ĐÃ LIÊN KẾT (DẠNG CARD) ================= */}
      <LinkedProfilesModal
        isOpen={isLinkedModalOpen}
        onClose={() => setIsLinkedModalOpen(false)}
        profiles={familyProfiles}
        loading={profilesLoading}
        activeProfileId={activeProfile?.patientId}
        onSelectProfile={handleSelectProfile}
        onUnlinkProfile={handleUnlinkProfile}
      />

      {/* ================= MODAL NHẬP THÔNG TIN VÀ XÁC THỰC OTP ================= */}
      <LinkProfileModal
        isOpen={isLinkNewModalOpen}
        onClose={() => setIsLinkNewModalOpen(false)}
        primaryPatient={primaryPatient}
        onLinkSuccess={handleLinkSuccess}
      />

    </div>
  );
}

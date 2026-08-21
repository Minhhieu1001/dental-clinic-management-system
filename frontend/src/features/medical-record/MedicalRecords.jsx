import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Edit2,
  Stethoscope,
  FileText,
  Image as ImageIcon,
  Search,
  Phone,
  X,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getPatientByPatientCode,
  getPatientsByPhone,
  getPatients,
  updatePatient,
} from '../../services/patient.service';
import MedicalRecordHeader from './components/MedicalRecordHeader';
import PatientGeneralInfoForm from './components/PatientGeneralInfoForm';
import TreatmentHistoryTimeline from './components/TreatmentHistoryTimeline';

// Sample Treatment History mapped 100% to MedicalRecord.java entity fields
const SAMPLE_MEDICAL_RECORDS = [
  {
    id: 'mr-101',
    recordDate: '2024-05-12T09:30:00',
    status: 'COMPLETED',
    statusLabel: 'Đã hoàn thành',
    diagnosis: 'Khám tổng quát & Cạo vôi răng',
    dentistName: 'BS. Nguyễn Thị An',
    treatmentNotes: 'Khám tổng quát, cạo vôi răng hàm trên và hàm dưới',
    symptoms: 'Răng nhiều cao răng, nướu viêm nhẹ',
    cost: '500.000 đ',
  },
  {
    id: 'mr-102',
    recordDate: '2024-04-15T14:00:00',
    status: 'COMPLETED',
    statusLabel: 'Đã hoàn thành',
    diagnosis: 'Trám răng số 46 (Sâu mặt nhai)',
    dentistName: 'BS. Nguyễn Thị An',
    treatmentNotes: 'Trám răng sâu mặt nhai bằng Composite thẩm mỹ',
    symptoms: 'Răng 46 đau ê buốt khi ăn đồ ngọt',
    cost: '800.000 đ',
  },
  {
    id: 'mr-103',
    recordDate: '2024-03-20T10:00:00',
    status: 'COMPLETED',
    statusLabel: 'Đã hoàn thành',
    diagnosis: 'Nhổ răng số 48 (Răng khôn mọc lệch)',
    dentistName: 'BS. Trần Văn Minh',
    treatmentNotes: 'Nhổ răng khôn hàm dưới bên phải, khâu 2 mũi',
    symptoms: 'Răng khôn 48 mọc lệch 90 độ gây đau nhức',
    cost: '1.200.000 đ',
  },
  {
    id: 'mr-104',
    recordDate: '2024-03-10T09:00:00',
    status: 'CANCELLED',
    statusLabel: 'Đã hủy',
    diagnosis: 'Lấy cao răng toàn hàm',
    dentistName: 'BS. Nguyễn Thị An',
    treatmentNotes: 'Lấy cao răng toàn hàm',
    symptoms: 'Vôi răng tích tụ',
    cost: '300.000 đ',
  },
];

export default function MedicalRecords() {
  const location = useLocation();
  const navigate = useNavigate();

  // Passed patient object from previous route or fallback default
  const passedPatient = location.state?.patient;

  // Active Tab for bottom navigation toolbar
  const [activeToolbarTab, setActiveToolbarTab] = useState('GENERAL'); // GENERAL, EXAM, PRESCRIPTION, IMAGES, DOCS
  const [isEditing, setIsEditing] = useState(false);

  // Phone Search State
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [multiplePatientsModalOpen, setMultiplePatientsModalOpen] = useState(false);
  const [foundPatientsList, setFoundPatientsList] = useState([]);

  // Selected systemic diseases list state (Array for checklist)
  const [systemicDiseases, setSystemicDiseases] = useState([]);

  // Patient State matching PatientDTO.java entity properties 100%
  const [patientData, setPatientData] = useState({
    id: passedPatient?.id || passedPatient?.patientId || '',
    patientCode: passedPatient?.patientCode || location.state?.patientCode || '',
    fullName: passedPatient?.fullName || passedPatient?.patientName || location.state?.fullName || '',
    nationality: passedPatient?.nationality || 'Việt Nam',
    phone: passedPatient?.phone || passedPatient?.phoneNumber || location.state?.phone || '',
    gender: passedPatient?.gender || 'FEMALE',
    dateOfBirth: passedPatient?.dateOfBirth ? String(passedPatient.dateOfBirth).split('T')[0] : '',
    address: passedPatient?.address || '',
    allergies: passedPatient?.allergies || '',
    currentMedications: passedPatient?.currentMedications || '',
    surgicalHistory: passedPatient?.surgicalHistory || '',
    createdAt: passedPatient?.createdAt ? String(passedPatient.createdAt).split('T')[0] : '',
    email: passedPatient?.email || '',
    avatar: passedPatient?.avatar || '',
  });

  // Apply chosen patient object onto form
  const applyPatientToForm = (patientObj) => {
    setPatientData({
      id: patientObj.id || '',
      patientCode: patientObj.patientCode || `PA-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: patientObj.fullName || patientObj.patientName || patientObj.user?.fullName || '',
      nationality: patientObj.nationality || 'Việt Nam',
      phone: patientObj.phone || patientObj.phoneNumber || patientObj.user?.phone || '',
      gender: patientObj.gender || 'MALE',
      dateOfBirth: patientObj.dateOfBirth ? String(patientObj.dateOfBirth).split('T')[0] : '',
      address: patientObj.address || '',
      allergies: patientObj.allergies || '',
      currentMedications: patientObj.currentMedications || '',
      surgicalHistory: patientObj.surgicalHistory || patientObj.pastSurgeries || '',
      createdAt: patientObj.createdAt ? String(patientObj.createdAt).split('T')[0] : '',
      email: patientObj.email || patientObj.user?.email || '',
      avatar: patientObj.avatar || patientObj.avatarUrl || null,
    });

    let diseases = [];
    if (Array.isArray(patientObj.systemicDisease)) {
      diseases = patientObj.systemicDisease;
    } else if (typeof patientObj.systemicDisease === 'string' && patientObj.systemicDisease.trim()) {
      diseases = patientObj.systemicDisease.split(',').map((s) => s.trim()).filter(Boolean);
    }
    setSystemicDiseases(diseases);
  };

  // Search Patients By Phone Number
  const handleSearchPhone = async (e) => {
    if (e) e.preventDefault();

    const query = phoneSearchQuery.trim();
    if (!query) {
      toast.error('Vui lòng nhập số điện thoại cần tìm');
      return;
    }

    setSearchingPhone(true);
    try {
      let results = [];
      try {
        const apiRes = await getPatientsByPhone(query);
        results = Array.isArray(apiRes) ? apiRes : apiRes ? [apiRes] : [];
      } catch (err) {
        console.warn('API phone search fallback', err);
      }

      // Fallback: search in full patient list if direct API endpoint returns empty
      if (results.length === 0) {
        try {
          const allList = await getPatients();
          const raw = Array.isArray(allList) ? allList : allList?.data || allList?.result || [];
          if (Array.isArray(raw)) {
            results = raw.filter((p) => {
              const pPhone = (p.phone || p.phoneNumber || p.user?.phone || '').replace(/\D/g, '');
              const qPhone = query.replace(/\D/g, '');
              return pPhone && qPhone && pPhone.includes(qPhone);
            });
          }
        } catch (e) {
          console.warn('Fallback getPatients error:', e);
        }
      }

      if (results.length === 0) {
        toast.error(`Không tìm thấy hồ sơ bệnh nhân nào với SĐT "${query}"`);
      } else if (results.length === 1) {
        applyPatientToForm(results[0]);
        toast.success(`Đã tải hồ sơ bệnh nhân: ${results[0].fullName || results[0].patientName}`);
      } else {
        // Multiple records matching same phone number -> Open selection modal!
        setFoundPatientsList(results);
        setMultiplePatientsModalOpen(true);
      }
    } catch (error) {
      console.error('Error searching patient by phone:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm bệnh nhân');
    } finally {
      setSearchingPhone(false);
    }
  };

  // Re-sync and fetch real Backend Patient data by patientCode or phone
  useEffect(() => {
    const code = passedPatient?.patientCode || location.state?.patientCode;
    const phoneNum = passedPatient?.phone || passedPatient?.phoneNumber || location.state?.phone;

    if (passedPatient) {
      applyPatientToForm(passedPatient);
    }

    const loadData = async () => {
      try {
        let data = null;
        if (code && code !== 'N/A') {
          data = await getPatientByPatientCode(code).catch(() => null);
        }
        if (!data && phoneNum) {
          const list = await getPatientsByPhone(phoneNum).catch(() => []);
          data = Array.isArray(list) ? list[0] : list;
        }

        if (data) {
          applyPatientToForm(data);
        }
      } catch (err) {
        console.warn('Lỗi tải thông tin bệnh nhân từ API:', err);
      }
    };

    if (code || phoneNum) {
      loadData();
    }
  }, [location.state]);

  // Toggle disease checkbox handler
  const handleToggleDisease = (disease) => {
    if (!isEditing) return;
    setSystemicDiseases((prev) =>
      prev.includes(disease) ? prev.filter((d) => d !== disease) : [...prev, disease]
    );
  };

  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: patientData.fullName,
        phone: patientData.phone,
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth
          ? (patientData.dateOfBirth.includes('T') ? patientData.dateOfBirth : `${patientData.dateOfBirth}T00:00:00`)
          : null,
        address: patientData.address,
        nationality: patientData.nationality,
        allergies: patientData.allergies || null,
        currentMedications: patientData.currentMedications || null,
        surgicalHistory: patientData.surgicalHistory || null,
        systemicDisease: systemicDiseases.length > 0 ? systemicDiseases.join(', ') : null,
      };

      const isUUID = (str) =>
        typeof str === 'string' &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

      let targetId = isUUID(patientData.id) ? patientData.id : null;

      if (!targetId) {
        if (patientData.patientCode && patientData.patientCode !== 'N/A') {
          const fetchedObj = await getPatientByPatientCode(patientData.patientCode).catch(() => null);
          if (fetchedObj?.id && isUUID(fetchedObj.id)) {
            targetId = fetchedObj.id;
          }
        }
        if (!targetId && patientData.phone) {
          const list = await getPatientsByPhone(patientData.phone).catch(() => []);
          const fetchedObj = Array.isArray(list) ? list[0] : list;
          if (fetchedObj?.id && isUUID(fetchedObj.id)) {
            targetId = fetchedObj.id;
          }
        }
      }

      if (targetId) {
        const updated = await updatePatient(targetId, payload);
        if (updated) {
          applyPatientToForm(updated);
        }
      }

      setIsEditing(false);
      toast.success(`Đã cập nhật thông tin bệnh nhân ${patientData.fullName} thành công!`);
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin bệnh nhân:', err);
      toast.error('Lỗi khi lưu thông tin bệnh nhân vào cơ sở dữ liệu!');
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    const age = new Date().getFullYear() - birthYear;
    return `${age} tuổi`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="mx-auto max-w-[1500px] px-1 sm:px-2 space-y-4 py-1">
      {/* Top Header Toolbar Component */}
      <MedicalRecordHeader
        patientName={patientData.fullName}
        patientCode={patientData.patientCode}
        saving={saving}
        onSave={handleSaveProfile}
        onBack={() => navigate(-1)}
      />

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN (8 cols): THÔNG TIN CHUNG (PATIENT DTO FIELDS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            {/* Header section with Title & Phone Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50/70 gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-extrabold text-slate-900 whitespace-nowrap tracking-tight">
                  Thông tin chung
                </h2>
                {isEditing && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-300 animate-pulse">
                    Đang chỉnh sửa
                  </span>
                )}
              </div>

              {/* Phone Search Bar Input Form */}
              <form onSubmit={handleSearchPhone} className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={phoneSearchQuery}
                    onChange={(e) => setPhoneSearchQuery(e.target.value)}
                    placeholder="Nhập số điện thoại tìm hồ sơ bệnh nhân..."
                    className="w-full rounded-lg border border-slate-300/90 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-900 font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none shadow-2xs transition-all"
                  />
                  <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-700" />
                  {phoneSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPhoneSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searchingPhone}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 disabled:opacity-50 transition-all whitespace-nowrap cursor-pointer"
                  title="Tìm kiếm hồ sơ bệnh nhân theo số điện thoại"
                >
                  <Search size={13} />
                  <span>{searchingPhone ? 'Đang tìm...' : 'Tìm kiếm SĐT'}</span>
                </button>
              </form>
            </div>

            {/* TOP NAVIGATION TAB TOOLBAR */}
            <div className="flex border-b border-slate-200/80 bg-slate-50/50 px-6 pt-3 pb-1 gap-2 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveToolbarTab('GENERAL')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeToolbarTab === 'GENERAL'
                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <User size={15} />
                <span>Thông tin chung</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dentist/clinical-exam', { state: { patient: patientData } })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 border-transparent text-slate-600 hover:text-teal-900 hover:bg-slate-100/60 transition-all whitespace-nowrap cursor-pointer"
              >
                <Stethoscope size={15} className="text-teal-700" />
                <span>Khám và chẩn đoán &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolbarTab('PRESCRIPTION')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeToolbarTab === 'PRESCRIPTION'
                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Edit2 size={15} />
                <span>Chỉ định</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolbarTab('IMAGES')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeToolbarTab === 'IMAGES'
                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <ImageIcon size={15} />
                <span>Hình ảnh</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolbarTab('DOCS')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeToolbarTab === 'DOCS'
                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <FileText size={15} />
                <span>Tài liệu</span>
              </button>
            </div>

            {/* TAB CONTENT: THÔNG TIN CHUNG */}
            {activeToolbarTab === 'GENERAL' && (
              <PatientGeneralInfoForm
                patientData={patientData}
                setPatientData={setPatientData}
                systemicDiseases={systemicDiseases}
                handleToggleDisease={handleToggleDisease}
                isEditing={isEditing}
                onToggleEdit={() => setIsEditing(!isEditing)}
              />
            )}

            {/* TAB CONTENT: KHÁM VÀ ĐIỀU TRỊ */}
            {activeToolbarTab === 'EXAM' && (
              <div className="p-6 space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Stethoscope className="text-teal-700" size={17} /> Lịch Sử Khám Lâm Sàng & Điều Trị
                </h3>
                <p className="text-slate-500">Danh sách các buổi khám, sơ đồ răng và kế hoạch điều trị của bệnh nhân.</p>
                <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 text-slate-600 font-medium">
                  Chưa có hồ sơ chẩn đoán răng mới trong ngày hôm nay.
                </div>
              </div>
            )}

            {/* TAB CONTENT: CHỈ ĐỊNH */}
            {activeToolbarTab === 'PRESCRIPTION' && (
              <div className="p-6 space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Edit2 className="text-teal-700" size={17} /> Danh Sách Chỉ Định & Đơn Thuốc
                </h3>
                <p className="text-slate-500">Các chỉ định cận lâm sàng, xét nghiệm và đơn thuốc đã kê.</p>
                <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 text-slate-600 font-medium">
                  Chưa có chỉ định thuốc mới cần xử lý.
                </div>
              </div>
            )}

            {/* TAB CONTENT: HÌNH ẢNH */}
            {activeToolbarTab === 'IMAGES' && (
              <div className="p-6 space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ImageIcon className="text-teal-700" size={17} /> Phim X-Quang & Hình Ảnh Nha Khoa
                </h3>
                <p className="text-slate-500">Hình ảnh chụp X-quang răng Panorama, Periapical và ảnh trước/sau điều trị.</p>
                <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 text-slate-600 font-medium">
                  Chưa có dữ liệu phim X-quang được tải lên.
                </div>
              </div>
            )}

            {/* TAB CONTENT: TÀI LIỆU */}
            {activeToolbarTab === 'DOCS' && (
              <div className="p-6 space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="text-teal-700" size={17} /> Tài Liệu & Hợp Đồng Cam Kết
                </h3>
                <p className="text-slate-500">Các file PDF hợp đồng điều trị niềng răng, cam kết cấy ghép Implant.</p>
                <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 text-slate-600 font-medium">
                  Chưa có file tài liệu đính kèm.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (4 cols): LỊCH SỬ ĐIỀU TRỊ (TIMELINE MEDICALRECORDS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4">
          <TreatmentHistoryTimeline records={SAMPLE_MEDICAL_RECORDS} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CHỌN HỒ SƠ BỆNH NHÂN KHI 1 SỐ ĐIỆN THOẠI CÓ NHIỀU HỒ SƠ */}
      {/* ========================================================================= */}
      {multiplePatientsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-teal-800 to-teal-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700/60 border border-teal-500/30 text-teal-200">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    Phát Hiện Nhiều Hồ Sơ Bệnh Nhân
                  </h3>
                  <p className="text-xs text-teal-200/90 font-medium pt-0.5">
                    Số điện thoại <span className="font-bold text-white">{phoneSearchQuery}</span> có {foundPatientsList.length} hồ sơ trùng khớp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMultiplePatientsModalOpen(false)}
                className="rounded-lg p-1.5 text-teal-200 hover:bg-teal-700 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: List of matching patients */}
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-xs font-semibold text-slate-600">
                Vui lòng chọn đúng bệnh nhân bên dưới để tải dữ liệu lên form:
              </p>

              <div className="space-y-3 pt-1">
                {foundPatientsList.map((p) => {
                  const pName = p.fullName || p.patientName || p.user?.fullName || 'Bệnh nhân';
                  const pCode = p.patientCode || 'Chưa có mã';
                  const pPhone = p.phone || p.phoneNumber || p.user?.phone || 'N/A';
                  const pDob = p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : '';
                  const pGender = p.gender === 'FEMALE' ? '♀ Nữ' : '♂ Nam';
                  const pAddr = p.address || 'Chưa cập nhật địa chỉ';

                  return (
                    <div
                      key={p.id || pCode}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-300 transition-all gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-white font-extrabold text-lg shrink-0 shadow-xs">
                          {pName.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">{pName}</h4>
                            <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-teal-800 border border-teal-200">
                              {pCode}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="text-teal-700" /> {pPhone}
                            </span>
                            <span>•</span>
                            <span>{pGender}</span>
                            {pDob && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} className="text-teal-700" /> {formatDateDisplay(pDob)} ({calculateAge(pDob)})
                                </span>
                              </>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5 truncate max-w-md">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{pAddr}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          applyPatientToForm(p);
                          setMultiplePatientsModalOpen(false);
                          toast.success(`Đã chọn hồ sơ bệnh nhân: ${pName} (${pCode})`);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition-colors shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <CheckCircle2 size={15} />
                        <span>Chọn hồ sơ này &rarr;</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end bg-slate-50 px-6 py-3.5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setMultiplePatientsModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

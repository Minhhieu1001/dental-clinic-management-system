import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Stethoscope,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPatients, createPatient, updatePatient } from '../../services/patient.service';
import PatientModal from '../../components/ui/PatientModal';
import { useAuthStore } from '../../store/authStore';
import {
  DEFAULT_DENTAL_CLINIC_NAME,
  DEFAULT_DENTAL_CLINIC_ADDRESS,
  DEFAULT_RECORD_FILE_NAME,
} from '../medical-record/dentist/medicalRecordHelpers';
import { toPatientPayload } from './patientFormMapper';

// Fallback initial patient list
const INITIAL_PATIENTS = [
  {
    id: 'p-101',
    patientCode: 'PA-881459',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    gender: 'MALE',
    dateOfBirth: '1992-05-15',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    createdAt: '2026-08-10',
    notes: 'Bệnh nhân khám tư vấn niềng răng Invisalign',
  },
  {
    id: 'p-102',
    patientCode: 'PA-881460',
    fullName: 'Trần Thị Mai',
    phone: '0918765432',
    gender: 'FEMALE',
    dateOfBirth: '1988-11-20',
    address: '456 Lê Văn Sỹ, Quận 3, TP.HCM',
    createdAt: '2026-08-12',
    notes: 'Tiền sử răng nhạy cảm, cần nhẹ tay khi cạo vôi',
  },
];

const ROWS_PER_PAGE = 5;

export default function DentistPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Unified Modal State
  const [modalConfig, setModalConfig] = useState({
    open: false,
    type: 'CREATE',
    payload: null,
  });

  // Fetch real backend data if available
  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      const rawList = Array.isArray(data) ? data : data?.data || data?.result || [];
      if (Array.isArray(rawList)) {
        const formatted = rawList.map((p) => ({
          id: p.id || `p-${Math.random()}`,
          patientCode: p.patientCode || `PA-${Math.floor(100000 + Math.random() * 900000)}`,
          fullName: p.fullName || p.user?.fullName || 'Bệnh nhân',
          phone: p.phone || p.phoneNumber || p.user?.phone || 'N/A',
          cccd: p.cccd || '',
          email: p.email || p.user?.email || '',
          nationality: p.nationality || 'Việt Nam',
          hometown: p.hometown || '',
          job: p.job || '',
          gender: p.gender || 'MALE',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          address: p.address || 'Chưa cập nhật',
          createdAt: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          systemicDisease: p.systemicDisease || '',
          allergies: p.allergies || '',
          currentMedications: p.currentMedications || '',
          surgicalHistory: p.surgicalHistory || '',
          notes: p.notes || p.systemicDisease || p.allergies || '',
        }));
        setPatients(formatted);
      }
    } catch (e) {
      console.warn('Using initial patient list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  // Calculate age helper
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    const age = new Date().getFullYear() - birthYear;
    return `(${age} tuổi)`;
  };

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = (p.fullName || '').toLowerCase().includes(term);
        const matchPhone = (p.phone || '').includes(term);
        const matchCode = (p.patientCode || '').toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchCode) return false;
      }

      if (genderFilter !== 'ALL' && p.gender !== genderFilter) return false;
      return true;
    });
  }, [patients, searchTerm, genderFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ROWS_PER_PAGE) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredPatients.slice(start, start + ROWS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  const handleOpenCreate = () => {
    setModalConfig({ open: true, type: 'CREATE', payload: null });
  };

  const handleOpenEdit = (patient) => {
    setModalConfig({ open: true, type: 'EDIT', payload: patient });
  };

  const handleOpenView = (patient) => {
    setModalConfig({ open: true, type: 'VIEW', payload: patient });
  };

  const handleSaveModal = async (formData) => {
    try {
      const currentUser = useAuthStore.getState().user;
      const payloadData = {
        ...toPatientPayload(formData, currentUser?.id || null),
        // 3 biến FE: Tên cơ sở/bệnh viện, Địa chỉ bệnh viện, Tên hồ sơ
        dentalClinicName: DEFAULT_DENTAL_CLINIC_NAME,
        clinicAddress: DEFAULT_DENTAL_CLINIC_ADDRESS,
        fileName: DEFAULT_RECORD_FILE_NAME,
      };

      if (modalConfig.type === 'EDIT' && formData.id) {
        await updatePatient(formData.id, payloadData);
        toast.success('Đã cập nhật thông tin bệnh nhân thành công!');
      } else {
        const res = await createPatient(payloadData);
        const createdCode = res?.patientCode || res?.data?.patientCode || '';
        toast.success(`Đã thêm thành công bệnh nhân ${createdCode ? `(${createdCode})` : ''} & tự động tạo hồ sơ bệnh án!`);
      }
      await fetchPatientData();
    } catch (error) {
      console.error('Error saving patient profile:', error);
      toast.error('Có lỗi xảy ra khi lưu dữ liệu bệnh nhân');
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-1 space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-teal-700" size={26} />
            Danh Sách Hồ Sơ Bệnh Nhân (Bác Sĩ)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Tra cứu thông tin bệnh nhân, bệnh lý toàn thân, tiền sử dị ứng và điều hướng tới Hồ sơ bệnh án chi tiết.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchPatientData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : 'text-slate-500'} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Thêm bệnh nhân</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên bệnh nhân, mã bệnh nhân (PA-...), số điện thoại..."
            className="w-full rounded border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-teal-600 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả giới tính</option>
            <option value="MALE">Nam (MALE)</option>
            <option value="FEMALE">Nữ (FEMALE)</option>
          </select>
        </div>
      </div>

      {/* 3. Patient Data Table */}
      <div className="rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã Bệnh Nhân</th>
                <th className="px-4 py-3">Họ Và Tên</th>
                <th className="px-4 py-3">Số Điện Thoại</th>
                <th className="px-4 py-3">Giới Tính / Tuổi</th>
                <th className="px-4 py-3">Bệnh Lý / Ghi Chú</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPatients.map((p) => (
                <tr key={p.id} className="hover:bg-teal-50/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-teal-800 whitespace-nowrap">
                    {p.patientCode}
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white font-bold text-xs shrink-0">
                        {p.fullName.charAt(0)}
                      </div>
                      <span>{p.fullName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>{p.phone}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                    <span>{p.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'}</span>
                    <span className="ml-1 text-slate-400">{calculateAge(p.dateOfBirth)}</span>
                  </td>

                  <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">
                    {p.notes || p.systemicDisease || 'Chưa ghi nhận'}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Hồ sơ bệnh án chi tiết */}
                      <button
                        type="button"
                        onClick={() => navigate('/dentist/medical-records', { state: { patient: p } })}
                        className="flex items-center gap-1 rounded bg-teal-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-800 shadow-2xs transition-colors cursor-pointer"
                        title="Xem Hồ Sơ Bệnh Án Chi Tiết"
                      >
                        <FileText size={13} />
                        <span>Hồ sơ bệnh án</span>
                      </button>

                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => handleOpenView(p)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={13} />
                      </button>

                      {/* Chỉnh sửa */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="rounded border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy hồ sơ bệnh nhân nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-slate-50">
          <p className="text-xs text-slate-500">
            Hiển thị <span className="font-bold text-slate-700">{filteredPatients.length}</span> hồ sơ bệnh nhân
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2.5 text-xs font-bold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Unified Patient Modal */}
      <PatientModal
        open={modalConfig.open}
        type={modalConfig.type}
        payload={modalConfig.payload}
        onClose={() => setModalConfig({ open: false, type: 'CREATE', payload: null })}
        onSave={handleSaveModal}
      />
    </div>
  );
}

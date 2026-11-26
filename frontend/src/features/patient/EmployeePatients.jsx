import { useState, useMemo, useEffect } from 'react';
import {
  User,
  Phone,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Link2,
  ArrowUpDown,
  RotateCcw,
  MoreHorizontal,
  LockKeyhole,
  LockKeyholeOpen,
} from 'lucide-react';
import { Dialog, Menu, MenuItem } from '@mui/material';
import toast from 'react-hot-toast';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '../../services/patient.service';
import PatientModal from '../../components/ui/PatientModal';
import EmployeeLinkedProfile from './components/EmployeeLinkedProfile';
import { toPatientPayload } from '../../utils/patientFormMapper';
import { lockUser, unlockUser } from '../../services/user.service';

const ROWS_PER_PAGE = 5;

export default function EmployeePatients({ adminMode = false }) {
  // Quản lý Tab chính: 'PATIENTS' (Danh sách bệnh nhân) | 'LINKED_PROFILES' (Hồ sơ đã liên kết)
  const [activeTab, setActiveTab] = useState('PATIENTS');

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [updatingAccountId, setUpdatingAccountId] = useState(null);
  const [accountActionPatient, setAccountActionPatient] = useState(null);
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST'); // 'NEWEST' | 'OLDEST'
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, patient: null });

  // Unified Modal State: { open: boolean, type: 'CREATE'|'EDIT'|'VIEW'|'DELETE', payload: object }
  const [modalConfig, setModalConfig] = useState({
    open: false,
    type: 'CREATE',
    payload: null,
  });

  // Fetch real backend data
  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      const rawList = Array.isArray(data) ? data : data?.data || data?.result || [];
      const formatted = rawList.map((p) => ({
        id: p.id,
        userId: p.userId || null,
        accountStatus: p.accountStatus || null,
        createdBranchId: p.createdBranchId || null,
        createdBranchName: p.createdBranchName || null,
        patientCode: p.patientCode || '',
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
        createdAt: p.createdAt || '',
        systemicDisease: p.systemicDisease || '',
        allergies: p.allergies || '',
        currentMedications: p.currentMedications || '',
        surgicalHistory: p.surgicalHistory || '',
        notes: p.notes || p.systemicDisease || p.allergies || '',
        contactName: p.contactName || '',
        contactPhone: p.contactPhone || '',
        contactRelationship: p.contactRelationship || '',
      }));
      setPatients(formatted);
    } catch (e) {
      console.error('Lỗi khi tải danh sách bệnh nhân:', e);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPatientData, 0);
    return () => clearTimeout(timer);
  }, []);

  // Format date helper (DD/MM/YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        const cleanDate = dateStr.split('T')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Calculate age helper
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    const age = new Date().getFullYear() - birthYear;
    return `(${age} tuổi)`;
  };

  // Danh sách năm tạo có trong dữ liệu bệnh nhân
  const availableYears = useMemo(() => {
    const yearsSet = new Set([new Date().getFullYear()]);
    patients.forEach((p) => {
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (!isNaN(d.getFullYear())) {
          yearsSet.add(d.getFullYear());
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [patients]);

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    const list = patients.filter((p) => {
      if (adminMode && accountFilter === 'WITH_ACCOUNT' && !p.userId) return false;
      if (adminMode && accountFilter === 'WITHOUT_ACCOUNT' && p.userId) return false;
      // 1. Search term (Tên, Mã BN, SĐT)
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = (p.fullName || '').toLowerCase().includes(term);
        const matchPhone = (p.phone || '').includes(term);
        const matchCode = (p.patientCode || '').toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchCode) return false;
      }

      if (genderFilter !== 'ALL' && p.gender !== genderFilter) return false;

      // Month Filter (createdAt)
      if (monthFilter !== 'ALL') {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        if (isNaN(d.getTime())) return false;
        const month = String(d.getMonth() + 1);
        if (month !== String(monthFilter)) return false;
      }

      // Year Filter (createdAt)
      if (yearFilter !== 'ALL') {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        if (isNaN(d.getTime())) return false;
        const year = String(d.getFullYear());
        if (year !== String(yearFilter)) return false;
      }

      return true;
    });

    // 5. Sắp xếp theo ngày tạo (Mới nhất / Cũ nhất)
    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortOrder === 'OLDEST') {
        return timeA - timeB; // Cũ nhất trước
      }
      return timeB - timeA; // Mới nhất trước (mặc định)
    });

    return list;
  }, [patients, searchTerm, genderFilter, accountFilter, monthFilter, yearFilter, sortOrder, adminMode]);

  const accountCounts = useMemo(() => ({
    total: patients.length,
    withAccount: patients.filter((patient) => Boolean(patient.userId)).length,
    withoutAccount: patients.filter((patient) => !patient.userId).length,
  }), [patients]);

  const handleAccountStatusChange = async () => {
    const patient = accountActionPatient;
    if (!patient?.userId || updatingAccountId) return;
    const shouldLock = patient.accountStatus !== 'BLOCK';
    setUpdatingAccountId(patient.userId);
    try {
      if (shouldLock) await lockUser(patient.userId);
      else await unlockUser(patient.userId);
      await fetchPatientData();
      setAccountActionPatient(null);
      toast.success(shouldLock ? 'Đã khóa tài khoản bệnh nhân' : 'Đã mở khóa tài khoản bệnh nhân');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản');
    } finally {
      setUpdatingAccountId(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ROWS_PER_PAGE) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredPatients.slice(start, start + ROWS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  // Action Button Handlers
  const handleOpenCreate = () => {
    setModalConfig({ open: true, type: 'CREATE', payload: null });
  };

  const handleOpenEdit = (patient) => {
    setModalConfig({ open: true, type: 'EDIT', payload: patient });
  };

  const handleOpenView = (patient) => {
    setModalConfig({ open: true, type: 'VIEW', payload: patient });
  };

  const handleOpenDelete = (patient) => {
    setModalConfig({ open: true, type: 'DELETE', payload: patient });
  };

  const closeActionMenu = () => setActionMenu({ anchorEl: null, patient: null });

  // Unified Save Handler for CREATE and EDIT
  const handleSaveModal = async (formData) => {
    try {
      const payloadData = toPatientPayload(formData);

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
      console.error('Error saving patient:', error);
      throw error;
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async (patient) => {
    if (patient?.id) {
      try {
        await deletePatient(patient.id);
        toast.success(`Đã xóa hồ sơ bệnh nhân ${patient.fullName}`);
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error(error?.response?.data?.message || 'Không thể xóa hồ sơ bệnh nhân');
      } finally {
        await fetchPatientData();
      }
    }
  };

  return (
    <div className="w-full px-1 space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-teal-700" size={26} />
            Quản Lý Hồ Sơ Bệnh Nhân
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Danh sách bệnh nhân, tra cứu thông tin hành chính, số điện thoại, ngày sinh và quản lý hồ sơ liên kết.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchPatientData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : 'text-slate-500'} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-[4px] bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Thêm bệnh nhân mới</span>
          </button>
        </div>
      </div>

      {adminMode && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Tổng số hồ sơ bệnh nhân</p><p className="mt-1 text-2xl font-bold text-slate-900">{accountCounts.total}</p></div>
          <div className="rounded border border-teal-200 bg-teal-50 p-4"><p className="text-xs font-semibold text-teal-700">Đã có tài khoản</p><p className="mt-1 text-2xl font-bold text-teal-800">{accountCounts.withAccount}</p></div>
          <div className="rounded border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold text-amber-700">Chưa có tài khoản</p><p className="mt-1 text-2xl font-bold text-amber-800">{accountCounts.withoutAccount}</p></div>
        </div>
      )}

      {/* 2. TAB NAVIGATION (Tab 1: Danh sách bệnh nhân | Tab 2: Hồ sơ đã liên kết) */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white rounded-t-sm px-1.5 pt-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('PATIENTS')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'PATIENTS'
            ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-sm'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-sm'
            }`}
        >
          <User size={16} className={activeTab === 'PATIENTS' ? 'text-teal-700' : 'text-slate-400'} />
          <span>Danh sách bệnh nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LINKED_PROFILES')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'LINKED_PROFILES'
            ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-sm'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-sm'
            }`}
        >
          <Link2 size={16} className={activeTab === 'LINKED_PROFILES' ? 'text-teal-700' : 'text-slate-400'} />
          <span>Hồ sơ đã liên kết</span>
        </button>
      </div>

      {/* 3. NỘI DUNG TỪNG TAB */}
      {activeTab === 'PATIENTS' && (
        <div className="space-y-4">
          {/* Filter & Search Controls */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 rounded-[4px] border border-slate-200 bg-white p-3 shadow-2xs">
            {/* Search Input */}
            <div className="relative w-full xl:w-56 xl:shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm tên, mã BN hoặc SĐT..."
                className="w-full rounded border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 min-w-0">
              {adminMode && (
                <select
                  value={accountFilter}
                  onChange={(event) => { setAccountFilter(event.target.value); setCurrentPage(1); }}
                  aria-label="Lọc theo tài khoản"
                  className="shrink-0 rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">Tất cả tài khoản</option>
                  <option value="WITH_ACCOUNT">Đã có tài khoản</option>
                  <option value="WITHOUT_ACCOUNT">Chưa có tài khoản</option>
                </select>
              )}
              {/* Lọc theo Tháng tạo */}
              <div className="flex shrink-0 items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700">
                <Calendar size={13} className="text-teal-700 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500">Tháng:</span>
                <select
                  value={monthFilter}
                  onChange={(e) => {
                    setMonthFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả tháng</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc theo Năm tạo */}
              <div className="flex shrink-0 items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700">
                <span className="text-[11px] font-semibold text-slate-500">Năm:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả năm</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      Năm {yr}
                    </option>
                  ))}
                </select>
              </div>

              {!adminMode && (
                <div className="flex shrink-0 items-center gap-1.5 rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                  <Filter size={13} className="shrink-0 text-slate-400" />
                  <select
                    value={genderFilter}
                    onChange={(event) => { setGenderFilter(event.target.value); setCurrentPage(1); }}
                    className="cursor-pointer bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">Tất cả giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
              )}

              {/* Sắp xếp Ngày tạo mới nhất / trễ nhất (cũ nhất) */}
              <div className="flex shrink-0 items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700">
                <ArrowUpDown size={13} className="text-teal-700 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500">Sắp xếp:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-teal-900 focus:outline-none cursor-pointer"
                >
                  <option value="NEWEST">Mới nhất</option>
                  <option value="OLDEST">Cũ nhất</option>
                </select>
              </div>

              {/* Reset filter button if any active */}
              {(searchTerm || monthFilter !== 'ALL' || yearFilter !== 'ALL' || genderFilter !== 'ALL' || sortOrder !== 'NEWEST' || (adminMode && accountFilter !== 'ALL')) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setMonthFilter('ALL');
                    setYearFilter('ALL');
                    setGenderFilter('ALL');
                    setAccountFilter('ALL');
                    setSortOrder('NEWEST');
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Đặt lại bộ lọc"
                >
                  <RotateCcw size={12} />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          {/* Patient Data Table */}
          <div className="rounded-[4px] border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Mã Bệnh Nhân</th>
                    <th className="px-4 py-3 whitespace-nowrap">Họ Và Tên</th>
                    <th className="px-4 py-3">Ngày Tạo</th>
                    <th className="px-4 py-3">Số Điện Thoại</th>
                    <th className="px-4 py-3">Giới Tính / Tuổi</th>
                    <th className="px-4 py-3">Địa Chỉ</th>
                    {adminMode && <th className="px-4 py-3">Tài khoản</th>}
                    <th className="px-4 py-3 text-center whitespace-nowrap w-16">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={adminMode ? 8 : 7} className="px-4 py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw size={16} className="animate-spin text-teal-600" />
                          <span>Đang tải danh sách hồ sơ bệnh nhân từ hệ thống...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedPatients.length > 0 ? (
                    paginatedPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-teal-50/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-teal-800 whitespace-nowrap">
                          {p.patientCode}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2 min-w-max">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white font-bold text-xs shrink-0">
                              {(p.fullName || 'B').charAt(0)}
                            </div>
                            <span>{p.fullName}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar size={13} className="text-teal-600 shrink-0" />
                            <span>{formatDate(p.createdAt)}</span>
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

                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                          {p.address}
                        </td>

                        {adminMode && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`rounded px-2 py-1 text-[11px] font-bold ${!p.userId ? 'bg-slate-100 text-slate-600' : p.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {!p.userId ? 'Chưa có TK' : p.accountStatus === 'ACTIVE' ? '● Active' : p.accountStatus === 'BLOCK' ? '● Inactive (bị khóa)' : '● Inactive'}
                            </span>
                          </td>
                        )}

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(event) => setActionMenu({ anchorEl: event.currentTarget, patient: p })}
                            aria-label={`Thao tác với ${p.fullName}`}
                            aria-haspopup="menu"
                            aria-expanded={actionMenu.patient?.id === p.id ? true : undefined}
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={adminMode ? 8 : 7} className="px-4 py-8 text-center text-slate-400">
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
        </div>
      )}

      {/* TAB 2: HỒ SƠ ĐÃ LIÊN KẾT (DỮ LIỆU THẬT) */}
      {activeTab === 'LINKED_PROFILES' && (
        <EmployeeLinkedProfile />
      )}

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={closeActionMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { handleOpenView(actionMenu.patient); closeActionMenu(); }} className="!text-xs !gap-2">
          <Eye size={15} /> Xem chi tiết
        </MenuItem>
        <MenuItem onClick={() => { handleOpenEdit(actionMenu.patient); closeActionMenu(); }} className="!text-xs !gap-2">
          <Edit size={15} /> Chỉnh sửa
        </MenuItem>
        {adminMode && (
          <MenuItem
            disabled={!actionMenu.patient?.userId || Boolean(updatingAccountId)}
            onClick={() => { setAccountActionPatient(actionMenu.patient); closeActionMenu(); }}
            className="!text-xs !gap-2"
          >
            {actionMenu.patient?.accountStatus === 'BLOCK' ? <LockKeyholeOpen size={15} /> : <LockKeyhole size={15} />}
            {!actionMenu.patient?.userId ? 'Chưa có tài khoản' : actionMenu.patient.accountStatus === 'BLOCK' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          </MenuItem>
        )}
        <MenuItem onClick={() => { handleOpenDelete(actionMenu.patient); closeActionMenu(); }} className="!text-xs !gap-2 !text-rose-700">
          <Trash2 size={15} /> Xóa hồ sơ
        </MenuItem>
      </Menu>

      <Dialog
        open={Boolean(accountActionPatient)}
        onClose={() => { if (!updatingAccountId) setAccountActionPatient(null); }}
        maxWidth="xs"
        fullWidth
        aria-labelledby="patient-account-confirm-title"
      >
        <div className="p-5 sm:p-6">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${accountActionPatient?.accountStatus === 'BLOCK' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
            {accountActionPatient?.accountStatus === 'BLOCK' ? <LockKeyholeOpen size={22} /> : <LockKeyhole size={22} />}
          </div>
          <h2 id="patient-account-confirm-title" className="text-lg font-bold text-slate-900">
            {accountActionPatient?.accountStatus === 'BLOCK' ? 'Mở khóa tài khoản bệnh nhân' : 'Khóa tài khoản bệnh nhân'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {accountActionPatient?.accountStatus === 'BLOCK' ? 'Mở khóa tài khoản của ' : 'Khóa tài khoản của '}
            <strong className="text-slate-900">{accountActionPatient?.fullName}</strong>
            {accountActionPatient?.patientCode ? ` (${accountActionPatient.patientCode})` : ''}?
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {accountActionPatient?.accountStatus === 'BLOCK'
              ? 'Bệnh nhân sẽ có thể đăng nhập lại sau khi mở khóa.'
              : 'Bệnh nhân sẽ không thể đăng nhập khi tài khoản bị khóa.'}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAccountActionPatient(null)}
              disabled={Boolean(updatingAccountId)}
              className="rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAccountStatusChange}
              disabled={Boolean(updatingAccountId)}
              className="rounded bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {updatingAccountId ? 'Đang xử lý...' : accountActionPatient?.accountStatus === 'BLOCK' ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* ========================================================================= */}
      {/* UNIFIED REUSABLE PATIENT MODAL (CREATE, EDIT, VIEW, DELETE) */}
      {/* ========================================================================= */}
      <PatientModal
        open={modalConfig.open}
        type={modalConfig.type}
        payload={modalConfig.payload}
        onClose={() => setModalConfig({ open: false, type: 'CREATE', payload: null })}
        onSave={handleSaveModal}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Menu, MenuItem } from '@mui/material';
import toast from 'react-hot-toast';
import AddEmployeeModal from '../../components/ui/AddEmployeeModal';
import EditEmployeeModal from '../../components/ui/EditEmployeeModal';
import { getEmployeesList, getEmployeeStats } from '../../services/employee.service';
import { getBranches } from '../../services/clinic.service';
import { lockUser, unlockUser } from '../../services/user.service';
import { RoleBadge, StatusDot } from './EmployeeBadges';
import EmployeeDetailPanel from './EmployeeDetailPanel';
import { mapEmployeeFromApi, calcStatsFromEmployees, ROLE_OPTIONS } from './employeeHelpers';

const USE_MOCK_DATA = false;

function StatCard({ title, value, subtitle, icon: Icon, gradient, border, iconBg, iconColor, valueColor, badge }) {
  return (
    <div className={`flex-1 rounded-[4px] border ${border} bg-gradient-to-br ${gradient} p-4 sm:p-4.5 shadow-2xs relative overflow-hidden transition-all duration-150 hover:shadow-xs`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] ${iconBg} shadow-2xs`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
            <p className={`text-xl sm:text-2xl font-black ${valueColor} tracking-tight`}>{value}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>
        {badge && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10.5px] font-bold bg-white/90 border border-slate-300 text-slate-700 shadow-2xs">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function EmployeeAvatar({ employee }) {
  const [imgError, setImgError] = useState(false);
  const initials = useMemo(() => {
    const raw = (employee.name || employee.fullName || '').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (raw[0] || 'NV').toUpperCase();
  }, [employee.name, employee.fullName]);

  const hasAvatar = employee.avatar && !employee.avatar.includes('ui-avatars.com');

  if (!imgError && hasAvatar) {
    return (
      <img
        src={employee.avatar}
        alt=""
        onError={() => setImgError(true)}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs shrink-0"
      />
    );
  }

  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-800 via-teal-700 to-emerald-600 text-white font-black text-xs flex items-center justify-center ring-2 ring-teal-100 shadow-2xs shrink-0 tracking-wider select-none">
      {initials}
    </div>
  );
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, locked: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // UI State
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // MUI Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuEmployee, setMenuEmployee] = useState(null);

  const handleOpenMenu = (event, emp) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuEmployee(emp);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuEmployee(null);
  };

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      let mappedEmployees = [];
      let statsData = null;

      if (USE_MOCK_DATA) {
        mappedEmployees = [];
        statsData = calcStatsFromEmployees(mappedEmployees);
      } else {
        const [listData, apiStats, branchData] = await Promise.all([
          getEmployeesList(),
          getEmployeeStats().catch(() => null),
          getBranches().catch(() => []),
        ]);
        mappedEmployees = (listData || []).map((emp) => mapEmployeeFromApi(emp));
        statsData = apiStats;
        if (Array.isArray(branchData)) {
          setBranches(branchData);
        }
      }

      setEmployees(mappedEmployees);
      setStats({
        total: statsData?.total ?? mappedEmployees.length,
        active: statsData?.active ?? mappedEmployees.filter((e) => e.displayStatus === 'active' || e.displayStatus === 'Hoạt động').length,
        locked: statsData?.blocked ?? statsData?.locked ?? mappedEmployees.filter((e) => e.displayStatus === 'locked' || e.displayStatus === 'Bị khóa').length,
        inactive: statsData?.inactive ?? 0,
      });

      setSelectedEmployee((prev) => {
        if (!prev) return prev;
        const updatedSelected = mappedEmployees.find((e) => e.id === prev.id);
        return updatedSelected || prev;
      });
    } catch (err) {
      setError('Không thể tải dữ liệu nhân viên. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Danh sách chi nhánh duy nhất từ API + từ danh sách nhân viên
  const branchOptions = useMemo(() => {
    const map = new Map();
    branches.forEach((b) => {
      const id = b.branchId || b.id;
      const name = b.branchName || b.name;
      if (id && name) {
        map.set(String(id), { branchId: String(id), branchName: name });
      }
    });

    employees.forEach((emp) => {
      if (emp.branchId && emp.branchName && !map.has(String(emp.branchId))) {
        map.set(String(emp.branchId), {
          branchId: String(emp.branchId),
          branchName: emp.branchName,
        });
      } else if (emp.branchName && emp.branchName !== 'Chưa phân chi nhánh') {
        const exists = Array.from(map.values()).some((item) => item.branchName === emp.branchName);
        if (!exists) {
          map.set(emp.branchName, {
            branchId: emp.branchName,
            branchName: emp.branchName,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [branches, employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !normalizedSearch ||
        (emp.name && emp.name.toLowerCase().includes(normalizedSearch)) ||
        (emp.email && emp.email.toLowerCase().includes(normalizedSearch)) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(normalizedSearch)) ||
        (emp.phone && emp.phone.replace(/\s/g, '').includes(normalizedSearch.replace(/\s/g, '')));

      const matchesStatus =
        statusFilter === 'all' ||
        emp.displayStatus === statusFilter ||
        (statusFilter === 'active' && (emp.displayStatus === 'active' || emp.displayStatus === 'Hoạt động')) ||
        (statusFilter === 'locked' && (emp.displayStatus === 'locked' || emp.displayStatus === 'Bị khóa'));

      const matchesBranch =
        branchFilter === 'all' ||
        String(emp.branchId) === String(branchFilter) ||
        emp.branchName === branchFilter;

      const matchesRole =
        roleFilter === 'all' ||
        emp.displayRole === roleFilter ||
        emp.originalRole === roleFilter;

      return matchesSearch && matchesStatus && matchesBranch && matchesRole;
    });
  }, [employees, searchTerm, statusFilter, branchFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + pageSize);

  const handleToggleLock = async (emp) => {
    if (!emp) return;
    if (!USE_MOCK_DATA && !emp?.userId) {
      toast.error('Nhân viên này chưa có tài khoản đăng nhập!');
      return;
    }

    try {
      setProcessingId(emp.id);
      const isLocked = emp.displayStatus === 'locked' || emp.displayStatus === 'Bị khóa';

      if (!USE_MOCK_DATA) {
        if (isLocked) {
          await unlockUser(emp.userId);
        } else {
          await lockUser(emp.userId);
        }
      }

      const updatedList = employees.map((e) => {
        if (e.id === emp.id) {
          return {
            ...e,
            displayStatus: isLocked ? 'active' : 'locked',
            statusUser: isLocked ? 'ACTIVE' : 'BLOCK',
          };
        }
        return e;
      });

      setEmployees(updatedList);

      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee((prev) => ({
          ...prev,
          displayStatus: isLocked ? 'active' : 'locked',
          statusUser: isLocked ? 'ACTIVE' : 'BLOCK',
        }));
      }

      setStats((prev) => {
        const isNowLocked = !isLocked;
        return {
          ...prev,
          active: Math.max(0, prev.active + (isNowLocked ? -1 : 1)),
          locked: Math.max(0, prev.locked + (isNowLocked ? 1 : -1)),
        };
      });

      if (!USE_MOCK_DATA) await fetchData(false);
      toast.success(isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
    } catch (err) {
      console.error(err);
      toast.error('Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetail = (emp) => {
    setSelectedEmployee(emp);
    setIsDetailOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
  };

  const activePercent = stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% tổng số` : '0%';
  const lockedPercent = stats.total > 0 ? `${Math.round((stats.locked / stats.total) * 100)}% tổng số` : '0%';

  return (
    <div className="space-y-5">
      {/* Thống kê chuẩn thương hiệu Crown Dental ERP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng số tài khoản"
          value={stats.total}
          subtitle="Nhân sự toàn hệ thống"
          icon={Users}
          gradient="from-teal-500/10 via-white to-emerald-50/20"
          border="border-teal-200/80"
          iconBg="bg-gradient-to-tr from-teal-800 to-teal-600 text-white"
          iconColor="text-white"
          valueColor="text-teal-950"
          badge="Nhân sự ERP"
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active}
          subtitle={activePercent}
          icon={ShieldCheck}
          gradient="from-emerald-500/10 via-white to-teal-50/20"
          border="border-emerald-200/80"
          iconBg="bg-gradient-to-tr from-emerald-600 to-teal-600 text-white"
          iconColor="text-white"
          valueColor="text-emerald-700"
          badge="Khả dụng"
        />
        <StatCard
          title="Bị khóa"
          value={stats.locked}
          subtitle={lockedPercent}
          icon={Ban}
          gradient="from-rose-500/10 via-white to-orange-50/20"
          border="border-rose-200/80"
          iconBg="bg-gradient-to-tr from-rose-600 to-red-500 text-white"
          iconColor="text-white"
          valueColor="text-rose-700"
          badge="Tạm ngưng"
        />
      </div>

      {/* Thanh lọc & Nút Thêm mới */}
      <div className="rounded-[4px] border border-slate-300 bg-white p-3 shadow-2xs flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, SĐT, email, mã nhân viên..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-9 pl-9 pr-3.5 rounded-[3px] border border-slate-300 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all font-medium"
          />
        </div>

        {/* Lọc theo Chi nhánh */}
        <div className="relative">
          <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 pl-8 pr-7 rounded-[3px] border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer transition-all"
          >
            <option value="all">Tất cả chi nhánh ({branchOptions.length})</option>
            {branchOptions.map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.branchName}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 px-3 rounded-[3px] border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer transition-all"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>

        {/* Lọc theo Vai trò */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 px-3 rounded-[3px] border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer transition-all"
        >
          <option value="all">Tất cả vai trò</option>
          {ROLE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Reset filter nếu có chọn */}
        {(searchTerm || branchFilter !== 'all' || statusFilter !== 'all' || roleFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setBranchFilter('all');
              setStatusFilter('all');
              setRoleFilter('all');
              setCurrentPage(1);
            }}
            className="h-9 px-2.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
            title="Xóa bộ lọc"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </button>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[3px] bg-teal-800 hover:bg-teal-900 px-3.5 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </button>
      </div>

      {/* Main Content Area - Full-width ERP Table */}
      <div className="rounded-[4px] border border-slate-300 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-800" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Danh sách nhân viên</h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-[2px]">
            {filteredEmployees.length} nhân viên
          </span>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto max-h-[calc(100vh-310px)] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100 shadow-xs z-10 border-b border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200 w-12">#</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">Mã nhân viên</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">Nhân viên</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">Ngày vào làm</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">Vai trò</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">Chi nhánh</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-800 uppercase tracking-wide border-r border-slate-200">Trạng thái tài khoản</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-800 uppercase tracking-wide w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-500 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-teal-800" />
                      <span>Đang tải danh sách nhân viên...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-500 font-medium">
                    Không tìm thấy nhân viên phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, index) => {
                  return (
                    <tr
                      key={emp.id}
                      onDoubleClick={() => handleViewDetail(emp)}
                      className="transition-colors hover:bg-teal-50/40 bg-white cursor-pointer select-none"
                      title="Nhấp đúp để xem chi tiết nhân viên"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500 font-bold border-r border-slate-100">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-[2px] border border-teal-300 inline-block shadow-2xs">
                          {emp.employeeCode || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-3">
                          <EmployeeAvatar employee={emp} />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-xs truncate">{emp.name || 'Chưa cập nhật'}</p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{emp.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-semibold border-r border-slate-100">{emp.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium border-r border-slate-100">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-slate-400" />
                          {formatDate(emp.createdAt || emp.hireDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <RoleBadge role={emp.displayRole} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-semibold border-r border-slate-100 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-800">
                          <Building2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                          <span>{emp.branchName || 'Chưa phân chi nhánh'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <StatusDot status={emp.displayStatus} />
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, emp)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-[3px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-colors cursor-pointer"
                          title="Tùy chọn"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang ERP góc nhọn */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/60 gap-3">
          <p className="text-xs text-slate-600 font-medium">
            Hiển thị <span className="font-bold text-slate-800">{filteredEmployees.length === 0 ? 0 : startIndex + 1}</span> đến{' '}
            <span className="font-bold text-slate-800">
              {Math.min(startIndex + pageSize, filteredEmployees.length)}
            </span>{' '}
            của <span className="font-bold text-teal-800">{filteredEmployees.length}</span> nhân viên
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-[3px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`h-7 w-7 rounded-[3px] text-xs font-bold transition-colors cursor-pointer border ${currentPage === idx + 1
                      ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-[3px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 rounded-[3px] border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Menu (Render qua MUI Portal) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            elevation: 2,
            sx: {
              borderRadius: '3px',
              mt: 0.5,
              minWidth: 170,
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            handleViewDetail(menuEmployee);
            handleCloseMenu();
          }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 py-2 px-3 hover:bg-slate-50"
        >
          <Eye className="w-4 h-4 text-teal-700" />
          Xem chi tiết
        </MenuItem>
        <MenuItem
          onClick={() => {
            setEditEmployee(menuEmployee);
            setIsEditModalOpen(true);
            handleCloseMenu();
          }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 py-2 px-3 hover:bg-slate-50"
        >
          <Pencil className="w-4 h-4 text-emerald-600" />
          Cập nhật thông tin
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleToggleLock(menuEmployee);
            handleCloseMenu();
          }}
          disabled={processingId === menuEmployee?.id}
          className="flex items-center gap-2 text-xs font-semibold text-rose-600 py-2 px-3 hover:bg-rose-50"
        >
          <LockKeyhole className="w-4 h-4 text-rose-500" />
          {menuEmployee?.displayStatus === 'locked' || menuEmployee?.displayStatus === 'Bị khóa'
            ? 'Mở khóa tài khoản'
            : 'Khóa tài khoản'}
        </MenuItem>
      </Menu>

      {/* Employee Detail Slide-in Panel */}
      <EmployeeDetailPanel
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        employee={selectedEmployee}
        onEdit={(emp) => {
          setEditEmployee(emp);
          setIsEditModalOpen(true);
        }}
        onToggleLock={handleToggleLock}
        processing={processingId === selectedEmployee?.id}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          await fetchData(false);
          setIsAddModalOpen(false);
        }}
      />

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditEmployee(null);
        }}
        onSuccess={async () => {
          await fetchData(false);
          setIsEditModalOpen(false);
        }}
        employee={editEmployee}
      />
    </div>
  );
}

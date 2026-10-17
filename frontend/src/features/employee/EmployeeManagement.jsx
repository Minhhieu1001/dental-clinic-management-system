import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Menu, MenuItem } from '@mui/material';
import toast from 'react-hot-toast';
import AddEmployeeModal from '../../components/ui/AddEmployeeModal';
import EditEmployeeModal from '../../components/ui/EditEmployeeModal';
import { getEmployeesList, getEmployeeStats } from '../../services/employee.service';
import { RoleBadge, StatusDot } from './EmployeeBadges';
import EmployeeDetailPanel from './EmployeeDetailPanel';
import { mapEmployeeFromApi, calcStatsFromEmployees } from './employeeHelpers';

const USE_MOCK_DATA = false;

function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-[12px] text-slate-500 font-medium">{title}</p>
          <p className={`text-xl font-extrabold ${valueColor}`}>{value}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, locked: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
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

  // MUI Menu State (Cho nút 3 chấm)
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
      let mappedEmployees;
      let statsData;

      if (USE_MOCK_DATA) {
        mappedEmployees = [];
        statsData = calcStatsFromEmployees(mappedEmployees);
      } else {
        const [listData, apiStats] = await Promise.all([getEmployeesList(), getEmployeeStats()]);
        mappedEmployees = listData.map((emp) => mapEmployeeFromApi(emp));
        statsData = apiStats;
      }

      setEmployees(mappedEmployees);
      setStats({
        total: statsData?.total || 0,
        active: statsData?.active || 0,
        locked: statsData?.blocked || statsData?.locked || 0,
        inactive: statsData?.inactive || 0,
      });

      // Cập nhật dữ liệu nhân viên đang xem chi tiết (nếu có)
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

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !normalizedSearch ||
        (emp.name && emp.name.toLowerCase().includes(normalizedSearch)) ||
        (emp.email && emp.email.toLowerCase().includes(normalizedSearch)) ||
        (emp.phone && emp.phone.replace(/\s/g, '').includes(normalizedSearch.replace(/\s/g, '')));

      const matchesStatus = statusFilter === 'all' || emp.displayStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

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
        const { lockUser, unlockUser } = await import('../../services/user.service');
        if (isLocked) {
          await unlockUser(emp.userId);
        } else {
          await lockUser(emp.userId);
        }
      }

      // Optimistic update
      const updatedList = employees.map((e) => {
        if (e.id === emp.id) {
          return {
            ...e,
            displayStatus: isLocked ? 'Hoạt động' : 'Bị khóa',
            statusUser: isLocked ? 'ACTIVE' : 'BLOCK',
          };
        }
        return e;
      });

      setEmployees(updatedList);

      // Update selectedEmployee state if currently open
      if (selectedEmployee?.id === emp.id) {
        setSelectedEmployee((prev) => ({
          ...prev,
          displayStatus: isLocked ? 'Hoạt động' : 'Bị khóa',
          statusUser: isLocked ? 'ACTIVE' : 'BLOCK',
        }));
      }

      // Update stats optimistically
      setStats((prev) => {
        const isNowLocked = !isLocked;
        return {
          ...prev,
          active: Math.max(0, prev.active + (isNowLocked ? -1 : 1)),
          locked: Math.max(0, prev.locked + (isNowLocked ? 1 : -1)),
        };
      });

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
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng số tài khoản"
          value={stats.total}
          subtitle="Nhân viên"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          valueColor="text-slate-900"
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active}
          subtitle="Nhân viên"
          icon={ShieldCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          valueColor="text-emerald-600"
        />
        <StatCard
          title="Bị khóa"
          value={stats.locked}
          subtitle="Nhân viên"
          icon={Ban}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          valueColor="text-amber-600"
        />
      </div>

      {/* Bộ lọc và Nút Thêm */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">Lọc theo trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Hoạt động">Đang hoạt động</option>
            <option value="Bị khóa">Bị khóa</option>
          </select>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </button>
      </div>

      {/* Main Content Area - Full-width Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-white">
          <h2 className="text-sm font-bold text-slate-800">Danh sách nhân viên</h2>
        </div>

        {/* Table container với scroll dọc cố định height */}
        <div className="overflow-x-auto max-h-[calc(100vh-310px)] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-xs z-10 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-slate-600 w-12">#</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-slate-600">Nhân viên</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-slate-600">Số điện thoại</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-slate-600">Ngày vào làm</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-slate-600">Vai trò</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-slate-600">Trạng thái tài khoản</th>
                <th className="px-5 py-3 text-center text-[12px] font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    Không tìm thấy nhân viên phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, index) => {
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => handleViewDetail(emp)}
                      className="transition-colors hover:bg-slate-50/80 bg-white cursor-pointer"
                    >
                      <td className="px-5 py-3 text-[13px] text-slate-500 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-2xs shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 text-xs truncate">{emp.name || 'Chưa cập nhật'}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{emp.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 font-medium">{emp.phone || '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-600 font-medium">{formatDate(emp.createdAt)}</td>
                      <td className="px-5 py-3">
                        <RoleBadge role={emp.displayRole} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusDot status={emp.displayStatus} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, emp)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-white">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="font-semibold text-slate-700">{startIndex + 1}</span> đến{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(startIndex + pageSize, filteredEmployees.length)}
              </span>{' '}
              của <span className="font-semibold text-slate-700">{filteredEmployees.length}</span> nhân viên
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`h-7 w-7 rounded-md text-xs font-medium transition-colors cursor-pointer ${currentPage === idx + 1
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
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
                className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none cursor-pointer"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action Menu (Render bằng MUI Portal giúp không bị overflow clipping) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            elevation: 2,
            sx: {
              borderRadius: '8px',
              mt: 0.5,
              minWidth: 160,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
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
          className="flex items-center gap-2 text-xs font-medium text-slate-700 py-2 px-3 hover:bg-slate-50"
        >
          <Eye className="w-4 h-4 text-blue-500" />
          Xem chi tiết
        </MenuItem>
        <MenuItem
          onClick={() => {
            setEditEmployee(menuEmployee);
            setIsEditModalOpen(true);
            handleCloseMenu();
          }}
          className="flex items-center gap-2 text-xs font-medium text-slate-700 py-2 px-3 hover:bg-slate-50"
        >
          <Pencil className="w-4 h-4 text-emerald-500" />
          Cập nhật thông tin
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleToggleLock(menuEmployee);
            handleCloseMenu();
          }}
          disabled={processingId === menuEmployee?.id}
          className="flex items-center gap-2 text-xs font-medium text-red-600 py-2 px-3 hover:bg-red-50"
        >
          <LockKeyhole className="w-4 h-4 text-red-500" />
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
        onSuccess={() => {
          fetchData(false);
          setIsAddModalOpen(false);
        }}
      />

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditEmployee(null);
        }}
        onSuccess={() => {
          fetchData(false);
          setIsEditModalOpen(false);
        }}
        employee={editEmployee}
      />
    </div>
  );
}
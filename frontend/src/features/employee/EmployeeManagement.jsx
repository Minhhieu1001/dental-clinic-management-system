import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Eye,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from 'lucide-react';
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
    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
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
  const [actionEmployeeId, setActionEmployeeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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

      // Update selected employee data if it is currently selected
      setSelectedEmployee((prev) => {
        if (!prev) return prev;
        const updatedSelected = mappedEmployees.find((e) => e.id === prev.id);
        // Only update if something changed (to avoid unnecessary re-renders)
        // Here we just return the new object from mappedEmployees, React handles the rest.
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
    if (!USE_MOCK_DATA && !emp?.userId) {
      toast.error('Nhân viên này chưa có tài khoản đăng nhập!');
      return;
    }

    try {
      setProcessingId(emp.id);
      const isLocked = emp.displayStatus === 'locked';

      if (!USE_MOCK_DATA) {
        const { lockUser, unlockUser } = await import('../../services/user.service');
        if (isLocked) {
          await unlockUser(emp.userId);
        } else {
          await lockUser(emp.userId);
        }
      }
      
      // Optimistic update for both mock and real API
      setEmployees(prev => prev.map(e => {
        if (e.id === emp.id) {
          return {
            ...e,
            displayStatus: isLocked ? 'active' : 'locked',
            statusUser: isLocked ? 'ACTIVE' : 'BLOCK'
          };
        }
        return e;
      }));

      // Update stats optimistically
      setStats(prev => {
        const isNowLocked = !isLocked;
        return {
          ...prev,
          active: prev.active + (isNowLocked ? -1 : 1),
          locked: prev.locked + (isNowLocked ? 1 : -1)
        };
      });

      toast.success(isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
    } catch (err) {
      console.error(err);
      toast.error('Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
      setActionEmployeeId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng số tài khoản"
          value={stats.total}
          subtitle="Nhân viên"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          valueColor="text-slate-800"
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active}
          subtitle="Nhân viên"
          icon={ShieldCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          valueColor="text-slate-800"
        />
        <StatCard
          title="Bị khóa"
          value={stats.locked}
          subtitle="Nhân viên"
          icon={Ban}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          valueColor="text-slate-800"
        />
      </div>

      {/* Main Content Area (Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Table Area */}
        <div className="lg:col-span-3 min-w-0 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[600px]">
          {/* Filters Bar */}
          <div className="border-b border-slate-100 p-4 bg-white flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">Lọc theo trạng thái</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-44 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Hoạt động">Đang hoạt động</option>
                <option value="Bị khóa">Bị khóa</option>
              </select>
            </div>

            <div className="flex-1 lg:flex-none" />

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex h-10 w-full lg:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Thêm nhân viên
            </button>
          </div>

          <div className="px-5 py-4 border-b border-slate-100 bg-white">
            <h2 className="text-base font-bold text-slate-800">Danh sách nhân viên</h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[900px]">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[13px] font-semibold text-slate-700 w-12">#</th>
                  <th className="px-5 py-3 text-left text-[13px] font-semibold text-slate-700">Nhân viên</th>
                  <th className="px-5 py-3 text-left text-[13px] font-semibold text-slate-700">Số điện thoại</th>
                  <th className="px-5 py-3 text-left text-[13px] font-semibold text-slate-700">Vai trò</th>
                  <th className="px-5 py-3 text-left text-[13px] font-semibold text-slate-700">Trạng thái tài khoản</th>
                  <th className="px-5 py-3 text-left text-[13px] font-semibold text-slate-700 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      Không tìm thấy nhân viên phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp, index) => {
                    const isActionOpen = actionEmployeeId === emp.id;
                    const showDropdownUp = index >= paginatedEmployees.length - 2 && paginatedEmployees.length > 2;
                    const isSelected = selectedEmployee?.id === emp.id;

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80 bg-white'}`}
                      >
                        <td className="px-5 py-3 text-[13px] text-slate-500">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 text-[13px] truncate">{emp.name || 'Chưa cập nhật'}</p>
                              <p className="text-[12px] text-slate-500 truncate mt-0.5">{emp.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-slate-600">{emp.phone || '—'}</td>
                        <td className="px-5 py-3">
                          <RoleBadge role={emp.displayRole} />
                        </td>
                        <td className="px-5 py-3">
                          <StatusDot status={emp.displayStatus} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmployee(emp);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditEmployee(emp);
                                setIsEditModalOpen(true);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionEmployeeId(isActionOpen ? null : emp.id);
                                }}
                                className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${isActionOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {isActionOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionEmployeeId(null);
                                    }}
                                  />
                                  <div
                                    className={`absolute right-0 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${showDropdownUp ? 'bottom-10 origin-bottom-right' : 'top-10 origin-top-right'}`}
                                  >
                                    <button
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditEmployee(emp);
                                        setIsEditModalOpen(true);
                                        setActionEmployeeId(null);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                      Cập nhật thông tin
                                    </button>
                                    <div className="h-px bg-slate-100 mx-2" />
                                    <button
                                      disabled={processingId === emp.id}
                                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleLock(emp);
                                        setActionEmployeeId(null);
                                      }}
                                    >
                                      <LockKeyhole className="h-3.5 w-3.5 text-red-400" />
                                      {emp.displayStatus === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
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
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-sm text-slate-500">
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
                  className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === idx + 1
                          ? 'bg-blue-600 text-white shadow-sm'
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
                  className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-600 outline-none cursor-pointer"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Detail Panel */}
        <div className="lg:col-span-1">
          <EmployeeDetailPanel
            employee={selectedEmployee}
            onEdit={(emp) => {
              setEditEmployee(emp);
              setIsEditModalOpen(true);
            }}
          />
        </div>
      </div>

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
        onSuccess={(updated) => {
          fetchData(false);
          setIsEditModalOpen(false);
        }}
        employee={editEmployee}
      />
    </div>
  );
}
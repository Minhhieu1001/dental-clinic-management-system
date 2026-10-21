// ... existing imports ...
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, BarChart3, CalendarDays, ChevronLeft, ChevronRight, Eye, Loader2, LockKeyhole, MoreVertical, Pencil, Plus, Search, ShieldCheck, TrendingUp, UserRound, Users, } from 'lucide-react';
import { Menu, MenuItem } from '@mui/material';
import toast from 'react-hot-toast';
import AddDentistModal from '../../components/ui/AddDentistModal';
import EditDentistModal from '../../components/ui/EditDentistModal';
import { getDentistsList, getDentistStats } from '../../services/dentist.service';
import { USE_MOCK_DATA, calcStatsFromDentists, fetchMockDentistData, } from './dentistMockData';
import { DentistStatusDot, SpecialtyBadge } from './DentistBadges';
import DentistDetailPanel from './DentistDetailPanel';
import { SHIFT_OPTIONS, CERTIFICATE_TYPE_OPTIONS, calcPercent, mapDentistFromApi, } from './dentistHelpers';
import { lockUser, unlockUser } from '../../services/user.service';

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


export default function DentistManagement() {
    const [dentists, setDentists] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0, blocked: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [specialtyFilter, setSpecialtyFilter] = useState('all');
    const [shiftFilter, setShiftFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);

    // UI State
    const [selectedDentistId, setSelectedDentistId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editDentist, setEditDentist] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    // MUI Menu State (Cho nút 3 chấm)
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuDentist, setMenuDentist] = useState(null);

    const handleOpenMenu = (event, dentist) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuDentist(dentist);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuDentist(null);
    };

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            let mappedDentists;
            let statsData;

            if (USE_MOCK_DATA) {
                const mock = await fetchMockDentistData(350);
                mappedDentists = mock.dentists;
                statsData = mock.stats;
            } else {
                const [listData, apiStats] = await Promise.all([getDentistsList(), getDentistStats()]);
                mappedDentists = listData.map((dentist, index) => mapDentistFromApi(dentist, index));
                statsData = apiStats;
            }

            setDentists(mappedDentists);
            setStats({
                total: statsData?.total || 0,
                active: statsData?.active || 0,
                onLeave: statsData?.onLeave || 0,
                blocked: statsData?.blocked || 0,
            });
        } catch (err) {
            setError('Không thể tải dữ liệu bác sĩ. Vui lòng thử lại sau.');
            console.error(err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredDentists = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return dentists.filter((dentist) => {
            const matchesSearch =
                !normalizedSearch ||
                (dentist.name && dentist.name.toLowerCase().includes(normalizedSearch)) ||
                (dentist.email && dentist.email.toLowerCase().includes(normalizedSearch)) ||
                (dentist.phone && dentist.phone.replace(/\s/g, '').includes(normalizedSearch.replace(/\s/g, '')));

            const matchesStatus = statusFilter === 'all' || dentist.displayStatus === statusFilter;
            const matchesSpecialty =
                specialtyFilter === 'all' || (dentist.certificates || []).some(c => c.certificate_type === specialtyFilter);
            const matchesShift = shiftFilter === 'all' || dentist.shiftKey === shiftFilter;

            return matchesSearch && matchesStatus && matchesSpecialty && matchesShift;
        });
    }, [dentists, searchTerm, statusFilter, specialtyFilter, shiftFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredDentists.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedDentists = filteredDentists.slice(startIndex, startIndex + pageSize);

    const selectedDentist = dentists.find((d) => d.id === selectedDentistId);

    const handleToggleLock = async (dentist) => {
        if (!USE_MOCK_DATA && !dentist?.userId) return;

        try {
            setProcessingId(dentist.id);
            const isLocked = dentist.displayStatus === 'locked';

            if (!USE_MOCK_DATA) {

                if (isLocked) {
                    await unlockUser(dentist.userId);
                } else {
                    await lockUser(dentist.userId);
                }
            }

            const updatedDentists = dentists.map((item) =>
                item.id === dentist.id
                    ? {
                        ...item,
                        displayStatus: isLocked ? 'active' : 'locked',
                        statusUser: isLocked ? 'ACTIVE' : 'BLOCK',
                    }
                    : item
            );
            setDentists(updatedDentists);
            setStats(calcStatsFromDentists(updatedDentists));

            toast.success(isLocked ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công');
            setActionDentistId(null);
        } catch (err) {
            toast.error('Thao tác thất bại');
            console.error(err);
        } finally {
            setProcessingId(null);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const handleViewDetail = (id) => {
        setSelectedDentistId(id);
        setIsDetailOpen(true);
    };
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="space-y-5">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>
            ) : (
                <div className="flex flex-col space-y-5">
                    {/* Thống kê */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Tổng số bác sĩ"
                            value={stats.total}
                            subtitle="Bác sĩ"
                            icon={Users}
                            iconBg="bg-blue-50"
                            iconColor="text-blue-500"
                            valueColor="text-slate-900"
                        />
                        <StatCard
                            title="Đang hoạt động"
                            value={stats.active}
                            subtitle={calcPercent(stats.active, stats.total)}
                            icon={ShieldCheck}
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-500"
                            valueColor="text-emerald-600"
                        />
                        <StatCard
                            title="Bị khóa"
                            value={stats.blocked}
                            subtitle={calcPercent(stats.blocked, stats.total)}
                            icon={Ban}
                            iconBg="bg-red-50"
                            iconColor="text-red-500"
                            valueColor="text-red-600"
                        />
                    </div>

                    {/* Bộ lọc và Bảng danh sách - Full width */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                type="text"
                                placeholder="Tìm kiếm tên, email, SĐT..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
                        >
                            <option value="all">Trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="locked">Bị khóa</option>
                        </select>

                        <select
                            value={specialtyFilter}
                            onChange={(e) => {
                                setSpecialtyFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
                        >
                            <option value="all">Chuyên khoa</option>
                            {CERTIFICATE_TYPE_OPTIONS.filter(item => item.value !== 'PRACTICE_LICENSE').map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <div className="flex-1" />

                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm bác sĩ
                        </button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white shadow-2xs flex flex-col overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 bg-white shrink-0">
                            <h2 className="text-base font-bold text-slate-800">Danh sách bác sĩ</h2>
                        </div>

                        {/* Chiều cao bảng vừa màn hình, cuộn mượt khi có nhiều danh sách, tiêu đề dính sticky */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-310px)] min-h-[300px] flex-1">
                            <table className="w-full min-w-[900px]">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 w-12 bg-slate-50">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 bg-slate-50">Mã bác sĩ</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 bg-slate-50">Thông tin bác sĩ</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 bg-slate-50">Ngày sinh</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 bg-slate-50">Chuyên khoa</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 bg-slate-50">Kinh nghiệm</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 bg-slate-50">Số điện thoại</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 bg-slate-50">Trạng thái</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 w-20 bg-slate-50">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedDentists.map((dentist, index) => (
                                        <tr
                                            key={dentist.id}
                                            className="transition-colors hover:bg-slate-50/50 bg-white"
                                        >
                                            <td className="px-4 py-3 text-sm text-slate-500">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                                                    {dentist.dentistCode || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={dentist.avatar}
                                                        alt={dentist.name}
                                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 text-sm truncate">
                                                            {dentist.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate">{dentist.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{formatDate(dentist.dateOfBirth)}</td>
                                            <td className="px-4 py-3">
                                                <SpecialtyBadge labels={dentist.displaySpecializations} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{dentist.displayExperience}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{dentist.phone || '—'}</td>
                                            <td className="px-4 py-3">
                                                <DentistStatusDot status={dentist.displayStatus} compact />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleOpenMenu(e, dentist)}
                                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                                    title="Thao tác"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {paginatedDentists.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                                                Không tìm thấy bác sĩ phù hợp.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Thanh phân trang cố định dưới chân bảng */}
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-white shrink-0">
                            <p className="text-sm text-slate-400">
                                Hiển thị {filteredDentists.length === 0 ? 0 : startIndex + 1} đến{' '}
                                {Math.min(startIndex + pageSize, filteredDentists.length)} của{' '}
                                <span className="font-medium text-slate-600">{filteredDentists.length} bác sĩ</span>
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {getPageNumbers().map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === safeCurrentPage
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>

                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="ml-2 h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-600 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <option value={6}>6 / trang</option>
                                    <option value={10}>10 / trang</option>
                                    <option value={20}>20 / trang</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* Menu Thao tác xổ xuống (Dùng MUI Portal không bao giờ bị đè hay bị giấu dưới thanh cuộn) */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                    style: {
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        minWidth: '135px',
                        border: '1px solid #e2e8f0',
                        padding: '2px 0',
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        handleViewDetail(menuDentist?.id);
                        handleCloseMenu();
                    }}
                    className="text-[11px] font-medium text-slate-700 gap-2 py-1 px-2.5 hover:bg-slate-50 cursor-pointer min-h-0"
                >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    Xem chi tiết
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setEditDentist(menuDentist);
                        setIsEditModalOpen(true);
                        handleCloseMenu();
                    }}
                    className="text-[11px] font-medium text-slate-700 gap-2 py-1 px-2.5 hover:bg-slate-50 cursor-pointer min-h-0"
                >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    Chỉnh sửa
                </MenuItem>
                <div className="h-px bg-slate-100 my-0.5" />
                <MenuItem
                    onClick={() => {
                        if (menuDentist) handleToggleLock(menuDentist);
                        handleCloseMenu();
                    }}
                    className={`text-[11px] font-medium gap-2 py-1 px-2.5 cursor-pointer min-h-0 ${menuDentist?.displayStatus === 'locked' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'
                        }`}
                >
                    <LockKeyhole className="h-3.5 w-3.5" />
                    {menuDentist?.displayStatus === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}
                </MenuItem>
            </Menu>

            {/* Panel chi tiết - Render overlay */}
            <DentistDetailPanel
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                dentist={selectedDentist}
                processing={processingId === selectedDentist?.id}
                onEdit={(item) => {
                    setIsDetailOpen(false); // Đóng panel trước khi mở modal
                    setEditDentist(item);
                    setIsEditModalOpen(true);
                }}
                onToggleLock={handleToggleLock}
            />

            <AddDentistModal
                isOpen={isAddModalOpen}
                mockMode={USE_MOCK_DATA}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => fetchData(false)}
            />
            <EditDentistModal
                isOpen={isEditModalOpen}
                mockMode={USE_MOCK_DATA}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditDentist(null);
                }}
                onSuccess={(updated) => {
                    if (USE_MOCK_DATA && updated) {
                        setDentists((prev) => {
                            const next = prev.map((item) => (item.id === updated.id ? updated : item));
                            setStats(calcStatsFromDentists(next));
                            return next;
                        });
                        return;
                    }
                    fetchData(false);
                }}
                dentist={editDentist}
            />
        </div>
    );
}

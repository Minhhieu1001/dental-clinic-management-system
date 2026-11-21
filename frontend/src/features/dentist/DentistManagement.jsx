// ... existing imports ...
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Ban,
    BarChart3,
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
    Stethoscope,
    TrendingUp,
    UserRound,
    Users,
} from 'lucide-react';
import { Menu, MenuItem } from '@mui/material';
import toast from 'react-hot-toast';
import AddDentistModal from '../../components/ui/AddDentistModal';
import EditDentistModal from '../../components/ui/EditDentistModal';
import { getDentistsList, getDentistStats } from '../../services/dentist.service';
import { getBranches } from '../../services/clinic.service';
import { USE_MOCK_DATA, calcStatsFromDentists, fetchMockDentistData } from './dentistMockData';
import { DentistStatusDot, SpecialtyBadge } from './DentistBadges';
import DentistDetailPanel from './DentistDetailPanel';
import { SHIFT_OPTIONS, CERTIFICATE_TYPE_OPTIONS, calcPercent, mapDentistFromApi } from './dentistHelpers';
import { lockUser, unlockUser } from '../../services/user.service';

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

function DentistAvatar({ dentist }) {
    const [imgError, setImgError] = useState(false);
    const initials = useMemo(() => {
        const raw = (dentist.name || '').replace(/^(BS\.|ThS\.|TS\.|Bác sĩ)\s*/i, '').trim();
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return (raw[0] || 'BS').toUpperCase();
    }, [dentist.name]);

    const isCustomAvatar = dentist.avatar && !dentist.avatar.includes('ui-avatars.com');

    if (!imgError && isCustomAvatar) {
        return (
            <img
                src={dentist.avatar}
                alt={dentist.name}
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

export default function DentistManagement() {
    const [dentists, setDentists] = useState([]);
    const [branches, setBranches] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0, blocked: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [specialtyFilter, setSpecialtyFilter] = useState('all');
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
            let branchList = [];

            if (USE_MOCK_DATA) {
                const mock = await fetchMockDentistData(350);
                mappedDentists = mock.dentists;
                statsData = mock.stats;
            } else {
                const [listData, apiStats, branchData] = await Promise.all([
                    getDentistsList(),
                    getDentistStats().catch(() => null),
                    getBranches().catch(() => []),
                ]);
                mappedDentists = (listData || []).map((dentist, index) => mapDentistFromApi(dentist, index));
                statsData = apiStats || calcStatsFromDentists(mappedDentists);
                branchList = Array.isArray(branchData) ? branchData : [];
            }

            setDentists(mappedDentists);
            setBranches(branchList);
            setStats({
                total: statsData?.total ?? mappedDentists.length,
                active: statsData?.active ?? mappedDentists.filter((d) => d.displayStatus === 'active').length,
                onLeave: statsData?.onLeave ?? 0,
                blocked: statsData?.blocked ?? mappedDentists.filter((d) => d.displayStatus === 'locked').length,
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

    const branchOptions = useMemo(() => {
        const map = new Map();
        branches.forEach((b) => {
            const bId = b.branchId || b.id;
            const bName = b.branchName || b.name;
            if (bId && bName) {
                map.set(String(bId), { branchId: String(bId), branchName: bName });
            }
        });
        // Đồng bộ thêm chi nhánh từ dữ liệu bác sĩ (nếu có chi nhánh nào chưa nằm trong bảng branches)
        dentists.forEach((d) => {
            if (d.branchId && d.branchName && !map.has(String(d.branchId))) {
                map.set(String(d.branchId), { branchId: String(d.branchId), branchName: d.branchName });
            }
        });
        return Array.from(map.values());
    }, [branches, dentists]);

    const filteredDentists = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return dentists.filter((dentist) => {
            const matchesSearch =
                !normalizedSearch ||
                (dentist.name && dentist.name.toLowerCase().includes(normalizedSearch)) ||
                (dentist.email && dentist.email.toLowerCase().includes(normalizedSearch)) ||
                (dentist.dentistCode && dentist.dentistCode.toLowerCase().includes(normalizedSearch)) ||
                (dentist.phone && dentist.phone.replace(/\s/g, '').includes(normalizedSearch.replace(/\s/g, '')));

            const matchesStatus = statusFilter === 'all' || dentist.displayStatus === statusFilter;
            const matchesSpecialty =
                specialtyFilter === 'all' || (dentist.certificates || []).some((c) => c.certificate_type === specialtyFilter);
            const matchesBranch =
                branchFilter === 'all' ||
                String(dentist.branchId) === String(branchFilter) ||
                String(dentist.branchName).toLowerCase() === String(branchFilter).toLowerCase();

            return matchesSearch && matchesStatus && matchesSpecialty && matchesBranch;
        });
    }, [dentists, searchTerm, statusFilter, specialtyFilter, branchFilter]);

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

            if (!USE_MOCK_DATA) await fetchData(false);
            toast.success(isLocked ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công');
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
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="space-y-5">
            {loading ? (
                <div className="flex flex-col justify-center items-center h-64 gap-3">
                    <Loader2 className="h-9 w-9 animate-spin text-teal-600" />
                    <p className="text-sm font-semibold text-slate-500">Đang tải danh sách bác sĩ...</p>
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-2">
                    <p className="font-bold text-red-600">{error}</p>
                    <button
                        onClick={() => fetchData()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            ) : (
                <div className="flex flex-col space-y-5">
                    {/* Thống kê nổi bật chuẩn màu thương hiệu Crown Dental */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Tổng số bác sĩ"
                            value={stats.total}
                            subtitle="Bác sĩ trong toàn hệ thống"
                            icon={Users}
                            gradient="from-teal-500/10 via-white to-emerald-50/20"
                            border="border-teal-200/80"
                            iconBg="bg-gradient-to-tr from-teal-700 to-emerald-600 text-white"
                            iconColor="text-white"
                            valueColor="text-slate-900"
                            badge="Toàn hệ thống"
                        />
                        <StatCard
                            title="Đang hoạt động"
                            value={stats.active}
                            subtitle={calcPercent(stats.active, stats.total)}
                            icon={ShieldCheck}
                            gradient="from-emerald-500/10 via-white to-teal-50/20"
                            border="border-emerald-200/80"
                            iconBg="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"
                            iconColor="text-white"
                            valueColor="text-emerald-700"
                            badge="Sẵn sàng khám"
                        />
                        <StatCard
                            title="Bị khóa"
                            value={stats.blocked}
                            subtitle={calcPercent(stats.blocked, stats.total)}
                            icon={Ban}
                            gradient="from-rose-500/10 via-white to-orange-50/20"
                            border="border-rose-200/80"
                            iconBg="bg-gradient-to-tr from-rose-600 to-red-500 text-white"
                            iconColor="text-white"
                            valueColor="text-rose-700"
                            badge="Tạm ngưng"
                        />
                    </div>

                    {/* Bộ lọc và Bảng danh sách */}
                    <div className="rounded-[4px] border border-slate-300 bg-white p-3 shadow-2xs flex flex-wrap items-center gap-2.5">
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                type="text"
                                placeholder="Tìm kiếm tên, email, SĐT, mã BS..."
                                className="w-full h-9 pl-9 pr-3.5 rounded-[3px] border border-slate-300 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all font-medium"
                            />
                        </div>

                        {/* Thanh lọc theo Chi nhánh */}
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

                        {/* Thanh lọc theo Trạng thái */}
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

                        {/* Thanh lọc theo Chuyên khoa */}
                        <select
                            value={specialtyFilter}
                            onChange={(e) => {
                                setSpecialtyFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-9 px-3 rounded-[3px] border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer transition-all"
                        >
                            <option value="all">Tất cả chuyên khoa</option>
                            {CERTIFICATE_TYPE_OPTIONS.filter((item) => item.value !== 'PRACTICE_LICENSE').map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        <div className="flex-1" />

                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[3px] bg-teal-800 hover:bg-teal-900 px-4 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
                        >
                            <Plus className="h-4 w-4 stroke-[2.5]" />
                            <span>Thêm bác sĩ</span>
                        </button>
                    </div>

                    <div className="rounded-[4px] border border-slate-300 bg-white shadow-none flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-300 bg-slate-50 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Danh sách bác sĩ</h2>
                                <span className="px-2 py-0.5 rounded-[2px] text-[11px] font-bold bg-teal-50 text-teal-900 border border-teal-300">
                                    {filteredDentists.length} bác sĩ
                                </span>
                            </div>
                            {(searchTerm || statusFilter !== 'all' || specialtyFilter !== 'all' || branchFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setSpecialtyFilter('all');
                                        setBranchFilter('all');
                                        setCurrentPage(1);
                                    }}
                                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Đặt lại bộ lọc</span>
                                </button>
                            )}
                        </div>

                        {/* Chiều cao bảng vừa màn hình, cuộn mượt khi có nhiều danh sách, tiêu đề dính sticky */}
                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-310px)] min-h-[300px] flex-1">
                            <table className="w-full min-w-[1000px] border-collapse text-xs">
                                <thead className="bg-slate-100 border-b border-slate-300 sticky top-0 z-10 shadow-2xs">
                                    <tr className="text-slate-800 font-bold text-[11px] uppercase tracking-wide">
                                        <th className="px-3 py-2.5 text-center w-12 border-r border-slate-200">#</th>
                                        <th className="px-3.5 py-2.5 text-left border-r border-slate-200 whitespace-nowrap">Mã bác sĩ</th>
                                        <th className="px-3.5 py-2.5 text-left border-r border-slate-200 min-w-[200px]">Thông tin bác sĩ</th>
                                        <th className="px-3.5 py-2.5 text-left border-r border-slate-200 whitespace-nowrap">Chi nhánh</th>
                                        <th className="px-3.5 py-2.5 text-left border-r border-slate-200 whitespace-nowrap">Chuyên khoa</th>
                                        <th className="px-3.5 py-2.5 text-left border-r border-slate-200 whitespace-nowrap">Số điện thoại</th>
                                        <th className="px-3.5 py-2.5 text-left border-r border-slate-200 whitespace-nowrap">Ngày tạo</th>
                                        <th className="px-3.5 py-2.5 text-center border-r border-slate-200 whitespace-nowrap">Trạng thái</th>
                                        <th className="px-3 py-2.5 text-center w-16">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {paginatedDentists.map((dentist, index) => (
                                        <tr
                                            key={dentist.id}
                                            onDoubleClick={() => handleViewDetail(dentist.id)}
                                            className="transition-colors hover:bg-teal-50/40 bg-white cursor-pointer select-none"
                                            title="Nhấp đúp để xem chi tiết bác sĩ"
                                        >
                                            <td className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 border-r border-slate-100">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="px-3.5 py-2.5 whitespace-nowrap border-r border-slate-100">
                                                <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-[2px] border border-teal-300 inline-block shadow-2xs">
                                                    {dentist.dentistCode || '—'}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-2.5 border-r border-slate-100">
                                                <div className="flex items-center gap-2.5">
                                                    <DentistAvatar dentist={dentist} />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 text-xs truncate">
                                                            {dentist.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 truncate">{dentist.email || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5 whitespace-nowrap border-r border-slate-100">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700">
                                                    <Building2 className="h-3 w-3 text-teal-700 shrink-0" />
                                                    <span className="truncate max-w-[160px]" title={dentist.branchName || 'Chưa phân chi nhánh'}>
                                                        {dentist.branchName || 'Chưa phân chi nhánh'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5 border-r border-slate-100">
                                                <SpecialtyBadge labels={dentist.displaySpecializations} />
                                            </td>
                                            <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-slate-700 font-mono font-medium border-r border-slate-100">
                                                {dentist.phone || '—'}
                                            </td>
                                            <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-slate-600 border-r border-slate-100">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <CalendarDays className="h-3 w-3 text-slate-400 shrink-0" />
                                                    <span>{formatDate(dentist.createdAt) || dentist.displayCreatedAt || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5 text-center whitespace-nowrap border-r border-slate-100">
                                                <DentistStatusDot status={dentist.displayStatus} />
                                            </td>
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleOpenMenu(e, dentist)}
                                                    className="h-7 w-7 inline-flex items-center justify-center rounded-[3px] text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                                    title="Thao tác"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {paginatedDentists.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-14 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <Users className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                                                    <p className="font-semibold text-slate-600 text-xs">Không tìm thấy bác sĩ phù hợp.</p>
                                                    <p className="text-[11px] text-slate-400">Vui lòng thử thay đổi từ khóa hoặc bộ lọc chi nhánh, trạng thái.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Thanh phân trang cố định dưới chân bảng */}
                        <div className="flex items-center justify-between border-t border-slate-300 px-4 py-2.5 bg-slate-50 shrink-0">
                            <p className="text-xs text-slate-600 font-medium">
                                Hiển thị {filteredDentists.length === 0 ? 0 : startIndex + 1} đến{' '}
                                {Math.min(startIndex + pageSize, filteredDentists.length)} của{' '}
                                <span className="font-bold text-slate-900">{filteredDentists.length} bác sĩ</span>
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="h-7 w-7 flex items-center justify-center rounded-[3px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>

                                {getPageNumbers().map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-7 w-7 flex items-center justify-center rounded-[3px] text-xs font-bold transition-colors cursor-pointer ${
                                            page === safeCurrentPage
                                                ? 'bg-teal-800 text-white border border-teal-900 shadow-2xs'
                                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="h-7 w-7 flex items-center justify-center rounded-[3px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>

                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="ml-2 h-7 rounded-[3px] border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
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
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        minWidth: '140px',
                        border: '1px solid #e2e8f0',
                        padding: '4px 0',
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        handleViewDetail(menuDentist?.id);
                        handleCloseMenu();
                    }}
                    className="text-xs font-semibold text-slate-700 gap-2.5 py-1.5 px-3 hover:bg-teal-50/60 cursor-pointer min-h-0"
                >
                    <Eye className="h-4 w-4 text-teal-600" />
                    Xem chi tiết
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setEditDentist(menuDentist);
                        setIsEditModalOpen(true);
                        handleCloseMenu();
                    }}
                    className="text-xs font-semibold text-slate-700 gap-2.5 py-1.5 px-3 hover:bg-teal-50/60 cursor-pointer min-h-0"
                >
                    <Pencil className="h-4 w-4 text-teal-600" />
                    Chỉnh sửa
                </MenuItem>
                <div className="h-px bg-slate-100 my-1" />
                <MenuItem
                    onClick={() => {
                        if (menuDentist) handleToggleLock(menuDentist);
                        handleCloseMenu();
                    }}
                    className={`text-xs font-semibold gap-2.5 py-1.5 px-3 cursor-pointer min-h-0 ${
                        menuDentist?.displayStatus === 'locked' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'
                    }`}
                >
                    <LockKeyhole className="h-4 w-4" />
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
                    return fetchData(false);
                }}
                dentist={editDentist}
            />
        </div>
    );
}

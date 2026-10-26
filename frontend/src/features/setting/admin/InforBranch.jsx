import { useState, useMemo } from 'react';
import {
    Building2,
    Plus,
    Search,
    Filter,
    MapPin,
    Phone,
    Mail,
    Clock,
    Edit3,
    Trash2,
    Star,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    Check,
    Sparkles,
    Layers,
} from 'lucide-react';

export default function InforBranch({
    branches = [],
    onOpenAddModal,
    onOpenEditModal,
    onDeleteBranch,
    onToggleStatus,
    canCreateBranch = true,
    isProcessing = false,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Filtered branches
    const filteredBranches = useMemo(() => {
        return branches.filter((branch) => {
            const matchSearch =
                (branch.branchName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (branch.branchCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (branch.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (branch.phoneNumber || '').includes(searchQuery);

            const matchStatus =
                statusFilter === 'ALL' || (branch.status || 'ACTIVE') === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [branches, searchQuery, statusFilter]);

    const totalCount = branches.length;
    const activeCount = branches.filter((b) => b.status === 'ACTIVE').length;
    const totalChairs = branches.reduce((sum, b) => sum + (Number(b.dentalChairs) || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header bar & Search toolbar - Chữ vừa vặn, gọn gàng */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
                <div>
                </div>

                {/* Action button */}
                <button
                    type="button"
                    onClick={onOpenAddModal}
                    disabled={!canCreateBranch || isProcessing}
                    title={!canCreateBranch ? 'Vui lòng tạo phòng khám trước khi thêm chi nhánh' : 'Thêm chi nhánh mới'}
                    className={`inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all self-start sm:self-auto ${canCreateBranch
                        ? 'bg-teal-700 hover:bg-teal-800 active:scale-95 cursor-pointer'
                        : 'bg-slate-400 opacity-50 cursor-not-allowed'
                        }`}
                >
                    <Plus size={15} />
                    <span>Thêm Chi Nhánh Mới</span>
                </button>
            </div>

            {/* Search & Filter row */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                <div className="relative flex-1 max-w-sm">
                    <input
                        type="text"
                        placeholder="Tìm theo tên cơ sở, mã CN, địa chỉ, hotline..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none shadow-2xs focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 transition-all font-medium"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 flex items-center gap-1">
                        <Filter size={13} /> Lọc:
                    </span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none shadow-2xs focus:border-teal-700 cursor-pointer"
                    >
                        <option value="ALL">Tất cả ({totalCount})</option>
                        <option value="ACTIVE">Hoạt động ({activeCount})</option>
                        <option value="MAINTENANCE">Bảo trì ({totalCount - activeCount})</option>
                    </select>
                </div>
            </div>

            {/* BRANCH CARDS GRID - ẢNH SẠCH SẼ, MÃ VÀ TRẠNG THÁI ĐƯỢC ĐƯA XUỐNG PHẦN THÔNG TIN */}
            {filteredBranches.length === 0 ? (
                <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Building2 size={36} className="mx-auto text-slate-300" />
                    <h4 className="mt-2 text-sm font-bold text-slate-700">Không tìm thấy chi nhánh nào</h4>
                    <p className="mt-1 text-xs text-slate-500">
                        Thử nhập từ khóa khác hoặc bấm nút "Thêm Chi Nhánh Mới".
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBranches.map((branch, index) => {
                        const isActive = branch.status === 'ACTIVE';
                        const fallbackImages = [
                            'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
                            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
                            'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
                        ];
                        const defaultFallbackImage = fallbackImages[index % fallbackImages.length];
                        const imageUrl = branch.imageBranch || defaultFallbackImage;

                        return (
                            <div
                                key={branch.branchId}
                                onDoubleClick={() => onOpenEditModal(branch)}
                                className="group relative flex flex-col justify-between overflow-hidden rounded border border-slate-300 bg-white shadow-2xs transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                            >
                                <div>
                                    {/* Image Section - Ảnh sạch sẽ, không bị đè che */}
                                    <div className="relative h-44 w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                                        <img
                                            src={imageUrl}
                                            alt={branch.branchName}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => {
                                                e.currentTarget.src = defaultFallbackImage;
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                                        {/* Giờ mở cửa hiển thị nhẹ góc dưới ảnh */}
                                        <div className="absolute bottom-2 left-2.5 text-white flex items-center gap-1 text-[13px] font-medium drop-shadow-sm">
                                            <Clock size={15} className="text-teal-300" />
                                            <span>{branch.openTime || '08:00'} - {branch.closeTime || '20:00'}</span>
                                        </div>
                                    </div>

                                    {/* Body Content - MÃ CHI NHÁNH & TRẠNG THÁI ĐÃ ĐƯA XUỐNG ĐÂY */}
                                    <div className="p-3.5 space-y-2.5 text-xs text-slate-700">
                                        {/* HÀNG 1: MÃ CHI NHÁNH + TRỤ SỞ + TRẠNG THÁI (ĐƯA XUỐNG PHẦN THÔNG TIN) */}
                                        <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {/* Mã chi nhánh */}
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-extrabold text-slate-800 border border-slate-300">
                                                    {branch.branchCode}
                                                </span>

                                            </div>

                                            {/* Trạng thái hoạt động */}
                                            <span
                                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold shrink-0 ${isActive
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`}
                                                />
                                                {isActive ? 'Đang hoạt động' : 'Tạm bảo trì'}
                                            </span>
                                        </div>

                                        {/* Tên cơ sở (Chữ thu nhỏ vừa vặn) */}
                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-1">
                                            {branch.branchName}
                                        </h4>

                                        {/* Địa chỉ cơ sở */}
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <MapPin size={14} className="mt-0.5 shrink-0 text-teal-700" />
                                            <span className="line-clamp-2 leading-relaxed text-[11px] text-slate-700">
                                                {branch.address}
                                            </span>
                                        </div>

                                        {/* Hotline & Email */}
                                        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                <Phone size={13} className="shrink-0 text-teal-700 mb-3.5" />
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Hotline</p>
                                                    <p className="font-bold text-slate-900">{branch.phoneNumber}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Mail size={13} className="shrink-0 text-teal-700 mb-3.5" />
                                                <div className="overflow-hidden">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                                                    <p className="font-medium text-slate-600 truncate" title={branch.email}>
                                                        {branch.email || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quy mô số ghế điều trị và thao tác */}
                                        <div className="flex items-center justify-between gap-2 rounded bg-slate-50 p-2 border border-slate-200 text-[11px]">
                                            <div>
                                                <span className="font-semibold text-slate-600">Quy mô điều trị:</span>
                                                <span className="ml-2 rounded bg-teal-100 px-2 py-0.5 font-bold text-teal-900 border border-teal-200">
                                                    {branch.dentalChairs || 8} Ghế Khám
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenEditModal(branch)}
                                                    disabled={isProcessing}
                                                    className="rounded border border-slate-300 p-1 text-slate-600 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 transition-colors cursor-pointer"
                                                    title="Chỉnh sửa chi nhánh"
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteBranch(branch.branchId)}
                                                    disabled={isProcessing}
                                                    className="rounded border border-slate-300 p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                                                    title="Xóa chi nhánh"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

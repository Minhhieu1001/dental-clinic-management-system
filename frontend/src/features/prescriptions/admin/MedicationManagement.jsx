import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Pill,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Building2,
  DollarSign,
  Download,
  Power,
  X,
  PackageCheck,
  PackageX,
  CalendarClock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMedicines,
  createMedicine,
  updateMedicine,
  updateMedicineStatus,
  deleteMedicine,
  getDistinctUnits,
  getMedicineSummary,
} from '../../../services/medicine.service.js';
import MedicineModal from '../action/MedicineModal.jsx';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

// Format tiền tệ VNĐ
const formatCurrency = (amount) => {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Format ngày tháng DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
};

// Tính toán trạng thái hạn sử dụng
const calculateExpiryStatus = (expiryDateStr) => {
  if (!expiryDateStr) return { label: 'Không có HSD', type: 'none', days: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Đã hết hạn', type: 'expired', days: diffDays };
  }
  if (diffDays <= 60) {
    return { label: `Cận hạn (${diffDays} ngày)`, type: 'warning', days: diffDays };
  }
  return { label: `Còn ${diffDays} ngày`, type: 'good', days: diffDays };
};

export default function MedicationManagement() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW' | 'OUT'
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [availableUnits, setAvailableUnits] = useState([]);

  // KPI Thống kê toàn kho lấy trực tiếp từ CSDL
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringSoon: 0,
    expired: 0,
    totalStock: 0,
    totalValuation: 0,
  });

  // Unified Modal State: { open: boolean, type: 'CREATE'|'EDIT'|'VIEW'|'DELETE', payload: object }
  const [modalConfig, setModalConfig] = useState({
    open: false,
    type: 'CREATE',
    payload: null,
  });

  // Tải danh sách đơn vị tính độc nhất từ CSDL
  const fetchUnits = async () => {
    try {
      const units = await getDistinctUnits();
      if (Array.isArray(units)) {
        setAvailableUnits(units);
      }
    } catch (err) {
      console.error('Lỗi khi tải đơn vị tính từ CSDL:', err);
    }
  };

  // Tải số liệu thống kê toàn kho từ CSDL
  const fetchSummary = async () => {
    try {
      const res = await getMedicineSummary();
      if (res) {
        setStats({
          total: res.total ?? 0,
          active: res.active ?? 0,
          inactive: res.inactive ?? 0,
          lowStock: res.lowStock ?? 0,
          outOfStock: res.outOfStock ?? 0,
          expiringSoon: res.expiringSoon ?? 0,
          expired: res.expired ?? 0,
          totalStock: res.totalStock ?? 0,
          totalValuation: res.totalValuation ?? 0,
        });
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê kho thuốc:', err);
    }
  };

  // Tải danh sách thuốc từ máy chủ (Server-side Search & Filter đa tiêu chí)
  const fetchMedicines = useCallback(
    async (showToast = false) => {
      setLoading(true);
      try {
        const params = {};
        if (searchTerm.trim()) params.keyword = searchTerm.trim();
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (unitFilter !== 'ALL') params.unit = unitFilter;
        if (stockFilter !== 'ALL') params.stockStatus = stockFilter;
        if (sortBy !== 'DEFAULT') params.sortBy = sortBy;

        const data = await getMedicines(params);
        setMedicines(Array.isArray(data) ? data : []);
        if (showToast) {
          toast.success('Đã làm mới danh mục thuốc từ máy chủ!');
        }
      } catch (err) {
        console.error('Lỗi khi tải thuốc từ máy chủ:', err);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách thuốc từ máy chủ';
        toast.error(errorMsg);
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter, unitFilter, stockFilter, sortBy]
  );

  // Debounce 300ms khi gõ từ khóa hoặc đổi tiêu chí lọc -> gửi request trực tiếp về Backend
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchMedicines]);

  // Tải đơn vị tính và thống kê toàn kho khi khởi tạo
  useEffect(() => {
    fetchUnits();
    fetchSummary();
  }, []);

  // Danh sách đã lọc theo tiêu chí trả về từ máy chủ
  const filteredMedicines = medicines;

  // Phân trang
  const totalPages = Math.ceil(filteredMedicines.length / rowsPerPage) || 1;
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMedicines.slice(start, start + rowsPerPage);
  }, [filteredMedicines, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, stockFilter, unitFilter, sortBy, rowsPerPage]);

  // Modal open handlers
  const handleOpenCreate = () => {
    setModalConfig({ open: true, type: 'CREATE', payload: null });
  };

  const handleOpenEdit = (med) => {
    setModalConfig({ open: true, type: 'EDIT', payload: med });
  };

  const handleOpenView = (med) => {
    setModalConfig({ open: true, type: 'VIEW', payload: med });
  };

  const handleOpenDelete = (med) => {
    setModalConfig({ open: true, type: 'DELETE', payload: med });
  };

  // Lưu thuốc (Create / Edit) qua API Backend thật
  const handleSaveMedicine = async (savedData) => {
    const isEdit = modalConfig.type === 'EDIT' && modalConfig.payload?.id;
    if (isEdit) {
      const id = modalConfig.payload.id;
      try {
        await updateMedicine(id, savedData);
        toast.success(`Đã cập nhật thuốc: ${savedData.name}`);
        fetchMedicines();
        fetchSummary();
        fetchUnits();
      } catch (err) {
        console.error('Lỗi khi cập nhật thuốc qua API:', err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật thuốc';
        toast.error(errorMsg);
        throw err;
      }
    } else {
      try {
        await createMedicine(savedData);
        toast.success(`Đã thêm thuốc mới: ${savedData.name}`);
        fetchMedicines();
        fetchSummary();
        fetchUnits();
      } catch (err) {
        console.error('Lỗi khi thêm thuốc qua API:', err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi khi thêm thuốc';
        toast.error(errorMsg);
        throw err;
      }
    }
  };

  // Xóa thuốc (Delete) qua API Backend thật
  const handleDeleteMedicine = async (payload) => {
    if (!payload?.id) return;
    try {
      await deleteMedicine(payload.id);
      toast.success(`Đã xóa thuốc: ${payload.name}`);
      fetchMedicines();
      fetchSummary();
      fetchUnits();
    } catch (err) {
      console.error('Lỗi khi xóa thuốc qua API:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Không thể xóa thuốc này';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Đổi trạng thái nhanh (ACTIVE <-> INACTIVE) qua API Backend thật
  const handleToggleStatus = async (med) => {
    const nextStatus = med.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const statusLabel = nextStatus === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán';

    try {
      await updateMedicineStatus(med.id, nextStatus);
      toast.success(`Thuốc "${med.name}" chuyển sang: ${statusLabel}`);
      fetchMedicines();
      fetchSummary();
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái thuốc qua API:', err);
      const errorMsg = err?.response?.data?.message || 'Không thể cập nhật trạng thái thuốc';
      toast.error(errorMsg);
    }
  };

  // Xuất danh sách thuốc ra file CSV (UTF-8 có BOM)
  const handleExportCSV = () => {
    if (filteredMedicines.length === 0) {
      toast.error('Không có dữ liệu thuốc để xuất!');
      return;
    }

    const headers = [
      'STT',
      'Mã thuốc',
      'Tên thuốc',
      'Đơn vị tính',
      'Nhà sản xuất',
      'Số lượng tồn',
      'Đơn giá (VNĐ)',
      'Ngày sản xuất',
      'Hạn sử dụng',
      'Trạng thái kinh doanh',
      'Mô tả / Chỉ định',
      'Hướng dẫn sử dụng',
    ];

    const rows = filteredMedicines.map((m, index) => [
      index + 1,
      `"${m.code || ''}"`,
      `"${m.name || ''}"`,
      `"${m.unit || ''}"`,
      `"${m.manufacturer || ''}"`,
      m.stockQuantity ?? 0,
      m.price ?? 0,
      m.manufactureDate || '',
      m.expiryDate || '',
      m.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán',
      `"${(m.description || '').replace(/"/g, '""')}"`,
      `"${(m.usageInstruction || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_muc_thuoc_nha_khoa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file CSV thành công!');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* ── HEADER BREADCRUMB & ACTIONS ───────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Pill className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-slate-900">Quản lý Danh mục Thuốc</h1>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {stats.total || medicines.length} loại
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchMedicines(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50"
            title="Xuất file CSV"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm thuốc mới</span>
          </button>
        </div>
      </div>

      {/* ── STAT CARDS DASHBOARD ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {/* Card 1: Tổng số thuốc */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/70 transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tổng danh mục</span>
            <span className="rounded-md bg-blue-50 p-1.5 text-blue-600">
              <Pill className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-800">{stats.total}</span>
            <span className="text-[11px] text-slate-500">loại</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Tổng {stats.totalStock.toLocaleString()} đơn vị</p>
        </div>

        {/* Card 2: Đang kinh doanh / Còn bán */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/70 transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Đang bán</span>
            <span className="rounded-md bg-emerald-50 p-1.5 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-emerald-600">{stats.active}</span>
            <span className="text-[11px] text-slate-500">loại</span>
          </div>
          <p className="mt-0.5 text-[11px] text-emerald-600 font-medium">Sẵn sàng kê đơn</p>
        </div>

        {/* Card 3: Ngừng kinh doanh / Tạm ngưng */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/70 transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ngừng bán</span>
            <span className="rounded-md bg-slate-100 p-1.5 text-slate-500">
              <XCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-700">{stats.inactive}</span>
            <span className="text-[11px] text-slate-500">loại</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Tạm ngưng nhập / kê</p>
        </div>

        {/* Card 4: Sắp hết hàng */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/70 transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Sắp hết hàng</span>
            <span className="rounded-md bg-amber-50 p-1.5 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-600">{stats.lowStock}</span>
            <span className="text-[11px] text-slate-500">loại</span>
          </div>
          <p className="mt-0.5 text-[11px] text-amber-600 font-medium">Tồn &lt; 30 đơn vị</p>
        </div>

        {/* Card 5: Cận hạn / Hết hạn */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/70 transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Cận date / Hết hạn</span>
            <span className="rounded-md bg-rose-50 p-1.5 text-rose-600">
              <CalendarClock className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-rose-600">{stats.expiringSoon + stats.expired}</span>
            <span className="text-[11px] text-slate-500">loại</span>
          </div>
          <p className="mt-0.5 text-[11px] text-rose-600 font-medium">
            {stats.expired > 0 ? `${stats.expired} đã hết hạn` : 'Trong 60 ngày'}
          </p>
        </div>

      </div>

      {/* ── TOOLBAR & FILTERS ────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/70">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search Box */}
          <div className="relative lg:col-span-4">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên thuốc, mã thuốc, nhà sản xuất..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-8 text-xs text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lọc Trạng thái bán */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="INACTIVE">Ngừng bán</option>
            </select>
          </div>

          {/* Lọc Mức tồn */}
          <div className="lg:col-span-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">Tất cả mức tồn</option>
              <option value="IN_STOCK">Còn hàng (≥ 30)</option>
              <option value="LOW">Sắp hết (&lt; 30)</option>
              <option value="OUT">Hết hàng (0)</option>
            </select>
          </div>

          {/* Lọc Đơn vị tính */}
          <div className="lg:col-span-2">
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="ALL">Tất cả đơn vị ({availableUnits.length})</option>
              {availableUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="DEFAULT">Sắp xếp mặc định</option>
              <option value="NAME_ASC">Tên thuốc (A → Z)</option>
              <option value="NAME_DESC">Tên thuốc (Z → A)</option>
              <option value="PRICE_ASC">Giá bán tăng dần</option>
              <option value="PRICE_DESC">Giá bán giảm dần</option>
              <option value="STOCK_ASC">Số lượng tồn tăng dần</option>
              <option value="STOCK_DESC">Số lượng tồn giảm dần</option>
              <option value="EXPIRY_ASC">Hạn sử dụng gần nhất</option>
            </select>
          </div>
        </div>

        {/* Thống kê kết quả lọc */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-800">{filteredMedicines.length}</span> / {medicines.length} loại thuốc
            {searchTerm && <span> với từ khóa &ldquo;{searchTerm}&rdquo;</span>}
          </div>
          {(searchTerm || statusFilter !== 'ALL' || stockFilter !== 'ALL' || unitFilter !== 'ALL' || sortBy !== 'DEFAULT') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setStockFilter('ALL');
                setUnitFilter('ALL');
                setSortBy('DEFAULT');
              }}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE VIEW ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2.5 pl-4 pr-3 min-w-[240px]">Mã &amp; Tên thuốc</th>
                <th className="px-3 py-2.5 min-w-[90px]">Đơn vị</th>
                <th className="px-3 py-2.5 min-w-[150px]">Nhà sản xuất</th>
                <th className="px-3 py-2.5 min-w-[110px] text-right">Đơn giá bán</th>
                <th className="px-3 py-2.5 min-w-[90px] text-center">Tồn kho</th>
                <th className="px-3 py-2.5 min-w-[170px]">Ngày SX / Hạn dùng</th>
                <th className="px-3 py-2.5 min-w-[120px] text-center">Trạng thái bán</th>
                <th className="py-2.5 pl-3 pr-4 min-w-[100px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMedicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Pill className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-base font-medium text-slate-700">Không tìm thấy loại thuốc nào</p>
                    <p className="mt-1 text-sm text-slate-400">Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((med) => {
                  const expStatus = calculateExpiryStatus(med.expiryDate);
                  const isLow = (Number(med.stockQuantity) || 0) < 30;
                  const isOut = (Number(med.stockQuantity) || 0) === 0;

                  return (
                    <tr
                      key={med.id || med.code}
                      className="transition hover:bg-slate-50/80 group"
                    >
                      {/* Mã & Tên thuốc */}
                      <td className="py-2.5 pl-4 pr-3">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 group-hover:bg-blue-600 group-hover:text-white transition">
                            <Pill className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                                {med.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="whitespace-nowrap shrink-0 inline-block font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {med.code}
                              </span>
                              {med.description && (
                                <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[240px]" title={med.description}>
                                  {med.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Đơn vị */}
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                          {med.unit}
                        </span>
                      </td>

                      {/* Nhà sản xuất */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="text-xs font-medium truncate max-w-[150px]" title={med.manufacturer || 'Chưa cập nhật'}>
                            {med.manufacturer || 'Chưa cập nhật'}
                          </span>
                        </div>
                      </td>

                      {/* Đơn giá bán */}
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900 text-xs whitespace-nowrap">
                        {formatCurrency(med.price)}
                      </td>

                      {/* Số lượng tồn kho */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isOut
                            ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                            : isLow
                              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            }`}
                        >
                          {isOut ? (
                            <PackageX className="h-3 w-3" />
                          ) : isLow ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <PackageCheck className="h-3 w-3" />
                          )}
                          <span>{med.stockQuantity ?? 0}</span>
                        </span>
                      </td>

                      {/* Ngày sản xuất & Hạn sử dụng */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-[11px] space-y-0.5">
                          <div className="text-slate-500">
                            NSX: <span className="text-slate-700 font-medium">{formatDate(med.manufactureDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">HSD:</span>
                            <span className="text-slate-700 font-semibold">{formatDate(med.expiryDate)}</span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${expStatus.type === 'expired'
                                ? 'bg-rose-100 text-rose-700'
                                : expStatus.type === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                              {expStatus.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Trạng thái bán (ACTIVE / INACTIVE) */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(med)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition cursor-pointer ${med.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200'
                            }`}
                          title="Bấm để đổi trạng thái Còn bán / Ngừng bán"
                        >
                          <Power className={`h-2.5 w-2.5 ${med.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{med.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}</span>
                        </button>
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenView(med)}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(med)}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(med)}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Xóa thuốc"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-100 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Hiển thị</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white py-1 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} dòng/trang
                </option>
              ))}
            </select>
            <span>
              (Trang {currentPage} / {totalPages})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-200 p-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
              title="Trang trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <div key={p} className="flex items-center">
                    {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[28px] h-7 rounded-md py-0.5 px-1.5 text-xs font-semibold transition ${currentPage === p
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {p}
                    </button>
                  </div>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-slate-200 p-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
              title="Trang sau"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── UNIFIED MEDICINE CRUD MODAL (ACTION COMPONENT) ───────────── */}
      <MedicineModal
        open={modalConfig.open}
        type={modalConfig.type}
        payload={modalConfig.payload}
        onClose={() => setModalConfig((prev) => ({ ...prev, open: false }))}
        onSave={handleSaveMedicine}
        onConfirmDelete={handleDeleteMedicine}
        onSwitchType={(type) => setModalConfig((prev) => ({ ...prev, type }))}
      />
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Sparkles,
  Layers,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Pencil,
  Trash2,
  X,
  Upload,
  ShieldCheck,
  Star,
  BarChart3,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminServices,
  createService,
  updateService,
  deleteService,
  toggleActiveStatus,
  toggleFeaturedStatus,
} from '../../services/service.service';
import { uploadImage } from '../../services/media.service';

const CATEGORIES = [
  { key: 'NIENG_RANG', label: 'Niềng Răng', color: 'bg-blue-50 text-blue-700 border-blue-200', barBg: 'bg-blue-500' },
  { key: 'IMPLANT', label: 'Trồng Răng Implant', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', barBg: 'bg-emerald-500' },
  { key: 'RANG_SU', label: 'Nha Khoa Thẩm Mỹ', color: 'bg-purple-50 text-purple-700 border-purple-200', barBg: 'bg-purple-500' },
  { key: 'TAY_TRANG', label: 'Tẩy Trắng Răng', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', barBg: 'bg-cyan-500' },
  { key: 'KHAM_DIEU_TRI', label: 'Nha Khoa Tổng Quát', color: 'bg-amber-50 text-amber-700 border-amber-200', barBg: 'bg-amber-500' },
  { key: 'NHA_KHOA_TRE_EM', label: 'Nha Khoa Trẻ Em', color: 'bg-rose-50 text-rose-700 border-rose-200', barBg: 'bg-rose-500' },
];

const COMMON_UNITS = ['Lần', '/trụ', '/răng', 'Cả 2 hàm', 'Gói', '/bộ', '/tuýp', '/cầu', '/hàm'];
const WARRANTY_OPTIONS = ['Không bảo hành', '12 tháng', '2 năm', '5 năm', '10 năm', '15 năm', 'Trọn đời'];

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentService, setCurrentService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    serviceCode: '',
    serviceName: '',
    category: 'IMPLANT',
    subCategory: '',
    price: '',
    costPrice: '',
    estimatedDuration: 30,
    sessionsCount: '1 buổi',
    unit: 'Lần',
    warrantyPeriod: 'Không bảo hành',
    imageUrl: '',
    sortOrder: 0,
    isFeatured: false,
    isActive: true,
    description: '',
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus === 'active') params.isActive = true;
      if (selectedStatus === 'inactive') params.isActive = false;
      if (search.trim()) params.search = search.trim();

      const data = await getAdminServices(params);
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load services:', err);
      toast.error('Không thể tải danh sách dịch vụ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, selectedStatus]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        !search.trim() ||
        (s.serviceName && s.serviceName.toLowerCase().includes(search.toLowerCase())) ||
        (s.serviceCode && s.serviceCode.toLowerCase().includes(search.toLowerCase())) ||
        (s.subCategory && s.subCategory.toLowerCase().includes(search.toLowerCase()));

      return matchSearch;
    });
  }, [services, search]);

  // Comprehensive Analytics Calculations
  const analytics = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const featured = services.filter((s) => s.isFeatured).length;
    const categoriesCount = new Set(services.map((s) => s.category)).size;

    // Category Distribution
    const categoryStats = CATEGORIES.map((cat) => {
      const count = services.filter((s) => s.category === cat.key).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const catServices = services.filter((s) => s.category === cat.key);
      const avgPrice =
        catServices.length > 0
          ? catServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0) / catServices.length
          : 0;
      return { ...cat, count, pct, avgPrice };
    });

    // Price & Profit Analysis
    const servicesWithPrice = services.filter((s) => s.price > 0);
    const avgPriceAll =
      servicesWithPrice.length > 0
        ? servicesWithPrice.reduce((sum, s) => sum + parseFloat(s.price), 0) / servicesWithPrice.length
        : 0;

    const maxPriceService = servicesWithPrice.reduce(
      (max, s) => (parseFloat(s.price) > parseFloat(max.price || 0) ? s : max),
      { price: 0 }
    );

    const minPriceService = servicesWithPrice.reduce(
      (min, s) => (parseFloat(s.price) < parseFloat(min.price || Infinity) ? s : min),
      { price: Infinity }
    );

    // Avg Duration
    const avgDuration =
      services.length > 0
        ? Math.round(services.reduce((sum, s) => sum + (parseInt(s.estimatedDuration, 10) || 30), 0) / services.length)
        : 30;

    return {
      total,
      active,
      featured,
      categoriesCount,
      categoryStats,
      avgPriceAll,
      maxPriceService,
      minPriceService,
      avgDuration,
    };
  }, [services]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentService(null);
    setFormData({
      serviceCode: '',
      serviceName: '',
      category: selectedCategory || 'IMPLANT',
      subCategory: '',
      price: '',
      costPrice: '',
      estimatedDuration: 30,
      sessionsCount: '1 buổi',
      unit: 'Lần',
      warrantyPeriod: 'Không bảo hành',
      imageUrl: '',
      sortOrder: (services.length + 1) * 10,
      isFeatured: false,
      isActive: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setModalMode('edit');
    setCurrentService(service);
    setFormData({
      serviceCode: service.serviceCode || '',
      serviceName: service.serviceName || '',
      category: service.category || 'IMPLANT',
      subCategory: service.subCategory || '',
      price: service.price !== undefined ? service.price : '',
      costPrice: service.costPrice !== undefined ? service.costPrice : '',
      estimatedDuration: service.estimatedDuration || 30,
      sessionsCount: service.sessionsCount || '1 buổi',
      unit: service.unit || 'Lần',
      warrantyPeriod: service.warrantyPeriod || 'Không bảo hành',
      imageUrl: service.imageUrl || '',
      sortOrder: service.sortOrder || 0,
      isFeatured: !!service.isFeatured,
      isActive: service.isActive !== undefined ? service.isActive : true,
      description: service.description || '',
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl }));
      toast.success('Tải ảnh minh họa lên thành công!');
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Tải ảnh thất bại. Vui lòng thử lại!');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceName.trim()) {
      toast.error('Tên dịch vụ không được để trống!');
      return;
    }

    if ([formData.price, formData.costPrice, formData.estimatedDuration, formData.sortOrder]
      .some((value) => value !== '' && value != null && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      toast.error('Giá, thời lượng và thứ tự hiển thị không được âm.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        price: formData.price !== '' ? parseFloat(formData.price) : 0,
        costPrice: formData.costPrice !== '' ? parseFloat(formData.costPrice) : 0,
        estimatedDuration: parseInt(formData.estimatedDuration, 10) || 30,
        sortOrder: parseInt(formData.sortOrder, 10) || 0,
      };

      if (modalMode === 'create') {
        await createService(payload);
        toast.success('Thêm mới dịch vụ thành công!');
      } else {
        await updateService(currentService.id, payload);
        toast.success('Cập nhật dịch vụ thành công!');
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error('Submit service failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Lưu dịch vụ thất bại!';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const updateNonNegativeNumber = (field, value) => {
    if (value === '' || (!value.includes('-') && Number(value) >= 0)) {
      setFormData((previous) => ({ ...previous, [field]: value }));
    }
  };

  const handleToggleActive = async (service) => {
    try {
      await toggleActiveStatus(service.id);
      toast.success(`Đã ${service.isActive ? 'tạm ngưng' : 'kích hoạt'} dịch vụ!`);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (err) {
      console.error('Toggle active failed:', err);
      toast.error('Không thể cập nhật trạng thái!');
    }
  };

  const handleToggleFeatured = async (service) => {
    try {
      await toggleFeaturedStatus(service.id);
      toast.success(`Đã ${service.isFeatured ? 'bỏ nổi bật' : 'đánh dấu nổi bật'}!`);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isFeatured: !s.isFeatured } : s))
      );
    } catch (err) {
      console.error('Toggle featured failed:', err);
      toast.error('Không thể cập nhật trạng thái nổi bật!');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.id);
      toast.success('Xóa dịch vụ thành công!');
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete service failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Không thể xóa dịch vụ. Vui lòng thử lại!';
      toast.error(errMsg);
    }
  };

  const formatPrice = (val) => {
    if (!val || val === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + 'đ';
  };

  const renderDiscountedPrice = (service) => {
    const price = service.discountedPrice ?? service.price;
    const hasDiscount = price != null && service.price != null
      && Number(price) < Number(service.price);

    return (
      <span className={`block font-semibold ${hasDiscount ? 'text-emerald-600' : 'text-slate-900'}`}>
        {price == null ? 'Chưa có giá' : formatPrice(price)}
      </span>
    );
  };

  const getCategoryInfo = (catKey) => {
    return (
      CATEGORIES.find((c) => c.key === catKey) || {
        label: catKey,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        barBg: 'bg-slate-400',
      }
    );
  };

  return (
    <div className="space-y-5 pb-2 font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Danh Mục Dịch Vụ Nha Khoa</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp gói điều trị y khoa chuyên sâu, biểu phí niêm yết và chính sách bảo hành
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>{showAnalytics ? 'Ẩn báo cáo' : 'Hiện báo cáo'}</span>
            {showAnalytics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-[#005f73] hover:bg-[#0a9396] text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Dịch Vụ Mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng Dịch Vụ</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{analytics.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đang Hoạt Động</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{analytics.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Dịch Vụ Nổi Bật</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{analytics.featured}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Nhóm Dịch Vụ</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{analytics.categoriesCount}</p>
          </div>
        </div>
      </div>

      {/* ANALYTICS REPORT DASHBOARD PANEL */}
      {showAnalytics && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#005f73]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Báo Cáo & Tỷ Trọng Danh Mục Dịch Vụ
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Cập nhật thời gian thực</span>
          </div>

          {/* Distribution Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
              <span>Tỷ lệ phân bổ dịch vụ theo danh mục</span>
              <span className="text-slate-400">100% ({analytics.total} dịch vụ)</span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
              {analytics.categoryStats.map(
                (cat) =>
                  cat.pct > 0 && (
                    <div
                      key={cat.key}
                      style={{ width: `${cat.pct}%` }}
                      className={`${cat.barBg} transition-all duration-500 relative group cursor-pointer`}
                      title={`${cat.label}: ${cat.count} dịch vụ (${cat.pct}%)`}
                    />
                  )
              )}
            </div>
          </div>

          {/* Category Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {analytics.categoryStats.map((cat) => (
              <div
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key === selectedCategory ? '' : cat.key)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedCategory === cat.key
                  ? 'bg-teal-50/80 border-[#005f73] text-slate-900 shadow-xs ring-1 ring-[#005f73]/20'
                  : 'bg-slate-50/50 border-slate-200/70 hover:bg-slate-100/70 text-slate-700'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === cat.key ? 'text-[#005f73]' : 'text-slate-500'}`}>
                    {cat.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${cat.barBg}`} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-bold text-slate-900">{cat.count}</span>
                  <span className={`text-xs font-semibold ${selectedCategory === cat.key ? 'text-[#005f73]' : 'text-slate-400'}`}>
                    {cat.pct}%
                  </span>
                </div>
                <div className={`text-[10px] mt-1 truncate ${selectedCategory === cat.key ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  TB: {formatPrice(cat.avgPrice)}
                </div>
              </div>
            ))}
          </div>

          {/* Financial & Time Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Giá dịch vụ trung bình</p>
                <p className="text-sm font-bold text-slate-900">{formatPrice(analytics.avgPriceAll)}</p>
              </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Thời lượng điều trị TB</p>
                <p className="text-sm font-bold text-slate-900">{analytics.avgDuration} phút / ca</p>
              </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60 flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-md">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Dịch vụ cao nhất</p>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[170px]" title={analytics.maxPriceService.serviceName}>
                  {formatPrice(analytics.maxPriceService.price)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên dịch vụ, mã DV, nhóm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#005f73] focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & View switcher */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#005f73]"
            >
              <option value="">Tất cả danh mục ({CATEGORIES.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#005f73]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchServices}
              title="Tải lại dữ liệu"
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Bảng</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Thẻ Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${selectedCategory === ''
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key === selectedCategory ? '' : cat.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${selectedCategory === cat.key
                ? 'bg-[#005f73] text-white border-[#005f73]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-[#005f73]" />
          <p className="text-xs font-medium text-slate-500 mt-2.5">Đang tải danh sách dịch vụ...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">Không tìm thấy dịch vụ nào</h3>
          <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="max-h-[calc(100vh-170px)] min-h-[400px] overflow-auto relative">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-xs">
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Mã DV</th>
                  <th className="py-3 px-4 sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Dịch vụ & Nội dung</th>
                  <th className="py-3 px-4 sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Nhóm dịch vụ</th>
                  <th className="py-3 px-4 text-right sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Giá tham khảo</th>
                  <th className="py-3 px-4 text-right sticky top-0 bg-slate-50 z-10 border-b border-slate-200 whitespace-nowrap">Giá ưu đãi</th>
                  <th className="py-3 px-4 text-center sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Thời lượng & Buổi</th>
                  <th className="py-3 px-4 text-center sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Nổi bật</th>
                  <th className="py-3 px-4 text-center sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Trạng thái</th>
                  <th className="py-3 px-4 text-center sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => {
                  const catInfo = getCategoryInfo(service.category);
                  return (
                    <tr key={service.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {service.serviceCode || ''}
                      </td>

                      {/* Name & Image */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              service.imageUrl ||
                              'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=200&q=80'
                            }
                            alt={service.serviceName}
                            className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-slate-900 leading-snug line-clamp-1">
                              {service.serviceName}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {service.description || 'Chưa có mô tả'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {service.subCategory && (
                          <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                            {service.subCategory}
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block">
                          {formatPrice(service.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          / {service.unit || 'Lần'}
                        </span>
                      </td>

                      {/* Discounted price */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" title="Giá tham khảo cho một dịch vụ sau khuyến mãi">
                        {renderDiscountedPrice(service)}
                        <span className="text-[10px] text-slate-400 font-normal">
                          / {service.unit || 'Lần'}
                        </span>
                      </td>

                      {/* Duration & Sessions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{service.estimatedDuration || 30} phút</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          {service.sessionsCount || '1 buổi'}
                        </span>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleFeatured(service)}
                          className={`p-1.5 rounded-md border transition-all ${service.isFeatured
                            ? 'bg-amber-50 border-amber-200 text-amber-600'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                          title="Tắt/Bật Nổi bật"
                        >
                          <Star className={`w-4 h-4 ${service.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${service.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${service.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(service)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Sửa thông tin"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(service)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const catInfo = getCategoryInfo(service.category);
            return (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                {/* Header Image - Full Bleed */}
                <div className="h-44 sm:h-48 bg-slate-900/5 relative overflow-hidden w-full border-b border-slate-100 flex items-center justify-center">
                  <img
                    src={
                      service.imageUrl ||
                      'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={service.serviceName}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border backdrop-blur-md shadow-2xs ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                    {service.isFeatured && (
                      <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-2xs">
                        Nổi bật
                      </span>
                    )}
                  </div>
                  {service.serviceCode && (
                    <span className="absolute bottom-2.5 right-2.5 z-20 bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      Mã: {service.serviceCode}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {service.serviceName}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {service.description || 'Chưa có mô tả chi tiết'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Giá tham khảo</span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatPrice(service.price)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">/ {service.unit || 'Lần'}</span>
                      <div className="mt-2 text-sm" title="Giá tham khảo cho một dịch vụ sau khuyến mãi">
                        <span className="text-[10px] text-slate-400 block font-medium">Giá sau giảm</span>
                        {renderDiscountedPrice(service)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Thời lượng</span>
                      <span className="text-xs font-semibold text-slate-700">
                        ⏱️ {service.estimatedDuration || 30} phút
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900"
                  >
                    <span className={`w-2 h-2 rounded-full ${service.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>{service.isActive ? 'Hoạt động' : 'Tạm ngưng'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                      title="Sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(service)}
                      className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-sm text-slate-900">
                {modalMode === 'create' ? 'Thêm Dịch Vụ Mới' : 'Cập Nhật Dịch Vụ'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


                {/* Name */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tên Dịch Vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Implant Osstem (Hàn Quốc)"
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#005f73] focus:bg-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Danh Mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SubCategory */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nhóm Phụ / Thẻ Phân Loại</label>
                  <input
                    type="text"
                    placeholder="VD: Trụ Implant theo hãng..."
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73] focus:bg-white"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Giá Tham Khảo (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="VD: 19000000"
                    value={formData.price}
                    onChange={(e) => updateNonNegativeNumber('price', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#005f73] focus:bg-white"
                  />
                  {formData.price !== '' && (
                    <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                      Xem trước: {formatPrice(formData.price)}
                    </span>
                  )}
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Giá Vốn / Chi Phí Vật Tư (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="VD: 8000000"
                    value={formData.costPrice}
                    onChange={(e) => updateNonNegativeNumber('costPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-normal focus:outline-none focus:ring-1 focus:ring-[#005f73] focus:bg-white"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Thời Lượng Thực Hiện (Phút)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="VD: 45"
                    value={formData.estimatedDuration}
                    onChange={(e) => updateNonNegativeNumber('estimatedDuration', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]"
                  />
                </div>

                {/* Sessions Count */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Số Buổi Điều Trị Dự Kiến</label>
                  <input
                    type="text"
                    placeholder="VD: 1 buổi, 3-5 buổi"
                    value={formData.sessionsCount}
                    onChange={(e) => setFormData({ ...formData, sessionsCount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Đơn Vị Tính</label>
                  <div className="flex gap-1.5">
                    <select
                      value={COMMON_UNITS.includes(formData.unit) ? formData.unit : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value !== 'OTHER') {
                          setFormData({ ...formData, unit: e.target.value });
                        } else {
                          setFormData({ ...formData, unit: '' });
                        }
                      }}
                      className={`${!COMMON_UNITS.includes(formData.unit) ? 'w-1/3' : 'w-full'
                        } px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]`}
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                      <option value="OTHER">Tùy chỉnh...</option>
                    </select>
                    {!COMMON_UNITS.includes(formData.unit) && (
                      <input
                        type="text"
                        placeholder="VD: Gói 2 năm"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]"
                      />
                    )}
                  </div>
                </div>

                {/* Warranty */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bảo Hành</label>
                  <select
                    value={formData.warrantyPeriod}
                    onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]"
                  >
                    {WARRANTY_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Ảnh Minh Họa</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>{uploadingImage ? 'Đang tải...' : 'Tải lên'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-md border border-slate-200 shadow-xs bg-white"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      <div>
                        <span className="text-xs font-medium text-slate-700 block">Xem trước ảnh minh họa</span>
                        <span className="text-[10px] text-emerald-600 font-medium">✓ Đã tải ảnh lên</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#005f73] rounded border-slate-300 focus:ring-[#005f73]"
                  />
                  <span>Đang kinh doanh (Kích hoạt)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span>Đánh dấu Nổi bật (Trang chủ)</span>
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Mô Tả Dịch Vụ</label>
                <textarea
                  rows={3}
                  placeholder="Nhập thông tin chi tiết về dịch vụ..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005f73]"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#005f73] hover:bg-[#0a9396] text-white font-medium rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  {submitting && <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  <span>{modalMode === 'create' ? 'Tạo Dịch Vụ' : 'Cập Nhật'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3.5 text-center border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Xác Nhận Xóa Dịch Vụ</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc muốn xóa dịch vụ <strong className="text-slate-800">"{deleteTarget.serviceName}"</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-xs transition-colors text-xs"
              >
                Đồng Ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

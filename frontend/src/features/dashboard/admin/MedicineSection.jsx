import React, { useState, useMemo } from 'react';
import {
  Pill,
  Package,
  AlertTriangle,
  Search,
  Boxes,
  RotateCcw,
  SlidersHorizontal,
  X,
  Activity,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Droplets,
  Stethoscope,
  ShieldCheck,
  Receipt,
  FileCheck2,
  ChevronRight,
  Filter,
  BarChart2,
  Layers,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatNumber } from './dashboardUtils';

// Helper categorize dental medications
const categorizeMedicine = (name = '') => {
  const lower = name.toLowerCase();
  if (/amox|clinda|augmen|cefix|azithro|metro|spira|rodo|kháng sinh/.test(lower)) {
    return 'Kháng sinh';
  }
  if (/para|ibu|pana|efferal|diclo|cele|melo|alpha|predni|giảm đau|kháng viêm/.test(lower)) {
    return 'Giảm đau - Kháng viêm';
  }
  if (/chlorhex|beta|súc miệng|mouthwash|kin|elu|sát khuẩn/.test(lower)) {
    return 'Sát khuẩn & Vệ sinh miệng';
  }
  return 'Dược phẩm nha khoa khác';
};

export default function MedicineSection({ data, loading }) {
  const [activeTab, setActiveTab] = useState('medicines'); // 'medicines' or 'supplies'

  // Advanced Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUsageStatus, setSelectedUsageStatus] = useState('all');
  const [selectedStockLevel, setSelectedStockLevel] = useState('all');
  const [selectedRevenueTier, setSelectedRevenueTier] = useState('all');
  const [sortBy, setSortBy] = useState('revenue_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showDiagrams, setShowDiagrams] = useState(true);

  if (loading && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500">
        <Activity className="h-6 w-6 animate-pulse text-teal-600" />
        <span className="text-xs font-semibold">Đang tải dữ liệu dược phẩm & vật tư nha khoa...</span>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalMedicinesCount = 0,
    totalMedicinesUsedCount = 0,
    totalUnitsDispensed = 0,
    totalMedicineRevenue = 0,
    lowStockCount = 0,
    medicines = [],
    supplies = [],
    periodLabel = '',
  } = data;

  // Total Prescriptions count
  const totalPrescriptions = medicines.reduce(
    (sum, m) => sum + (Number(m.prescriptionCount) || 0),
    0
  );

  const maxMedicineRevenue = Math.max(
    ...medicines.map((m) => Number(m.totalRevenue) || 0),
    1
  );

  // Clinical Pharmacy Intelligence Ratios
  const avgPrescriptionValue =
    totalPrescriptions > 0 ? totalMedicineRevenue / totalPrescriptions : 0;
  const avgUnitsPerPrescription =
    totalPrescriptions > 0 ? (totalUnitsDispensed / totalPrescriptions).toFixed(1) : 0;
  const safeStockCount = Math.max(0, totalMedicinesCount - lowStockCount);
  const safeStockPct =
    totalMedicinesCount > 0 ? (safeStockCount / totalMedicinesCount) * 100 : 100;
  const lowStockPct = 100 - safeStockPct;

  // Top prescribed/revenue medicines
  const topMedicines = useMemo(() => {
    return [...medicines]
      .sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0))
      .slice(0, 4);
  }, [medicines]);

  // Low stock list (< 30 items)
  const lowStockMedicines = useMemo(() => {
    return medicines
      .filter((m) => Number(m.stockQuantity) < 30)
      .sort((a, b) => Number(a.stockQuantity) - Number(b.stockQuantity));
  }, [medicines]);

  // Clinical Pharmacology Category Breakdown Cards
  const pharmacologyCards = useMemo(() => {
    const list = [
      {
        key: 'Kháng sinh',
        title: 'Kháng sinh nha khoa',
        desc: 'Nhiễm trùng răng, áp xe, sau nhổ răng khôn & tiểu phẫu',
        icon: Stethoscope,
        colorClass: 'teal',
        items: [],
        revenue: 0,
        units: 0,
        prescriptions: 0,
      },
      {
        key: 'Sát khuẩn & Vệ sinh miệng',
        title: 'Sát khuẩn & Vệ sinh miệng',
        desc: 'Nước súc miệng diệt khuẩn khoang miệng, chống viêm nướu',
        icon: Droplets,
        colorClass: 'cyan',
        items: [],
        revenue: 0,
        units: 0,
        prescriptions: 0,
      },
      {
        key: 'Giảm đau - Kháng viêm',
        title: 'Giảm đau & Kháng viêm',
        desc: 'Cắt cơn đau nhức răng, chống sưng nề hậu can thiệp',
        icon: Pill,
        colorClass: 'emerald',
        items: [],
        revenue: 0,
        units: 0,
        prescriptions: 0,
      },
    ];

    medicines.forEach((m) => {
      const cat = categorizeMedicine(m.name);
      const target = list.find((item) => item.key === cat);
      if (target) {
        target.revenue += Number(m.totalRevenue) || 0;
        target.units += Number(m.quantityUsed) || 0;
        target.prescriptions += Number(m.prescriptionCount) || 0;
        target.items.push(m);
      }
    });

    return list;
  }, [medicines]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedUsageStatus('all');
    setSelectedStockLevel('all');
    setSelectedRevenueTier('all');
    setSortBy('revenue_desc');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'all' ||
    selectedUsageStatus !== 'all' ||
    selectedStockLevel !== 'all' ||
    selectedRevenueTier !== 'all' ||
    sortBy !== 'revenue_desc';

  // Filter & Sort Medicines
  const filteredMedicines = useMemo(() => {
    return medicines
      .filter((m) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (m.name || '').toLowerCase().includes(term) ||
          (m.code || '').toLowerCase().includes(term) ||
          (m.manufacturer || '').toLowerCase().includes(term);

        if (!matchesSearch) return false;

        if (selectedCategory !== 'all') {
          const cat = categorizeMedicine(m.name);
          if (cat !== selectedCategory) return false;
        }

        const used = Number(m.quantityUsed) || 0;
        if (selectedUsageStatus === 'used' && used <= 0) return false;
        if (selectedUsageStatus === 'unused' && used > 0) return false;

        const stock = Number(m.stockQuantity) || 0;
        if (selectedStockLevel === 'low' && stock >= 30) return false;
        if (selectedStockLevel === 'safe' && stock < 30) return false;
        if (selectedStockLevel === 'out' && stock > 0) return false;

        const rev = Number(m.totalRevenue) || 0;
        if (selectedRevenueTier === 'has_revenue' && rev <= 0) return false;
        if (selectedRevenueTier === 'high_revenue' && rev < 50000) return false;

        return true;
      })
      .sort((a, b) => {
        const revA = Number(a.totalRevenue) || 0;
        const revB = Number(b.totalRevenue) || 0;
        const qtyA = Number(a.quantityUsed) || 0;
        const qtyB = Number(b.quantityUsed) || 0;
        const presA = Number(a.prescriptionCount) || 0;
        const presB = Number(b.prescriptionCount) || 0;
        const stockA = Number(a.stockQuantity) || 0;
        const stockB = Number(b.stockQuantity) || 0;
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;

        switch (sortBy) {
          case 'revenue_desc':
            return revB - revA;
          case 'revenue_asc':
            return revA - revB;
          case 'quantity_desc':
            return qtyB - qtyA;
          case 'prescription_desc':
            return presB - presA;
          case 'stock_asc':
            return stockA - stockB;
          case 'stock_desc':
            return stockB - stockA;
          case 'price_desc':
            return priceB - priceA;
          case 'name_asc':
            return (a.name || '').localeCompare(b.name || '');
          default:
            return revB - revA;
        }
      });
  }, [
    medicines,
    searchTerm,
    selectedCategory,
    selectedUsageStatus,
    selectedStockLevel,
    selectedRevenueTier,
    sortBy,
  ]);

  // Filter & Sort Supplies
  const filteredSupplies = useMemo(() => {
    return supplies
      .filter((s) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (s.suppliesName || '').toLowerCase().includes(term) ||
          (s.unit || '').toLowerCase().includes(term);

        if (!matchesSearch) return false;

        if (selectedStockLevel === 'low' && s.stockQuantity > (s.minStock || 20)) {
          return false;
        }
        if (selectedStockLevel === 'safe' && s.stockQuantity <= (s.minStock || 20)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const exportA = Number(a.exportedQuantity) || 0;
        const exportB = Number(b.exportedQuantity) || 0;
        const stockA = Number(a.stockQuantity) || 0;
        const stockB = Number(b.stockQuantity) || 0;

        switch (sortBy) {
          case 'quantity_desc':
          case 'revenue_desc':
            return exportB - exportA;
          case 'stock_asc':
            return stockA - stockB;
          case 'stock_desc':
            return stockB - stockA;
          case 'name_asc':
            return (a.suppliesName || '').localeCompare(b.suppliesName || '');
          default:
            return exportB - exportA;
        }
      });
  }, [supplies, searchTerm, selectedStockLevel, sortBy]);

  return (
    <div className="space-y-5">
      {/* 4 Professional KPI Cards - Dental Teal & Clean Medical Tone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Doanh Thu Thuốc */}
        <div className="rounded-lg border border-teal-200/70 bg-gradient-to-br from-teal-50/20 via-white to-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Tiền thu được từ thuốc
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white shadow-xs">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-teal-900">
              {formatCurrency(totalMedicineRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-teal-100/60 pt-2">
            <span>Doanh thu quầy thuốc</span>
            <span className="text-teal-700 font-semibold">{totalPrescriptions} đơn kê</span>
          </div>
        </div>

        {/* Card 2: Số Lượng Đã Cấp */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Số lượng thuốc đã cấp
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalUnitsDispensed)}
            </span>
            <span className="text-xs font-medium text-slate-500">viên / lọ</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>Xuất theo đơn điều trị</span>
            <span className="text-slate-700 font-medium">{medicines.length} mặt hàng</span>
          </div>
        </div>

        {/* Card 3: Chủng Loại Được Dùng */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chủng loại được dùng
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/60">
              <Pill className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalMedicinesUsedCount)}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {totalMedicinesCount} danh mục</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>Tỷ lệ lưu hành:</span>
            <span className="text-teal-700 font-bold">
              {totalMedicinesCount > 0
                ? ((totalMedicinesUsedCount / totalMedicinesCount) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Card 4: Tồn Kho Dưới Ngưỡng An Toàn */}
        <div className="rounded-lg border border-amber-200/70 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Tồn kho dưới ngưỡng
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-700 border border-amber-200/70">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-900">
              {formatNumber(lowStockCount)}
            </span>
            <span className="text-xs font-medium text-amber-700">loại thuốc</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-amber-100/70 pt-2">
            <span className="text-amber-800 font-medium">Ngưỡng tối thiểu &lt; 30</span>
            <span className="text-amber-700 font-semibold">Cần nhập kho</span>
          </div>
        </div>
      </div>

      {/* MÔ HÌNH MỚI: TRUNG TÂM GIÁM SÁT DƯỢC LÂM SÀNG & TỒN KHO NHA KHOA THÔNG MINH */}
      <div className="rounded-lg border border-teal-200/80 bg-white shadow-xs overflow-hidden">
        {/* Header Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-50/70 to-slate-50/70 border-b border-teal-100/80">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-teal-600 text-white shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Trung tâm giám sát dược lâm sàng & sức khỏe kho nha khoa
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDiagrams(!showDiagrams)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors"
          >
            {showDiagrams ? 'Thu gọn phân tích' : 'Mở rộng phân tích'}
          </button>
        </div>

        {showDiagrams && (
          <div className="p-4 space-y-4">
            {/* 1. KHỐI CHỈ SỐ VẬN HÀNH DƯỢC KHOA & THƯỚC ĐO SỨC KHỎE KHO */}
            <div className="rounded-md border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                {/* Stock Health Bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Boxes className="h-3.5 w-3.5 text-teal-600" />
                      Tình trạng mức dự trữ kho dược phòng khám
                    </span>
                    <span className="text-slate-600 text-[11px]">
                      <strong className="text-teal-800">{safeStockCount}</strong> an toàn /{' '}
                      <strong className="text-amber-700">{lowStockCount}</strong> cần bù
                    </span>
                  </div>

                  {/* Multi-segment health bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                    <div
                      title={`Tồn kho an toàn: ${safeStockCount} mặt hàng (${safeStockPct.toFixed(1)}%)`}
                      style={{ width: `${safeStockPct}%` }}
                      className="h-full bg-teal-600 transition-all duration-500"
                    />
                    <div
                      title={`Cảnh báo dưới ngưỡng: ${lowStockCount} mặt hàng (${lowStockPct.toFixed(1)}%)`}
                      style={{ width: `${lowStockPct}%` }}
                      className="h-full bg-amber-500 transition-all duration-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      {safeStockPct.toFixed(1)}% Đạt mức dự trữ ổn định (&ge; 30)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {lowStockPct.toFixed(1)}% Nguy cơ thiếu hụt (&lt; 30)
                    </span>
                  </div>
                </div>

                {/* 2 Quick clinical ratios */}
                <div className="flex items-center gap-3 lg:border-l lg:border-slate-200 lg:pl-5">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Giá trị TB / Đơn thuốc
                    </span>
                    <span className="text-sm font-bold text-teal-900">
                      {formatCurrency(avgPrescriptionValue)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {avgUnitsPerPrescription} viên-lọ / đơn
                    </span>
                  </div>

                  <div className="text-right pl-3 border-l border-slate-200">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Tỷ lệ phát luân chuyển
                    </span>
                    <span className="text-sm font-bold text-teal-800">
                      {totalMedicinesCount > 0
                        ? ((totalMedicinesUsedCount / totalMedicinesCount) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {totalMedicinesUsedCount} thuốc đã kê
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. MA TRẬN 3 NHÓM DƯỢC LÝ NHA KHOA TƯƠNG TÁC (Interactive Category Grid) */}
              <div className="pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    Phân bổ theo nhóm điều trị nha khoa chuyên sâu
                  </span>
                  <span className="text-[10px] text-slate-500 italic">
                    Nhấp vào thẻ để lọc danh mục thuốc bên dưới
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {pharmacologyCards.map((card) => {
                    const IconComponent = card.icon;
                    const isSelected = selectedCategory === card.key;
                    const pctOfRevenue =
                      totalMedicineRevenue > 0
                        ? (card.revenue / totalMedicineRevenue) * 100
                        : 0;

                    return (
                      <div
                        key={card.key}
                        onClick={() => {
                          setSelectedCategory(isSelected ? 'all' : card.key);
                        }}
                        className={`group relative rounded-md p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-md ${
                                  isSelected
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors'
                                }`}
                              >
                                <IconComponent className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                                {card.title}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {pctOfRevenue.toFixed(0)}% DS
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                            {card.desc}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-xs font-bold text-teal-900 block">
                              {formatCurrency(card.revenue)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Đã cấp: <strong>{card.units}</strong> viên/chai
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                              isSelected ? 'text-teal-700' : 'text-slate-400 group-hover:text-teal-600'
                            }`}
                          >
                            {isSelected ? 'Đang lọc' : 'Lọc thẻ này'}
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. BẢNG SO SÁNH HAI CHIỀU: TOP THUỐC DÙNG NHIỀU VS CẢNH BÁO CẦN BỔ SUNG */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-1">
              {/* Cột 1: Top Dược phẩm kê đơn nhiều nhất */}
              <div className="rounded-md border border-slate-200/80 bg-white p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-teal-600" />
                      Dược phẩm luân chuyển nhanh nhất
                    </span>
                    <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                      Xuất nhiều kỳ này
                    </span>
                  </div>

                  <div className="space-y-2 mt-2">
                    {topMedicines.map((m, idx) => {
                      const rev = Number(m.totalRevenue) || 0;
                      const pct =
                        maxMedicineRevenue > 0 ? (rev / maxMedicineRevenue) * 100 : 0;
                      return (
                        <div
                          key={m.medicineId || idx}
                          className="rounded-md border border-slate-100 p-2 hover:bg-teal-50/20 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2 truncate">
                              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-slate-900 truncate">
                                {m.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({m.quantityUsed} {m.unit})
                              </span>
                            </div>
                            <span className="font-bold text-teal-900">
                              {formatCurrency(rev)}
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cột 2: Cảnh báo Tồn kho thông minh (< 30) */}
              <div className="rounded-md border border-amber-200/80 bg-gradient-to-br from-amber-50/30 to-white p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Mặt hàng dưới ngưỡng an toàn (Cần nhập kho)
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {lowStockMedicines.length} mặt hàng
                    </span>
                  </div>

                  <div className="space-y-2 mt-2">
                    {lowStockMedicines.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <CheckCircle2 className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                        Tất cả các loại thuốc đều đạt mức tồn kho an toàn
                      </div>
                    ) : (
                      lowStockMedicines.slice(0, 3).map((m, idx) => (
                        <div
                          key={m.medicineId || idx}
                          className="flex items-center justify-between p-2 rounded-md border border-amber-200/60 bg-white text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Hãng: {m.manufacturer || 'Tiêu chuẩn'} &bull; Mã: {m.code}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                              Còn {formatNumber(m.stockQuantity)} {m.unit}
                            </span>
                            <span className="text-[10px] text-rose-600 block mt-0.5 font-medium">
                              Dưới định mức 30
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-800">
                  <span>Dự trù đặt hàng định kỳ đảm bảo ca lâm sàng</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStockLevel('low')}
                    className="font-semibold underline hover:text-amber-900 text-[11px]"
                  >
                    Xem tất cả thuốc sắp hết
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Top Control Bar: Segmented Tabs (WITHOUT numbers in parentheses) + Search + Filter Toggle */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            {/* Segmented Control Tabs - BỎ SỐ TRONG NGOẶC */}
            <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('medicines');
                  setSortBy('revenue_desc');
                }}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'medicines'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700'
                }`}
              >
                <Pill className="h-3.5 w-3.5" />
                <span>Thống kê dược phẩm & Thuốc</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('supplies');
                  setSortBy('revenue_desc');
                }}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'supplies'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Vật tư tiêu hao phòng khám</span>
              </button>
            </div>

            {/* Search and Advanced Filters Trigger */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <div className="relative w-full sm:w-64 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'medicines'
                      ? 'Tìm tên thuốc, mã, hãng...'
                      : 'Tìm tên vật tư, quy cách...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Toggle Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'border-teal-300 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600" />
                <span className="hidden sm:inline">Bộ lọc</span>
                {hasActiveFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Đặt lại bộ lọc"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters Bar */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 bg-teal-50/30 p-3 rounded-md border border-teal-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
              {activeTab === 'medicines' ? (
                <>
                  {/* Filter: Category */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nhóm dược lý nha khoa
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả nhóm dược phẩm</option>
                      <option value="Kháng sinh">Kháng sinh nha khoa</option>
                      <option value="Giảm đau - Kháng viêm">Giảm đau & Kháng viêm</option>
                      <option value="Sát khuẩn & Vệ sinh miệng">Sát khuẩn & Vệ sinh miệng</option>
                      <option value="Dược phẩm nha khoa khác">Dược phẩm nha khoa khác</option>
                    </select>
                  </div>

                  {/* Filter: Stock Level */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mức tồn kho dược
                    </label>
                    <select
                      value={selectedStockLevel}
                      onChange={(e) => setSelectedStockLevel(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả mức tồn kho</option>
                      <option value="low">Cảnh báo sắp hết (&lt; 30)</option>
                      <option value="safe">Tồn kho an toàn (&ge; 30)</option>
                      <option value="out">Hết hàng trong kho (= 0)</option>
                    </select>
                  </div>

                  {/* Filter: Usage Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Trạng thái phát sinh
                    </label>
                    <select
                      value={selectedUsageStatus}
                      onChange={(e) => setSelectedUsageStatus(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="used">Đã phát sinh kê đơn (&gt; 0)</option>
                      <option value="unused">Chưa sử dụng trong kỳ</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Sắp xếp kết quả
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="revenue_desc">Tiền thu được: Cao nhất</option>
                      <option value="revenue_asc">Tiền thu được: Thấp nhất</option>
                      <option value="quantity_desc">Số lượng dùng: Nhiều nhất</option>
                      <option value="prescription_desc">Số đơn thuốc: Nhiều nhất</option>
                      <option value="stock_asc">Tồn kho: Thấp nhất (Cần bù)</option>
                      <option value="stock_desc">Tồn kho: Nhiều nhất</option>
                      <option value="price_desc">Đơn giá: Cao nhất</option>
                      <option value="name_asc">Tên thuốc: A - Z</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Filter for supplies */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tình trạng tồn kho vật tư
                    </label>
                    <select
                      value={selectedStockLevel}
                      onChange={(e) => setSelectedStockLevel(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả tình trạng</option>
                      <option value="low">Cần nhập thêm (&le; Tối thiểu)</option>
                      <option value="safe">Tồn kho đầy đủ (&gt; Tối thiểu)</option>
                    </select>
                  </div>

                  {/* Sort by for supplies */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Sắp xếp kết quả
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="quantity_desc">Xuất dùng: Nhiều nhất</option>
                      <option value="stock_asc">Tồn kho: Ít nhất</option>
                      <option value="stock_desc">Tồn kho: Nhiều nhất</option>
                      <option value="name_asc">Tên vật tư: A - Z</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active Filter Chips & Summary count */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
              <span>Đang hiển thị:</span>
              <span className="font-semibold text-slate-800">
                {activeTab === 'medicines'
                  ? `${filteredMedicines.length} / ${medicines.length} loại thuốc`
                  : `${filteredSupplies.length} / ${supplies.length} vật tư`}
              </span>
              {periodLabel && (
                <span className="text-teal-700 font-medium">({periodLabel})</span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-medium text-teal-700 hover:text-teal-900 underline"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Medicines Usage Table - Scrollable Internally with Sticky Header */}
        {activeTab === 'medicines' && (
          <div className="overflow-x-auto overflow-y-auto max-h-[380px] sm:max-h-[430px] border-b border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="px-4 py-3">Tên thuốc & Nhóm dược lý</th>
                  <th className="px-4 py-3">Mã & Hãng sản xuất</th>
                  <th className="px-4 py-3">Đơn vị</th>
                  <th className="px-4 py-3">Đơn giá</th>
                  <th className="px-4 py-3 text-center">Tồn kho</th>
                  <th className="px-4 py-3 text-center">Số lượng đã dùng</th>
                  <th className="px-4 py-3 text-center">Số đơn thuốc</th>
                  <th className="px-4 py-3 text-right">Tiền thu được</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Pill className="h-6 w-6 text-slate-300" />
                        <p className="font-medium text-slate-500">
                          Không tìm thấy loại thuốc nào phù hợp với bộ lọc hiện tại
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 text-xs text-teal-700 font-semibold underline hover:text-teal-900"
                        >
                          Xóa bộ lọc để xem toàn bộ danh mục
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((m, idx) => {
                    const isUsed = Number(m.quantityUsed) > 0;
                    const isLowStock = Number(m.stockQuantity) < 30;
                    const cat = categorizeMedicine(m.name);
                    const rev = Number(m.totalRevenue) || 0;

                    return (
                      <tr
                        key={m.medicineId || idx}
                        className={`hover:bg-teal-50/30 transition-colors ${
                          isUsed ? 'bg-teal-50/10' : ''
                        }`}
                      >
                        {/* 1. Name & Category */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                isUsed ? 'bg-teal-600' : 'bg-slate-300'
                              }`}
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {m.name}
                              </span>
                              <span className="text-[10px] text-teal-700 font-medium">
                                {cat}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Code & Manufacturer */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-600 text-[11px] block">
                            {m.code || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {m.manufacturer || '-'}
                          </span>
                        </td>

                        {/* 3. Unit */}
                        <td className="px-4 py-3 font-medium text-slate-600">
                          {m.unit}
                        </td>

                        {/* 4. Price */}
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {formatCurrency(m.price)}
                        </td>

                        {/* 5. Stock Level */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                              isLowStock
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200/60'
                            }`}
                          >
                            {formatNumber(m.stockQuantity)}
                          </span>
                        </td>

                        {/* 6. Quantity Used */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                              isUsed
                                ? 'bg-teal-50 text-teal-800 border border-teal-200/70'
                                : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            {formatNumber(m.quantityUsed)} {m.unit}
                          </span>
                        </td>

                        {/* 7. Prescriptions Count */}
                        <td className="px-4 py-3 text-center text-slate-600">
                          {Number(m.prescriptionCount) > 0 ? (
                            <span className="font-semibold text-slate-800">
                              {m.prescriptionCount} đơn
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 8. Revenue */}
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`text-sm font-bold ${
                              isUsed ? 'text-teal-900' : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(rev)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Supplies Table - Scrollable Internally with Sticky Header */}
        {activeTab === 'supplies' && (
          <div className="overflow-x-auto overflow-y-auto max-h-[380px] sm:max-h-[430px] border-b border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="px-4 py-3">Tên vật tư nha khoa</th>
                  <th className="px-4 py-3">Đơn vị tính</th>
                  <th className="px-4 py-3 text-center">Tồn kho hiện tại</th>
                  <th className="px-4 py-3 text-center">Mức tối thiểu</th>
                  <th className="px-4 py-3 text-center">Số lượng xuất dùng</th>
                  <th className="px-4 py-3 text-center">Trạng thái kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredSupplies.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Package className="h-6 w-6 text-slate-300" />
                        <p className="font-medium text-slate-500">
                          Không tìm thấy vật tư nào phù hợp với bộ lọc
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 text-xs text-teal-700 font-semibold underline hover:text-teal-900"
                        >
                          Xóa bộ lọc để xem toàn bộ danh sách
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSupplies.map((s, idx) => {
                    const isLow = s.stockQuantity <= (s.minStock || 20);

                    return (
                      <tr
                        key={s.supplyId || idx}
                        className="hover:bg-teal-50/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {s.suppliesName}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">
                          {s.unit}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {formatNumber(s.stockQuantity)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 font-medium">
                          {formatNumber(s.minStock || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 border border-teal-200/60">
                            {formatNumber(s.exportedQuantity)} {s.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                              <AlertTriangle className="h-3 w-3" /> Cần nhập thêm
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200">
                              <CheckCircle2 className="h-3 w-3" /> Đầy đủ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary of the filtered medicines/supplies */}
        <div className="px-5 py-3 bg-teal-50/30 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
            <span>
              {activeTab === 'medicines'
                ? `Tổng tiền thuốc lọc được: ${formatCurrency(
                    filteredMedicines.reduce(
                      (sum, m) => sum + (Number(m.totalRevenue) || 0),
                      0
                    )
                  )} (${filteredMedicines.reduce(
                    (sum, m) => sum + (Number(m.quantityUsed) || 0),
                    0
                  )} đơn vị đã cấp / ${filteredMedicines.reduce(
                    (sum, m) => sum + (Number(m.prescriptionCount) || 0),
                    0
                  )} đơn thuốc)`
                : `Tổng số lượng xuất lọc được: ${filteredSupplies.reduce(
                    (sum, s) => sum + (Number(s.exportedQuantity) || 0),
                    0
                  )} đơn vị (${filteredSupplies.filter((s) => s.stockQuantity <= (s.minStock || 20)).length} mặt hàng cần nhập)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

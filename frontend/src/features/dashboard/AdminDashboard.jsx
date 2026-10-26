import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download,
  Printer,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dashboardService from '../../services/dashboard.service';
import FilterBar from './admin/FilterBar';
import OverviewTab from './admin/OverviewTab';
import DetailModal from './admin/DetailModal';
import ReportPrintModal from './admin/ReportPrintModal';

export default function AdminDashboard() {
  // Global Filter State (defaults to YEAR 2026 where data exists)
  const [filter, setFilter] = useState({
    filterType: 'YEAR',
    year: 2026,
    month: 10,
    quarter: 4,
    date: '2026-10-20',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  });

  // Data states for each section
  const [overviewData, setOverviewData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const [medicineData, setMedicineData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [promotionData, setPromotionData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);

  const [loading, setLoading] = useState(false);

  // Modal Dialog state for viewing full section details from Overview
  const [activeModalModule, setActiveModalModule] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Print modal state for Overview Report
  const [showOverviewPrintModal, setShowOverviewPrintModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch individual module detail data
  const fetchModuleData = useCallback(async (moduleKey, currentFilter = filter) => {
    switch (moduleKey) {
      case 'revenue': {
        const data = await dashboardService.getRevenue(currentFilter);
        setRevenueData(data);
        return data;
      }
      case 'staff': {
        const data = await dashboardService.getStaff(currentFilter);
        setStaffData(data);
        return data;
      }
      case 'medicines': {
        const data = await dashboardService.getMedicines(currentFilter);
        setMedicineData(data);
        return data;
      }
      case 'services': {
        const data = await dashboardService.getServices(currentFilter);
        setServiceData(data);
        return data;
      }
      case 'promotions': {
        const data = await dashboardService.getPromotions(currentFilter);
        setPromotionData(data);
        return data;
      }
      case 'appointments': {
        const data = await dashboardService.getAppointments(currentFilter);
        setAppointmentData(data);
        return data;
      }
      default:
        return null;
    }
  }, [filter]);

  // Handle open modal dialog and load fresh data
  const handleOpenDetailModal = async (moduleKey) => {
    setActiveModalModule(moduleKey);
    setModalLoading(true);
    try {
      await fetchModuleData(moduleKey, filter);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết module:', err);
      toast.error('Không thể tải chi tiết: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  // Fetch data for overview and currently open modal (if any)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getOverview(filter);
      setOverviewData(data);
      if (activeModalModule) {
        fetchModuleData(activeModalModule, filter);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard:', err);
      toast.error('Không thể tải dữ liệu thống kê: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filter, activeModalModule, fetchModuleData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Current active period label
  const periodLabel =
    overviewData?.periodLabel ||
    revenueData?.periodLabel ||
    staffData?.periodLabel ||
    medicineData?.periodLabel ||
    serviceData?.periodLabel ||
    promotionData?.periodLabel ||
    appointmentData?.periodLabel ||
    'Năm 2026';

  const handlePrint = () => {
    setShowOverviewPrintModal(true);
  };

  // Xuất file Excel (.csv UTF-8 BOM chuẩn tiếng Việt mở trực tiếp trên Microsoft Excel)
  const handleExportCSV = () => {
    if (!overviewData) {
      toast.error('Chưa có dữ liệu thống kê để xuất');
      return;
    }

    const rev = overviewData.revenue || {};
    const staff = overviewData.staff || {};
    const meds = overviewData.medicines || {};
    const srv = overviewData.services || {};
    const appts = overviewData.appointments || {};
    const promos = overviewData.promotions || {};

    const csvRows = [
      ['PHÒNG KHÁM CHUYÊN KHOA RĂNG HÀM MẶT CROWN DENTAL'],
      ['Địa chỉ: 12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh'],
      ['Hotline: 1900 6868 - Giấy phép hoạt động: 04521/BYT-CCHN'],
      [''],
      ['BÁO CÁO THỐNG KÊ QUẢN TRỊ NHA KHOA TOÀN DIỆN'],
      [`Kỳ thống kê: ${periodLabel || 'Năm 2026'}`],
      [`Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}`],
      [''],
      ['I. TỔNG HỢP CHỈ SỐ DOANH THU & DÒNG TIỀN'],
      ['Chỉ tiêu quản trị', 'Giá trị ghi nhận', 'Đơn vị tính'],
      ['Tổng tiền hóa đơn phát sinh', rev.invoiceRevenue || 0, 'VNĐ'],
      ['Thực thu (Tiền về thực tế)', rev.actualCollected || 0, 'VNĐ'],
      ['Công nợ còn lại chưa thu', rev.remainingDebt || 0, 'VNĐ'],
      ['Tổng số lượng hóa đơn', rev.totalInvoices || 0, 'Hóa đơn'],
      ['Doanh thu dịch vụ khám chữa', rev.serviceAmount || 0, 'VNĐ'],
      ['Doanh thu bán thuốc quầy', rev.medicineAmount || 0, 'VNĐ'],
      [''],
      ['II. THỐNG KÊ LỊCH HẸN & TIẾP NHẬN BỆNH NHÂN'],
      ['Chỉ tiêu quản trị', 'Số lượng', 'Tỷ lệ hoàn thành'],
      ['Tổng số lịch hẹn tiếp nhận', appts.totalAppointments || 0, '100%'],
      ['Ca khám điều trị hoàn thành', appts.completedAppointments || 0, `${appts.completionRate || 0}%`],
      ['Lịch hẹn bị hủy', appts.cancelledAppointments || 0, `${appts.cancellationRate || 0}%`],
      ['Lịch đã xác nhận / Đang chờ', (appts.confirmedAppointments || 0) + (appts.waitingAppointments || 0), '-'],
      [''],
      ['III. THỐNG KÊ DƯỢC PHẨM & VẬT TƯ TIÊU HAO'],
      ['Chỉ tiêu quản trị', 'Số lượng', 'Giá trị ghi nhận'],
      ['Tổng danh mục thuốc nha khoa', meds.totalMedicinesCount || 0, 'Mặt hàng'],
      ['Số loại thuốc đã phát sinh kê đơn', meds.totalUsedCount || 0, 'Mặt hàng'],
      ['Tổng số lượng đơn vị đã cấp phát', meds.totalUnitsDispensed || 0, 'Đơn vị viên/lọ'],
      ['Thuốc dưới định mức an toàn (< 30)', meds.lowStockCount || 0, 'Mặt hàng cần nhập'],
      ['Doanh số quầy thuốc ghi nhận', meds.totalRevenue || 0, 'VNĐ'],
      [''],
      ['IV. THỐNG KÊ DỊCH VỤ NHA KHOA'],
      ['Chỉ tiêu quản trị', 'Số lượng', 'Giá trị ghi nhận'],
      ['Tổng danh mục dịch vụ nha khoa', srv.totalServices || 0, 'Dịch vụ'],
      ['Tổng lượt chỉ định kỹ thuật', srv.totalUsageCount || 0, 'Lượt'],
      ['Doanh thu dịch vụ', srv.totalRevenue || 0, 'VNĐ'],
      ['Tăng trưởng so với kỳ trước', `${srv.growthRate || 0}%`, '-'],
      [''],
      ['V. THỐNG KÊ NHÂN SỰ & BÁC SĨ'],
      ['Chỉ tiêu quản trị', 'Số lượng', 'Ghi chú'],
      ['Tổng nhân sự cơ sở phòng khám', staff.totalStaff || 0, 'Người'],
      ['Bác sĩ nha khoa điều trị', staff.totalDoctors || 0, 'Bác sĩ'],
      ['Lễ tân / Tiếp đón / Thu ngân', staff.totalReceptionists || staff.totalEmployees || 0, 'Nhân viên'],
      [''],
      ['VI. CHƯƠNG TRÌNH ƯU ĐÃI & TRI ÂN'],
      ['Chỉ tiêu quản trị', 'Số lượng', 'Giá trị ghi nhận'],
      ['Tổng số chương trình ưu đãi', promos.totalPromotions || 0, 'Chương trình'],
      ['Chương trình đang áp dụng', promos.activePromotions || 0, 'Chương trình'],
      ['Số hóa đơn có áp dụng ưu đãi', promos.totalInvoicesApplied || 0, 'Hóa đơn'],
      ['Tổng ngân sách chiết khấu giảm giá', promos.totalDiscountAmount || 0, 'VNĐ'],
    ];

    const csvContent = '\uFEFF' + csvRows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedPeriod = (periodLabel || 'nam_2026').replace(/\s+/g, '_').toLowerCase();
    a.download = `Bao_cao_nha_khoa_CrownDental_${sanitizedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất báo cáo Excel (.csv) thành công');
  };

  const handleExportJSON = () => {
    const exportObj = {
      period: periodLabel,
      exportTime: new Date().toISOString(),
      overviewData,
      revenueData,
      staffData,
      medicineData,
      serviceData,
      promotionData,
      appointmentData,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống tệp sao lưu JSON');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner - Gentle Medical Aesthetic & Professional Business Buttons */}
      <div className="rounded-xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 shadow-xs backdrop-blur-sm transition-all hover:border-slate-300/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-teal-800">
              <span>Crown Dental Clinic</span>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-slate-500">Trung tâm điều hành nha khoa</span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Báo Cáo & Thống Kê Nha Khoa
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 font-normal">
              Giám sát toàn diện doanh thu điều trị, bác sĩ nha khoa, kho vật tư răng miệng, dịch vụ và lịch hẹn
            </p>
          </div>

          {/* Action buttons with complete dental business logic */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            {/* Dropdown / Export Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Xuất dữ liệu báo cáo ra Excel hoặc sao lưu"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Xuất dữ liệu</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Định dạng dữ liệu xuất
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      handleExportCSV();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-teal-50/70 hover:text-teal-900 transition-colors group cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-teal-900 block">
                        Bảng tính Excel (.csv)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Chuẩn kế toán y tế (UTF-8 có dấu), mở bằng Excel
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      handleExportJSON();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-50 text-slate-700 transition-colors group cursor-pointer"
                  >
                    <FileCode className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700 block">
                        Tệp sao lưu hệ thống (.json)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Dữ liệu thô dùng cho đối soát & lưu trữ kỹ thuật
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* In Báo Cáo Button */}
            <button
              type="button"
              onClick={handlePrint}
              title="Xem trước & In Báo cáo Tổng quan Quản trị Nha khoa khổ A4"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 hover:border-teal-300 hover:text-teal-900 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-teal-700" />
              <span>In báo cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filter={filter}
        onChange={setFilter}
        onRefresh={fetchData}
        loading={loading}
        periodLabel={periodLabel}
      />

      {/* Main Overview Dashboard */}
      <OverviewTab
        data={overviewData}
        onOpenDetail={handleOpenDetailModal}
      />

      {/* Detail Modal Dialog: Focused purely on the selected module */}
      <DetailModal
        isOpen={Boolean(activeModalModule)}
        onClose={() => setActiveModalModule(null)}
        moduleKey={activeModalModule}
        data={
          activeModalModule === 'revenue'
            ? revenueData
            : activeModalModule === 'staff'
            ? staffData
            : activeModalModule === 'medicines'
            ? medicineData
            : activeModalModule === 'services'
            ? serviceData
            : activeModalModule === 'promotions'
            ? promotionData
            : activeModalModule === 'appointments'
            ? appointmentData
            : null
        }
        loading={modalLoading}
        periodLabel={periodLabel}
      />

      {/* Official Executive Dental Report Print Preview Dialog (Khổ giấy A4, Đầy đủ 6 phân hệ & Chữ ký) */}
      <ReportPrintModal
        open={showOverviewPrintModal}
        onClose={() => setShowOverviewPrintModal(false)}
        moduleKey="overview"
        data={overviewData}
        periodLabel={periodLabel}
      />
    </div>
  );
}

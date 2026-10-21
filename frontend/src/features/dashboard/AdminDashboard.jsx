import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Printer,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dashboardService from '../../services/dashboard.service';
import FilterBar from './admin/FilterBar';
import OverviewTab from './admin/OverviewTab';
import DetailModal from './admin/DetailModal';

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
    window.print();
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
    toast.success('Đã tải xuống dữ liệu báo cáo');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-700">
            <span>Crown Dental Clinic</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-500">Trung tâm điều hành nha khoa</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
            Báo Cáo & Thống Kê Nha Khoa
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Giám sát toàn diện doanh thu điều trị, bác sĩ nha khoa, kho vật tư răng miệng, dịch vụ và lịch hẹn
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Xuất dữ liệu</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>In báo cáo</span>
          </button>
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
    </div>
  );
}

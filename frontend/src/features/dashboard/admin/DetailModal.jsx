import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  DollarSign,
  Users,
  Pill,
  Sparkles,
  Tag,
  CalendarCheck,
  Calendar,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import RevenueSection from './RevenueSection';
import StaffSection from './StaffSection';
import MedicineSection from './MedicineSection';
import ServiceSection from './ServiceSection';
import PromotionSection from './PromotionSection';
import AppointmentSection from './AppointmentSection';
import ReportPrintModal from './ReportPrintModal';

const MODULE_CONFIG = {
  revenue: {
    id: 'revenue',
    title: 'Chi tiết Doanh thu & Dòng tiền',
    subtitle: 'Thống kê tổng hóa đơn, thực thu, công nợ và chi tiết cấu trúc tiền',
    icon: DollarSign,
    bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconBg: 'bg-emerald-600 text-white shadow-xs',
  },
  staff: {
    id: 'staff',
    title: 'Chi tiết Bác Sĩ Nha Khoa & Nhân Sự',
    subtitle: 'Đánh giá năng suất Bác sĩ (khám, điều trị, doanh thu) và Lễ tân (tiếp nhận, thu ngân)',
    icon: Users,
    bgBadge: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-600 text-white shadow-xs',
  },
  medicines: {
    id: 'medicines',
    title: 'Chi tiết Dược Phẩm & Vật Tư Nha Khoa',
    subtitle: 'Theo dõi loại thuốc sử dụng, số lượng cấp phát, doanh thu thuốc và tồn kho vật tư',
    icon: Pill,
    bgBadge: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-600 text-white shadow-xs',
  },
  services: {
    id: 'services',
    title: 'Chi tiết Dịch Vụ Nha Khoa',
    subtitle: 'Đo lường tần suất chỉ định, doanh thu theo tháng, tăng trưởng và cơ cấu chuyên khoa',
    icon: Sparkles,
    bgBadge: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-600 text-white shadow-xs',
  },
  promotions: {
    id: 'promotions',
    title: 'Chi tiết Ưu Đãi & Tri Ân Nụ Cười',
    subtitle: 'Thống kê mã ưu đãi, số hóa đơn áp dụng, doanh thu mang lại và tổng tiền giảm giá',
    icon: Tag,
    bgBadge: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-600 text-white shadow-xs',
  },
  appointments: {
    id: 'appointments',
    title: 'Chi tiết Lịch Hẹn Khám & Tái Khám',
    subtitle: 'Theo dõi tỷ lệ hoàn thành, hủy hẹn, xu hướng thời gian và phân bổ theo bác sĩ',
    icon: CalendarCheck,
    bgBadge: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-teal-600 text-white shadow-xs',
  },
};

export default function DetailModal({
  isOpen,
  onClose,
  moduleKey,
  data,
  loading = false,
  periodLabel = '',
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Preserve moduleKey during exit animation so content doesn't flicker or collapse
  const lastModuleKeyRef = useRef(moduleKey);
  if (moduleKey) {
    lastModuleKeyRef.current = moduleKey;
  }
  const effectiveModuleKey = moduleKey || lastModuleKeyRef.current;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showPrintModal) {
          setShowPrintModal(false);
          return;
        }
        if (isOpen) {
          if (isMaximized) {
            setIsMaximized(false);
          } else {
            onClose();
          }
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isMaximized, showPrintModal]);

  const currentConfig = MODULE_CONFIG[effectiveModuleKey] || MODULE_CONFIG.revenue;
  const Icon = currentConfig.icon;

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && effectiveModuleKey && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
            isMaximized ? 'p-1 sm:p-2' : 'p-3 sm:p-5'
          }`}
        >
          {/* Backdrop with smooth slow-motion fade & blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog Container - Cinematic ease & dynamic sizing */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.93, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 18 }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1], // Elegant cubic-bezier curve for smooth feel
            }}
            className={`relative w-full flex flex-col bg-white shadow-2xl border border-slate-200/90 overflow-hidden z-10 transition-all duration-300 ease-out ${
              isMaximized
                ? 'h-[98vh] max-w-[99vw] rounded-xl'
                : 'max-w-6xl max-h-[92vh] rounded-xl'
            }`}
          >
            {/* Sticky Header - Supports double-click to toggle maximize */}
            <div
              onDoubleClick={() => setIsMaximized(!isMaximized)}
              className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white/95 backdrop-blur-md select-none cursor-default"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md shadow-xs ${currentConfig.iconBg}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {currentConfig.title}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold border ${currentConfig.bgBadge}`}
                    >
                      <Calendar className="h-3 w-3" />
                      {periodLabel || 'Năm 2026'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                    {currentConfig.subtitle}
                  </p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  title="In báo cáo này"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden md:inline">In báo cáo</span>
                </button>

                {/* Maximize / Restore Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? 'Thu nhỏ cửa sổ (Esc)' : 'Phóng to toàn màn hình'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all shadow-xs"
                >
                  {isMaximized ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  title="Đóng cửa sổ (Esc)"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all shadow-xs ml-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body: Displays the specific module details */}
            <div className="overflow-y-auto p-5 sm:p-6 bg-slate-50/50 flex-1">
              {loading ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                  <p className="text-sm font-semibold">Đang tải số liệu chi tiết...</p>
                </div>
              ) : (
                <>
                  {effectiveModuleKey === 'revenue' && (
                    <RevenueSection data={data} loading={loading} />
                  )}
                  {effectiveModuleKey === 'staff' && (
                    <StaffSection data={data} loading={loading} />
                  )}
                  {effectiveModuleKey === 'medicines' && (
                    <MedicineSection data={data} loading={loading} />
                  )}
                  {effectiveModuleKey === 'services' && (
                    <ServiceSection data={data} loading={loading} />
                  )}
                  {effectiveModuleKey === 'promotions' && (
                    <PromotionSection data={data} loading={loading} />
                  )}
                  {effectiveModuleKey === 'appointments' && (
                    <AppointmentSection data={data} loading={loading} />
                  )}
                </>
              )}
            </div>

            {/* Clean Sticky Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
                <span className="font-medium text-slate-600">{periodLabel || 'Năm 2026'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Standard Dental Business Report Print Preview & Print Dialog */}
    <ReportPrintModal
      open={showPrintModal}
      onClose={() => setShowPrintModal(false)}
      moduleKey={effectiveModuleKey}
      data={data}
      periodLabel={periodLabel}
    />
  </>
);
}

import React from 'react';
import {
  DollarSign,
  Users,
  Pill,
  Sparkles,
  Tag,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Activity,
  CheckCircle2,
  Stethoscope,
  Smile,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from './dashboardUtils';

// Biểu tượng Răng Nha Khoa Chuẩn Y Khoa
export function ToothIcon({ className = 'h-4 w-4', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7 3C4.5 3 2.5 5 2.5 7.5c0 3 1.5 5.5 2.5 8 .8 2 1.5 5.5 3 5.5s1.8-3.5 2.5-5.5c.5-1.5 1-1.5 1.5-1.5s1 0 1.5 1.5c.7 2 1 5.5 2.5 5.5s2.2-3.5 3-5.5c1-2.5 2.5-5 2.5-8C21.5 5 19.5 3 17 3c-2 0-3.5 1.2-5 1.2S9 3 7 3z" />
    </svg>
  );
}

export default function OverviewTab({ data, onSelectTab, onOpenDetail }) {
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Đang tải dữ liệu tổng quan nha khoa...
      </div>
    );
  }

  const { revenue, staff, medicines, services, promotions, appointments } = data;

  const handleOpen = (tabKey) => {
    if (onOpenDetail) {
      onOpenDetail(tabKey);
    } else if (onSelectTab) {
      onSelectTab(tabKey);
    }
  };

  // Tính toán số liệu điều hành thực tế
  const invoiceTotal = revenue?.invoiceRevenue || 0;
  const actualCollected = revenue?.actualCollected || 0;
  const debtTotal = revenue?.remainingDebt || 0;
  const collectionRate = invoiceTotal > 0 ? Math.min(100, Math.round((actualCollected / invoiceTotal) * 100)) : 100;
  const debtRate = 100 - collectionRate;

  const totalStaff = staff?.totalStaff || 0;
  const doctors = staff?.totalDoctors || 0;
  const doctorRatio = totalStaff > 0 ? Math.round((doctors / totalStaff) * 100) : 0;

  const totalAppts = appointments?.totalAppointments || 0;
  const completedAppts = appointments?.completedAppointments || 0;
  const cancelledAppts = appointments?.cancelledAppointments || 0;
  const completionRate = appointments?.completionRate || (totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0);
  const cancellationRate = appointments?.cancellationRate || (totalAppts > 0 ? Math.round((cancelledAppts / totalAppts) * 100) : 0);

  const avgInvoiceValue = (revenue?.totalInvoices && revenue.totalInvoices > 0)
    ? Math.round(invoiceTotal / revenue.totalInvoices)
    : 0;

  const avgServiceValue = (services?.totalUsageCount && services.totalUsageCount > 0)
    ? Math.round((services?.totalRevenue || 0) / services.totalUsageCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. Executive Dental KPI Pulse Bar - Băng Chỉ Số Vận Hành Nha Khoa Thực Tế */}
      <div className="rounded-lg border border-cyan-100/90 bg-white p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
              <ToothIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 flex-wrap">
                Chỉ Số Vận Hành Nha Khoa Thực Tế
                <span className="rounded bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 border border-cyan-200/80">
                  Chuẩn Y Khoa
                </span>
                {data?.branchName && (
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                      data?.branchId
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {data.branchName}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Dòng tiền điều trị, ca thủ thuật nha khoa & kho vật tư
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Tỷ lệ thu hồi dòng tiền */}
          <div className="rounded-md bg-slate-50/70 p-3 border border-slate-200/60 hover:border-cyan-200 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Thu hồi tiền điều trị</span>
              <span className="font-bold text-cyan-700">{collectionRate}%</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {formatCurrency(actualCollected)}
              </span>
            </div>
            {/* Dental progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 flex">
              <div
                className="bg-cyan-600 transition-all duration-500"
                style={{ width: `${collectionRate}%` }}
                title={`Thực thu: ${collectionRate}%`}
              />
              <div
                className="bg-amber-400 transition-all duration-500"
                style={{ width: `${debtRate}%` }}
                title={`Công nợ: ${debtRate}%`}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium text-cyan-800">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                Đã thu
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Nợ: {formatCurrency(debtTotal)}
              </span>
            </div>
          </div>

          {/* KPI 2: Dịch vụ răng miệng */}
          <div className="rounded-md bg-slate-50/70 p-3 border border-slate-200/60 hover:border-teal-200 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Dịch vụ nha khoa</span>
              <span className="font-bold text-teal-700">{services?.totalUsageCount || 0} lượt</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {formatCurrency(services?.totalRevenue)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-teal-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(15, (services?.totalUsageCount || 0) * 3))}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>TB/lượt dịch vụ:</span>
              <span className="font-semibold text-teal-800">
                {avgServiceValue > 0 ? formatCurrency(avgServiceValue) : 'Đang tính'}
              </span>
            </div>
          </div>

          {/* KPI 3: Cơ cấu nhân sự bác sĩ nha khoa */}
          <div className="rounded-md bg-slate-50/70 p-3 border border-slate-200/60 hover:border-sky-200 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Bác sĩ chuyên khoa răng</span>
              <span className="font-bold text-sky-700">{doctorRatio}% đội ngũ</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {doctors} <span className="text-xs font-normal text-slate-500">Nha sĩ</span>
              </span>
              <span className="text-xs text-slate-500">
                / {totalStaff} nhân sự
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-sky-600 transition-all duration-500"
                style={{ width: `${doctorRatio}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Phụ tá & Lễ tân:</span>
              <span className="font-semibold text-slate-700">{staff?.totalEmployees || 0} nhân sự</span>
            </div>
          </div>

          {/* KPI 4: Tiếp nhận điều trị & Cảnh báo vật tư */}
          <div className="rounded-md bg-slate-50/70 p-3 border border-slate-200/60 hover:border-cyan-200 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Tiếp nhận hoàn tất</span>
              <span className="font-bold text-cyan-700">{completionRate}%</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {completedAppts} <span className="text-xs font-normal text-slate-500">/ {totalAppts} ca</span>
              </span>
              {(medicines?.lowStockCount || 0) > 0 ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                  <AlertCircle className="h-3 w-3" />
                  {medicines?.lowStockCount} vật tư sắp cạn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Kho vật tư đủ
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 flex">
              <div
                className="bg-cyan-600 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
              <div
                className="bg-rose-400 transition-all duration-500"
                style={{ width: `${cancellationRate}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Hủy/Vắng hẹn:</span>
              <span className="font-semibold text-rose-600">{cancelledAppts} ca ({cancellationRate}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6 Core Dental Modules - Cân Đối & Đậm Chất Nha Khoa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Module 1: Doanh thu */}
        <div className="group rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-cyan-300 hover:shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 min-h-[50px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">Doanh thu & Dòng tiền</h3>
                  <p className="text-[11px] text-slate-500 truncate">Hóa đơn, thực thu & công nợ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen('revenue')}
                className="group/btn inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 active:scale-90 hover:scale-105 transition-all duration-300 ease-out cursor-pointer shadow-2xs"
              >
                <span>Chi tiết</span>
                <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Doanh thu hóa đơn phát sinh</span>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatCurrency(revenue?.invoiceRevenue)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />
                    Thực thu ({collectionRate}%)
                  </span>
                  <p className="text-sm font-bold text-cyan-800 mt-1 truncate">
                    {formatCurrency(revenue?.actualCollected)}
                  </p>
                </div>

                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    Công nợ ({debtRate}%)
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                    {formatCurrency(revenue?.remainingDebt)}
                  </p>
                </div>
              </div>

              {/* Collection Progress */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
                <div
                  className="bg-cyan-600"
                  style={{ width: `${collectionRate}%` }}
                />
                <div
                  className="bg-amber-400"
                  style={{ width: `${debtRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Tổng số hóa đơn:</span>
                <span className="font-semibold text-slate-800">
                  {revenue?.totalInvoices || 0} HĐ {avgInvoiceValue > 0 && `(TB: ${formatCurrency(avgInvoiceValue)})`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Nhân sự Nha Khoa */}
        <div className="group rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-cyan-300 hover:shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 min-h-[50px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">Bác Sĩ & Nhân Sự</h3>
                  <p className="text-[11px] text-slate-500 truncate">Nha sĩ chuyên khoa & phụ tá</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen('staff')}
                className="group/btn inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 active:scale-90 hover:scale-105 transition-all duration-300 ease-out cursor-pointer shadow-2xs"
              >
                <span>Chi tiết</span>
                <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Tổng nhân lực phòng khám</span>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatNumber(staff?.totalStaff)} <span className="text-xs font-normal text-slate-500">nhân sự trực</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">Nha sĩ điều trị</span>
                  <p className="text-base font-bold text-sky-800 mt-0.5 truncate">
                    {staff?.totalDoctors || 0} <span className="text-xs font-normal text-slate-500">BS ({doctorRatio}%)</span>
                  </p>
                </div>

                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">Phụ tá & Lễ tân</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5 truncate">
                    {staff?.totalEmployees || 0} <span className="text-xs font-normal text-slate-500">NV</span>
                  </p>
                </div>
              </div>

              {/* Staff Ratio Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-sky-600"
                  style={{ width: `${doctorRatio}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Lễ tân tiếp đón:</span>
                <span className="font-semibold text-slate-800">{staff?.totalReceptionists || 0} nhân sự</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Vật tư & Thuốc Nha Khoa */}
        <div className="group rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-cyan-300 hover:shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 min-h-[50px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 border border-teal-200/80 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                  <Pill className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">Dược Phẩm & Vật Tư</h3>
                  <p className="text-[11px] text-slate-500 truncate">Vật tư tiêu hao & thuốc cấp phát</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen('medicines')}
                className="group/btn inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 active:scale-90 hover:scale-105 transition-all duration-300 ease-out cursor-pointer shadow-2xs"
              >
                <span>Chi tiết</span>
                <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Doanh thu thuốc & vật tư</span>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatCurrency(medicines?.totalRevenue)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">Danh mục đã dùng</span>
                  <p className="text-base font-bold text-teal-800 mt-0.5 truncate">
                    {medicines?.totalUsedCount || 0} / {medicines?.totalMedicinesCount || 0}
                  </p>
                </div>

                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">Số lượng cấp</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5 truncate">
                    {formatNumber(medicines?.totalUnitsDispensed)} <span className="text-xs font-normal text-slate-500">đơn vị</span>
                  </p>
                </div>
              </div>

              {/* Usage ratio bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-teal-600"
                  style={{
                    width: `${medicines?.totalMedicinesCount
                        ? Math.min(100, Math.round(((medicines?.totalUsedCount || 0) / medicines.totalMedicinesCount) * 100))
                        : 0
                      }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Cảnh báo tồn kho:</span>
                {(medicines?.lowStockCount || 0) > 0 ? (
                  <span className="font-bold text-rose-600 truncate">
                    {medicines?.lowStockCount} mặt hàng sắp cạn
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600 truncate">Đầy đủ định mức</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module 4: Dịch vụ Nha khoa */}
        <div className="group rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-cyan-300 hover:shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 min-h-[50px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/80 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                  <ToothIcon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">Dịch Vụ</h3>
                  <p className="text-[11px] text-slate-500 truncate">Khám, trám, nhổ, niềng & sứ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen('services')}
                className="group/btn inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 active:scale-90 hover:scale-105 transition-all duration-300 ease-out cursor-pointer shadow-2xs"
              >
                <span>Chi tiết</span>
                <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Doanh thu dịch vụ điều trị</span>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatCurrency(services?.totalRevenue)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">Lượt chỉ định</span>
                  <p className="text-base font-bold text-cyan-800 mt-0.5 truncate">
                    {services?.totalUsageCount || 0} <span className="text-xs font-normal text-slate-500">lượt</span>
                  </p>
                </div>

                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">Danh mục DV</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5 truncate">
                    {services?.totalServices || 0} <span className="text-xs font-normal text-slate-500">dịch vụ</span>
                  </p>
                </div>
              </div>

              {/* Growth indicator bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-cyan-600"
                  style={{ width: `${Math.min(100, Math.max(20, (services?.growthRate || 100)))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Tăng trưởng dịch vụ:</span>
                <span className="inline-flex items-center gap-0.5 font-bold text-cyan-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {formatPercent(services?.growthRate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 5: Khuyến mãi & Tri Ân Nụ Cười */}
        <div className="group rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-cyan-300 hover:shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 min-h-[50px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                  <Tag className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">Ưu Đãi & Tri Ân</h3>
                  <p className="text-[11px] text-slate-500 truncate">Voucher & chăm sóc khách hàng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen('promotions')}
                className="group/btn inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 active:scale-90 hover:scale-105 transition-all duration-300 ease-out cursor-pointer shadow-2xs"
              >
                <span>Chi tiết</span>
                <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Tổng tiền giảm cho khách hàng</span>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatCurrency(promotions?.totalDiscountAmount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">HĐ áp dụng mã</span>
                  <p className="text-base font-bold text-rose-700 mt-0.5 truncate">
                    {promotions?.totalInvoicesApplied || 0} <span className="text-xs font-normal text-slate-500">HĐ</span>
                  </p>
                </div>

                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 block truncate">Đang hoạt động</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5 truncate">
                    {promotions?.activePromotions || 0} / {promotions?.totalPromotions || 0}
                  </p>
                </div>
              </div>

              {/* Campaign active bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-rose-500"
                  style={{
                    width: `${promotions?.totalPromotions
                        ? Math.round(((promotions?.activePromotions || 0) / promotions.totalPromotions) * 100)
                        : 0
                      }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Lượt dùng coupon:</span>
                <span className="font-semibold text-slate-800">{promotions?.totalUsageCount || 0} lượt</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 6: Lịch Hẹn Khám Răng */}
        <div className="group rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-cyan-300 hover:shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 min-h-[50px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <CalendarCheck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">Lịch Hẹn & Tái Khám</h3>
                  <p className="text-[11px] text-slate-500 truncate">Khám mới, tái khám & điều trị</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen('appointments')}
                className="group/btn inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 active:scale-90 hover:scale-105 transition-all duration-300 ease-out cursor-pointer shadow-2xs"
              >
                <span>Chi tiết</span>
                <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Tổng số lịch hẹn tiếp nhận</span>
                <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatNumber(appointments?.totalAppointments)} <span className="text-xs font-normal text-slate-500">lịch hẹn</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />
                    Đã khám ({completionRate}%)
                  </span>
                  <p className="text-base font-bold text-cyan-800 mt-0.5 truncate">
                    {appointments?.completedAppointments || 0} <span className="text-xs font-normal text-slate-500">ca</span>
                  </p>
                </div>

                <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    Hủy hẹn ({cancellationRate}%)
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5 truncate">
                    {appointments?.cancelledAppointments || 0} <span className="text-xs font-normal text-slate-500">ca</span>
                  </p>
                </div>
              </div>

              {/* Appointment Status Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
                <div
                  className="bg-cyan-600"
                  style={{ width: `${completionRate}%` }}
                />
                <div
                  className="bg-rose-400"
                  style={{ width: `${cancellationRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Đang chờ / Xác nhận:</span>
                <span className="font-semibold text-slate-800">{appointments?.confirmedAppointments || 0} lịch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

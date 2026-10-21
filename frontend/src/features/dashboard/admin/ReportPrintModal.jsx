import React, { useRef } from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from './dashboardUtils';

// Helper categorize dental medications
const categorizeMedicine = (name = '') => {
  const lower = name.toLowerCase();
  if (/amox|clinda|augmen|cefix|azithro|metro|spira|rodo|kháng sinh/.test(lower)) {
    return 'Kháng sinh nha khoa';
  }
  if (/para|ibu|pana|efferal|diclo|cele|melo|alpha|predni|giảm đau|kháng viêm/.test(lower)) {
    return 'Giảm đau - Kháng viêm';
  }
  if (/chlorhex|beta|súc miệng|mouthwash|kin|elu|sát khuẩn/.test(lower)) {
    return 'Sát khuẩn & Vệ sinh miệng';
  }
  return 'Dược phẩm nha khoa khác';
};

export default function ReportPrintModal({
  open,
  onClose,
  moduleKey,
  data,
  periodLabel = '',
}) {
  if (!open || !data) return null;

  const printDate = new Date();
  const printDateFormatted = printDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const printTimeFormatted = printDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  // Module report configurations matching exact database DTO fields
  const getReportMeta = () => {
    switch (moduleKey) {
      case 'revenue': {
        const invRev = data.invoiceRevenue ?? data.totalInvoiceAmount ?? data.totalAmount ?? 0;
        const actRev = data.actualCollected ?? data.totalActualCollected ?? 0;
        const debtRev = data.remainingDebt ?? data.totalRemainingDebt ?? 0;
        const invCount = data.totalInvoices ?? data.invoiceCount ?? 0;
        return {
          code: 'BC-TC-DTHU',
          title: 'BÁO CÁO QUẢN TRỊ DOANH THU & DÒNG TIỀN',
          subtitle: 'Kiểm toán tổng tiền hóa đơn, thực thu, công nợ và hình thức thanh toán',
          kpis: [
            { label: 'Tổng tiền hóa đơn', value: formatCurrency(invRev) },
            { label: 'Thực thu thực tế', value: formatCurrency(actRev) },
            { label: 'Tổng nợ chưa thu', value: formatCurrency(debtRev) },
            { label: 'Tổng số hóa đơn', value: `${formatNumber(invCount)} HĐ` },
          ],
        };
      }
      case 'staff': {
        const totalStaff = data.totalStaff ?? data.totalStaffCount ?? 0;
        const totalDoctors = data.totalDoctors ?? data.totalDentistsCount ?? 0;
        const totalEmployees = data.totalReceptionists ?? data.totalEmployees ?? data.totalReceptionistsCount ?? 0;
        const docRevenue = (data.doctors || []).reduce(
          (sum, d) => sum + (Number(d.serviceRevenue) || 0),
          0
        ) || data.totalRevenue || 0;
        return {
          code: 'BC-NS-BS',
          title: 'BÁO CÁO NĂNG SUẤT BÁC SĨ & ĐỘI NGŨ NHÂN SỰ',
          subtitle: 'Đánh giá khối lượng điều trị, ca khám hoàn thành và doanh thu theo nhân sự',
          kpis: [
            { label: 'Tổng nhân sự', value: `${formatNumber(totalStaff)} người` },
            { label: 'Bác sĩ điều trị', value: `${formatNumber(totalDoctors)} BS` },
            { label: 'Lễ tân / Nhân viên', value: `${formatNumber(totalEmployees)} NV` },
            { label: 'Doanh thu điều trị', value: formatCurrency(docRevenue) },
          ],
        };
      }
      case 'medicines': {
        const totalMed = data.totalMedicinesCount ?? 0;
        const lowStock = data.lowStockCount ?? 0;
        const unitsDispensed = data.totalUnitsDispensed ?? data.totalDispensedQuantity ?? 0;
        const medRevenue = data.totalMedicineRevenue ?? 0;
        return {
          code: 'BC-KHO-DUOC',
          title: 'BÁO CÁO XUẤT NHẬP TỒN DƯỢC PHẨM & VẬT TƯ',
          subtitle: 'Kiểm kê cơ số thuốc cấp phát, định mức tồn kho và doanh thu dược phẩm',
          kpis: [
            { label: 'Tổng danh mục thuốc', value: `${formatNumber(totalMed)} loại` },
            { label: 'Thuốc cần nhập thêm', value: `${formatNumber(lowStock)} loại` },
            { label: 'Số lượng đã cấp phát', value: `${formatNumber(unitsDispensed)} viên/lọ` },
            { label: 'Doanh thu quầy thuốc', value: formatCurrency(medRevenue) },
          ],
        };
      }
      case 'services':
        return {
          code: 'BC-DV-KHAM',
          title: 'BÁO CÁO THỐNG KÊ DỊCH VỤ & CHUYÊN KHOA ĐIỀU TRỊ',
          subtitle: 'Đo lường tần suất chỉ định kỹ thuật, cơ cấu doanh thu theo từng dịch vụ nha khoa',
          kpis: [
            { label: 'Doanh thu dịch vụ', value: formatCurrency(data.totalServiceRevenue) },
            { label: 'Tổng lượt thực hiện', value: `${formatNumber(data.totalUsageCount)} lượt` },
            { label: 'Dịch vụ niêm yết', value: `${formatNumber(data.activeServicesCount)} / ${formatNumber(data.totalServicesCount)} DV` },
            { label: 'Tăng trưởng kỳ trước', value: `${Number(data.revenueGrowthPercent || 0) >= 0 ? '+' : ''}${data.revenueGrowthPercent || 0}%` },
          ],
        };
      case 'promotions':
        return {
          code: 'BC-MKT-UD',
          title: 'BÁO CÁO HIỆU QUẢ CHƯƠNG TRÌNH ƯU ĐÃI & TRI ÂN',
          subtitle: 'Đo lường đòn bẩy doanh thu kích hoạt và tỷ lệ ngân sách chiết khấu khách hàng',
          kpis: [
            { label: 'Ngân sách ưu đãi đã trao', value: formatCurrency(data.totalDiscountAmount) },
            { label: 'Doanh thu thu về từ đơn KM', value: formatCurrency(data.totalSalesGenerated) },
            { label: 'Số hóa đơn áp dụng', value: `${formatNumber(data.totalInvoicesApplied)} HĐ` },
            { label: 'Chương trình kích hoạt', value: `${formatNumber(data.activePromotions)} / ${formatNumber(data.totalPromotions)} CT` },
          ],
        };
      case 'appointments':
        return {
          code: 'BC-VH-HEN',
          title: 'BÁO CÁO VẬN HÀNH LỊCH HẸN KHÁM & TÁI KHÁM',
          subtitle: 'Kiểm soát tỷ lệ tiếp nhận, số ca hoàn thành, lịch hủy và phân bổ bác sĩ',
          kpis: [
            { label: 'Tổng số lịch hẹn', value: `${formatNumber(data.totalAppointments)} lịch` },
            { label: 'Ca khám hoàn thành', value: `${formatNumber(data.completedAppointments)} ca (${data.completionRate}%)` },
            { label: 'Lịch bị hủy', value: `${formatNumber(data.cancelledAppointments)} lịch (${data.cancellationRate}%)` },
            { label: 'Sắp tới (Xác nhận & Chờ)', value: `${formatNumber((data.confirmedAppointments || 0) + (data.waitingAppointments || 0))} lịch` },
          ],
        };
      case 'overview':
      default: {
        const rev = data.revenue || {};
        const staff = data.staff || {};
        const meds = data.medicines || {};
        const srv = data.services || {};
        const appts = data.appointments || {};
        const promos = data.promotions || {};
        const compRate = appts.completionRate || (appts.totalAppointments ? Math.round(((appts.completedAppointments || 0) / appts.totalAppointments) * 100) : 0);
        return {
          code: 'BC-NK-TONG',
          title: 'BÁO CÁO TỔNG QUAN QUẢN TRỊ NHA KHOA',
          subtitle: 'Báo cáo hợp nhất hoạt động tài chính, chuyên môn lâm sàng, kho dược và vận hành phòng khám',
          kpis: [
            { label: 'Doanh thu hóa đơn', value: formatCurrency(rev.invoiceRevenue || 0) },
            { label: 'Thực thu thực tế', value: formatCurrency(rev.actualCollected || 0) },
            { label: 'Công nợ chưa thu', value: formatCurrency(rev.remainingDebt || 0) },
            { label: 'Ca khám hoàn thành', value: `${formatNumber(appts.completedAppointments || 0)} ca (${compRate}%)` },
          ],
        };
      }
    }
  };

  const meta = getReportMeta();

  return (
    <>
      {/* Print CSS Specific to Standard A4 Report */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          #dental-printable-report, #dental-printable-report * {
            visibility: visible !important;
          }
          #dental-printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Backdrop & Preview Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-transparent">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none">
          {/* Header Action Bar - Gentle, Minimalist Dental Medical Style */}
          <div className="px-5 py-3.5 bg-white flex items-center justify-between border-b border-slate-200 shrink-0 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/70 flex items-center justify-center shadow-2xs">
                <Printer className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                  Xem trước bản in Báo cáo Quản trị Nha khoa
                </h3>
                <p className="text-[11px] text-slate-500">
                  Chuẩn khổ giấy A4, đầy đủ tiêu đề cơ sở y tế và chữ ký xác nhận nghiệp vụ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer border border-teal-600"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Xác nhận In / Xuất PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Đóng xem trước"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Printable Report Wrapper: Soft gray desk background during preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
            {/* Printable Report Container - Strict Standard A4 Style */}
            <div
              id="dental-printable-report"
              className="bg-white rounded-lg shadow-sm border border-slate-200/90 max-w-[210mm] mx-auto p-7 sm:p-9 text-slate-800 font-sans text-xs leading-relaxed print:p-0 print:border-none print:shadow-none print:rounded-none print:max-w-none"
            >
              {/* 1. Official Dental Clinic Header */}
              <div className="flex items-start justify-between border-b border-slate-300 pb-4 mb-5">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/logo.png"
                    alt="Logo Crown Dental"
                    className="h-14 w-14 object-contain shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <h1 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide">
                      PHÒNG KHÁM CHUYÊN KHOA RĂNG HÀM MẶT CROWN DENTAL
                    </h1>
                    <p className="text-[11px] text-slate-600 font-normal mt-0.5">
                      Địa chỉ: 12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh
                    </p>
                    <p className="text-[11px] text-slate-600 font-normal">
                      Hotline: 1900 6868 · Giấy phép hoạt động: 04521/BYT-CCHN
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Mã văn bản:
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 block">
                    {meta.code}-{new Date().getFullYear()}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Thời điểm in: {printTimeFormatted} · {printDateFormatted}
                  </span>
                </div>
              </div>

              {/* 2. Report Main Title & Period */}
              <div className="text-center my-5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-wide">
                  {meta.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 italic font-normal">
                  {meta.subtitle}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                  Kỳ thống kê: {periodLabel || 'Năm 2026'}
                </div>
              </div>

              {/* 3. Executive Summary KPI Grid */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-l-2 border-teal-600 pl-2">
                  I. TỔNG HỢP CHỈ SỐ QUẢN TRỊ TRỌNG YẾU (KPI SUMMARY)
                </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {meta.kpis.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-slate-50 p-3 border border-slate-200 text-center print-break-inside-avoid"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase block truncate">
                      {kpi.label}
                    </span>
                    <span className="text-sm font-black text-slate-900 block mt-1">
                      {kpi.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Detailed Audit Data Table (All rows, no scrolling cut-off) */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-l-2 border-teal-600 pl-2">
                II. SỐ LIỆU KIỂM TOÁN CHI TIẾT
              </h3>

              {/* Table for OVERVIEW (Hợp nhất 6 trụ cột vận hành nha khoa) */}
              {(moduleKey === 'overview' || !['revenue', 'staff', 'medicines', 'services', 'promotions', 'appointments'].includes(moduleKey)) && (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Trụ cột quản trị</th>
                      <th className="p-2 border-r border-slate-200">Chỉ số trọng yếu</th>
                      <th className="p-2 border-r border-slate-200 text-center">Khối lượng / Quy mô</th>
                      <th className="p-2 border-r border-slate-200 text-right">Doanh thu / Giá trị</th>
                      <th className="p-2 text-center">Tỷ lệ / Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Trụ cột 1: Tài chính */}
                    <tr className="border-b border-slate-200 print-break-inside-avoid">
                      <td className="p-2 border-r border-slate-200 text-center font-bold">1</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">Doanh thu & Dòng tiền</td>
                      <td className="p-2 border-r border-slate-200">Tổng thu hóa đơn, thực thu & công nợ</td>
                      <td className="p-2 border-r border-slate-200 text-center">{formatNumber(data.revenue?.totalInvoices || 0)} hóa đơn</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">{formatCurrency(data.revenue?.invoiceRevenue || 0)}</td>
                      <td className="p-2 text-center text-teal-800 font-semibold">
                        Thu hồi: {data.revenue?.invoiceRevenue ? Math.round(((data.revenue?.actualCollected || 0) / data.revenue.invoiceRevenue) * 100) : 100}%
                      </td>
                    </tr>
                    {/* Trụ cột 2: Khám & Tiếp nhận */}
                    <tr className="border-b border-slate-200 print-break-inside-avoid">
                      <td className="p-2 border-r border-slate-200 text-center font-bold">2</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">Lịch hẹn & Tiếp nhận</td>
                      <td className="p-2 border-r border-slate-200">Ca khám hoàn thành, tỷ lệ chuyển đổi</td>
                      <td className="p-2 border-r border-slate-200 text-center">{formatNumber(data.appointments?.totalAppointments || 0)} lịch hẹn</td>
                      <td className="p-2 border-r border-slate-200 text-right font-medium">{formatNumber(data.appointments?.completedAppointments || 0)} ca khám xong</td>
                      <td className="p-2 text-center font-semibold text-slate-800">Hoàn thành: {data.appointments?.completionRate || 0}%</td>
                    </tr>
                    {/* Trụ cột 3: Dịch vụ */}
                    <tr className="border-b border-slate-200 print-break-inside-avoid">
                      <td className="p-2 border-r border-slate-200 text-center font-bold">3</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">Dịch vụ nha khoa chuyên sâu</td>
                      <td className="p-2 border-r border-slate-200">Chỉ định kỹ thuật & cơ cấu chuyên khoa</td>
                      <td className="p-2 border-r border-slate-200 text-center">{formatNumber(data.services?.totalUsageCount || 0)} lượt làm DV</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">{formatCurrency(data.services?.totalRevenue || 0)}</td>
                      <td className="p-2 text-center font-medium text-slate-700">Tăng trưởng: {data.services?.growthRate || 0}%</td>
                    </tr>
                    {/* Trụ cột 4: Dược phẩm */}
                    <tr className="border-b border-slate-200 print-break-inside-avoid">
                      <td className="p-2 border-r border-slate-200 text-center font-bold">4</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">Dược phẩm & Vật tư kho</td>
                      <td className="p-2 border-r border-slate-200">Cơ số thuốc cấp phát theo đơn & tồn kho</td>
                      <td className="p-2 border-r border-slate-200 text-center">{formatNumber(data.medicines?.totalUnitsDispensed || 0)} đơn vị thuốc cấp</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">{formatCurrency(data.medicines?.totalRevenue || 0)}</td>
                      <td className="p-2 text-center text-amber-700 font-semibold">{formatNumber(data.medicines?.lowStockCount || 0)} loại sắp hết</td>
                    </tr>
                    {/* Trụ cột 5: Bác sĩ & Nhân sự */}
                    <tr className="border-b border-slate-200 print-break-inside-avoid">
                      <td className="p-2 border-r border-slate-200 text-center font-bold">5</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">Bác sĩ & Nhân sự cơ sở</td>
                      <td className="p-2 border-r border-slate-200">Đội ngũ y tế, điều trị & tiếp đón</td>
                      <td className="p-2 border-r border-slate-200 text-center">{formatNumber(data.staff?.totalStaff || 0)} nhân sự</td>
                      <td className="p-2 border-r border-slate-200 text-right font-medium">{formatNumber(data.staff?.totalDoctors || 0)} Bác sĩ RHM</td>
                      <td className="p-2 text-center text-slate-700">{formatNumber(data.staff?.totalReceptionists || data.staff?.totalEmployees || 0)} Lễ tân/TN</td>
                    </tr>
                    {/* Trụ cột 6: Ưu đãi */}
                    <tr className="border-b border-slate-200 print-break-inside-avoid">
                      <td className="p-2 border-r border-slate-200 text-center font-bold">6</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">Ưu đãi & Tri ân khách hàng</td>
                      <td className="p-2 border-r border-slate-200">Mã kích hoạt & ngân sách hỗ trợ</td>
                      <td className="p-2 border-r border-slate-200 text-center">{formatNumber(data.promotions?.totalInvoicesApplied || 0)} hóa đơn áp dụng</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">Giảm: {formatCurrency(data.promotions?.totalDiscountAmount || 0)}</td>
                      <td className="p-2 text-center font-medium text-slate-700">{formatNumber(data.promotions?.activePromotions || 0)} CT đang chạy</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Table for REVENUE */}
              {moduleKey === 'revenue' && (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Mã giao dịch</th>
                      <th className="p-2 border-r border-slate-200">Mã hóa đơn</th>
                      <th className="p-2 border-r border-slate-200">Thời gian GD</th>
                      <th className="p-2 border-r border-slate-200">Bệnh nhân / Khách hàng</th>
                      <th className="p-2 border-r border-slate-200">Hình thức thanh toán</th>
                      <th className="p-2 border-r border-slate-200">Thu ngân</th>
                      <th className="p-2 text-right">Số tiền thực thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((data.recentPayments || data.recentInvoices || []).length === 0) ? (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-slate-400 italic">
                          Không có giao dịch thanh toán nào phát sinh trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      (data.recentPayments || data.recentInvoices || []).map((p, idx) => (
                        <tr key={idx} className="border-b border-slate-200 print-break-inside-avoid">
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-teal-800">{p.transactionCode || p.code || '-'}</td>
                          <td className="p-2 border-r border-slate-200 font-mono">{p.invoiceCode || '-'}</td>
                          <td className="p-2 border-r border-slate-200">{formatDateTime(p.paymentTime || p.invoiceDate)}</td>
                          <td className="p-2 border-r border-slate-200 font-medium text-slate-900">{p.patientName}</td>
                          <td className="p-2 border-r border-slate-200">
                            {p.paymentMethod === 'BANK_TRANSFER'
                              ? 'Chuyển khoản'
                              : p.paymentMethod === 'CASH'
                              ? 'Tiền mặt'
                              : p.paymentMethod || 'Tiền mặt'}
                          </td>
                          <td className="p-2 border-r border-slate-200">{p.cashierName || p.dentistName || 'Quầy thu ngân'}</td>
                          <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(p.amount ?? p.paidAmount ?? p.finalAmount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Table for MEDICINES */}
              {moduleKey === 'medicines' && (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Mã thuốc</th>
                      <th className="p-2 border-r border-slate-200">Tên thuốc / Dược phẩm</th>
                      <th className="p-2 border-r border-slate-200">Nhóm dược lý & Hãng SX</th>
                      <th className="p-2 border-r border-slate-200 text-center">Đơn vị</th>
                      <th className="p-2 border-r border-slate-200 text-right">Đơn giá bán</th>
                      <th className="p-2 border-r border-slate-200 text-center">Tồn kho</th>
                      <th className="p-2 border-r border-slate-200 text-center">Đã cấp phát</th>
                      <th className="p-2 border-r border-slate-200 text-center">Số đơn kê</th>
                      <th className="p-2 text-right">Doanh số thuốc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((data.medicines || []).length === 0) ? (
                      <tr>
                        <td colSpan="10" className="p-4 text-center text-slate-400 italic">
                          Không có dữ liệu dược phẩm nào trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      (data.medicines || []).map((med, idx) => {
                        const medName = med.name || med.medicineName || 'Thuốc nha khoa';
                        const cat = categorizeMedicine(medName);
                        const qtyUsed = med.quantityUsed ?? med.dispensedQuantity ?? 0;
                        const presCount = med.prescriptionCount ?? 0;
                        return (
                          <tr key={idx} className="border-b border-slate-200 print-break-inside-avoid">
                            <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-200 font-mono font-medium text-slate-700">{med.code || '-'}</td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{medName}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600">
                              <span>{cat}</span>
                              {med.manufacturer && <span className="text-[10px] text-slate-400 block">{med.manufacturer}</span>}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">{med.unit || 'Viên'}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-medium">{formatCurrency(med.price)}</td>
                            <td className="p-2 border-r border-slate-200 text-center font-bold">{formatNumber(med.stockQuantity)}</td>
                            <td className="p-2 border-r border-slate-200 text-center font-bold text-teal-800">{formatNumber(qtyUsed)}</td>
                            <td className="p-2 border-r border-slate-200 text-center">{formatNumber(presCount)} đơn</td>
                            <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(med.totalRevenue)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {/* Table for SERVICES */}
              {moduleKey === 'services' && (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Mã DV</th>
                      <th className="p-2 border-r border-slate-200">Tên dịch vụ nha khoa</th>
                      <th className="p-2 border-r border-slate-200">Chuyên khoa</th>
                      <th className="p-2 border-r border-slate-200 text-center">Đơn vị</th>
                      <th className="p-2 border-r border-slate-200 text-right">Đơn giá niêm yết</th>
                      <th className="p-2 border-r border-slate-200 text-center">Lượt sử dụng</th>
                      <th className="p-2 border-r border-slate-200 text-center">Tăng trưởng</th>
                      <th className="p-2 text-right">Doanh thu ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((data.services || []).length === 0) ? (
                      <tr>
                        <td colSpan="9" className="p-4 text-center text-slate-400 italic">
                          Không có dữ liệu dịch vụ nha khoa nào trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      (data.services || []).map((srv, idx) => (
                        <tr key={idx} className="border-b border-slate-200 print-break-inside-avoid">
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono">{srv.serviceCode || '-'}</td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{srv.serviceName}</td>
                          <td className="p-2 border-r border-slate-200">{srv.categoryName}</td>
                          <td className="p-2 border-r border-slate-200 text-center">{srv.unit || 'Lần'}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-medium">{formatCurrency(srv.basePrice)}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{formatNumber(srv.usageCount || 0)}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-medium">
                            {srv.growthPercent !== undefined && srv.growthPercent !== null
                              ? `${Number(srv.growthPercent) >= 0 ? '+' : ''}${srv.growthPercent}%`
                              : '-'}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(srv.totalRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Table for STAFF */}
              {moduleKey === 'staff' && (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Họ và tên Bác sĩ / Nhân sự</th>
                      <th className="p-2 border-r border-slate-200">Chuyên môn / Khoa</th>
                      <th className="p-2 border-r border-slate-200 text-center">Kinh nghiệm</th>
                      <th className="p-2 border-r border-slate-200 text-center">Lượt khám</th>
                      <th className="p-2 border-r border-slate-200 text-center">Ca điều trị xong</th>
                      <th className="p-2 text-right">Doanh thu điều trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((data.doctors || data.topDoctors || []).length === 0) ? (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-slate-400 italic">
                          Không có dữ liệu nhân sự bác sĩ trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      (data.doctors || data.topDoctors || []).map((doc, idx) => (
                        <tr key={idx} className="border-b border-slate-200 print-break-inside-avoid">
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{doc.fullName || doc.dentistName}</td>
                          <td className="p-2 border-r border-slate-200">{doc.specialization || doc.specialty || 'Nha khoa tổng quát'}</td>
                          <td className="p-2 border-r border-slate-200 text-center">{doc.experienceYears ? `${doc.experienceYears} năm` : 'Tiêu chuẩn'}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-medium">{formatNumber(doc.examCount ?? doc.examinationsCount ?? 0)} lượt</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold text-teal-800">{formatNumber(doc.completedTreatments ?? doc.completedCount ?? 0)} ca</td>
                          <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(doc.serviceRevenue ?? doc.totalRevenue ?? 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Table for PROMOTIONS */}
              {moduleKey === 'promotions' && (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Mã Coupon</th>
                      <th className="p-2 border-r border-slate-200">Tên chương trình ưu đãi</th>
                      <th className="p-2 border-r border-slate-200">Mức ưu đãi</th>
                      <th className="p-2 border-r border-slate-200 text-center">Trạng thái</th>
                      <th className="p-2 border-r border-slate-200 text-center">Hóa đơn áp dụng</th>
                      <th className="p-2 border-r border-slate-200 text-right">Tiền giảm cho khách</th>
                      <th className="p-2 text-right">Doanh số mang về</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((data.promotions || []).length === 0) ? (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-slate-400 italic">
                          Không có chương trình ưu đãi nào phát sinh trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      (data.promotions || []).map((promo, idx) => (
                        <tr key={idx} className="border-b border-slate-200 print-break-inside-avoid">
                          <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-teal-800">{promo.couponCode}</td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{promo.title}</td>
                          <td className="p-2 border-r border-slate-200">
                            {promo.discountPercent
                              ? `Giảm ${promo.discountPercent}%`
                              : promo.discountAmount
                              ? `Giảm ${formatCurrency(promo.discountAmount)}`
                              : 'Ưu đãi'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center">
                            {promo.status === 'ACTIVE' ? 'Đang kích hoạt' : 'Hết hạn'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{formatNumber(promo.invoicesCount || 0)} HĐ</td>
                          <td className="p-2 border-r border-slate-200 text-right font-medium text-slate-800">{formatCurrency(promo.discountGiven)}</td>
                          <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(promo.salesGenerated)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Table for APPOINTMENTS */}
              {moduleKey === 'appointments' && (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                      <th className="p-2 border-r border-slate-200">Bác sĩ phụ trách</th>
                      <th className="p-2 border-r border-slate-200 text-center">Tổng lịch hẹn</th>
                      <th className="p-2 border-r border-slate-200 text-center">Ca khám hoàn thành</th>
                      <th className="p-2 border-r border-slate-200 text-center">Lịch hủy</th>
                      <th className="p-2 text-center">Tỷ lệ hoàn thành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((data.doctorStats || []).length === 0) ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-400 italic">
                          Không có dữ liệu lịch hẹn của bác sĩ trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      (data.doctorStats || []).map((doc, idx) => {
                        const total = Number(doc.total) || 0;
                        const comp = Number(doc.completed) || 0;
                        const canc = Number(doc.cancelled) || 0;
                        const rate = total > 0 ? Math.round((comp / total) * 100) : 0;
                        return (
                          <tr key={idx} className="border-b border-slate-200 print-break-inside-avoid">
                            <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{doc.doctorName}</td>
                            <td className="p-2 border-r border-slate-200 text-center font-bold">{formatNumber(total)}</td>
                            <td className="p-2 border-r border-slate-200 text-center font-bold text-teal-800">{formatNumber(comp)}</td>
                            <td className="p-2 border-r border-slate-200 text-center text-slate-500">{formatNumber(canc)}</td>
                            <td className="p-2 text-center font-bold text-slate-900">{rate}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* 5. Official Medical Approvals & Signatures */}
            <div className="mt-10 pt-4 border-t border-slate-300 print-break-inside-avoid">
              <div className="text-right text-[11px] text-slate-600 italic mb-4">
                TP. Hồ Chí Minh, ngày {printDate.getDate()} tháng {printDate.getMonth() + 1} năm {printDate.getFullYear()}
              </div>

              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 uppercase block">NGƯỜI LẬP BIỂU</span>
                  <span className="text-[10px] text-slate-500 italic block">(Ký và ghi rõ họ tên)</span>
                  <div className="h-20" />
                  <span className="font-semibold text-slate-800 block text-[11px]">Ban Quản trị Cơ sở</span>
                </div>

                <div>
                  <span className="font-bold text-slate-900 uppercase block">KẾ TOÁN TRƯỞNG / PHỤ TRÁCH</span>
                  <span className="text-[10px] text-slate-500 italic block">(Ký và ghi rõ họ tên)</span>
                  <div className="h-20" />
                  <span className="font-semibold text-slate-800 block text-[11px]">Phòng Kế toán - Nghiệp vụ</span>
                </div>

                <div>
                  <span className="font-bold text-slate-900 uppercase block">GIÁM ĐỐC PHÒNG KHÁM</span>
                  <span className="text-[10px] text-slate-500 italic block">(Ký tên và đóng dấu)</span>
                  <div className="h-20" />
                  <span className="font-semibold text-slate-800 block text-[11px]">Nha khoa Crown Dental</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);
}

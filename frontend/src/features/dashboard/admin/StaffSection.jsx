import React, { useState, useMemo } from 'react';
import {
  Users,
  Stethoscope,
  Briefcase,
  Search,
  RotateCcw,
  Award,
  Receipt,
  Phone,
  Mail,
  SlidersHorizontal,
  X,
  FileCheck2,
  CalendarCheck,
  ChevronRight,
  TrendingUp,
  PieChart,
  GitCommit,
  CheckCircle2,
  Activity,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatNumber } from './dashboardUtils';
import { DonutChart } from './Charts';

export default function StaffSection({ data, loading }) {
  const [activeSubTab, setActiveSubTab] = useState('doctors'); // 'doctors' | 'employees'

  // Advanced Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [selectedPerformance, setSelectedPerformance] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [sortBy, setSortBy] = useState('revenue_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showDiagrams, setShowDiagrams] = useState(true);

  if (loading && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500">
        <Activity className="h-6 w-6 animate-pulse text-teal-600" />
        <span className="text-xs font-semibold">Đang tải dữ liệu hồ sơ nhân sự nha khoa...</span>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalStaff = 0,
    totalDoctors = 0,
    totalEmployees = 0,
    totalReceptionists = 0,
    totalWarehouse = 0,
    doctors = [],
    employees = [],
    periodLabel = '',
  } = data;

  // Aggregate metrics
  const totalDoctorRevenue = doctors.reduce(
    (sum, d) => sum + (Number(d.serviceRevenue) || 0),
    0
  );
  const totalExamCount = doctors.reduce(
    (sum, d) => sum + (Number(d.examCount) || 0),
    0
  );
  const totalTreatments = doctors.reduce(
    (sum, d) => sum + (Number(d.completedTreatments) || 0),
    0
  );
  const maxDocRevenue = Math.max(
    ...doctors.map((d) => Number(d.serviceRevenue) || 0),
    1
  );

  const totalEmployeeAssisted = employees.reduce(
    (sum, e) => sum + (Number(e.totalAssistedAmount) || 0),
    0
  );
  const totalInvoicesAssisted = employees.reduce(
    (sum, e) => sum + (Number(e.invoicesAssisted) || 0),
    0
  );
  const totalAppointmentsReceived = employees.reduce(
    (sum, e) => sum + (Number(e.appointmentsReceived) || 0),
    0
  );

  // Overall clinical conversion rate
  const overallConversionRate =
    totalExamCount > 0 ? (totalTreatments / totalExamCount) * 100 : 0;

  // Top 4 performing doctors for diagram chart
  const topDoctors = useMemo(() => {
    return [...doctors]
      .sort((a, b) => (Number(b.serviceRevenue) || 0) - (Number(a.serviceRevenue) || 0))
      .slice(0, 4);
  }, [doctors]);

  // Extract unique specializations
  const specializations = useMemo(() => {
    const set = new Set();
    doctors.forEach((d) => {
      if (d.specialization) {
        d.specialization.split(',').forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [doctors]);

  // Donut chart items for specializations
  const specialtyDonutItems = useMemo(() => {
    const map = {};
    doctors.forEach((d) => {
      const spec = d.specialization || 'Nha khoa tổng quát';
      if (!map[spec]) map[spec] = { count: 0, revenue: 0 };
      map[spec].count += 1;
      map[spec].revenue += Number(d.serviceRevenue) || 0;
    });

    const colors = ['#0d9488', '#0891b2', '#0284c7', '#059669', '#6366f1'];
    return Object.entries(map).map(([spec, stat], idx) => ({
      label: spec,
      value: stat.revenue > 0 ? stat.revenue : stat.count,
      color: colors[idx % colors.length],
    }));
  }, [doctors]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSpecialization('all');
    setSelectedExperience('all');
    setSelectedPerformance('all');
    setSelectedPosition('all');
    setSortBy('revenue_desc');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSpecialization !== 'all' ||
    selectedExperience !== 'all' ||
    selectedPerformance !== 'all' ||
    selectedPosition !== 'all' ||
    sortBy !== 'revenue_desc';

  // Filter & Sort Doctors
  const filteredDoctors = useMemo(() => {
    return doctors
      .filter((d) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (d.fullName || '').toLowerCase().includes(term) ||
          (d.specialization || '').toLowerCase().includes(term) ||
          (d.phone || '').includes(term) ||
          (d.email || '').toLowerCase().includes(term);

        if (!matchesSearch) return false;

        if (
          selectedSpecialization !== 'all' &&
          !(d.specialization || '').toLowerCase().includes(selectedSpecialization.toLowerCase())
        ) {
          return false;
        }

        const exp = Number(d.experienceYears) || 0;
        if (selectedExperience === '<3' && exp >= 3) return false;
        if (selectedExperience === '3-5' && (exp < 3 || exp > 5)) return false;
        if (selectedExperience === '6-10' && (exp < 6 || exp > 10)) return false;
        if (selectedExperience === '>10' && exp <= 10) return false;

        const rev = Number(d.serviceRevenue) || 0;
        const exams = Number(d.examCount) || 0;
        const treatments = Number(d.completedTreatments) || 0;
        const conversion = exams > 0 ? (treatments / exams) * 100 : 0;

        if (selectedPerformance === 'has_revenue' && rev <= 0) return false;
        if (selectedPerformance === 'high_revenue' && rev < 10000000) return false;
        if (selectedPerformance === 'has_exams' && exams <= 0) return false;
        if (selectedPerformance === 'has_treatments' && treatments <= 0) return false;
        if (selectedPerformance === 'high_conversion' && conversion < 50) return false;

        return true;
      })
      .sort((a, b) => {
        const revA = Number(a.serviceRevenue) || 0;
        const revB = Number(b.serviceRevenue) || 0;
        const examA = Number(a.examCount) || 0;
        const examB = Number(b.examCount) || 0;
        const treatA = Number(a.completedTreatments) || 0;
        const treatB = Number(b.completedTreatments) || 0;
        const expA = Number(a.experienceYears) || 0;
        const expB = Number(b.experienceYears) || 0;
        const convA = examA > 0 ? treatA / examA : 0;
        const convB = examB > 0 ? treatB / examB : 0;

        switch (sortBy) {
          case 'revenue_desc':
            return revB - revA;
          case 'revenue_asc':
            return revA - revB;
          case 'exams_desc':
            return examB - examA;
          case 'treatments_desc':
            return treatB - treatA;
          case 'conversion_desc':
            return convB - convA;
          case 'exp_desc':
            return expB - expA;
          case 'name_asc':
            return (a.fullName || '').localeCompare(b.fullName || '');
          default:
            return revB - revA;
        }
      });
  }, [doctors, searchTerm, selectedSpecialization, selectedExperience, selectedPerformance, sortBy]);

  // Filter & Sort Employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((e) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (e.fullName || '').toLowerCase().includes(term) ||
          (e.positionLabel || '').toLowerCase().includes(term) ||
          (e.position || '').toLowerCase().includes(term) ||
          (e.phone || '').includes(term) ||
          (e.email || '').toLowerCase().includes(term);

        if (!matchesSearch) return false;

        if (selectedPosition !== 'all') {
          if (selectedPosition === 'RECEPTIONIST' && e.position !== 'RECEPTIONIST') return false;
          if (selectedPosition === 'WAREHOUSE' && e.position !== 'WAREHOUSE') return false;
          if (
            selectedPosition === 'OTHER' &&
            (e.position === 'RECEPTIONIST' || e.position === 'WAREHOUSE')
          )
            return false;
        }

        return true;
      })
      .sort((a, b) => {
        const assistA = Number(a.totalAssistedAmount) || 0;
        const assistB = Number(b.totalAssistedAmount) || 0;
        const apptA = Number(a.appointmentsReceived) || 0;
        const apptB = Number(b.appointmentsReceived) || 0;
        const invA = Number(a.invoicesAssisted) || 0;
        const invB = Number(b.invoicesAssisted) || 0;

        switch (sortBy) {
          case 'revenue_desc':
            return assistB - assistA;
          case 'revenue_asc':
            return assistA - assistB;
          case 'appointments_desc':
            return apptB - apptA;
          case 'invoices_desc':
            return invB - invA;
          case 'name_asc':
            return (a.fullName || '').localeCompare(b.fullName || '');
          default:
            return assistB - assistA;
        }
      });
  }, [employees, searchTerm, selectedPosition, sortBy]);

  return (
    <div className="space-y-5">
      {/* 4 Professional KPI Cards - Dental Teal & Clean Medical Tone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng Nhân Sự */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tổng đội ngũ nhân sự
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalStaff)}
            </span>
            <span className="text-xs font-medium text-slate-500">thành viên</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>
              Bác sĩ: <strong className="text-teal-800">{formatNumber(totalDoctors)}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Nhân viên: <strong className="text-slate-800">{formatNumber(totalEmployees)}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Doanh Thu Dịch Vụ Bác Sĩ */}
        <div className="rounded-lg border border-teal-200/70 bg-gradient-to-br from-teal-50/20 via-white to-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Doanh thu dịch vụ bác sĩ
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white shadow-xs">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-teal-900">
              {formatCurrency(totalDoctorRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-teal-100/60 pt-2">
            <span>{totalDoctors} bác sĩ phụ trách</span>
            <span className="text-teal-700 font-semibold">
              TB {formatCurrency(totalDoctors > 0 ? totalDoctorRevenue / totalDoctors : 0)}/BS
            </span>
          </div>
        </div>

        {/* Card 3: Lâm Sàng & Phác Đồ */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Lâm sàng & Phác đồ
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/60">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalTreatments)}
            </span>
            <span className="text-xs font-medium text-slate-500">ca hoàn thành</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>
              Khám: <strong className="text-slate-800">{formatNumber(totalExamCount)}</strong> lượt
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Tỷ lệ: <strong className="text-teal-700">{overallConversionRate.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Card 4: Tiếp Đón & Thu Ngân */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Khối tiếp đón & thu ngân
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(totalEmployeeAssisted)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>
              Tiếp đón: <strong className="text-slate-800">{formatNumber(totalAppointmentsReceived)}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Thu: <strong className="text-slate-800">{formatNumber(totalInvoicesAssisted)}</strong> GD
            </span>
          </div>
        </div>
      </div>

      {/* Sơ Đồ Quy Trình & Phân Tích Nha Khoa (Dental Clinical Flow & Analytics Diagrams) */}
      <div className="rounded-lg border border-teal-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-teal-50/50 border-b border-teal-100/70">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-teal-600 text-white">
              <GitCommit className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
              Mô hình quy trình & Sơ đồ phân tích hiệu suất nha khoa
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowDiagrams(!showDiagrams)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            {showDiagrams ? 'Thu gọn sơ đồ' : 'Hiển thị sơ đồ'}
          </button>
        </div>

        {showDiagrams && (
          <div className="p-4 space-y-4">
            {/* SƠ ĐỒ 1: Sơ đồ luân chuyển quy trình khám & điều trị nha khoa (Clinical Workflow Funnel) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-600" />
                  Sơ đồ chuỗi vận hành khám & điều trị nha khoa
                </span>
                <span className="text-[11px] text-slate-500">
                  Chu trình khép kín: Tiếp nhận ➔ Khám chẩn đoán ➔ Điều trị ➔ Hoàn tất
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 relative">
                {/* Bước 1: Tiếp Đón Lịch Hẹn */}
                <div className="relative rounded-md border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Trạm 1: Tiếp đón & Check-in</span>
                      <CalendarCheck className="h-3.5 w-3.5 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {formatNumber(totalAppointmentsReceived)}
                      <span className="text-xs font-normal text-slate-500 ml-1">lịch hẹn</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                    Lễ tân tiếp nhận tại sảnh & đăng ký số
                  </div>
                </div>

                {/* Bước 2: Khám Lâm Sàng */}
                <div className="relative rounded-md border border-teal-200/80 bg-teal-50/30 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-teal-800 mb-1">
                      <span>Trạm 2: Khám & Chẩn đoán</span>
                      <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                    </div>
                    <div className="text-lg font-bold text-teal-900">
                      {formatNumber(totalExamCount)}
                      <span className="text-xs font-normal text-teal-700 ml-1">lượt khám</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-teal-700 border-t border-teal-100 pt-1.5 flex items-center justify-between">
                    <span>Bác sĩ chỉ định phác đồ</span>
                    <span className="font-semibold">19 Bác sĩ</span>
                  </div>
                </div>

                {/* Bước 3: Ca Điều Trị Hoàn Thành */}
                <div className="relative rounded-md border border-cyan-200/80 bg-cyan-50/30 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-800 mb-1">
                      <span>Trạm 3: Thực hiện phác đồ</span>
                      <FileCheck2 className="h-3.5 w-3.5 text-cyan-700" />
                    </div>
                    <div className="text-lg font-bold text-cyan-900">
                      {formatNumber(totalTreatments)}
                      <span className="text-xs font-normal text-cyan-700 ml-1">ca điều trị</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-cyan-700 border-t border-cyan-100 pt-1.5 flex items-center justify-between">
                    <span>Tỷ lệ chuyển đổi phác đồ</span>
                    <span className="font-bold">{overallConversionRate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Bước 4: Doanh Thu & Thu Ngân */}
                <div className="relative rounded-md border border-teal-300 bg-teal-500/10 p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-teal-900 mb-1">
                      <span>Trạm 4: Doanh thu hoàn tất</span>
                      <Receipt className="h-3.5 w-3.5 text-teal-700" />
                    </div>
                    <div className="text-base font-bold text-teal-950 truncate">
                      {formatCurrency(totalDoctorRevenue)}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-teal-800 border-t border-teal-200/70 pt-1.5 flex items-center justify-between">
                    <span>Hóa đơn hỗ trợ</span>
                    <span className="font-semibold">{totalInvoicesAssisted} giao dịch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SƠ ĐỒ 2 & 3: 2 Cột: Cơ cấu Chuyên Khoa Nha Khoa + Bảng Xếp Hạng Top Bác Sĩ Dẫn Đầu */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Phân bổ chuyên khoa */}
              <div className="rounded-md border border-slate-200/80 bg-slate-50/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <PieChart className="h-3.5 w-3.5 text-teal-600" />
                    Cơ cấu doanh thu theo chuyên khoa nha khoa
                  </span>
                </div>
                <div className="py-1">
                  <DonutChart
                    items={specialtyDonutItems}
                    isCurrency={totalDoctorRevenue > 0}
                    centerTitle="Tổng DS"
                    centerValue={formatCurrency(totalDoctorRevenue)}
                  />
                </div>
              </div>

              {/* Top Bác sĩ dẫn đầu kỳ */}
              <div className="rounded-md border border-slate-200/80 bg-slate-50/40 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-teal-600" />
                    Top bác sĩ đóng góp doanh thu dịch vụ
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    Dẫn đầu kỳ
                  </span>
                </div>

                <div className="space-y-2.5">
                  {topDoctors.map((doc, idx) => {
                    const rev = Number(doc.serviceRevenue) || 0;
                    const pct = maxDocRevenue > 0 ? (rev / maxDocRevenue) * 100 : 0;
                    return (
                      <div key={doc.dentistId || idx} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {doc.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({doc.specialization || 'Tổng quát'})
                            </span>
                          </div>
                          <span className="font-bold text-teal-800">
                            {formatCurrency(rev)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Top Control Bar: Segmented Tabs (WITHOUT numbers in parentheses) + Search + Filter Toggle */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            {/* Segmented Control Tabs - BỎ SỐ PHÍA SAU như yêu cầu */}
            <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('doctors');
                  setSortBy('revenue_desc');
                }}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeSubTab === 'doctors'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700'
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Đội ngũ Bác sĩ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('employees');
                  setSortBy('revenue_desc');
                }}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeSubTab === 'employees'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-700'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Lễ tân & Vận hành</span>
              </button>
            </div>

            {/* Search and Advanced Filters Trigger */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <div className="relative w-full sm:w-64 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeSubTab === 'doctors'
                      ? 'Tìm tên, chuyên môn, SĐT...'
                      : 'Tìm nhân sự, vị trí đảm nhiệm...'
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
              {activeSubTab === 'doctors' ? (
                <>
                  {/* Filter: Specialization - BỎ SỐ TRONG NGOẶC */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Chuyên môn lâm sàng
                    </label>
                    <select
                      value={selectedSpecialization}
                      onChange={(e) => setSelectedSpecialization(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả chuyên môn</option>
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter: Experience */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Thâm niên kinh nghiệm
                    </label>
                    <select
                      value={selectedExperience}
                      onChange={(e) => setSelectedExperience(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả kinh nghiệm</option>
                      <option value="<3">Dưới 3 năm (Bác sĩ sơ cấp)</option>
                      <option value="3-5">3 - 5 năm (Bác sĩ chuyên khoa)</option>
                      <option value="6-10">6 - 10 năm (Bác sĩ kinh nghiệm)</option>
                      <option value=">10">Trên 10 năm (Chuyên gia thâm niên)</option>
                    </select>
                  </div>

                  {/* Filter: Performance Tier */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Hiệu suất hoạt động
                    </label>
                    <select
                      value={selectedPerformance}
                      onChange={(e) => setSelectedPerformance(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả mức hiệu suất</option>
                      <option value="has_revenue">Có phát sinh doanh thu (&gt; 0đ)</option>
                      <option value="high_revenue">Doanh thu cao (≥ 10 triệu đ)</option>
                      <option value="has_exams">Có lượt khám lâm sàng (&gt; 0)</option>
                      <option value="has_treatments">Có ca hoàn thành (&gt; 0)</option>
                      <option value="high_conversion">Tỷ lệ phác đồ cao (≥ 50%)</option>
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
                      <option value="revenue_desc">Doanh thu: Cao nhất</option>
                      <option value="revenue_asc">Doanh thu: Thấp nhất</option>
                      <option value="exams_desc">Lượt khám: Nhiều nhất</option>
                      <option value="treatments_desc">Ca điều trị: Nhiều nhất</option>
                      <option value="conversion_desc">Tỷ lệ hoàn thành: Cao nhất</option>
                      <option value="exp_desc">Thâm niên: Lâu năm nhất</option>
                      <option value="name_asc">Tên bác sĩ: A - Z</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Filter: Position - BỎ SỐ TRONG NGOẶC */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Vị trí công tác
                    </label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">Tất cả vị trí</option>
                      <option value="RECEPTIONIST">Lễ tân tiếp đón & Thu ngân</option>
                      <option value="WAREHOUSE">Thủ kho dược & Vật tư</option>
                      <option value="OTHER">Nhân viên hỗ trợ khác</option>
                    </select>
                  </div>

                  {/* Sort By for Employees */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Sắp xếp kết quả
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                      <option value="revenue_desc">Tiền thu hỗ trợ: Cao nhất</option>
                      <option value="revenue_asc">Tiền thu hỗ trợ: Thấp nhất</option>
                      <option value="appointments_desc">Lịch tiếp đón: Nhiều nhất</option>
                      <option value="invoices_desc">Giao dịch hỗ trợ: Nhiều nhất</option>
                      <option value="name_asc">Tên nhân sự: A - Z</option>
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
                {activeSubTab === 'doctors'
                  ? `${filteredDoctors.length} / ${doctors.length} bác sĩ`
                  : `${filteredEmployees.length} / ${employees.length} nhân sự`}
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

        {/* Tab 1: Professional Doctors Table */}
        {activeSubTab === 'doctors' && (
          <div className="overflow-x-auto overflow-y-auto max-h-[380px] sm:max-h-[430px] border-b border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="px-4 py-3">Bác sĩ & Học hàm</th>
                  <th className="px-4 py-3">Chuyên khoa & Kinh nghiệm</th>
                  <th className="px-4 py-3 text-center">Khám lâm sàng</th>
                  <th className="px-4 py-3 text-center">Ca điều trị (Phác đồ)</th>
                  <th className="px-4 py-3 text-right">Doanh thu dịch vụ</th>
                  <th className="px-4 py-3 text-center">Đánh giá năng suất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Users className="h-6 w-6 text-slate-300" />
                        <p className="font-medium text-slate-500">
                          Không tìm thấy bác sĩ nào phù hợp với bộ lọc hiện tại
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
                  filteredDoctors.map((doc, idx) => {
                    const docRev = Number(doc.serviceRevenue) || 0;
                    const docExams = Number(doc.examCount) || 0;
                    const docTreatments = Number(doc.completedTreatments) || 0;
                    const convRate = docExams > 0 ? (docTreatments / docExams) * 100 : 0;
                    const revShare =
                      totalDoctorRevenue > 0 ? (docRev / totalDoctorRevenue) * 100 : 0;
                    const isTopRevenue = docRev > 0 && docRev === maxDocRevenue;

                    return (
                      <tr
                        key={doc.dentistId || idx}
                        className="hover:bg-teal-50/30 transition-colors"
                      >
                        {/* 1. Doctor Info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-bold text-xs border border-teal-200/80">
                              {doc.fullName ? doc.fullName.charAt(0) : 'B'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900">
                                  {doc.fullName}
                                </span>
                                {isTopRevenue && (
                                  <span
                                    title="Bác sĩ có doanh thu dịch vụ cao nhất kỳ"
                                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80"
                                  >
                                    <Award className="h-3 w-3 text-amber-600" />
                                    Top 1
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                {doc.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-2.5 w-2.5 text-slate-400" />
                                    {doc.phone}
                                  </span>
                                )}
                                {doc.email && (
                                  <span className="hidden md:flex items-center gap-1">
                                    <Mail className="h-2.5 w-2.5 text-slate-400" />
                                    {doc.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Specialization & Experience */}
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="inline-block font-medium text-slate-800">
                              {doc.specialization || 'Nha khoa tổng quát'}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {doc.experienceYears ? (
                                <span>
                                  Kinh nghiệm: <strong>{doc.experienceYears} năm</strong>
                                </span>
                              ) : (
                                <span className="text-slate-400">Chưa cập nhật kinh nghiệm</span>
                              )}
                            </p>
                          </div>
                        </td>

                        {/* 3. Clinical Exams Count */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/60">
                            {formatNumber(docExams)} lượt
                          </span>
                        </td>

                        {/* 4. Completed Treatments & Conversion Rate */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center justify-center rounded px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200">
                              {formatNumber(docTreatments)} ca
                            </span>
                            {docExams > 0 && (
                              <span
                                className={`text-[10px] mt-0.5 font-medium ${
                                  convRate >= 50
                                    ? 'text-teal-700 font-bold'
                                    : 'text-slate-500'
                                }`}
                              >
                                {convRate.toFixed(0)}% phác đồ
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Service Revenue + Contribution Share */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-teal-900">
                              {formatCurrency(docRev)}
                            </span>
                            {/* Realistic Revenue Share Bar in Dental Teal */}
                            <div className="w-24 mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
                              <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-teal-600 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round((docRev / maxDocRevenue) * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="text-teal-800 font-medium">{revShare.toFixed(1)}%</span>
                            </div>
                          </div>
                        </td>

                        {/* 6. Realistic Productivity Badge */}
                        <td className="px-4 py-3 text-center">
                          {docRev > 0 ? (
                            convRate >= 50 ? (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
                                Hiệu suất cao
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                Đạt định mức
                              </span>
                            )
                          ) : docExams > 0 ? (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-cyan-50 text-cyan-800 border border-cyan-200/70">
                              Khám lâm sàng
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-normal text-slate-400 bg-slate-50 border border-slate-200/50">
                              Chưa có lượt
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

        {/* Tab 2: Receptionists & Administrative Staff Table */}
        {activeSubTab === 'employees' && (
          <div className="overflow-x-auto overflow-y-auto max-h-[380px] sm:max-h-[430px] border-b border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="px-4 py-3">Nhân sự</th>
                  <th className="px-4 py-3">Vị trí & Chức năng</th>
                  <th className="px-4 py-3">Thông tin liên hệ</th>
                  <th className="px-4 py-3 text-center">Lịch tiếp đón hẹn</th>
                  <th className="px-4 py-3 text-center">Giao dịch thu ngân</th>
                  <th className="px-4 py-3 text-right">Tổng tiền hỗ trợ thu</th>
                  <th className="px-4 py-3 text-center">Hiệu suất vận hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Users className="h-6 w-6 text-slate-300" />
                        <p className="font-medium text-slate-500">
                          Không tìm thấy nhân viên nào phù hợp với bộ lọc
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
                  filteredEmployees.map((emp, idx) => {
                    const assistedAmount = Number(emp.totalAssistedAmount) || 0;
                    const appts = Number(emp.appointmentsReceived) || 0;
                    const invoices = Number(emp.invoicesAssisted) || 0;
                    const avgPerInvoice =
                      invoices > 0 ? assistedAmount / invoices : 0;

                    return (
                      <tr
                        key={emp.employeeId || idx}
                        className="hover:bg-teal-50/30 transition-colors"
                      >
                        {/* 1. Employee Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-bold text-xs border border-teal-200/80">
                              {emp.fullName ? emp.fullName.charAt(0) : 'N'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {emp.fullName}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                ID: #{emp.employeeId ? emp.employeeId.slice(0, 8) : idx + 1}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Position Label */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold border ${
                              emp.position === 'RECEPTIONIST'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200/60'
                            }`}
                          >
                            {emp.positionLabel || emp.position}
                          </span>
                        </td>

                        {/* 3. Contact */}
                        <td className="px-4 py-3 text-slate-500">
                          <div className="space-y-0.5 text-[11px]">
                            {emp.phone && (
                              <p className="flex items-center gap-1 text-slate-600">
                                <Phone className="h-2.5 w-2.5 text-slate-400" />
                                {emp.phone}
                              </p>
                            )}
                            {emp.email && (
                              <p className="flex items-center gap-1 text-slate-400">
                                <Mail className="h-2.5 w-2.5 text-slate-400" />
                                {emp.email}
                              </p>
                            )}
                            {!emp.phone && !emp.email && <span>-</span>}
                          </div>
                        </td>

                        {/* 4. Appointments Received */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/60">
                            {formatNumber(appts)} lịch
                          </span>
                        </td>

                        {/* 5. Invoices Handled */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200">
                            {formatNumber(invoices)} giao dịch
                          </span>
                        </td>

                        {/* 6. Total Assisted Amount */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-teal-900">
                              {formatCurrency(assistedAmount)}
                            </span>
                            {invoices > 0 && (
                              <span className="text-[10px] text-teal-700/80 mt-0.5">
                                TB {formatCurrency(avgPerInvoice)}/GD
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 7. Operational Status */}
                        <td className="px-4 py-3 text-center">
                          {assistedAmount > 0 || invoices > 0 ? (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200/80">
                              Tích cực xử lý
                            </span>
                          ) : appts > 0 ? (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              Đón tiếp bệnh nhân
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-normal text-slate-400 bg-slate-50 border border-slate-200/50">
                              Vận hành hỗ trợ
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

        {/* Footer Summary / Insights of the filtered table */}
        <div className="px-5 py-3 bg-teal-50/30 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
            <span>
              {activeSubTab === 'doctors'
                ? `Tổng doanh thu lọc được: ${formatCurrency(
                    filteredDoctors.reduce(
                      (sum, d) => sum + (Number(d.serviceRevenue) || 0),
                      0
                    )
                  )} (${filteredDoctors.reduce(
                    (sum, d) => sum + (Number(d.completedTreatments) || 0),
                    0
                  )} ca điều trị / ${filteredDoctors.reduce(
                    (sum, d) => sum + (Number(d.examCount) || 0),
                    0
                  )} lượt khám)`
                : `Tổng tiền hỗ trợ lọc được: ${formatCurrency(
                    filteredEmployees.reduce(
                      (sum, e) => sum + (Number(e.totalAssistedAmount) || 0),
                      0
                    )
                  )} (${filteredEmployees.reduce(
                    (sum, e) => sum + (Number(e.invoicesAssisted) || 0),
                    0
                  )} giao dịch)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

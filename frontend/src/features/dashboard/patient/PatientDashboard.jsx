import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  MapPin,
  User,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  FileText,
  ClipboardList,
  Coins,
  Receipt,
  Check,
  Headphones,
  CreditCard,
  X,
  Activity,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';
import { getPatientStatistics } from '../../../services/patient.service';
import { getInProgressTreatmentPlansByPatientId } from '../../../services/treatmentPlan.service';
import { getExaminationResultsByPatientId } from '../../../services/examinationResult.service';
import { getCurrentMonthFollowUpAppointmentsByPatientId } from '../../../services/followUpAppointment.service';
import Loading from '../../../components/ui/Loading';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // User display info (defaults to user name if set, otherwise fallback)
  const displayName = user?.fullName || user?.username || 'Khách hàng';

  // State for interactive modals
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 4;

  // States quản lý dữ liệu từ từng API
  const [patientStatistics, setPatientStatistics] = useState(null);
  const [inProgressPlans, setInProgressPlans] = useState([]);
  const [examinationResults, setExaminationResults] = useState([]);
  const [followUpAppointments, setFollowUpAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Thống kê bệnh nhân
  const fetchPatientStatistics = async (patientId) => {
    try {
      const statistics = await getPatientStatistics(patientId);
      setPatientStatistics(statistics || null);
    } catch (error) {
      console.error("Lỗi lấy thống kê bệnh nhân:", error);
      setPatientStatistics(null);
    }
  };

  // 2. Fetch Kế hoạch điều trị đang tiến hành
  const fetchInProgressTreatmentPlansByPatientId = async (patientId) => {
    try {
      const res = await getInProgressTreatmentPlansByPatientId(patientId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setInProgressPlans(list);
    } catch (error) {
      console.error("Lỗi lấy kế hoạch điều trị đang tiến hành:", error);
      setInProgressPlans([]);
    }
  };

  // 3. Fetch Lịch sử kết quả khám
  const fetchExaminationResultsByPatientId = async (patientId) => {
    try {
      const res = await getExaminationResultsByPatientId(patientId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setExaminationResults(list);
    } catch (error) {
      console.error("Lỗi lấy kết quả khám của bệnh nhân:", error);
      setExaminationResults([]);
    }
  };

  // 4. Fetch Lịch tái khám trong tháng hiện tại
  const fetchCurrentMonthFollowUpAppointmentsByPatientId = async (patientId) => {
    try {
      const res = await getCurrentMonthFollowUpAppointmentsByPatientId(patientId);
      const list = Array.isArray(res) ? res : (res?.data || res?.result || []);
      setFollowUpAppointments(list);
    } catch (error) {
      console.error("Lỗi lấy lịch tái khám trong tháng:", error);
      setFollowUpAppointments([]);
    }
  };

  useEffect(() => {
    const patientId = user?.patientId || user?.id;
    if (patientId) {
      setLoading(true);
      Promise.allSettled([
        fetchPatientStatistics(patientId),
        fetchInProgressTreatmentPlansByPatientId(patientId),
        fetchExaminationResultsByPatientId(patientId),
        fetchCurrentMonthFollowUpAppointmentsByPatientId(patientId),
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  // Map dữ liệu thật từ danh sách lịch tái khám (followUpAppointments)
  const upcomingAppointments = useMemo(() => {
    if (!followUpAppointments || followUpAppointments.length === 0) return [];

    const sorted = [...followUpAppointments].sort((a, b) => {
      const timeA = a.followUpDate ? new Date(a.followUpDate).getTime() : 0;
      const timeB = b.followUpDate ? new Date(b.followUpDate).getTime() : 0;
      return timeA - timeB;
    });

    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    return sorted.map((apt) => {
      const d = apt.followUpDate ? new Date(apt.followUpDate) : null;
      const isValidDate = d && !isNaN(d.getTime());

      return {
        id: apt.id || Math.random().toString(),
        dayOfWeek: isValidDate ? dayNames[d.getDay()] : 'Chưa có',
        dayNumber: isValidDate ? String(d.getDate()).padStart(2, '0') : '--',
        monthYear: isValidDate ? `Tháng ${d.getMonth() + 1}` : 'Chưa có',
        date: isValidDate ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'Chưa có',
        fullDate: isValidDate ? d.toLocaleDateString('vi-VN') : 'Chưa có',
        time: isValidDate ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Chưa có',
        title: apt.reason || apt.chiefComplaint || 'Tái khám định kỳ',
        status: apt.status ? 'Đã xác nhận' : 'Sắp tới',
        statusColor: apt.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-teal-50 text-teal-700 border-teal-200',
        doctor: apt.dentistName ? (apt.dentistName.startsWith('BS.') ? apt.dentistName : `BS. ${apt.dentistName}`) : 'Chưa có',
        branch: apt.branchName || 'Chưa có',
        address: apt.addressBranch || 'Chưa có',
        notes: apt.note || 'Chưa có',
        raw: apt,
      };
    });
  }, [followUpAppointments]);

  const latestAppointment = upcomingAppointments[0] || null;

  // 5 Thẻ tóm tắt chỉ số (Dữ liệu từ API fetchPatientStatistics)
  const stats = [
    {
      id: 'appointments',
      title: 'Lịch hẹn trong 30 ngày',
      count: patientStatistics?.totalAppointmentsLast30Days ?? 0,
      icon: CalendarCheck,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50 border border-teal-100',
      to: '/patient/appointments',
    },
    {
      id: 'prescriptions',
      title: 'Tổng số đơn thuốc',
      count: patientStatistics?.totalPrescriptions ?? 0,
      icon: FileText,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border border-emerald-100',
      to: '/patient/prescriptions',
    },
    {
      id: 'treatment-plan',
      title: 'Kế hoạch điều trị',
      totalCount: patientStatistics?.totalTreatmentPlans ?? 0,
      inProgressCount: patientStatistics?.inProgressTreatmentPlans ?? 0,
      icon: ClipboardList,
      color: 'text-teal-800',
      bgColor: 'bg-teal-50 border border-teal-100',
      to: '/patient/medical-records',
    },
    {
      id: 'debt',
      title: 'Công nợ hiện tại',
      count: patientStatistics?.totalOutstandingDebt != null
        ? `${Number(patientStatistics.totalOutstandingDebt).toLocaleString('vi-VN')} đ`
        : '0 đ',
      icon: Coins,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border border-amber-100',
      to: '/patient/invoices',
    },
    {
      id: 'invoices',
      title: 'Tổng số hóa đơn',
      count: patientStatistics?.totalInvoices ?? 0,
      icon: Receipt,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border border-rose-100',
      to: '/patient/invoices',
    },
  ];

  // Map dữ liệu kế hoạch điều trị thật từ API (fetchInProgressTreatmentPlansByPatientId)
  const treatmentPlans = useMemo(() => {
    if (!inProgressPlans || inProgressPlans.length === 0) return [];

    return inProgressPlans.map((plan, index) => {
      const phases = plan.phases || [];
      const completedPhasesCount = phases.filter((p) => p.status === 'COMPLETED').length;
      const inProgressIdx = phases.findIndex((p) => p.status === 'IN_PROGRESS');
      const progressPercent = phases.length > 0 ? Math.round((completedPhasesCount / phases.length) * 100) : 0;

      let currentStage = 'Chưa có';
      if (phases.length > 0) {
        if (inProgressIdx !== -1) {
          currentStage = `Giai đoạn ${inProgressIdx + 1}/${phases.length}`;
        } else if (completedPhasesCount === phases.length) {
          currentStage = `Hoàn thành ${phases.length}/${phases.length}`;
        } else {
          currentStage = `Giai đoạn 1/${phases.length}`;
        }
      }

      const steps = phases.map((phase, pIdx) => {
        const isCompleted = phase.status === 'COMPLETED';
        const isInProgress = phase.status === 'IN_PROGRESS';
        const expectedStartDate = phase.expectedStartDate ? new Date(phase.expectedStartDate) : null;

        return {
          stepNum: pIdx + 1,
          title: phase.phaseName || `Giai đoạn ${pIdx + 1}`,
          date: expectedStartDate && !isNaN(expectedStartDate.getTime())
            ? expectedStartDate.toLocaleDateString('vi-VN')
            : 'Chưa có',
          status: isCompleted ? 'Hoàn thành' : isInProgress ? 'Đang điều trị' : 'Chưa bắt đầu',
          statusType: isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'pending',
        };
      });

      const startDateObj = plan.startDate ? new Date(plan.startDate) : null;
      const endDateObj = plan.endDate ? new Date(plan.endDate) : null;

      return {
        id: plan.id || `tp-${index}`,
        title: plan.planName || 'Chưa có',
        doctor: plan.dentistName ? (plan.dentistName.startsWith('BS.') ? plan.dentistName : `BS. ${plan.dentistName}`) : 'Chưa có',
        startDate: startDateObj && !isNaN(startDateObj.getTime()) ? startDateObj.toLocaleDateString('vi-VN') : 'Chưa có',
        expectedEndDate: endDateObj && !isNaN(endDateObj.getTime()) ? endDateObj.toLocaleDateString('vi-VN') : 'Chưa có',
        currentStage,
        progressPercent,
        status: plan.status === 'IN_PROGRESS' ? 'Đang điều trị' : plan.status === 'COMPLETED' ? 'Hoàn thành' : 'Chưa có',
        statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        image: '/tooth-implant.jpg',
        steps,
        raw: plan,
      };
    });
  }, [inProgressPlans]);

  const activeTreatmentPlan = treatmentPlans[selectedPlanIndex] || treatmentPlans[0] || null;

  // Map dữ liệu lịch sử điều trị thật từ API (fetchExaminationResultsByPatientId)
  const treatmentHistory = useMemo(() => {
    if (!examinationResults || examinationResults.length === 0) return [];

    return examinationResults.map((item) => {
      const d = item.examinationDate ? new Date(item.examinationDate) : null;
      const diagList = item.diagnoses || [];
      const primaryDiag = diagList[0]?.diagnosisName || item.diagnosis?.diagnosisName;
      const resultText = diagList.length > 0
        ? diagList.map((x) => x.diagnosisName).filter(Boolean).join(', ')
        : 'Hoàn thành';

      return {
        id: item.id || Math.random().toString(),
        date: d && !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : 'Chưa có',
        service: item.chiefComplaint || primaryDiag || 'Khám tổng quát',
        doctor: item.dentistName ? (item.dentistName.startsWith('BS.') ? item.dentistName : `BS. ${item.dentistName}`) : 'Chưa có',
        branch: item.branchName || 'Chưa có',
        result: resultText || 'chưa có',
        notes: item.diagnosis?.description || diagList[0]?.description || item.chiefComplaint || 'Chưa có',
        raw: item,
      };
    });
  }, [examinationResults]);

  // Phân trang lịch sử điều trị (tối đa 4 dòng mỗi trang)
  const totalHistoryPages = Math.ceil(treatmentHistory.length / itemsPerPage) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * itemsPerPage;
    return treatmentHistory.slice(start, start + itemsPerPage);
  }, [treatmentHistory, historyPage]);

  // Đặt lại trang 1 nếu trang hiện tại vượt quá tổng số trang
  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(1);
    }
  }, [historyPage, totalHistoryPages]);

  // Quick Action Buttons (Emerald / Teal Unified Theme)
  const quickActions = [
    {
      title: 'Đặt lịch khám',
      icon: CalendarPlus,
      bgColor: 'bg-teal-50 border border-teal-100',
      textColor: 'text-teal-800',
      hoverColor: 'hover:bg-teal-100/70',
      onClick: () => navigate('/patient/appointments'),
    },
    {
      title: 'Xem lịch hẹn',
      icon: CalendarCheck,
      bgColor: 'bg-emerald-50 border border-emerald-100',
      textColor: 'text-emerald-800',
      hoverColor: 'hover:bg-emerald-100/70',
      onClick: () => navigate('/patient/appointments'),
    },
    {
      title: 'Xem đơn thuốc',
      icon: FileText,
      bgColor: 'bg-teal-50/80 border border-teal-100',
      textColor: 'text-teal-700',
      hoverColor: 'hover:bg-teal-100/80',
      onClick: () => navigate('/patient/prescriptions'),
    },
    {
      title: 'Hồ sơ bệnh án',
      icon: Activity,
      bgColor: 'bg-emerald-50/80 border border-emerald-100',
      textColor: 'text-emerald-700',
      hoverColor: 'hover:bg-emerald-100/80',
      onClick: () => navigate('/patient/medical-records'),
    },
    {
      title: 'Thanh toán hóa đơn',
      icon: CreditCard,
      bgColor: 'bg-rose-50 border border-rose-100',
      textColor: 'text-rose-700',
      hoverColor: 'hover:bg-rose-100/70',
      onClick: () => navigate('/patient/invoices'),
    },
    {
      title: 'Liên hệ hỗ trợ',
      icon: Headphones,
      bgColor: 'bg-cyan-50 border border-cyan-100',
      textColor: 'text-cyan-800',
      hoverColor: 'hover:bg-cyan-100/70',
      onClick: () => setIsSupportOpen(true),
    },
  ];

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <Loading
          title="Đang tải bảng điều khiển bệnh nhân..."
          subtitle="Vui lòng đợi trong giây lát, hệ thống đang đồng bộ dữ liệu"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ======================================================== */}
      {/* 1. TOP HERO BANNER: Trải full màn hình web                */}
      {/* ======================================================== */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white shadow-md shadow-teal-950/10 border-b border-teal-500/20">
        {/* Soft background decor light glows */}
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        {/* Nội dung bên trong banner: Cách lề trái và phải cân đối chuẩn max-w-7xl */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

            {/* Left Card: Lịch hẹn sắp tới (White Floating Card) */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="flex items-center gap-1.5 text-emerald-100 font-bold text-sm mb-2.5 drop-shadow-xs">
                <Calendar className="h-4.5 w-4.5 text-emerald-200" />
                <span>Lịch hẹn sắp tới</span>
              </div>

              <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xl shadow-teal-950/20 border border-white/80 text-slate-800">
                {latestAppointment ? (
                  <>
                    <div className="flex items-start gap-4">
                      {/* Date Badge in Emerald theme */}
                      <div className="rounded-2xl bg-teal-50 border border-teal-100/90 px-3.5 py-3 text-center min-w-[76px] shrink-0 flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-teal-700 uppercase tracking-tight">
                          {latestAppointment.dayOfWeek}
                        </span>
                        <span className="text-3xl font-black text-teal-900 leading-none my-1">
                          {latestAppointment.dayNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {latestAppointment.monthYear}
                        </span>
                      </div>

                      {/* Appointment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {latestAppointment.title}
                          </h3>
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                            {latestAppointment.status}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{latestAppointment.doctor}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{latestAppointment.branch}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{latestAppointment.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedAppointment(latestAppointment)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors shadow-2xs cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointment(latestAppointment);
                          setIsRescheduleOpen(true);
                        }}
                        className="flex-1 rounded-xl bg-teal-700 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs cursor-pointer"
                      >
                        Đổi lịch
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-5 text-center">
                    <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Chưa có lịch hẹn nào sắp tới</p>
                    <p className="text-xs text-slate-400 mt-0.5">Đặt lịch khám để được bác sĩ theo dõi định kỳ</p>
                    <button
                      type="button"
                      onClick={() => navigate('/patient/appointments')}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors cursor-pointer shadow-xs"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Đặt lịch khám ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Banner: Greeting & Doctor Banner with Dental Slogan */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col md:flex-row items-center justify-between gap-6 pl-0 lg:pl-3">
              {/* Greeting & CTA */}
              <div className="max-w-md text-left space-y-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Xin chào,<br />
                  <span className="text-emerald-100 font-black">{displayName}!</span>
                </h2>
                <p className="text-xs sm:text-sm text-teal-100 leading-relaxed font-medium">
                  Cảm ơn bạn đã tin tưởng đồng hành cùng Crown Dental. Chúc bạn luôn có nụ cười khỏe mạnh!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/patient/appointments')}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-teal-900 shadow-md hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    Đặt lịch khám ngay
                    <ArrowRight className="h-4 w-4 text-teal-700" />
                  </button>
                </div>
              </div>

              {/* Model Face & Slogan Image Visual */}
              <div className="relative shrink-0 flex items-center justify-center">
                {/* Photo of model */}
                <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden border-4 border-white/60 shadow-xl shadow-teal-950/20 ring-4 ring-white/20">
                  <img
                    src="/patient-banner.jpg"
                    alt="Nụ cười khỏe đẹp"
                    className="h-full w-full object-cover object-top hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Slogan pill banner (top-right of model) */}
                <div className="hidden sm:block absolute -right-4 -top-3 max-w-[155px] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-white text-center transform rotate-3">
                  <p className="text-[11px] font-bold text-teal-900 italic leading-snug">
                    "Nụ cười đẹp khởi đầu của sự tự tin ♡"
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NỘI DUNG BÊN DƯỚI BANNER: Cách lề trái và phải cân đối  */}
      {/* ======================================================== */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-12">
        {/* 2. STATS SUMMARY ROW: 5 Cards (Emerald / Teal Unified)  */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-teal-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.bgColor} ${item.color} shadow-xs`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {item.id === 'treatment-plan' ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Bên trái: Tổng kế hoạch */}
                      <div>
                        <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
                          {item.totalCount || item.count}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-1 whitespace-nowrap">
                          Tổng kế hoạch
                        </p>
                      </div>

                      {/* Ngăn cách */}
                      <div className="h-7 w-px bg-slate-200 shrink-0" />

                      {/* Bên phải: Đang điều trị */}
                      <div>
                        <p className="text-xl sm:text-2xl font-black text-teal-700 leading-none">
                          {item.inProgressCount || '1'}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-teal-700 font-bold mt-1 whitespace-nowrap">
                          Điều trị
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
                        {item.count}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-1 truncate">
                        {item.title}
                      </p>
                      {item.subtext && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">
                          {item.subtext}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </Link>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* 3. MIDDLE ROW: Lịch hẹn sắp tới & Kế hoạch điều trị      */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: Lịch hẹn sắp tới */}
          <div className="lg:col-span-6 rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  Lịch hẹn sắp tới
                </h3>
                <Link
                  to="/patient/appointments"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
                >
                  Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="group flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer"
                    >
                      {/* Date badge in teal */}
                      <div className="flex flex-col items-center justify-center rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 min-w-[62px] shrink-0">
                        <span className="text-[10px] font-bold text-teal-700">
                          {apt.dayOfWeek}
                        </span>
                        <span className="text-sm font-black text-teal-900 leading-tight">
                          {apt.date}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                            {apt.title}
                          </h4>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border ${apt.statusColor} shrink-0`}>
                            {apt.status}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {apt.doctor}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {apt.branch}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {apt.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 group-hover:bg-teal-100 text-slate-400 group-hover:text-teal-800 transition-colors shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Chưa có lịch hẹn nào sắp tới</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Đặt lịch khám để được bác sĩ theo dõi định kỳ</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Kế hoạch điều trị (Hỗ trợ nhiều bản ghi dạng Tabs) */}
          <div className="lg:col-span-6 rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Kế hoạch điều trị
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                    {treatmentPlans.length} kế hoạch
                  </span>
                </div>
                <Link
                  to="/patient/medical-records"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
                >
                  Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {activeTreatmentPlan ? (
                <>
                  {/* Pill Tabs Switcher khi có từ 2 kế hoạch trở lên */}
                  {treatmentPlans.length > 1 && (
                    <div className="mt-3.5 flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                      {treatmentPlans.map((plan, index) => {
                        const isActive = index === selectedPlanIndex;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanIndex(index)}
                            className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                              ? 'bg-white text-teal-800 shadow-sm ring-1 ring-slate-200/80'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                              }`}
                          >
                            <span className="truncate">{plan.title}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold shrink-0 ${isActive
                                ? 'bg-teal-50 text-teal-700 border border-teal-100'
                                : 'bg-slate-200/60 text-slate-500'
                                }`}
                            >
                              {plan.progressPercent}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeTreatmentPlan.image || "/tooth-implant.jpg"}
                        alt={activeTreatmentPlan.title}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-100 shadow-sm shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">
                            {activeTreatmentPlan.title}
                          </h4>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${activeTreatmentPlan.statusColor || 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {activeTreatmentPlan.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Bác sĩ điều trị: <span className="font-semibold text-slate-700">{activeTreatmentPlan.doctor}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 font-medium space-y-0.5 sm:shrink-0">
                      <p>Ngày bắt đầu: <span className="font-semibold text-slate-700">{activeTreatmentPlan.startDate}</span></p>
                      <p>Dự kiến hoàn thành: <span className="font-semibold text-slate-700">{activeTreatmentPlan.expectedEndDate}</span></p>
                    </div>
                  </div>

                  {/* Progress Bar in Emerald / Teal */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>{activeTreatmentPlan.currentStage}</span>
                      <span className="text-teal-700 font-black">{activeTreatmentPlan.progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-500"
                        style={{ width: `${activeTreatmentPlan.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Visual Stepper */}
                  {activeTreatmentPlan.steps && activeTreatmentPlan.steps.length > 0 ? (
                    <div className="mt-6 relative">
                      {/* Connecting line behind circles */}
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                      <div
                        className="absolute top-4 left-6 h-0.5 bg-teal-600 -z-0 transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (activeTreatmentPlan.steps.filter((s) => s.statusType === 'completed').length /
                                (activeTreatmentPlan.steps.length - 1 || 1)) *
                              100 *
                              0.9
                            )
                          )}%`,
                        }}
                      />

                      <div
                        className="gap-2 text-center relative z-10"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${activeTreatmentPlan.steps.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {activeTreatmentPlan.steps.map((step) => {
                          const isCompleted = step.statusType === 'completed';
                          const isInProgress = step.statusType === 'in-progress';

                          return (
                            <div key={step.stepNum} className="flex flex-col items-center">
                              {/* Step Circle */}
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-xs transition-all ${isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : isInProgress
                                    ? 'bg-teal-700 text-white ring-4 ring-teal-100'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}
                              >
                                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.stepNum}
                              </div>

                              {/* Step Title */}
                              <p className="mt-2 text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">
                                {step.title}
                              </p>

                              {/* Step Date */}
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                {step.date}
                              </p>

                              {/* Step Badge */}
                              <span
                                className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[9px] font-bold leading-normal ${isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isInProgress
                                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                    : 'bg-slate-100 text-slate-500'
                                  }`}
                              >
                                {step.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 py-4 text-center rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500">Chưa có giai đoạn nào được ghi nhận cho kế hoạch này</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Chưa có kế hoạch điều trị nào đang tiến hành</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Các kế hoạch điều trị chuyên sâu đang thực hiện sẽ được cập nhật lộ trình chi tiết tại đây.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* 4. BOTTOM ROW: Lịch sử điều trị (Table) & Thao tác nhanh */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: Lịch sử điều trị (Table) */}
          <div className="lg:col-span-8 rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  Lịch sử điều trị
                </h3>
                <Link
                  to="/patient/medical-records"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
                >
                  Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Ngày điều trị</th>
                      <th className="py-3 px-3">Dịch vụ</th>
                      <th className="py-3 px-3">Bác sĩ</th>
                      <th className="py-3 px-3">Chi nhánh</th>
                      <th className="py-3 px-3">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedHistory.length > 0 ? (
                      paginatedHistory.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedHistory(item)}
                          className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                            {item.service}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {item.doctor}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {item.branch}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {item.result}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
                          Chưa có lịch sử điều trị
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phân trang khi lịch sử điều trị quá 4 dòng */}
            {treatmentHistory.length > itemsPerPage && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500 font-medium">
                  Trang <span className="font-bold text-slate-800">{historyPage}</span> / {totalHistoryPages} ({treatmentHistory.length} kết quả)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalHistoryPages }, (_, idx) => idx + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setHistoryPage(pageNum)}
                      className={`h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        pageNum === historyPage
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={historyPage === totalHistoryPages}
                    onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages))}
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Thao tác nhanh (6 Emerald / Teal Unified Tiles) */}
          <div className="lg:col-span-4 rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Thao tác nhanh
              </h3>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={action.onClick}
                      className={`flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition-all duration-200 ${action.bgColor} ${action.textColor} ${action.hoverColor} hover:scale-[1.02] active:scale-95 shadow-2xs cursor-pointer min-h-[86px]`}
                    >
                      <Icon className="h-5.5 w-5.5 mb-1.5 shrink-0" />
                      <span className="text-xs font-bold leading-tight">
                        {action.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. MODALS & POPUPS                                       */}
      {/* ======================================================== */}

      {/* Appointment Detail Modal */}
      {selectedAppointment && !isRescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Chi tiết lịch hẹn</h3>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Dịch vụ:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Bác sĩ:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.doctor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Thời gian:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.time} - {selectedAppointment.dayOfWeek}, {selectedAppointment.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Chi nhánh:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.branch}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Địa chỉ:</span>
                <span className="font-medium text-slate-700 text-right max-w-[240px]">{selectedAppointment.address}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Trạng thái:</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  {selectedAppointment.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(true)}
                className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs"
              >
                Yêu cầu đổi lịch
              </button>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Confirmation Modal */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Yêu cầu đổi lịch khám</h3>
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn đang yêu cầu đổi lịch hẹn: <span className="font-bold text-slate-900">{selectedAppointment?.title}</span> ({selectedAppointment?.time}, {selectedAppointment?.date}).
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700">Chọn ngày mong muốn mới:</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  defaultValue="2025-10-20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Khung giờ mong muốn:</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>Buổi sáng (08:30 - 11:30)</option>
                  <option>Buổi chiều (14:00 - 17:00)</option>
                  <option>Buổi tối (17:30 - 20:00)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Ghi chú thêm:</label>
                <textarea
                  rows={2}
                  placeholder="Lý do bận, yêu cầu bác sĩ..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  toast.success('Đã gửi yêu cầu đổi lịch! Lễ tân sẽ liên hệ xác nhận trong 15 phút.');
                  setIsRescheduleOpen(false);
                  setSelectedAppointment(null);
                }}
                className="flex-1 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs"
              >
                Gửi yêu cầu
              </button>
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Treatment History Detail Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Chi tiết đợt điều trị</h3>
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dịch vụ:</span>
                <span className="font-bold text-slate-900">{selectedHistory.service}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngày thực hiện:</span>
                <span className="font-bold text-slate-900">{selectedHistory.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bác sĩ phụ trách:</span>
                <span className="font-bold text-slate-900">{selectedHistory.doctor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chi nhánh:</span>
                <span className="font-bold text-slate-900">{selectedHistory.branch}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 text-xs block mb-1">Ghi chú & kết quả bác sĩ:</span>
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedHistory.notes}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support / Contact Hotline Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Headphones className="h-5 w-5 text-teal-700" />
                <h3 className="text-base font-bold">Trung tâm hỗ trợ bệnh nhân</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600">
              <div className="rounded-xl bg-teal-50 p-4 border border-teal-100 text-center">
                <p className="font-bold text-teal-900">Tổng đài chăm sóc khách hàng 24/7</p>
                <a
                  href="tel:19001234"
                  className="mt-1 block text-2xl font-black text-teal-800 hover:underline"
                >
                  1900 1234
                </a>
                <p className="text-[11px] text-teal-600 mt-1">Miễn phí cước gọi từ mọi mạng</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800">Hệ thống chi nhánh Crown Dental:</p>
                <div className="rounded-xl border border-slate-100 p-2.5 space-y-1">
                  <p className="font-bold text-slate-800">Chi nhánh 1 (Quận 1):</p>
                  <p className="text-slate-500">123 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1 - ĐT: 028 3930 1111</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-2.5 space-y-1">
                  <p className="font-bold text-slate-800">Chi nhánh 2 (Tân Bình):</p>
                  <p className="text-slate-500">45 Hoàng Hoa Thám, P.13, Q. Tân Bình - ĐT: 028 3810 2222</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-2.5 space-y-1">
                  <p className="font-bold text-slate-800">Chi nhánh 3 (Thủ Đức):</p>
                  <p className="text-slate-500">88 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức - ĐT: 028 3720 3333</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

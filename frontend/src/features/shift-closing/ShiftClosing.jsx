import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Coins,
  Building,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  Receipt,
  Search,
  Calculator,
  ShieldCheck,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Sunset,
  Moon,
  CalendarDays,
  Sparkles,
  Lock,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getEmployeeAddressById } from '../../services/employee.service';
import shiftClosingService from './services/shiftClosingService';
import CashDenominationModal from './components/CashDenominationModal';
import ShiftPrintReceipt from './components/ShiftPrintReceipt';
import ShiftHistoryTable from './components/ShiftHistoryTable';

// Lấy chuỗi ngày YYYY-MM-DD theo giờ địa phương thực tế của máy người dùng
const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Định dạng hiển thị thứ trong tuần và ngày tháng tiếng Việt
const formatVietnameseDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const weekday = weekdays[date.getDay()];
  return `${weekday}, ngày ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};

const SHIFT_OPTIONS = [
  { id: 'MORNING', label: 'Ca Sáng', timeRange: '07:30 - 12:00', icon: Sun },
  { id: 'AFTERNOON', label: 'Ca Chiều', timeRange: '12:00 - 17:30', icon: Sunset },
  { id: 'EVENING', label: 'Ca Tối', timeRange: '17:30 - 21:00+', icon: Moon },
  { id: 'FULL_DAY', label: 'Trọn Ngày', timeRange: '00:00 - 23:59', icon: CalendarDays },
];

// Kiểm tra giao dịch ngoài giờ ca tối (sau 21:00 như 21:01, 21:15)
const isOvertimeEvening = (timeStr) => {
  if (!timeStr) return false;
  const d = new Date(timeStr);
  const h = d.getHours();
  const m = d.getMinutes();
  return h > 21 || (h === 21 && m > 0);
};

// Kiểm tra giao dịch sớm đầu ca sáng (trước 07:30 như 07:00, 07:15)
const isEarlyMorning = (timeStr) => {
  if (!timeStr) return false;
  const d = new Date(timeStr);
  const h = d.getHours();
  const m = d.getMinutes();
  return h < 7 || (h === 7 && m < 30);
};

// Định dạng hiển thị khung giờ đối soát
const formatTimeWindow = (startStr, endStr) => {
  if (!startStr && !endStr) return '';
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  return `${formatTime(startStr)} - ${formatTime(endStr)}`;
};

// Tự động nhận diện ca làm việc theo thời điểm thực tế trong ngày
const getCurrentShiftType = () => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 12 * 60) return 'MORNING'; // 00:00 - 12:00
  if (minutes < 17 * 60 + 30) return 'AFTERNOON'; // 12:00 - 17:30
  return 'EVENING'; // 17:30 - 23:59
};

export default function ShiftClosing() {
  const { user } = useAuth();

  // Tab: 'current' | 'history'
  const [activeTab, setActiveTab] = useState('current');

  // Ngày làm việc: Mặc định luôn là ngày hôm nay theo giờ địa phương máy người dùng
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;
  const isYesterday = selectedDate === yesterdayStr;

  // Ca config: Mặc định tự động chọn ca phù hợp với khung giờ hiện tại
  const [shiftType, setShiftType] = useState(getCurrentShiftType);
  const [initialCash, setInitialCash] = useState(2000000); // Tiền mặt đầu ca trong két
  const [isCustomInitialCash, setIsCustomInitialCash] = useState(false); // Đánh dấu người dùng có tự sửa tiền két thủ công

  // Loading states
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dữ liệu tính toán từ hệ thống
  const [settlementData, setSettlementData] = useState({
    initialCash: 2000000,
    cashRevenue: 0,
    bankTransferRevenue: 0,
    cardRevenue: 0,
    eWalletRevenue: 0,
    totalSystemRevenue: 0,
    totalCashExpected: 2000000,
    totalTransactions: 0,
    transactions: [],
    startTime: '',
    endTime: '',
    inheritedFromPreviousShift: false,
    previousShiftCode: null,
    previousShiftType: null,
    previousShiftActualCash: null,
    previousShiftEmployeeName: null,
  });

  // Tiền mặt thực tế kiểm đếm
  const [actualCash, setActualCash] = useState(2000000);
  const [differenceReason, setDifferenceReason] = useState('');
  const [denominations, setDenominations] = useState({});

  // Chuyển khoản thực tế kiểm tra (trên App / sao kê ngân hàng)
  const [actualBankTransfer, setActualBankTransfer] = useState(0);
  const [bankDifferenceReason, setBankDifferenceReason] = useState('');

  // Chế độ xem đối soát: 'cash' (Tiền mặt) | 'bank' (Chuyển khoản) | 'all' (Xem cả hai)
  const [reconcileTab, setReconcileTab] = useState('cash');

  // Thông tin chi nhánh và hồ sơ nhân viên đang đăng nhập
  const [currentEmployeeProfile, setCurrentEmployeeProfile] = useState(null);

  // Bàn giao
  const [handoverEmployeeId, setHandoverEmployeeId] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [note, setNote] = useState('');

  // Lấy chi nhánh của nhân viên đang đăng nhập
  useEffect(() => {
    const empId = user?.employeeId || user?.id;
    if (empId) {
      getEmployeeAddressById(empId)
        .then((res) => {
          const data = res?.data || res;
          if (data) {
            setCurrentEmployeeProfile(data);
          }
        })
        .catch((err) => {
          console.warn('Lỗi lấy thông tin chi nhánh nhân viên:', err);
        });
    }
  }, [user?.employeeId, user?.id]);

  // Chi nhánh & tên nhân viên đang thao tác kết ca: Lấy đúng username/họ tên tài khoản đăng nhập thực tế
  const currentBranchId = currentEmployeeProfile?.branchId || settlementData?.branchId || null;
  const currentBranchName = currentEmployeeProfile?.branchName || settlementData?.branchName || null;
  const currentEmployeeName =
    currentEmployeeProfile?.fullName || user?.fullName || user?.username || 'Nhân viên lễ tân';
  const currentEmployeePosition = 'Nhân viên Lễ tân / Thu ngân';

  // Modals
  const [isDenomModalOpen, setIsDenomModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filter giao dịch trong ca
  const [searchTx, setSearchTx] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');

  // Lấy danh sách nhân viên để bàn giao (ưu tiên lọc cùng chi nhánh)
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await shiftClosingService.getEmployeesForHandover(
          currentBranchId ? { branchId: currentBranchId } : {}
        );
        setEmployeesList(res || []);
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    }
    loadEmployees();
  }, [currentBranchId]);

  // Lọc danh sách nhân viên bàn giao: Chỉ cùng chi nhánh & loại trừ chính mình
  const handoverCandidates = useMemo(() => {
    const currentEmpId = user?.employeeId || currentEmployeeProfile?.id;
    const currentUsername = user?.username;
    return employeesList.filter((emp) => {
      // 1. Loại trừ chính tài khoản đang đăng nhập kết ca
      if (currentEmpId && String(emp.id) === String(currentEmpId)) {
        return false;
      }
      if (currentUsername && (emp.username === currentUsername || emp.fullName === currentUsername)) {
        return false;
      }
      // 2. Lọc cùng chi nhánh (so sánh theo branchId hoặc branchName)
      if (currentBranchId && emp.branchId) {
        return String(emp.branchId) === String(currentBranchId);
      }
      if (currentBranchName && emp.branchName) {
        return emp.branchName === currentBranchName;
      }
      return true;
    });
  }, [employeesList, user?.employeeId, user?.username, currentEmployeeProfile?.id, currentBranchId, currentBranchName]);

  // Tính toán thời gian bắt đầu và kết thúc của ca theo ngày và ca chọn
  // Đảm bảo nghiệp vụ phân chia ca y tế chuẩn:
  // - Ca Sáng: 00:00:00 - 12:00:00 (gom cả các giao dịch cọc sớm trước 07:30)
  // - Ca Chiều: 12:00:00 - 17:30:00
  // - Ca Tối: 17:30:00 - 23:59:59 (ca cuối ngày, tự động tính các hóa đơn sau 21:00 như 21:01, 21:15 để tránh thất thoát két)
  // - Trọn Ngày: 00:00:00 - 23:59:59
  const getShiftTimeRange = (dateStr, type) => {
    if (type === 'FULL_DAY') {
      return {
        startIso: `${dateStr}T00:00:00`,
        endIso: `${dateStr}T23:59:59`,
      };
    }
    if (type === 'MORNING') {
      return {
        startIso: `${dateStr}T00:00:00`,
        endIso: `${dateStr}T12:00:00`,
      };
    }
    if (type === 'AFTERNOON') {
      return {
        startIso: `${dateStr}T12:00:00`,
        endIso: `${dateStr}T17:30:00`,
      };
    }
    if (type === 'EVENING') {
      return {
        startIso: `${dateStr}T17:30:00`,
        endIso: `${dateStr}T23:59:59`,
      };
    }
    return {
      startIso: `${dateStr}T00:00:00`,
      endIso: `${dateStr}T23:59:59`,
    };
  };

  // Các hàm tiện ích chuyển nhanh ngày
  const handleStepDay = (step) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + step);
    setSelectedDate(getLocalDateString(date));
  };

  // Tính toán số liệu ca hiện tại
  const fetchShiftCalculation = async (
    date = selectedDate,
    type = shiftType,
    initCash = null,
    isCustom = false
  ) => {
    setCalculating(true);
    try {
      const { startIso, endIso } = getShiftTimeRange(date, type);
      const params = {
        employeeId: user?.employeeId,
        shiftType: type,
        startTime: startIso,
        endTime: endIso,
        customInitialCash: isCustom,
      };
      if (isCustom && initCash !== null && initCash !== undefined) {
        params.initialCash = initCash;
      }

      const res = await shiftClosingService.calculateShiftSettlement(params);

      if (res && res.data) {
        const d = res.data;
        setSettlementData(d);

        // Trường hợp 1: Ca làm việc này ĐÃ ĐƯỢC CHỐT & BÀN GIAO trước đó
        if (d.isClosed && d.closedShift) {
          const cs = d.closedShift;
          setInitialCash(Number(cs.initialCash) || 0);
          setActualCash(Number(cs.totalCashActual) || 0);
          setActualBankTransfer(Number(cs.totalBankTransferActual) || 0);
          setDifferenceReason(cs.differenceReason || '');
          setBankDifferenceReason(cs.bankTransferDifferenceReason || '');
          setHandoverEmployeeId(cs.handoverEmployeeId || '');
          setNote(cs.note || '');
          setIsCustomInitialCash(false);
          try {
            if (cs.denominationsJson) {
              setDenominations(JSON.parse(cs.denominationsJson));
            }
          } catch (e) {
            // ignore
          }
        } else {
          // Trường hợp 2: Ca làm việc CHƯA CHỐT -> Thu ngân kiểm đếm đối soát mới
          // Tự động nhận tiền đầu ca do hệ thống tính toán (đã kế thừa từ ca bàn giao trước)
          setInitialCash(Number(d.initialCash) || 0);
          setActualCash(Number(d.totalCashExpected) || Number(d.initialCash) || 0);
          setActualBankTransfer(Number(d.bankTransferRevenue) || 0);
          setDifferenceReason('');
          setBankDifferenceReason('');
          setHandoverEmployeeId('');
          setNote('');
          if (!isCustom) {
            setIsCustomInitialCash(false);
          }
        }
      }
    } catch (err) {
      console.error('Error calculating shift:', err);
      toast.error('Không thể tải số liệu kết ca từ hệ thống');
    } finally {
      setCalculating(false);
    }
  };

  // Tải số liệu ban đầu khi đổi ca hoặc ngày: Tự động kế thừa từ ca trước
  useEffect(() => {
    setIsCustomInitialCash(false);
    fetchShiftCalculation(selectedDate, shiftType, null, false);
  }, [selectedDate, shiftType]);

  // Tải danh sách lịch sử kết ca
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await shiftClosingService.getShiftClosings();
      if (res && res.data) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Không thể tải lịch sử kết ca');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // 1. Tính toán đối soát Tiền mặt két
  const totalExpectedCash = (Number(initialCash) || 0) + (Number(settlementData.cashRevenue) || 0);
  const cashDifference = (Number(actualCash) || 0) - totalExpectedCash;

  // 2. Tính toán đối soát Chuyển khoản ngân hàng
  const expectedBankTransfer = Number(settlementData.bankTransferRevenue) || 0;
  const bankDifference = (Number(actualBankTransfer) || 0) - expectedBankTransfer;

  // Đếm số giao dịch theo phương thức
  const cashTransactionsCount = useMemo(() => {
    return (settlementData.transactions || []).filter(
      (tx) => tx.paymentMethod === 'CASH'
    ).length;
  }, [settlementData.transactions]);

  const bankTransactionsCount = useMemo(() => {
    return (settlementData.transactions || []).filter(
      (tx) => tx.paymentMethod !== 'CASH'
    ).length;
  }, [settlementData.transactions]);

  // 3. Doanh thu thực tế ca (Thực thu trong ca = Tiền mặt thực thu + Toàn bộ chuyển khoản/điện tử thực nhận)
  // Tiền mặt thực tế thu = Tiền mặt trong két - Tiền thối đầu ca
  const actualCashRevenue = (Number(actualCash) || 0) - (Number(initialCash) || 0);
  const actualBankRevenue = Number(actualBankTransfer) || 0;
  const actualTotalRevenue = actualCashRevenue + actualBankRevenue;
  const totalSystemRevenue = Number(settlementData.totalSystemRevenue) || 0;
  const totalRevenueDifference = cashDifference + bankDifference;

  // Xử lý áp dụng kết quả từ bảng kiểm đếm mệnh giá
  const handleApplyDenominations = (total, counts) => {
    setActualCash(total);
    setDenominations(counts);
    toast.success(`Đã cập nhật tiền thực đếm: ${total.toLocaleString('vi-VN')} đ`);
  };

  // Kiểm tra ca cuối ngày (Ca Tối hoặc Ca Trọn Ngày)
  const isEndOfDay = shiftType === 'EVENING' || shiftType === 'FULL_DAY';

  // Xác nhận chốt ca
  const handleSubmitClosing = async () => {
    if (!user?.employeeId) {
      toast.error('Không tìm thấy thông tin nhân viên');
      return;
    }

    if (!handoverEmployeeId && !isEndOfDay) {
      toast.error('Vui lòng chọn nhân viên nhận bàn giao ca tiếp theo');
      return;
    }

    if (cashDifference !== 0 && !differenceReason.trim()) {
      toast.error('Vui lòng nhập lý do chênh lệch tiền mặt trong két');
      return;
    }

    if (bankDifference !== 0 && !bankDifferenceReason.trim()) {
      toast.error('Vui lòng nhập lý do chênh lệch chuyển khoản ngân hàng');
      return;
    }

    setSubmitting(true);
    try {
      const { startIso, endIso } = getShiftTimeRange(selectedDate, shiftType);
      const isOvernight = !handoverEmployeeId || handoverEmployeeId === 'OVERNIGHT';
      const finalHandoverEmpId = isOvernight ? null : handoverEmployeeId;

      let finalNote = (note || '').trim();
      if (isEndOfDay && isOvernight && !finalNote.includes('Niêm phong')) {
        finalNote = finalNote
          ? `${finalNote} • [Niêm phong két lưu qua đêm]`
          : '[Niêm phong két lưu qua đêm cho ca sáng mai]';
      }

      const payload = {
        employeeId: user?.employeeId || currentEmployeeProfile?.id,
        handoverEmployeeId: finalHandoverEmpId,
        branchId: currentBranchId || settlementData.branchId || null,
        shiftType: shiftType,
        startTime: settlementData.startTime || startIso,
        endTime: settlementData.endTime || endIso,
        initialCash: Number(initialCash) || 0,
        cashRevenue: settlementData.cashRevenue || 0,
        bankTransferRevenue: settlementData.bankTransferRevenue || 0,
        cardRevenue: settlementData.cardRevenue || 0,
        eWalletRevenue: settlementData.eWalletRevenue || 0,
        totalSystemRevenue: settlementData.totalSystemRevenue || 0,
        totalCashExpected: totalExpectedCash,
        totalCashActual: Number(actualCash) || 0,
        differenceAmount: cashDifference,
        differenceReason: differenceReason,
        totalBankTransferActual: Number(actualBankTransfer) || 0,
        bankTransferDifference: bankDifference,
        bankTransferDifferenceReason: bankDifferenceReason,
        totalTransactions: settlementData.totalTransactions || 0,
        note: finalNote,
        denominationsJson: JSON.stringify(denominations),
      };

      const res = await shiftClosingService.createShiftClosing(payload);
      if (res && res.data) {
        toast.success('Chốt kết ca thành công!');
        setPrintData(res.data);
        setIsPrintModalOpen(true);
        await fetchShiftCalculation(selectedDate, shiftType, initialCash);
        loadHistory();
      }
    } catch (err) {
      console.error('Error submitting shift closing:', err);
      toast.error(err.response?.data?.message || 'Có lỗi khi chốt kết ca');
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc danh sách giao dịch hiển thị
  const filteredTransactions = useMemo(() => {
    return (settlementData.transactions || []).filter((tx) => {
      const matchSearch =
        !searchTx ||
        (tx.patientName && tx.patientName.toLowerCase().includes(searchTx.toLowerCase())) ||
        (tx.invoiceCode && tx.invoiceCode.toLowerCase().includes(searchTx.toLowerCase())) ||
        (tx.transactionCode && tx.transactionCode.toLowerCase().includes(searchTx.toLowerCase()));

      const matchMethod = filterMethod === 'ALL' || tx.paymentMethod === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [settlementData.transactions, searchTx, filterMethod]);

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="space-y-4 pb-12 text-slate-800">
      {/* Top Header Card - Thiết kế phẳng, tối giản, thanh lịch */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Clock className="h-3 w-3 text-slate-500" />
                Phiên làm việc thu ngân
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang trực ca
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Kết Toán & Bàn Giao Ca Làm Việc
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Đối soát doanh thu theo từng phương thức, kiểm đếm tiền mặt két và bàn giao công việc giữa các ca trực.
            </p>
          </div>

          {/* Tab switch buttons */}
          <div className="flex items-center rounded-md bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'current'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Calculator className="h-3.5 w-3.5 text-teal-700" />
              Kết ca hiện tại
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <History className="h-3.5 w-3.5 text-teal-700" />
              Lịch sử các ca
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'current' ? (
        <>
          {/* Thanh lọc & thiết lập ca làm việc - Thiết kế to, rộng, có icon và cân đối */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            {/* Hàng 1: Bộ chọn ngày & Bộ chọn ca làm việc (To, rộng, đầy đủ icon) */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 text-xs">
              {/* Cột 1: Ngày làm việc */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-700" />
                    Ngày làm việc
                  </span>
                  {isToday ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Hôm nay
                    </span>
                  ) : isYesterday ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Hôm qua
                    </span>
                  ) : null}
                </div>

                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 focus-within:border-teal-700 focus-within:bg-white transition-colors overflow-hidden h-9 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleStepDay(-1)}
                    className="h-full px-2.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 border-r border-slate-200 transition-colors"
                    title="Lùi lại 1 ngày"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-full px-3 text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepDay(1)}
                    className="h-full px-2.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 border-l border-slate-200 transition-colors"
                    title="Tiến lên 1 ngày"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Cột 2: Chọn ca làm việc (To, rộng, có icon sinh động) */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-[320px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-teal-700" />
                  Chọn ca làm việc
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SHIFT_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isActive = shiftType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setShiftType(opt.id)}
                        className={`h-9 flex items-center justify-center gap-2 px-3 rounded-lg text-xs font-semibold border transition-all ${isActive
                          ? 'bg-teal-700 border-teal-700 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                      >
                        <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-200' : 'text-slate-500'}`} />
                        <span className="truncate">{opt.label}</span>
                        <span className={`text-[10px] font-normal hidden xl:inline ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                          ({opt.timeRange})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Đường phân cách mảnh tinh tế */}
            <div className="border-t border-slate-100" />

            {/* Hàng 2: Thiết lập tiền két (bên trái) & Thao tác nhanh (bên phải) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Bên trái: Tiền mặt đầu ca trong két */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-teal-700" />
                  Tiền mặt đầu ca (két):
                </span>
                <div className="relative flex items-center h-8">
                  <input
                    type="number"
                    step="50000"
                    value={initialCash}
                    disabled={settlementData.isClosed}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setInitialCash(val);
                      setIsCustomInitialCash(true);
                    }}
                    onBlur={() => fetchShiftCalculation(selectedDate, shiftType, initialCash, true)}
                    className={`h-full w-36 rounded-lg border px-2.5 pr-8 text-xs font-bold shadow-2xs transition-colors focus:outline-none ${settlementData.isClosed
                      ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-teal-600 focus:border-teal-700'
                      }`}
                  />
                  <span className="absolute right-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                    VNĐ
                  </span>
                </div>

                {/* Huy hiệu thông tin nguồn gốc tiền két */}
                {settlementData.inheritedFromPreviousShift && !isCustomInitialCash ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Bàn giao từ {settlementData.previousShiftType === 'MORNING' ? 'Ca Sáng' : settlementData.previousShiftType === 'AFTERNOON' ? 'Ca Chiều' : settlementData.previousShiftType === 'EVENING' ? 'Ca Tối' : 'Ca trước'}
                      {settlementData.previousShiftCode && <span className="text-emerald-600 font-normal"> ({settlementData.previousShiftCode})</span>}
                      {settlementData.previousShiftActualCash !== null && settlementData.previousShiftActualCash !== undefined && (
                        <strong className="text-emerald-900 ml-1">: {Number(settlementData.previousShiftActualCash).toLocaleString('vi-VN')} đ</strong>
                      )}
                    </span>
                  </span>
                ) : isCustomInitialCash ? (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      Đã điều chỉnh thủ công
                    </span>
                    {settlementData.previousShiftActualCash !== null && settlementData.previousShiftActualCash !== undefined && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomInitialCash(false);
                          fetchShiftCalculation(selectedDate, shiftType, null, false);
                          toast.success('Đã khôi phục tiền đầu ca theo số tiền bàn giao ca trước');
                        }}
                        className="text-teal-700 hover:text-teal-900 underline font-bold cursor-pointer"
                        title="Khôi phục lại số tiền bàn giao từ ca trước"
                      >
                        Khôi phục ({Number(settlementData.previousShiftActualCash).toLocaleString('vi-VN')} đ)
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Quỹ tiền mặt định mức mặc định (2.000.000 đ)
                  </span>
                )}
              </div>

              {/* Bên phải: Nút tác vụ nhanh */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/employee/invoice-lookup"
                  className="h-8 flex items-center gap-1.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold whitespace-nowrap transition-colors shadow-2xs"
                  title="Tra cứu danh sách hóa đơn thu viện phí"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>Tra cứu hóa đơn</span>
                </Link>

                <button
                  type="button"
                  onClick={() => fetchShiftCalculation(selectedDate, shiftType, isCustomInitialCash ? initialCash : null, isCustomInitialCash)}
                  disabled={calculating}
                  className="h-8 flex items-center gap-1.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50 shadow-2xs"
                >
                  <RotateCcw className={`h-3.5 w-3.5 text-slate-500 shrink-0 ${calculating ? 'animate-spin text-teal-700' : ''}`} />
                  <span>{calculating ? 'Đang tải...' : 'Làm mới dữ liệu'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Thông báo nghiệp vụ ca làm việc & Khung giờ đối soát */}
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-700 shrink-0 font-bold">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <div>
                <span className="font-bold text-slate-800">
                  {shiftType === 'EVENING' && 'Ca Tối (Ca cuối ngày):'}
                  {shiftType === 'MORNING' && 'Ca Sáng (Đầu ngày):'}
                  {shiftType === 'AFTERNOON' && 'Ca Chiều:'}
                  {shiftType === 'FULL_DAY' && 'Ca Cả Ngày:'}
                </span>{' '}
                <span className="text-slate-600">
                  {shiftType === 'EVENING' && 'Hệ thống tự động gom các hóa đơn thanh toán sau 21:00 (như 21:01, 21:15 do điều trị/tiểu phẫu muộn) vào Ca Tối để đối soát khớp chính xác 100% tiền két.'}
                  {shiftType === 'MORNING' && 'Tự động tính đầy đủ các khoản thanh toán/đặt cọc sớm từ 00:00:00 đến 12:00:00 để không bỏ sót.'}
                  {shiftType === 'AFTERNOON' && 'Tổng hợp toàn bộ các giao dịch điều trị & thanh toán từ 12:00:00 đến 17:30:00.'}
                  {shiftType === 'FULL_DAY' && 'Tổng hợp toàn bộ 24h giao dịch trong ngày từ 00:00:00 đến 23:59:59.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-[11px]">
              <span className="text-slate-500 font-medium">Khung giờ đối soát:</span>
              <span className="font-bold text-teal-800">
                {settlementData.startTime && settlementData.endTime
                  ? formatTimeWindow(settlementData.startTime, settlementData.endTime)
                  : shiftType === 'EVENING' ? '17:30 - 23:59' : shiftType === 'MORNING' ? '00:00 - 12:00' : shiftType === 'AFTERNOON' ? '12:00 - 17:30' : '00:00 - 23:59'}
              </span>
            </div>
          </div>

          {/* Banner thông báo trạng thái ca ĐÃ CHỐT */}
          {settlementData.isClosed && settlementData.closedShift && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Ca trực đã được kết toán & bàn giao thành công
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300">
                      Mã phiếu: {settlementData.closedShift.shiftCode}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Người chốt: <strong className="text-slate-900">{settlementData.closedShift.employeeName}</strong>
                    {settlementData.closedShift.handoverEmployeeName && (
                      <> • Bàn giao cho: <strong className="text-slate-900">{settlementData.closedShift.handoverEmployeeName}</strong></>
                    )}
                    {settlementData.closedShift.createdAt && (
                      <> • Thời gian: <span className="font-semibold text-slate-800">{new Date(settlementData.closedShift.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(settlementData.closedShift.createdAt).toLocaleDateString('vi-VN')}</span></>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPrintData(settlementData.closedShift);
                  setIsPrintModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
                title="Mở lại biên bản kết toán ca để xem và in phiếu ký nhận"
              >
                <Printer className="h-3.5 w-3.5 text-emerald-700" />
                <span>Xem / In biên bản kết ca</span>
              </button>
            </div>
          )}

          {/* 3 Thẻ KPI: Doanh thu theo phương thức thanh toán - Thiết kế phẳng, tối giản, đồng bộ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Tổng doanh thu */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tổng Doanh Thu Ca
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                  <Receipt className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {formatMoney(settlementData.totalSystemRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {settlementData.totalTransactions || 0} giao dịch thanh toán
              </p>
            </div>

            {/* Card 2: Tiền mặt */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Thu Tiền Mặt (Cash)
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <Coins className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {formatMoney(settlementData.cashRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Nhập vào két tiền mặt trong ca
              </p>
            </div>

            {/* Card 3: Chuyển khoản ngân hàng */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Chuyển Khoản (Bank / QR)
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <Building className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {formatMoney(settlementData.bankTransferRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Qua VietQR / Ngân hàng phòng khám
              </p>
            </div>
          </div>

          {/* Middle Section: Đối soát tiền mặt & Bàn giao */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Cột trái (2/3): Bảng đối soát toàn diện Tiền mặt & Chuyển khoản */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Header đối soát */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Đối soát Doanh thu & Dòng tiền ca trực (Reconciliation)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Đối chiếu độc lập giữa Hóa đơn hệ thống với Tiền mặt trong két và Tiền chuyển khoản thực nhận
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDenomModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto"
                >
                  <Coins className="h-3.5 w-3.5 text-teal-700" />
                  <span>Kiểm đếm mệnh giá két</span>
                </button>
              </div>

              {/* THANH CHUYỂN TAB ĐỐI SOÁT (TABS) */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100/90 border border-slate-200">
                {/* Tab 1: Tiền mặt */}
                <button
                  type="button"
                  onClick={() => setReconcileTab('cash')}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${reconcileTab === 'cash'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 ring-1 ring-emerald-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                  <Coins className={`h-4 w-4 ${reconcileTab === 'cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Tiền mặt két</span>
                  <span className="hidden sm:inline-block text-[11px] font-normal text-slate-400">
                    ({cashTransactionsCount} HĐ)
                  </span>
                  {cashDifference === 0 ? (
                    <span className="ml-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Khớp
                    </span>
                  ) : (
                    <span className="ml-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="h-2.5 w-2.5" /> Lệch {formatMoney(cashDifference)}
                    </span>
                  )}
                </button>

                {/* Tab 2: Chuyển khoản */}
                <button
                  type="button"
                  onClick={() => setReconcileTab('bank')}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${reconcileTab === 'bank'
                    ? 'bg-white text-blue-800 shadow-xs border border-slate-200/80 ring-1 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                  <Building className={`h-4 w-4 ${reconcileTab === 'bank' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Chuyển khoản</span>
                  <span className="hidden sm:inline-block text-[11px] font-normal text-slate-400">
                    ({bankTransactionsCount} GD)
                  </span>
                  {bankDifference === 0 ? (
                    <span className="ml-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Khớp
                    </span>
                  ) : (
                    <span className="ml-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="h-2.5 w-2.5" /> Lệch {formatMoney(bankDifference)}
                    </span>
                  )}
                </button>
              </div>

              {/* NỘI DUNG TAB 1: ĐỐI SOÁT TIỀN MẶT KÉT */}
              {reconcileTab === 'cash' && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        1
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-emerald-600" />
                        Đối soát Tiền mặt trong két (Cash)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {cashTransactionsCount} hóa đơn tiền mặt
                    </span>
                  </div>

                  {/* 3 Ô so sánh tiền mặt */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">A. Tiền mặt đầu ca (két)</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {formatMoney(initialCash)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {settlementData.inheritedFromPreviousShift && !isCustomInitialCash
                          ? 'Bàn giao từ ca trước'
                          : isCustomInitialCash
                            ? 'Điều chỉnh thủ công'
                            : 'Tiền thối định mức'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-md border border-slate-200 bg-emerald-50/50">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">B. + Tiền mặt thu trong ca</p>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">
                        +{formatMoney(settlementData.cashRevenue)}
                      </p>
                      <p className="text-[10px] text-emerald-600/70">{cashTransactionsCount} giao dịch phát sinh</p>
                    </div>

                    <div className="p-2.5 rounded-md border border-slate-200 bg-slate-100/70">
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">= Tiền mặt dự kiến két (A+B)</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatMoney(totalExpectedCash)}
                      </p>
                      <p className="text-[10px] text-slate-500">Lý thuyết cần có</p>
                    </div>
                  </div>

                  {/* Trợ giúp xử lý quỹ tiền cuối ngày (Dành riêng cho Ca Tối & Ca Cả Ngày) */}
                  {isEndOfDay && !settlementData.isClosed && (
                    <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                          Nghiệp vụ chốt quỹ cuối ngày (End-of-Day):
                        </span>
                        <span className="text-[10px] text-teal-700 font-semibold bg-white px-2 py-0.5 rounded border border-teal-200">
                          Ca cuối ngày
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActualCash(totalExpectedCash);
                            setDifferenceReason('');
                            toast.success('Đã chọn: Giữ nguyên toàn bộ két qua đêm cho Ca Sáng mai');
                          }}
                          className={`p-2.5 text-left rounded-lg border transition-all ${
                            actualCash === totalExpectedCash && !differenceReason
                              ? 'border-teal-700 bg-white ring-1 ring-teal-700 shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-teal-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-800">1. Giữ trọn két qua đêm</p>
                            {actualCash === totalExpectedCash && !differenceReason && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Niêm phong toàn bộ <strong>{formatMoney(totalExpectedCash)}</strong> trong két để Ca Sáng mai nhận tiếp.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const defaultFloat = 2000000;
                            setActualCash(defaultFloat);
                            const dropAmount = Math.max(0, totalExpectedCash - defaultFloat);
                            const dropMsg = `Nộp ${formatMoney(dropAmount)} doanh thu cho Quản lý/Thủ quỹ; Để lại ${formatMoney(defaultFloat)} tiền thối định mức cho sáng mai.`;
                            setDifferenceReason(dropMsg);
                            setNote(dropMsg);
                            toast.success(`Đã chọn: Nộp ${formatMoney(dropAmount)}, lưu két 2.000.000 đ`);
                          }}
                          className={`p-2.5 text-left rounded-lg border transition-all ${
                            actualCash === 2000000 && differenceReason.includes('Nộp')
                              ? 'border-teal-700 bg-white ring-1 ring-teal-700 shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-teal-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-teal-800">2. Nộp doanh thu, giữ quỹ 2tr</p>
                            {actualCash === 2000000 && differenceReason.includes('Nộp') && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Rút nộp phần dư về két trung tâm, để lại đúng <strong>2.000.000 đ</strong> tiền thối cho Ca Sáng mai.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nhập kiểm đếm tiền mặt & chênh lệch */}
                  <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block font-bold text-slate-800">
                          Tiền mặt thực tế kiểm đếm trong két:
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Đếm thực tế trong két hoặc nhấn "Kiểm đếm mệnh giá"
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="1000"
                          value={actualCash}
                          disabled={settlementData.isClosed}
                          onChange={(e) => setActualCash(Number(e.target.value) || 0)}
                          className={`h-8 w-44 rounded-md border px-2.5 text-right font-bold text-sm focus:outline-none ${settlementData.isClosed
                            ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-teal-700'
                            }`}
                        />
                        <span className="text-xs font-semibold text-slate-500">VNĐ</span>
                        {!settlementData.isClosed && (
                          <button
                            type="button"
                            onClick={() => setActualCash(totalExpectedCash)}
                            className="h-8 px-2 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 whitespace-nowrap transition-colors"
                            title="Gán nhanh bằng số tiền lý thuyết két"
                          >
                            Khớp két
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Kết quả đối soát tiền mặt */}
                    <div className="border-t border-slate-200 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Chênh lệch két tiền mặt:</span>
                        {cashDifference === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            0 đ • KHỚP TIỀN MẶT HOÀN TOÀN
                          </span>
                        ) : cashDifference > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            +{formatMoney(cashDifference)} • THỪA TIỀN TRONG KÉT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            {formatMoney(cashDifference)} • THIẾU TIỀN TRONG KÉT
                          </span>
                        )}
                      </div>

                      {cashDifference !== 0 && (
                        <span className="text-[10px] text-rose-600 font-bold">
                          * Bắt buộc giải trình chênh lệch tiền mặt
                        </span>
                      )}
                    </div>

                    {cashDifference !== 0 && (
                      <div>
                        <input
                          type="text"
                          placeholder="Lý do chênh lệch tiền mặt (Ví dụ: BN trả thừa tiền lẻ không lấy, nhầm tiền thối...)"
                          value={differenceReason}
                          disabled={settlementData.isClosed}
                          onChange={(e) => setDifferenceReason(e.target.value)}
                          className={`w-full rounded-md border px-2.5 py-1.5 text-xs focus:outline-none ${settlementData.isClosed
                            ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'
                            : 'border-rose-200 bg-white text-slate-800 focus:border-rose-500'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NỘI DUNG TAB 2: ĐỐI SOÁT CHUYỂN KHOẢN NGÂN HÀNG */}
              {reconcileTab === 'bank' && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-800 text-[11px] font-bold">
                        2
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-blue-600" />
                        Đối soát Chuyển khoản ngân hàng (Bank / VietQR)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {bankTransactionsCount} giao dịch chuyển khoản
                    </span>
                  </div>

                  {/* 3 Ô so sánh chuyển khoản */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-md border border-slate-200 bg-blue-50/50">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">A. Doanh thu CK phần mềm</p>
                      <p className="text-sm font-bold text-blue-700 mt-0.5">
                        {formatMoney(settlementData.bankTransferRevenue)}
                      </p>
                      <p className="text-[10px] text-blue-600/70">Từ các hóa đơn quét mã / CK</p>
                    </div>

                    <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">B. Số giao dịch thành công</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {bankTransactionsCount} giao dịch
                      </p>
                      <p className="text-[10px] text-slate-400">Biên lai ngân hàng</p>
                    </div>

                    <div className="p-2.5 rounded-md border border-slate-200 bg-slate-100/70">
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">= Tiền CK cần có trên App</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatMoney(expectedBankTransfer)}
                      </p>
                      <p className="text-[10px] text-slate-500">Lý thuyết tài khoản nhận</p>
                    </div>
                  </div>

                  {/* Nhập kiểm tra chuyển khoản & chênh lệch */}
                  <div className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block font-bold text-slate-800">
                          Số tiền chuyển khoản thực nhận trên App / Sao kê ngân hàng:
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Kiểm tra số dư thực tế trên App ngân hàng phòng khám (VietQR / MB / VCB)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="1000"
                          value={actualBankTransfer}
                          disabled={settlementData.isClosed}
                          onChange={(e) => setActualBankTransfer(Number(e.target.value) || 0)}
                          className={`h-8 w-44 rounded-md border px-2.5 text-right font-bold text-sm focus:outline-none ${settlementData.isClosed
                            ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-teal-700'
                            }`}
                        />
                        <span className="text-xs font-semibold text-slate-500">VNĐ</span>
                        {!settlementData.isClosed && (
                          <button
                            type="button"
                            onClick={() => setActualBankTransfer(expectedBankTransfer)}
                            className="h-8 px-2 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 whitespace-nowrap transition-colors"
                            title="Gán nhanh bằng số tiền chuyển khoản trên hệ thống"
                          >
                            Khớp theo App
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Kết quả đối soát chuyển khoản */}
                    <div className="border-t border-slate-200 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Chênh lệch chuyển khoản:</span>
                        {bankDifference === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            0 đ • KHỚP CHUYỂN KHOẢN HOÀN TOÀN
                          </span>
                        ) : bankDifference > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            +{formatMoney(bankDifference)} • TIỀN VÀO NHIỀU HƠN HÓA ĐƠN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            {formatMoney(bankDifference)} • CHƯA NHẬN ĐỦ TIỀN (GIAO DỊCH TREO)
                          </span>
                        )}
                      </div>

                      {bankDifference !== 0 && (
                        <span className="text-[10px] text-rose-600 font-bold">
                          * Bắt buộc giải trình chênh lệch chuyển khoản
                        </span>
                      )}
                    </div>

                    {bankDifference !== 0 && (
                      <div>
                        <input
                          type="text"
                          placeholder="Lý do chênh lệch chuyển khoản (Ví dụ: Giao dịch 24/7 đang treo chờ ngân hàng hạch toán, khách chuyển nhầm...)"
                          value={bankDifferenceReason}
                          disabled={settlementData.isClosed}
                          onChange={(e) => setBankDifferenceReason(e.target.value)}
                          className={`w-full rounded-md border px-2.5 py-1.5 text-xs focus:outline-none ${settlementData.isClosed
                            ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'
                            : 'border-rose-200 bg-white text-slate-800 focus:border-rose-500'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* KHỐI 3: TỔNG KẾT ĐỐI SOÁT DOANH THU TOÀN CA */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-teal-700" />
                    Tổng kết đối soát Doanh thu ca
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    (Tiền mặt thực thu + Chuyển khoản thực nhận)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Doanh thu hệ thống ghi nhận</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {formatMoney(totalSystemRevenue)}
                    </p>
                    <p className="text-[10px] text-slate-400">Từ toàn bộ hóa đơn trong ca</p>
                  </div>

                  <div className="p-2 rounded bg-white border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Doanh thu thực tế thu được</p>
                    <p className="text-sm font-bold text-teal-800 mt-0.5">
                      {formatMoney(actualTotalRevenue)}
                    </p>
                    <p className="text-[10px] text-slate-400">Tiền mặt thực + CK thực nhận</p>
                  </div>

                  <div className="p-2 rounded bg-white border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Kết luận đối soát toàn ca</p>
                    {totalRevenueDifference === 0 ? (
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          0 đ • KHỚP DOANH THU 100%
                        </span>
                        <p className="text-[10px] text-emerald-600">Đủ điều kiện chốt ca</p>
                      </div>
                    ) : (
                      <div className="mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${totalRevenueDifference > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {totalRevenueDifference > 0 ? '+' : ''}{formatMoney(totalRevenueDifference)} • LỆCH DOANH THU
                        </span>
                        <p className="text-[10px] text-slate-500">
                          TM: {cashDifference >= 0 ? '+' : ''}{formatMoney(cashDifference)} | CK: {bankDifference >= 0 ? '+' : ''}{formatMoney(bankDifference)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải (1/3): Bàn giao ca & Xác nhận chốt */}
            <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs text-xs space-y-4 self-start sticky top-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <UserCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isEndOfDay ? 'Đóng sổ két & Niêm phong cuối ngày' : 'Bàn giao ca trực'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isEndOfDay ? 'Ca cuối cùng: Chốt doanh thu ngày, niêm phong két lưu qua đêm' : 'Chuyển giao cho người nhận ca tiếp theo'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    Nhân viên kết ca (Hiện tại):
                  </label>
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                    <div className="flex flex-wrap items-center gap-2 text-slate-800 font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-sm font-bold text-slate-900">{currentEmployeeName}</span>
                      <span className="font-semibold text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                        {currentEmployeePosition}
                      </span>
                    </div>
                    {currentBranchName && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium bg-white border border-slate-200 px-2 py-0.5 rounded">
                        <Building className="h-3 w-3 shrink-0 text-slate-500" />
                        <span className="truncate">
                          Chi nhánh làm việc: <strong className="font-semibold text-slate-800">{currentBranchName}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-600">
                      {isEndOfDay ? 'Bàn giao cho (Quản lý / Niêm phong két):' : 'Người nhận bàn giao (Ca sau / Quản lý):'}{' '}
                      {!isEndOfDay && <span className="text-rose-500">*</span>}
                    </label>
                  </div>
                  {currentBranchName && (
                    <p className="text-[10px] text-teal-700 font-medium mb-1.5 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                      <span>Đang lọc nhân viên cùng <strong>{currentBranchName}</strong></span>
                    </p>
                  )}
                  <select
                    value={handoverEmployeeId}
                    disabled={settlementData.isClosed}
                    onChange={(e) => setHandoverEmployeeId(e.target.value)}
                    className={`w-full rounded-md border p-2 text-xs font-medium focus:outline-none ${settlementData.isClosed
                      ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-800 focus:border-teal-700'
                      }`}
                  >
                    {isEndOfDay ? (
                      <>
                        <option value="OVERNIGHT">🔒 Niêm phong két lưu qua đêm (Bàn giao cho Ca Sáng mai)</option>
                        <option value="">-- Hoặc bàn giao trực tiếp cho nhân viên / Quản lý --</option>
                      </>
                    ) : (
                      <option value="">-- Chọn nhân viên nhận bàn giao ca --</option>
                    )}
                    {handoverCandidates.map((emp) => {
                      const empName = emp.fullName || emp.name || emp.full_name || emp.username || 'Nhân viên';
                      const pos = emp.positionLabel || (emp.position === 'RECEPTIONIST' ? 'Nhân viên Lễ tân / Thu ngân' : emp.position === 'WAREHOUSE' ? 'Nhân viên Quản lý kho' : emp.position || '');
                      return (
                        <option key={emp.id} value={emp.id}>
                          {empName} — {pos}
                        </option>
                      );
                    })}
                  </select>

                  {handoverCandidates.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      Không tìm thấy nhân viên nào khác thuộc {currentBranchName || 'chi nhánh này'} để bàn giao ca.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    Ghi chú bàn giao & Lưu ý ca:
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Ghi chú về các ca bệnh còn đang điều trị, hóa đơn chưa thu xong, bàn giao chìa khóa két..."
                    value={note}
                    disabled={settlementData.isClosed}
                    onChange={(e) => setNote(e.target.value)}
                    className={`w-full rounded-md border p-2 text-xs placeholder-slate-400 focus:outline-none ${settlementData.isClosed
                      ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-800 focus:border-teal-700'
                      }`}
                  />
                </div>
              </div>

              {/* Tóm tắt nhanh trước khi chốt */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tổng thực thu trong ca:</span>
                  <strong className="text-teal-800 font-bold text-sm">{formatMoney(actualTotalRevenue)}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Trạng thái đối soát:</span>
                  {totalRevenueDifference === 0 ? (
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Khớp 100%
                    </span>
                  ) : (
                    <span className="font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Lệch {formatMoney(totalRevenueDifference)}
                    </span>
                  )}
                </div>
              </div>

              {/* Nút chốt ca & Bàn giao */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {settlementData.isClosed ? (
                  <>
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs cursor-not-allowed"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>✓ {isEndOfDay ? 'Ca cuối ngày đã đóng sổ & niêm phong' : 'Ca trực này đã kết toán & bàn giao'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintData(settlementData.closedShift);
                        setIsPrintModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      <Printer className="h-4 w-4 shrink-0" />
                      <span>Xem / In lại biên bản kết ca</span>
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                      Số liệu ca trực đã được khóa bảo lưu và lưu trữ chính thức
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSubmitClosing}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      {submitting
                        ? 'Đang chốt ca...'
                        : isEndOfDay
                        ? 'Xác nhận đóng sổ két cuối ngày'
                        : 'Xác nhận chốt ca & Bàn giao'}
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                      Dữ liệu sau khi chốt sẽ được lưu trữ chính thức vào hệ thống
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sổ chi tiết các giao dịch trong ca */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Danh sách giao dịch phát sinh trong ca ({settlementData.totalTransactions || 0})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Chi tiết từng khoản thu được thực hiện trong thời gian ca làm việc
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên BN, mã HĐ..."
                    value={searchTx}
                    onChange={(e) => setSearchTx(e.target.value)}
                    className="h-7 pl-8 pr-2.5 text-xs rounded-md border border-slate-200 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                {/* Filter Method */}
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="h-7 px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:border-teal-700 focus:outline-none"
                >
                  <option value="ALL">Tất cả phương thức</option>
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                </select>
              </div>
            </div>

            {/* Bảng giao dịch */}
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Mã GD</th>
                    <th className="py-2 px-2.5">Hóa đơn</th>
                    <th className="py-2 px-2.5">Bệnh nhân</th>
                    <th className="py-2 px-2.5">Phương thức</th>
                    <th className="py-2 px-2.5">Thời gian</th>
                    <th className="py-2 px-2.5 text-right">Số tiền</th>
                    <th className="py-2 px-2.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-400">
                        Chưa ghi nhận giao dịch thanh toán nào trong khung giờ ca này
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-2.5 font-medium text-slate-800">
                          {tx.transactionCode || '---'}
                        </td>
                        <td className="py-2 px-2.5 font-semibold text-teal-800">
                          <div>{tx.invoiceCode || '---'}</div>
                          {tx.note && (
                            <div className="text-[10px] font-normal text-slate-400 max-w-[200px] truncate" title={tx.note}>
                              {tx.note}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5">
                          <p className="font-bold text-slate-800">{tx.patientName}</p>
                          {tx.patientPhone && (
                            <p className="text-[10px] text-slate-400">{tx.patientPhone}</p>
                          )}
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${tx.paymentMethod === 'CASH'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                          >
                            {tx.paymentMethod === 'CASH'
                              ? 'Tiền mặt'
                              : tx.paymentMethod === 'BANK_TRANSFER'
                                ? 'Chuyển khoản'
                                : tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-semibold text-slate-800 text-xs">
                              {tx.paymentTime
                                ? new Date(tx.paymentTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                : '---'}
                            </span>
                            {/* Đánh dấu hóa đơn ngoài giờ Ca Tối (ví dụ thanh toán lúc 21:01, 21:15) */}
                            {isOvertimeEvening(tx.paymentTime) && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                title="Hóa đơn thanh toán sau 21:00 (Đã tự động tính vào Ca Tối để tránh thất thoát két)"
                              >
                                <Clock className="h-2.5 w-2.5 text-amber-600" />
                                Ngoài giờ (Sau 21:00)
                              </span>
                            )}
                            {/* Đánh dấu hóa đơn sớm đầu Ca Sáng */}
                            {isEarlyMorning(tx.paymentTime) && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200"
                                title="Hóa đơn/tiền cọc phát sinh sớm trước 07:30 (Đã tính vào Ca Sáng)"
                              >
                                <Sun className="h-2.5 w-2.5 text-sky-600" />
                                Sớm đầu ca
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                          {formatMoney(tx.totalAmount)}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Thành công
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Tab Lịch sử các phiên kết ca */
        <div className="space-y-4">
          <ShiftHistoryTable
            historyList={historyList}
            loading={loadingHistory}
            currentUser={user}
            onRefresh={loadHistory}
            onViewDetail={(item) => {
              setPrintData(item);
              setIsPrintModalOpen(true);
            }}
            onPrint={(item) => {
              setPrintData(item);
              setIsPrintModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Modal Bảng kiểm đếm mệnh giá tiền mặt */}
      <CashDenominationModal
        isOpen={isDenomModalOpen}
        onClose={() => setIsDenomModalOpen(false)}
        initialDenominations={denominations}
        onApply={handleApplyDenominations}
      />

      {/* Modal Xem trước & In phiếu kết ca */}
      <ShiftPrintReceipt
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        shiftData={printData}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Coins,
  CreditCard,
  Building,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  Calendar,
  Receipt,
  Search,
  Calculator,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import shiftClosingService from './services/shiftClosingService';
import CashDenominationModal from './components/CashDenominationModal';
import ShiftPrintReceipt from './components/ShiftPrintReceipt';
import ShiftHistoryTable from './components/ShiftHistoryTable';

const SHIFT_OPTIONS = [
  { id: 'MORNING', label: 'Ca Sáng (07:30 - 12:00)', startHour: 7, startMinute: 30, endHour: 12, endMinute: 0 },
  { id: 'AFTERNOON', label: 'Ca Chiều (12:00 - 17:30)', startHour: 12, startMinute: 0, endHour: 17, endMinute: 30 },
  { id: 'EVENING', label: 'Ca Tối (17:30 - 21:00)', startHour: 17, startMinute: 30, endHour: 21, endMinute: 0 },
  { id: 'FULL_DAY', label: 'Cả Ngày (07:30 - 21:00)', startHour: 7, startMinute: 30, endHour: 21, endMinute: 0 },
];

export default function ShiftClosing() {
  const { user } = useAuth();

  // Tab: 'current' | 'history'
  const [activeTab, setActiveTab] = useState('current');

  // Ngày làm việc (Mặc định hôm nay YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Ca config
  const [shiftType, setShiftType] = useState('MORNING');
  const [initialCash, setInitialCash] = useState(2000000); // 2 triệu tiền mặt ban đầu mặc định

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
  });

  // Tiền mặt thực tế kiểm đếm
  const [actualCash, setActualCash] = useState(2000000);
  const [differenceReason, setDifferenceReason] = useState('');
  const [denominations, setDenominations] = useState({});

  // Bàn giao
  const [handoverEmployeeId, setHandoverEmployeeId] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [note, setNote] = useState('');

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

  // Lấy danh sách nhân viên để bàn giao
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await shiftClosingService.getEmployeesForHandover();
        setEmployeesList(res || []);
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    }
    loadEmployees();
  }, []);

  // Tính toán thời gian bắt đầu và kết thúc của ca theo ngày và ca chọn
  const getShiftTimeRange = (dateStr, type) => {
    const opt = SHIFT_OPTIONS.find((o) => o.id === type) || SHIFT_OPTIONS[0];
    const pad = (n) => String(n).padStart(2, '0');
    const startIso = `${dateStr}T${pad(opt.startHour)}:${pad(opt.startMinute)}:00`;
    const endIso = `${dateStr}T${pad(opt.endHour)}:${pad(opt.endMinute)}:00`;
    return { startIso, endIso };
  };

  // Tính toán số liệu ca hiện tại
  const fetchShiftCalculation = async (date = selectedDate, type = shiftType, initCash = initialCash) => {
    setCalculating(true);
    try {
      const { startIso, endIso } = getShiftTimeRange(date, type);
      const res = await shiftClosingService.calculateShiftSettlement({
        employeeId: user?.employeeId,
        shiftType: type,
        startTime: startIso,
        endTime: endIso,
        initialCash: initCash,
      });

      if (res && res.data) {
        const d = res.data;
        setSettlementData(d);
        // Tự động gán actualCash = expectedCash nếu là ca mới
        setActualCash(d.totalCashExpected || initCash);
      }
    } catch (err) {
      console.error('Error calculating shift:', err);
      toast.error('Không thể tải số liệu kết ca từ hệ thống');
    } finally {
      setCalculating(false);
    }
  };

  // Tải số liệu ban đầu khi đổi ca hoặc ngày
  useEffect(() => {
    fetchShiftCalculation(selectedDate, shiftType, initialCash);
  }, [selectedDate, shiftType]);

  // Tải danh sách lịch sử kết ca
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await shiftClosingService.getShiftClosings({
        employeeId: user?.employeeId,
      });
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

  // Tính chênh lệch tiền mặt
  const totalExpectedCash = (Number(initialCash) || 0) + (Number(settlementData.cashRevenue) || 0);
  const differenceAmount = (Number(actualCash) || 0) - totalExpectedCash;

  // Xử lý áp dụng kết quả từ bảng kiểm đếm mệnh giá
  const handleApplyDenominations = (total, counts) => {
    setActualCash(total);
    setDenominations(counts);
    toast.success(`Đã cập nhật tiền thực đếm: ${total.toLocaleString('vi-VN')} đ`);
  };

  // Xác nhận chốt ca
  const handleSubmitClosing = async () => {
    if (!user?.employeeId) {
      toast.error('Không tìm thấy thông tin nhân viên');
      return;
    }

    if (!handoverEmployeeId) {
      toast.error('Vui lòng chọn nhân viên nhận bàn giao ca tiếp theo');
      return;
    }

    if (differenceAmount !== 0 && !differenceReason.trim()) {
      toast.error('Vui lòng nhập lý do chênh lệch tiền mặt');
      return;
    }

    setSubmitting(true);
    try {
      const { startIso, endIso } = getShiftTimeRange(selectedDate, shiftType);
      const payload = {
        employeeId: user.employeeId,
        handoverEmployeeId: handoverEmployeeId || null,
        branchId: settlementData.branchId || null,
        shiftType: shiftType,
        startTime: settlementData.startTime || startIso,
        endTime: new Date().toISOString(),
        initialCash: Number(initialCash) || 0,
        cashRevenue: settlementData.cashRevenue || 0,
        bankTransferRevenue: settlementData.bankTransferRevenue || 0,
        cardRevenue: settlementData.cardRevenue || 0,
        eWalletRevenue: settlementData.eWalletRevenue || 0,
        totalSystemRevenue: settlementData.totalSystemRevenue || 0,
        totalCashExpected: totalExpectedCash,
        totalCashActual: Number(actualCash) || 0,
        differenceAmount: differenceAmount,
        differenceReason: differenceReason,
        totalTransactions: settlementData.totalTransactions || 0,
        note: note,
        denominationsJson: JSON.stringify(denominations),
      };

      const res = await shiftClosingService.createShiftClosing(payload);
      if (res && res.data) {
        toast.success('Chốt kết ca thành công!');
        setPrintData(res.data);
        setIsPrintModalOpen(true);
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === 'current'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="h-3.5 w-3.5 text-teal-700" />
              Kết ca hiện tại
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === 'history'
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
          {/* Shift Selection & Controls Toolbar */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* Ngày làm việc */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Ngày làm việc
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-8 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-800 bg-white focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              {/* Ca làm việc */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Chọn ca làm việc
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SHIFT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setShiftType(opt.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                        shiftType === opt.id
                          ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden lg:block" />

              {/* Tiền mặt đầu ca */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Tiền mặt đầu ca (két)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="50000"
                    value={initialCash}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setInitialCash(val);
                    }}
                    onBlur={() => fetchShiftCalculation(selectedDate, shiftType, initialCash)}
                    className="h-8 w-36 rounded-md border border-slate-200 px-2.5 pr-10 text-xs font-bold text-slate-800 focus:border-teal-700 focus:outline-none"
                  />
                  <span className="absolute right-2.5 text-[11px] text-slate-400 pointer-events-none">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/employee/invoice-lookup"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                title="Tra cứu danh sách hóa đơn"
              >
                <ExternalLink className="h-3 w-3" />
                Tra cứu hóa đơn
              </Link>

              <button
                type="button"
                onClick={() => fetchShiftCalculation(selectedDate, shiftType, initialCash)}
                disabled={calculating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`h-3 w-3 ${calculating ? 'animate-spin' : ''}`} />
                {calculating ? 'Đang tính...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {/* 4 Thẻ KPI: Doanh thu theo phương thức thanh toán - Thiết kế phẳng, tối giản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
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
                  Chuyển Khoản (Bank)
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
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

            {/* Card 4: Thẻ POS & Ví điện tử */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  POS & Ví Điện Tử
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {formatMoney(
                  (Number(settlementData.cardRevenue) || 0) + (Number(settlementData.eWalletRevenue) || 0)
                )}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Quẹt thẻ POS, VNPay, MoMo
              </p>
            </div>
          </div>

          {/* Middle Section: Đối soát tiền mặt & Bàn giao */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cột trái (2/3): Bảng đối soát tiền mặt két */}
            <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <Calculator className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Đối soát tiền mặt trong két (Reconciliation)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      So sánh giữa tiền mặt lý thuyết hệ thống và tiền mặt kiểm đếm thực tế
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDenomModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                >
                  <Coins className="h-3 w-3" />
                  Kiểm đếm mệnh giá
                </button>
              </div>

              {/* 3 Ô so sánh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">1. Tiền mặt đầu ca</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">
                    {formatMoney(initialCash)}
                  </p>
                  <p className="text-[10px] text-slate-400">Tiền thối sẵn trong két</p>
                </div>

                <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">2. + Tiền mặt thu trong ca</p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">
                    +{formatMoney(settlementData.cashRevenue)}
                  </p>
                  <p className="text-[10px] text-slate-400">Từ các hóa đơn tiền mặt</p>
                </div>

                <div className="p-3 rounded-md border border-slate-200 bg-slate-100/70">
                  <p className="text-[11px] font-bold text-slate-700 uppercase">= Tiền mặt dự kiến két</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {formatMoney(totalExpectedCash)}
                  </p>
                  <p className="text-[10px] text-slate-500">Lý thuyết cần có</p>
                </div>
              </div>

              {/* Nhập tiền mặt thực tế & Kết quả chênh lệch */}
              <div className="p-4 rounded-md border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-800">
                      Tiền mặt thực tế kiểm đếm trong két
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Nhập số tiền hoặc dùng nút kiểm đếm từng mệnh giá ở trên
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1000"
                      value={actualCash}
                      onChange={(e) => setActualCash(Number(e.target.value) || 0)}
                      className="h-8 w-44 rounded-md border border-slate-300 bg-white px-2.5 text-right font-bold text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-slate-500">VNĐ</span>
                  </div>
                </div>

                {/* Kết quả đối soát */}
                <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Chênh lệch đối soát:</span>
                    {differenceAmount === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        0 đ • KHỚP TIỀN HOÀN TOÀN
                      </span>
                    ) : differenceAmount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" />
                        +{formatMoney(differenceAmount)} • THỪA TIỀN TRONG KÉT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="h-3 w-3" />
                        {formatMoney(differenceAmount)} • THIẾU TIỀN TRONG KÉT
                      </span>
                    )}
                  </div>

                  {differenceAmount !== 0 && (
                    <span className="text-[11px] text-rose-600 font-medium">
                      * Bắt buộc nhập lý do chênh lệch
                    </span>
                  )}
                </div>

                {/* Ô nhập lý do chênh lệch */}
                {differenceAmount !== 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Giải trình lý do chênh lệch:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Bệnh nhân trả thừa tiền lẻ không lấy, hoặc chưa kịp nhập biên lai dịch vụ ngoài..."
                      value={differenceReason}
                      onChange={(e) => setDifferenceReason(e.target.value)}
                      className="w-full rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cột phải (1/3): Bàn giao ca & Xác nhận chốt */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Bàn giao ca trực
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Chuyển giao cho người nhận ca tiếp theo
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Nhân viên kết ca (Hiện tại):
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-800 font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{settlementData.employeeName || 'Lê Thu Trang'} <span className="font-normal text-[11px] text-slate-500">(Thu ngân ca hiện tại)</span></span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Người nhận bàn giao (Ca sau / Quản lý): <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={handoverEmployeeId}
                      onChange={(e) => setHandoverEmployeeId(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 focus:border-teal-700 focus:outline-none"
                    >
                      <option value="">-- Chọn nhân viên nhận bàn giao ca --</option>
                      {employeesList
                        .filter((emp) => emp.id !== user?.employeeId)
                        .map((emp) => {
                          const empName = emp.fullName || emp.name || emp.full_name || emp.username || 'Nhân viên';
                          const pos = emp.positionLabel || (emp.position === 'RECEPTIONIST' ? 'Nhân viên Lễ tân / Thu ngân' : emp.position === 'WAREHOUSE' ? 'Nhân viên Quản lý kho' : emp.position || '');
                          const branch = emp.branchName ? ` • ${emp.branchName}` : '';
                          return (
                            <option key={emp.id} value={emp.id}>
                              {empName} — {pos}{branch}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      Ghi chú bàn giao & Lưu ý ca:
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Ghi chú về các ca bệnh còn đang điều trị, hóa đơn chưa thu xong, bàn giao chìa khóa két..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-md border border-slate-200 p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Nút chốt ca */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <button
                  type="button"
                  onClick={handleSubmitClosing}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {submitting ? 'Đang chốt ca...' : 'Xác nhận chốt ca & Bàn giao'}
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Dữ liệu sau khi chốt sẽ được lưu trữ chính thức vào hệ thống
                </p>
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
                  <option value="CREDIT_CARD">Thẻ POS</option>
                  <option value="VNPAY">VNPay / MoMo</option>
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
                          {tx.invoiceCode || '---'}
                        </td>
                        <td className="py-2 px-2.5">
                          <p className="font-bold text-slate-800">{tx.patientName}</p>
                          {tx.patientPhone && (
                            <p className="text-[10px] text-slate-400">{tx.patientPhone}</p>
                          )}
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {tx.paymentMethod === 'CASH'
                              ? 'Tiền mặt'
                              : tx.paymentMethod === 'BANK_TRANSFER'
                              ? 'Chuyển khoản'
                              : tx.paymentMethod === 'CREDIT_CARD'
                              ? 'Thẻ POS'
                              : tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-500">
                          {tx.paymentTime ? new Date(tx.paymentTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '---'}
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
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Lịch sử các phiên kết ca làm việc
              </h3>
              <p className="text-xs text-slate-500">
                Tra cứu, đối soát lại doanh thu và in biên bản các ca trước đó
              </p>
            </div>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
            >
              <RotateCcw className={`h-3 w-3 ${loadingHistory ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          <ShiftHistoryTable
            historyList={historyList}
            loading={loadingHistory}
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

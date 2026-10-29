import React, { useState, useMemo } from 'react';
import {
  Eye,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Search,
  RotateCcw,
  Clock,
  ArrowRight,
  FileText,
  Lock,
} from 'lucide-react';

export default function ShiftHistoryTable({
  historyList = [],
  loading = false,
  onRefresh,
  onViewDetail,
  onPrint,
  currentUser,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShiftType, setSelectedShiftType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL | MATCHED | DISCREPANCY
  const [filterScope, setFilterScope] = useState('ALL'); // ALL | MINE
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL | TODAY | LAST_7_DAYS | LAST_30_DAYS

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatShiftPeriod = (startTime, endTime, createdAt) => {
    if (startTime) {
      const d = new Date(startTime);
      const dateStr = d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const sTime = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const eTime = endTime
        ? new Date(endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';
      return `${dateStr} (${sTime}${eTime ? ' - ' + eTime : ''})`;
    }
    return formatDate(createdAt);
  };

  const getShiftBadge = (type) => {
    switch (type) {
      case 'MORNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap">
            <Clock className="h-3 w-3 text-amber-600" /> Ca sáng
          </span>
        );
      case 'AFTERNOON':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 whitespace-nowrap">
            <Clock className="h-3 w-3 text-blue-600" /> Ca chiều
          </span>
        );
      case 'EVENING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200/80 whitespace-nowrap">
            <Clock className="h-3 w-3 text-purple-600" /> Ca tối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 whitespace-nowrap">
            <Clock className="h-3 w-3 text-slate-500" /> Cả ngày
          </span>
        );
    }
  };

  // Lọc dữ liệu theo các tiêu chí nghiệp vụ
  const filteredList = useMemo(() => {
    return historyList.filter((item) => {
      // 1. Tìm kiếm theo Mã ca hoặc Tên nhân viên
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const codeMatch = (item.shiftCode || '').toLowerCase().includes(term);
        const empMatch = (item.employeeName || '').toLowerCase().includes(term);
        const handMatch = (item.handoverEmployeeName || '').toLowerCase().includes(term);
        if (!codeMatch && !empMatch && !handMatch) return false;
      }

      // 2. Lọc theo ca trực
      if (selectedShiftType !== 'ALL' && item.shiftType !== selectedShiftType) {
        return false;
      }

      // 3. Lọc theo trạng thái đối soát
      const cashDiff = Number(item.differenceAmount || 0);
      const bankDiff = Number(item.bankTransferDifference || 0);
      const isMatched = cashDiff === 0 && bankDiff === 0;

      if (selectedStatus === 'MATCHED' && !isMatched) return false;
      if (selectedStatus === 'DISCREPANCY' && isMatched) return false;

      // 4. Lọc theo phạm vi (Tất cả ca vs Chỉ ca của tôi)
      if (filterScope === 'MINE' && currentUser) {
        const myUsername = (currentUser.username || '').toLowerCase();
        const myEmpId = currentUser.employeeId ? String(currentUser.employeeId) : null;
        const empName = (item.employeeName || '').toLowerCase();
        const handName = (item.handoverEmployeeName || '').toLowerCase();

        const isEmpIdMatch =
          myEmpId &&
          (String(item.employeeId) === myEmpId || String(item.handoverEmployeeId) === myEmpId);
        const isNameMatch =
          myUsername && (empName.includes(myUsername) || handName.includes(myUsername));

        if (!isEmpIdMatch && !isNameMatch) return false;
      }

      // 5. Lọc theo ngày
      if (dateFilter !== 'ALL') {
        const targetDate = item.startTime || item.createdAt;
        if (targetDate) {
          const itemDate = new Date(targetDate);
          const now = new Date();
          if (dateFilter === 'TODAY') {
            const isToday =
              itemDate.getDate() === now.getDate() &&
              itemDate.getMonth() === now.getMonth() &&
              itemDate.getFullYear() === now.getFullYear();
            if (!isToday) return false;
          } else if (dateFilter === 'LAST_7_DAYS') {
            const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
            if (diffDays > 7 || diffDays < 0) return false;
          } else if (dateFilter === 'LAST_30_DAYS') {
            const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
            if (diffDays > 30 || diffDays < 0) return false;
          }
        }
      }

      return true;
    });
  }, [historyList, searchTerm, selectedShiftType, selectedStatus, filterScope, dateFilter, currentUser]);

  // Thống kê tóm tắt nhanh dạng inline
  const totalRevenue = useMemo(() => {
    return filteredList.reduce((acc, item) => acc + Number(item.totalSystemRevenue || 0), 0);
  }, [filteredList]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* 1. Header tinh gọn kèm tóm tắt số liệu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Lịch sử các phiên kết ca làm việc
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/60">
              {filteredList.length} phiên kết ca
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu đối soát doanh thu, tiền mặt két và chuyển khoản được lưu trữ chính thức từ Database
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Tổng doanh thu ca
            </span>
            <span className="text-xs font-black text-teal-900">
              {formatMoney(totalRevenue)}
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
              title="Làm mới dữ liệu từ Database"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-700' : ''}`} />
              <span>Làm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Thanh lọc tinh giản một hàng (Compact Filter Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3 border-b border-slate-100 bg-slate-50/50 text-xs">
        {/* Ô tìm kiếm */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã ca, nhân viên bàn giao..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Phân loại phạm vi ca */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterScope('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                filterScope === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ca
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('MINE')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                filterScope === 'MINE'
                  ? 'bg-teal-700 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ca của tôi
            </button>
          </div>

          {/* Lọc thời gian */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-teal-700 cursor-pointer"
          >
            <option value="ALL">Toàn thời gian</option>
            <option value="TODAY">Hôm nay</option>
            <option value="LAST_7_DAYS">7 ngày qua</option>
            <option value="LAST_30_DAYS">30 ngày qua</option>
          </select>

          {/* Lọc ca trực */}
          <select
            value={selectedShiftType}
            onChange={(e) => setSelectedShiftType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-teal-700 cursor-pointer"
          >
            <option value="ALL">Tất cả ca trực</option>
            <option value="MORNING">Ca sáng</option>
            <option value="AFTERNOON">Ca chiều</option>
            <option value="EVENING">Ca tối</option>
            <option value="FULL_DAY">Cả ngày</option>
          </select>

          {/* Lọc trạng thái đối soát */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-teal-700 cursor-pointer"
          >
            <option value="ALL">Tất cả đối soát</option>
            <option value="MATCHED">Khớp 100% (0đ)</option>
            <option value="DISCREPANCY">Có chênh lệch</option>
          </select>
        </div>
      </div>

      {/* 3. Bảng dữ liệu tối giản & chuyên nghiệp */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent mb-2.5" />
          <p className="text-xs font-semibold text-slate-600">Đang tải lịch sử các phiên kết ca từ hệ thống...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
            <Calendar className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">Không tìm thấy phiên kết ca nào phù hợp</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Thử điều chỉnh lại bộ lọc tìm kiếm hoặc thời gian để xem kết quả khác.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap min-w-[160px]">Mã ca & Thời gian</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Ca trực</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Bên giao ➔ Bên nhận</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Doanh thu HT</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Tiền mặt két</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Chuyển khoản (App)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Đối soát</th>
                <th className="py-2.5 px-4 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => {
                const cashDiff = Number(item.differenceAmount || 0);
                const bankDiff = Number(item.bankTransferDifference || 0);
                const isPerfect = cashDiff === 0 && bankDiff === 0;

                const actualBank =
                  item.totalBankTransferActual !== undefined && item.totalBankTransferActual !== null
                    ? Number(item.totalBankTransferActual)
                    : Number(item.bankTransferRevenue || 0);

                return (
                  <tr
                    key={item.id || item.shiftCode}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Mã ca & Thời gian ca */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        className="font-mono text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer block"
                      >
                        {item.shiftCode}
                      </button>
                      <span className="text-[11px] text-slate-700 font-semibold block mt-0.5">
                        {formatShiftPeriod(item.startTime, item.endTime, item.createdAt)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal block">
                        Chốt lúc: {formatDate(item.createdAt)}
                      </span>
                    </td>

                    {/* Ca trực */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getShiftBadge(item.shiftType)}
                    </td>

                    {/* Bên giao ➔ Bên nhận */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-slate-800">
                          {item.employeeName || 'Nhân viên'}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                        {item.handoverEmployeeName && !item.handoverEmployeeName.includes('Niêm phong') ? (
                          <span className="text-slate-700 font-semibold">
                            {item.handoverEmployeeName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Lock className="h-2.5 w-2.5 text-amber-600" />
                            Niêm phong két qua đêm
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Doanh thu hệ thống */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">
                        {formatMoney(item.totalSystemRevenue)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.totalTransactions || 0} giao dịch
                      </span>
                    </td>

                    {/* Tiền mặt két */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-800 block">
                        {formatMoney(item.totalCashActual)}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {Number(item.cashRevenue || 0) > 0 ? (
                          <span className="text-emerald-700 font-bold">+{formatMoney(item.cashRevenue)} • </span>
                        ) : null}
                        Đầu ca: {formatMoney(item.initialCash)}
                      </span>
                    </td>

                    {/* Chuyển khoản thực tế */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="font-bold text-blue-900 block">
                        {formatMoney(actualBank)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        HT: {formatMoney(item.bankTransferRevenue)}
                      </span>
                    </td>

                    {/* Đối soát & Chênh lệch */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isPerfect ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Khớp 100%
                        </span>
                      ) : (
                        <div className="inline-flex flex-col gap-0.5">
                          {cashDiff !== 0 && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                cashDiff > 0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Két: {cashDiff > 0 ? '+' : ''}{formatMoney(cashDiff)}
                            </span>
                          )}
                          {bankDiff !== 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              CK: {bankDiff > 0 ? '+' : ''}{formatMoney(bankDiff)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Thao tác In & Xem */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPrint(item)}
                          title="In biên bản kết ca"
                          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Printer className="h-3 w-3" />
                          <span>In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          title="Xem chi tiết biên bản"
                          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Xem</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Footer đếm số lượng */}
      {!loading && filteredList.length > 0 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <span>
            Hiển thị <strong className="text-slate-800 font-semibold">{filteredList.length}</strong> / {historyList.length} phiên kết toán
          </span>
          <span className="text-slate-400">
            Dữ liệu kết ca thời gian thực • Chuẩn xác theo Database
          </span>
        </div>
      )}
    </div>
  );
}

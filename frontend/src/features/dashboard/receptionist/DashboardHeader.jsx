import { useState } from 'react';
import { Search, Bell, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardHeader({ staffName, onOpenCreateModal, onRefresh, loading }) {
  const [searchValue, setSearchValue] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        toast.success('Đã làm mới dữ liệu!');
      } catch {
        toast.error('Lỗi khi làm mới dữ liệu');
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  const today = new Date();
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = dayNames[today.getDay()];
  const dateStr = `${dayName}, ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  return (
    <div className="flex items-center justify-between gap-4 pb-3">
      {/* Left: Title & greeting */}
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold text-slate-800 leading-tight">
          Tổng quan lễ tân
        </h1>
        <p className="mt-0.5 text-[13px] text-slate-500">
          {dateStr} · Xin chào, {staffName}
        </p>
      </div>

      {/* Right: Search, Notification, Refresh, CTA */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Tìm tên, SĐT, mã bệnh nhân..."
            className="h-[36px] w-[260px] rounded-[4px] border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
          />
        </div>

        {/* Notification */}
        <button
          type="button"
          className="relative flex h-[36px] w-[36px] items-center justify-center rounded-[4px] border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <Bell size={17} />
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            3
          </span>
        </button>

        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="flex h-[36px] items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-teal-700 active:bg-slate-100 disabled:opacity-50 shadow-2xs cursor-pointer"
          title="Làm mới toàn bộ dữ liệu"
        >
          <RefreshCw size={14} className={loading || isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-500'} />
          <span>Làm mới</span>
        </button>

        {/* Create appointment button */}
        <button
          type="button"
          onClick={() => onOpenCreateModal && onOpenCreateModal()}
          className="flex h-[36px] items-center gap-1.5 rounded-[4px] bg-teal-700 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-teal-800 active:bg-teal-900 shadow-sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Tạo lịch hẹn</span>
        </button>
      </div>
    </div>
  );
}

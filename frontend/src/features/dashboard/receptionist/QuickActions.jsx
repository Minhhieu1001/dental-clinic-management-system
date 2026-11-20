import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, UserCheck, FilePlus, Receipt, Zap } from 'lucide-react';

const actions = [
  {
    key: 'schedule',
    icon: CalendarPlus,
    shortcut: '1',
    title: 'Đặt lịch',
    desc: 'Tạo lịch hẹn mới',
  },
  {
    key: 'checkin',
    icon: UserCheck,
    shortcut: '2',
    title: 'Tiếp nhận',
    desc: 'Check-in bệnh nhân',
  },
  {
    key: 'record',
    icon: FilePlus,
    shortcut: '3',
    title: 'Bệnh nhân',
    desc: 'Hồ sơ khách hàng',
  },
  {
    key: 'payment',
    icon: Receipt,
    shortcut: '4',
    title: 'Thu tiền',
    desc: 'Hóa đơn & công nợ',
  },
];

export default function QuickActions({ onOpenCreateModal }) {
  const navigate = useNavigate();

  const handleActionClick = useCallback((key) => {
    switch (key) {
      case 'schedule':
        if (onOpenCreateModal) onOpenCreateModal();
        break;
      case 'checkin':
        navigate('/employee/appointments');
        break;
      case 'record':
        navigate('/employee/patients');
        break;
      case 'payment':
        navigate('/employee/invoice');
        break;
      default:
        break;
    }
  }, [onOpenCreateModal, navigate]);

  // Lắng nghe phím tắt số 1, 2, 3, 4 trên toàn màn hình
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Bỏ qua nếu người dùng đang nhập văn bản trong ô input, textarea, select hoặc contenteditable
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);

      if (isInput) return;

      // 2. Bỏ qua nếu đang có Modal / Dialog hiển thị trên màn hình
      const hasOpenModal = document.querySelector('[role="dialog"]') !== null;
      if (hasOpenModal) return;

      // 3. Xử lý các phím số 1, 2, 3, 4 (hỗ trợ cả phím số thường và numpad)
      const key = e.key;
      if (key === '1') {
        e.preventDefault();
        handleActionClick('schedule');
      } else if (key === '2') {
        e.preventDefault();
        handleActionClick('checkin');
      } else if (key === '3') {
        e.preventDefault();
        handleActionClick('record');
      } else if (key === '4') {
        e.preventDefault();
        handleActionClick('payment');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleActionClick]);

  return (
    <div className="h-full min-h-[112px] rounded-[4px] border border-slate-200 bg-white shadow-2xs flex flex-col justify-between overflow-hidden">
      <div className="border-b border-slate-100 px-3 py-1.5 flex items-center justify-between bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-teal-700" />
          <h3 className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wide">
            Thao tác nhanh
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9.5px] text-slate-500 font-medium hidden sm:inline">Phím</span>
          <span className="text-[10px] text-teal-800 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-[2px]">
            1 - 4
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-2 flex-1 items-stretch">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => handleActionClick(action.key)}
              title={`Nhấn phím [ ${action.shortcut} ] trên bàn phím để ${action.title.toLowerCase()}`}
              className="flex items-center gap-2 rounded-[3px] border border-slate-200/90 bg-slate-50/60 hover:bg-teal-50/80 hover:border-teal-300 px-2 py-1.5 text-left transition-all cursor-pointer group shadow-2xs relative"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-white border border-slate-200 text-teal-700 group-hover:bg-teal-800 group-hover:text-white group-hover:border-teal-800 transition-colors shadow-2xs">
                <Icon size={14} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11.5px] font-bold text-slate-800 leading-tight truncate group-hover:text-teal-900">
                    {action.title}
                  </p>
                  <kbd className="inline-flex items-center justify-center h-4 w-4 shrink-0 text-[9.5px] font-mono font-bold text-slate-600 bg-white border border-slate-200 rounded-[2px] shadow-2xs group-hover:border-teal-300 group-hover:text-teal-800">
                    {action.shortcut}
                  </kbd>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                  {action.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

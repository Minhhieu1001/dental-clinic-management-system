import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  ClipboardList,
  FileText,
  Pill,
  Image as ImageIcon,
  Users,
  Bell,
  CreditCard,
  Receipt,
  FileSearch,
  Package,
  BarChart3,
  UserCheck,
  Briefcase,
  Tag,
  Activity,
  Settings,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  HeartHandshake,
  Building2,
  Building,
  SlidersHorizontal,
  Calculator,
} from 'lucide-react';

const getTabIcon = (to, label, customIcon) => {
  if (customIcon) return customIcon;
  const key = (to || '').toLowerCase();
  const lbl = (label || '').toLowerCase();

  if (key.includes('follow-up') || lbl.includes('tái khám')) return RotateCcw;
  if (key.includes('dashboard') || lbl.includes('tổng quan')) return LayoutDashboard;
  if (key.includes('appointment') || lbl.includes('lịch hẹn')) return Calendar;
  if (key.includes('exam') || lbl.includes('khám')) return Stethoscope;
  if (key.includes('treatment') || lbl.includes('kế hoạch')) return ClipboardList;
  if (key.includes('medical') || key.includes('record') || lbl.includes('hồ sơ')) return FileText;
  if (key.includes('medicine') || key.includes('prescription') || lbl.includes('thuốc')) return Pill;
  if (key.includes('xray') || lbl.includes('x-quang')) return ImageIcon;
  if (key.includes('patient') || lbl.includes('bệnh nhân')) return Users;
  if (key.includes('customer-care') || key.includes('care') || lbl.includes('chăm sóc')) return HeartHandshake;
  if (key.includes('notification') || lbl.includes('thông báo')) return Bell;
  if (key.includes('invoice-lookup') || lbl.includes('tra cứu hóa đơn') || lbl.includes('tra cứu')) return FileSearch;
  if (lbl === 'hóa đơn' || key === 'invoices') return Receipt;
  if (key.includes('billing') || key.includes('invoice') || lbl.includes('thanh toán') || lbl.includes('hóa đơn')) return CreditCard;
  if (key.includes('shift') || lbl.includes('kết ca') || lbl.includes('ca làm việc')) return Calculator;
  if (key.includes('inventory') || lbl.includes('kho') || lbl.includes('nhập')) return Package;
  if (key.includes('report') || lbl.includes('báo cáo')) return BarChart3;
  if (key.includes('dentist') || lbl.includes('nha sĩ')) return UserCheck;
  if (key.includes('employee') || lbl.includes('nhân viên')) return Briefcase;
  if (key.includes('promotion') || lbl.includes('khuyến mãi')) return Tag;
  if (key.includes('service') || lbl.includes('dịch vụ')) return Activity;
  if (key.includes('branch') || lbl.includes('chi nhánh')) return Building2;
  if (key.includes('clinic') || lbl.includes('nha khoa') || lbl.includes('phòng khám')) return Building;
  if (key.includes('general') || lbl.includes('thiết lập') || lbl.includes('chung')) return SlidersHorizontal;
  if (key.includes('setting') || lbl.includes('cài đặt')) return Settings;

  return Activity;
};

export default function TabBar({ items = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState({});

  // Helper check if route segment is currently active
  const isPathActive = (to) => {
    if (!to) return false;
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return pathSegments.includes(to) || location.pathname.endsWith(`/${to}`);
  };

  // Auto-expand menu when user navigates directly to a child path
  useEffect(() => {
    items.forEach((item) => {
      if (item.children?.some((child) => isPathActive(child.to))) {
        setOpenItems((prev) => ({
          ...prev,
          [item.to]: true,
        }));
      }
    });
  }, [location.pathname, items]);

  const handleParentClick = (item) => {
    const isCurrentlyOpen = !!openItems[item.to];
    setOpenItems((prev) => ({
      ...prev,
      [item.to]: !isCurrentlyOpen,
    }));

    if (!isCurrentlyOpen && item.children?.length > 0) {
      const childActive = item.children.some((child) => isPathActive(child.to));
      if (!childActive && item.children[0]) {
        navigate(item.children[0].to);
      }
    }
  };

  return (
    <nav className="fixed left-0 top-0 z-30 flex h-screen w-16 lg:w-64 flex-col border-r border-slate-200/80 bg-white select-none transition-all duration-300">
      {/* Top Header Logo Banner - Synchronized brand identity */}
      <div className="flex h-16 shrink-0 items-center justify-center lg:justify-start px-3 lg:px-4 border-b border-slate-200/70 bg-white">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Crown Dental Logo"
            className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0"
          />
          <div className="hidden lg:block overflow-hidden leading-tight">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">NHA KHOA</p>
            <span className="text-[14px] font-black tracking-tight text-[#1f4fb2] flex items-center gap-1 my-0.5 leading-none">
              CROWN <span className="text-teal-700 font-extrabold">Dental</span>
            </span>
            <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
              MANAGEMENT SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Label */}
      <div className="hidden lg:flex px-4 pt-3.5 pb-1.5 items-center justify-between shrink-0">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Menu Chức Năng
        </span>
        <Sparkles size={12} className="text-teal-600/80" />
      </div>

      {/* Nav Links List */}
      <div className="flex flex-1 flex-col gap-2 lg:gap-2.5 px-2.5 lg:px-3 py-2.5 overflow-y-auto custom-scrollbar min-h-0">
        {items.map((item) => {
          const IconComponent = getTabIcon(item.to, item.label, item.icon);
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            const hasActiveChild = item.children.some((child) => isPathActive(child.to));
            const isOpen = !!openItems[item.to];

            return (
              <div key={item.to} className="flex flex-col">
                {/* Parent Button */}
                <button
                  type="button"
                  onClick={() => handleParentClick(item)}
                  className={`group relative flex items-center justify-between rounded-xl px-3.5 h-[44px] lg:h-[46px] text-[13.5px] transition-all duration-150 cursor-pointer w-full text-left ${
                    hasActiveChild
                      ? 'bg-teal-50 text-teal-950 font-bold ring-1 ring-teal-200/70 shadow-2xs'
                      : isOpen
                      ? 'bg-slate-100/80 text-slate-800 font-medium'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-teal-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        hasActiveChild
                          ? 'text-teal-700 bg-teal-100/70'
                          : 'text-slate-400 group-hover:text-teal-700 group-hover:bg-teal-50/60'
                      }`}
                    >
                      <IconComponent size={19} strokeWidth={hasActiveChild ? 2.3 : 1.9} />
                    </div>
                    <span className={`hidden lg:inline truncate whitespace-nowrap ${hasActiveChild ? 'text-teal-950 font-bold' : ''}`}>
                      {item.label}
                    </span>
                  </div>

                  {/* Toggle Chevron with smooth rotation */}
                  <div className={`hidden lg:flex items-center justify-center ${hasActiveChild ? 'text-teal-700' : 'text-slate-400 group-hover:text-teal-700'}`}>
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ease-in-out ${
                        isOpen ? 'rotate-180 text-teal-700' : 'rotate-0'
                      }`}
                    />
                  </div>

                  {/* Floating tooltip & Popover on collapsed sidebar (< lg) */}
                  <div className="pointer-events-auto absolute left-full ml-2 hidden rounded-xl bg-slate-900/95 backdrop-blur-sm p-2 text-xs font-semibold text-white shadow-xl opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:flex flex-col lg:group-hover:hidden z-50 whitespace-nowrap min-w-[150px]">
                    <p className="px-2 py-1 font-bold text-teal-300 border-b border-slate-700/60 mb-1">
                      {item.label}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {item.children.map((c) => {
                        const ChildIcon = getTabIcon(c.to, c.label, c.icon);
                        const isChildNow = isPathActive(c.to);
                        return (
                          <NavLink
                            key={c.to}
                            to={c.to}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              isChildNow
                                ? '!bg-teal-600 !text-white font-bold'
                                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <ChildIcon size={13} className={isChildNow ? '!text-white' : 'text-teal-400'} />
                            <span className={isChildNow ? '!text-white font-bold' : ''}>{c.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </button>

                {/* Sub-menu Children list */}
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-1.5 border-l-2 border-teal-200/80 ml-7 pl-3 py-1.5 my-1.5">
                      {item.children.map((child) => {
                        const ChildIcon = getTabIcon(child.to, child.label, child.icon);

                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            title={child.label}
                            className={({ isActive }) =>
                              `group relative flex items-center gap-2.5 rounded-xl px-3 h-[38px] text-[13px] transition-all duration-150 select-none cursor-pointer w-full ${
                                isActive
                                  ? '!bg-gradient-to-r !from-teal-600 !to-teal-700 !text-white shadow-sm shadow-teal-700/25 font-bold'
                                  : 'text-slate-600 hover:bg-teal-50 hover:text-teal-900 font-medium'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <ChildIcon
                                  size={16}
                                  className={`shrink-0 transition-colors ${
                                    isActive
                                      ? '!text-white'
                                      : 'text-slate-400 group-hover:text-teal-700'
                                  }`}
                                />
                                <span className={`hidden lg:inline truncate text-[13px] ${
                                  isActive ? '!text-white font-bold' : 'font-medium'
                                }`}>
                                  {child.label}
                                </span>

                                {isActive && (
                                  <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-2xs shrink-0" />
                                )}

                                {/* Tooltip for collapsed mode */}
                                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden rounded-lg bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:block lg:group-hover:hidden z-50 whitespace-nowrap">
                                  {child.label}
                                </div>
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Top-level item without children
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center justify-center lg:justify-start gap-3 rounded-xl px-3.5 h-[44px] lg:h-[46px] text-[13.5px] transition-all duration-150 select-none cursor-pointer ${
                  isActive
                    ? '!bg-gradient-to-r !from-teal-600 !via-teal-700 !to-teal-800 !text-white shadow-md shadow-teal-800/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-teal-900 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? '!bg-white/20 !text-white shadow-2xs'
                        : 'text-slate-400 group-hover:text-teal-700 group-hover:bg-teal-50/70'
                    }`}
                  >
                    <IconComponent size={19} strokeWidth={isActive ? 2.3 : 1.9} />
                  </div>
                  <span className={`hidden lg:inline truncate whitespace-nowrap ${
                    isActive ? '!text-white font-bold' : 'font-medium'
                  }`}>
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed mode */}
                  <div className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:block lg:group-hover:hidden z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer Status Badge */}
      <div className="p-3 border-t border-slate-100 bg-white shrink-0 z-10">
        <div
          className="flex items-center justify-center lg:justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-teal-50/30 border border-slate-200/70 text-slate-700 text-xs font-medium shadow-2xs hover:bg-teal-50/50 hover:border-teal-200/70 transition-colors"
          title="Hệ thống Nha Khoa Crown đang hoạt động ổn định"
        >
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck size={16} className="text-teal-600 shrink-0" />
            <span className="hidden lg:inline truncate font-bold text-slate-700 text-[12px]">
              Crown Dental Active
            </span>
          </div>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>
      </div>
    </nav>
  );
}

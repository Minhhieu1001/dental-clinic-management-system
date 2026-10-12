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
  ChevronRight,
  RotateCcw,
  CalendarCheck,
  HeartHandshake,
  Building2,
  Building,
  SlidersHorizontal,
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
  if (key.includes('inventory') || key.includes('import') || lbl.includes('kho') || lbl.includes('nhập')) return Package;
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

  // Auto expand menu items if current location matches any child path
  useEffect(() => {
    const nextState = { ...openItems };
    let changed = false;

    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const isChildActive = item.children.some((child) =>
          location.pathname.endsWith(`/${child.to}`) || location.pathname.includes(`/${child.to}`)
        );
        if (isChildActive && !nextState[item.to]) {
          nextState[item.to] = true;
          changed = true;
        }
      }
    });

    if (changed) {
      setOpenItems(nextState);
    }
  }, [location.pathname, items]);

  const toggleSubMenu = (key) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleParentClick = (item) => {
    toggleSubMenu(item.to);
    if (item.children && item.children.length > 0) {
      const isChildActive = item.children.some((child) =>
        location.pathname.endsWith(`/${child.to}`) || location.pathname.includes(`/${child.to}`)
      );
      if (!isChildActive) {
        navigate(item.children[0].to);
      }
    }
  };

  return (
    <nav className="fixed left-0 top-0 z-30 flex h-screen w-16 lg:w-64 flex-col border-r border-slate-200/90 bg-white shadow-xs transition-all duration-300">
      {/* Top Header Logo Banner */}
      <div className="px-2.5 lg:px-5 py-4 lg:py-5 border-b border-slate-100/80 bg-slate-50/50 flex items-center justify-center lg:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-sm ring-2 ring-teal-500/20">
            <Stethoscope size={20} />
          </div>
          <div className="hidden lg:block overflow-hidden transition-all duration-300">
            <span className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1 whitespace-nowrap">
              CROWN <span className="text-teal-700">Dental</span>
            </span>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Label */}
      <div className="hidden lg:flex px-5 pt-4 pb-2 items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center justify-between w-full">
          <span>Menu Chức Năng</span>
          <Sparkles size={12} className="text-teal-600" />
        </p>
      </div>

      {/* Nav Links List */}
      <div className="flex flex-1 flex-col gap-1 px-2 lg:px-3 py-2 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const IconComponent = getTabIcon(item.to, item.label, item.icon);
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            const isChildActive = item.children.some((child) =>
              location.pathname.endsWith(`/${child.to}`) || location.pathname.includes(`/${child.to}`)
            );
            const isOpen = openItems[item.to] ?? isChildActive;

            return (
              <div key={item.to} className="flex flex-col gap-1">
                {/* Parent Button */}
                <div
                  onClick={() => handleParentClick(item)}
                  className={`group relative flex items-center justify-between rounded-xl p-2.5 lg:px-3.5 lg:py-2.5 text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
                    isChildActive
                      ? 'bg-teal-50/90 text-teal-900 border border-teal-200/80 font-extrabold'
                      : 'text-slate-600 hover:bg-teal-50/70 hover:text-teal-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isChildActive
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-400 group-hover:bg-teal-100/60 group-hover:text-teal-800'
                      }`}
                    >
                      <IconComponent size={18} />
                    </div>
                    <span className="hidden lg:inline truncate whitespace-nowrap">{item.label}</span>
                  </div>

                  {/* Toggle Chevron Icon on Desktop with smooth rotation */}
                  <div className="hidden lg:flex items-center justify-center text-slate-400 group-hover:text-teal-800">
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-300 ease-in-out ${
                        isOpen ? 'rotate-180 text-teal-700' : 'rotate-0 text-slate-400'
                      }`}
                    />
                  </div>

                  {/* Floating tooltip & Popover on collapsed sidebar */}
                  <div className="pointer-events-auto absolute left-full ml-2 hidden rounded-xl bg-slate-900/95 backdrop-blur-sm p-2.5 text-xs font-semibold text-white shadow-xl opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:flex flex-col lg:group-hover:hidden z-50 whitespace-nowrap min-w-[150px]">
                    <p className="px-2 py-1 font-bold text-teal-300 border-b border-slate-700/60 mb-1">{item.label}</p>
                    <div className="flex flex-col gap-1">
                      {item.children.map((c) => {
                        const ChildIcon = getTabIcon(c.to, c.label, c.icon);
                        return (
                          <NavLink
                            key={c.to}
                            to={c.to}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isActive ? 'bg-teal-700 text-white font-bold' : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                              }`
                            }
                          >
                            <ChildIcon size={14} className="text-teal-400 shrink-0" />
                            <span>{c.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sub-menu Children list with Smooth Height Expansion Animation */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-1 items-center lg:items-stretch pl-0 lg:pl-5 pr-0 lg:pr-1 border-l-0 lg:border-l-2 border-teal-100/80 ml-0 lg:ml-6 my-1">
                      {item.children.map((child) => {
                        const ChildIcon = getTabIcon(child.to, child.label, child.icon);
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            title={child.label}
                            className={({ isActive }) =>
                              [
                                'group relative flex items-center justify-center lg:justify-start gap-2.5 rounded-xl p-2 lg:px-2.5 lg:py-2 text-xs font-bold transition-all duration-200 select-none cursor-pointer w-full',
                                isActive
                                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                                  : 'text-slate-600 hover:bg-teal-50 hover:text-teal-900',
                              ].join(' ')
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : 'text-slate-400 group-hover:bg-teal-100/60 group-hover:text-teal-800'
                                  }`}
                                >
                                  <ChildIcon size={16} />
                                </div>
                                <span className="hidden lg:inline truncate">{child.label}</span>

                                {/* Floating tooltip khi thanh tabbar thu nhỏ */}
                                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden rounded-lg bg-slate-900/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:block lg:group-hover:hidden z-50 whitespace-nowrap">
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

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'group relative flex items-center justify-center lg:justify-start gap-3 rounded-xl p-2.5 lg:px-3.5 lg:py-2.5 text-xs font-bold transition-all duration-200 select-none cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-md shadow-teal-700/20 ring-1 ring-teal-600/30'
                    : 'text-slate-600 hover:bg-teal-50/70 hover:text-teal-900',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 group-hover:bg-teal-100/60 group-hover:text-teal-800'
                    }`}
                  >
                    <IconComponent size={18} />
                  </div>
                  <span className="hidden lg:inline truncate whitespace-nowrap">{item.label}</span>

                  {/* Floating tooltip khi thanh tabbar thu nhỏ */}
                  <div className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-slate-900/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:block lg:group-hover:hidden z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer Status Badge */}
      <div className="p-2 lg:p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-center lg:justify-start">
        <div
          className="flex items-center justify-center lg:justify-start gap-2 p-2 lg:px-3 lg:py-2 rounded-lg bg-teal-50/80 border border-teal-100 text-teal-800 text-[11px] font-bold w-full"
          title="Nha Khoa Crown Active"
        >
          <ShieldCheck size={16} className="text-teal-600 shrink-0" />
          <span className="hidden lg:inline truncate whitespace-nowrap">Nha Khoa Crown Active</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse lg:ml-auto shrink-0" />
        </div>
      </div>
    </nav>
  );
}
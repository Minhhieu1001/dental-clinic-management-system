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
  MessageSquare,
  X,
  Menu,
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
  if (key.includes('consultation') || lbl.includes('tư vấn')) return MessageSquare;
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

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

  // Auto close mobile drawer on path change
  useEffect(() => {
    setIsMobileExpanded(false);
  }, [location.pathname]);

  const handleParentClick = (item) => {
    // 1. Khi thu nhỏ màn hình (< 1024px) và chưa mở menu:
    // Đá thanh menu ra và mở sẵn các item con để người dùng chọn
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && !isMobileExpanded) {
      setIsMobileExpanded(true);
      setOpenItems((prev) => ({
        ...prev,
        [item.to]: true,
      }));
      return;
    }

    // 2. Chỉ toggle đóng/mở danh sách con, TUYỆT ĐỐI KHÔNG tự động chuyển trang / view item con!
    // Giữ nguyên UI của trang trước đó cho đến khi người dùng click đúng item con.
    setOpenItems((prev) => ({
      ...prev,
      [item.to]: !prev[item.to],
    }));
  };

  const handleTopLevelClick = (e, item) => {
    // Khi thu nhỏ màn hình (< 1024px) và chưa mở menu:
    // Đá thanh menu ra trước để người dùng nhìn thấy rõ rồi mới chọn
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && !isMobileExpanded) {
      e.preventDefault();
      setIsMobileExpanded(true);
      return;
    }

    // Khi đã mở menu hoặc trên desktop: chọn và thu về
    navigate(item.to);
    setIsMobileExpanded(false);
  };

  return (
    <>
      {/* Mobile Backdrop overlay when expanded (< lg) - High z-index to cover Header */}
      {isMobileExpanded && (
        <div
          onClick={() => setIsMobileExpanded(false)}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed left-0 top-0 flex h-screen flex-col border-r border-[#0d3b32] bg-gradient-to-b from-[#06201b] via-[#082822] to-[#051a16] text-[#e6f7f3] select-none transition-all duration-300 shadow-2xl ${
          isMobileExpanded
            ? 'z-[70] w-64 shadow-2xl ring-1 ring-emerald-500/20'
            : 'z-40 lg:z-30 w-16 lg:w-64'
        }`}
      >
        {/* Top Header Logo Banner */}
        <div className="flex h-16 shrink-0 items-center justify-between px-3 lg:px-4 border-b border-[#0d3b32] bg-[#051a16]/90">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setIsMobileExpanded((prev) => !prev);
              }
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer lg:cursor-default focus:outline-none text-left"
            title={isMobileExpanded ? 'Thu nhỏ menu' : 'Menu chức năng'}
          >
            {/* Logo Icon Container - Mint Tooth badge as in image */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#059669] p-1.5 shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/30">
              <img
                src="/logo.png"
                alt="Crown Dental Logo"
                className="h-full w-full object-contain filter brightness-110"
              />
            </div>
            <div
              className={`overflow-hidden leading-tight ${
                isMobileExpanded ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-extrabold tracking-tight text-white leading-none">
                  Crown Dental
                </span>
              </div>
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#34d399] leading-none mt-1">
                DENTAL ERP
              </p>
            </div>
          </button>

          {/* Toggle Close button on Mobile when expanded */}
          {isMobileExpanded && (
            <button
              type="button"
              onClick={() => setIsMobileExpanded(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#7ca89f] hover:text-white hover:bg-[#0c352d] transition-colors cursor-pointer"
              title="Đóng menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Section Title - Sage Pine styling */}
        <div
          className={`px-4 pt-4 pb-1.5 items-center justify-between shrink-0 ${
            isMobileExpanded ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#3d7a6e]">
            Menu Chức Năng
          </span>
          <Sparkles size={12} className="text-[#34d399]" />
        </div>

        {/* Nav Links List */}
        <div className="flex flex-1 flex-col gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
          {items.map((item) => {
            const IconComponent = getTabIcon(item.to, item.label, item.icon);
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              const hasActiveChild = item.children.some((child) => isPathActive(child.to));
              const isOpen = !!openItems[item.to];

              return (
                <div key={item.to} className="flex flex-col shrink-0 w-full relative group">
                  {/* Parent Button - Consistent 44px height, sharp ERP corners (rounded-lg) */}
                  <button
                    type="button"
                    onClick={() => handleParentClick(item)}
                    className={`relative flex items-center justify-between rounded-lg px-3 h-11 min-h-[44px] shrink-0 text-[13.5px] transition-all duration-150 cursor-pointer w-full text-left ${
                      hasActiveChild
                        ? 'bg-[#0e3b33] text-white font-bold ring-1 ring-[#10b981]/50 shadow-sm shadow-emerald-950/40'
                        : isOpen
                        ? 'bg-[#0c352d] text-white font-semibold'
                        : 'text-[#9dbfb7] hover:bg-[#0c352d]/80 hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                          hasActiveChild || isOpen
                            ? 'text-[#34d399]'
                            : 'text-[#4e8d80] group-hover:text-[#34d399]'
                        }`}
                      >
                        <IconComponent size={19} strokeWidth={hasActiveChild ? 2.3 : 1.9} />
                      </div>
                      <span
                        className={`truncate whitespace-nowrap ${
                          isMobileExpanded ? 'inline' : 'hidden lg:inline'
                        } ${hasActiveChild ? 'text-white font-bold' : ''}`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Toggle Chevron */}
                    <div
                      className={`items-center justify-center ${
                        isMobileExpanded ? 'flex' : 'hidden lg:flex'
                      } ${hasActiveChild || isOpen ? 'text-[#34d399]' : 'text-[#4e8d80] group-hover:text-[#34d399]'}`}
                    >
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 ease-in-out ${
                          isOpen ? 'rotate-180 text-[#34d399]' : 'rotate-0'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Sub-menu Children tree list with vertical guide and bullet dots */}
                  <div
                    className={`${
                      isMobileExpanded ? 'block' : 'hidden lg:block'
                    } overflow-hidden transition-all duration-200 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100 mt-1 mb-1' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="flex flex-col gap-1 border-l border-[#194b41] ml-7 pl-3 py-1">
                      {item.children.map((child) => {
                        const ChildIcon = getTabIcon(child.to, child.label, child.icon);
                        const isChildActive = isPathActive(child.to);

                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={() => setIsMobileExpanded(false)}
                            title={child.label}
                            className={`relative flex items-center gap-2.5 rounded-md px-2.5 h-[36px] min-h-[36px] shrink-0 text-[13px] transition-all duration-150 select-none cursor-pointer w-full ${
                              isChildActive
                                ? 'bg-[#0e3b33] text-[#a7f3d0] font-bold shadow-xs'
                                : 'text-[#88ada5] hover:bg-[#0c352d]/60 hover:text-white font-medium'
                            }`}
                          >
                            {/* Glowing bullet dot */}
                            <span
                              className={`shrink-0 rounded-full transition-all duration-150 ${
                                isChildActive
                                  ? 'w-2 h-2 bg-[#10b981] shadow-[0_0_8px_#10b981]'
                                  : 'w-1.5 h-1.5 bg-[#275c51] group-hover:bg-[#34d399]'
                              }`}
                            />

                            <span
                              className={`truncate text-[13px] ${
                                isMobileExpanded ? 'inline' : 'hidden lg:inline'
                              } ${isChildActive ? 'text-[#d1fae5] font-bold' : 'font-medium'}`}
                            >
                              {child.label}
                            </span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>

                  {/* Floating flyout for collapsed rail mode (< lg when not expanded) */}
                  {!isMobileExpanded && (
                    <div className="pointer-events-none group-hover:pointer-events-auto absolute left-full top-0 ml-2 hidden group-hover:flex flex-col lg:group-hover:hidden z-[80] bg-[#07241e] rounded-lg shadow-2xl border border-[#0d3b32] p-2 min-w-[170px] whitespace-nowrap animate-in fade-in-50 zoom-in-95 duration-150">
                      <p className="px-2.5 py-1 text-[11px] font-bold text-[#34d399] uppercase tracking-wider border-b border-[#0f443a] mb-1">
                        {item.label}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {item.children.map((c) => {
                          const isChildNow = isPathActive(c.to);
                          return (
                            <NavLink
                              key={c.to}
                              to={c.to}
                              onClick={() => setIsMobileExpanded(false)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                isChildNow
                                  ? 'bg-[#0e3b33] text-[#a7f3d0] font-bold'
                                  : 'text-[#9dbfb7] hover:bg-[#0c352d] hover:text-white font-medium'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isChildNow ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]' : 'bg-[#275c51]'
                                }`}
                              />
                              <span>{c.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Top-level item without children - Consistent 44px height
            const isActive = isPathActive(item.to);

            return (
              <div key={item.to} className="relative group shrink-0 w-full">
                <button
                  type="button"
                  onClick={(e) => handleTopLevelClick(e, item)}
                  className={`relative flex items-center justify-center ${
                    isMobileExpanded ? 'justify-start' : 'lg:justify-start'
                  } gap-3 rounded-lg px-3 h-11 min-h-[44px] shrink-0 text-[13.5px] transition-all duration-150 select-none cursor-pointer w-full text-left ${
                    isActive
                      ? 'bg-[#0e3b33] text-white font-bold ring-1 ring-[#10b981]/50 shadow-sm shadow-emerald-950/40'
                      : 'text-[#9dbfb7] hover:bg-[#0c352d]/80 hover:text-white font-medium'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                      isActive
                        ? 'text-[#34d399]'
                        : 'text-[#4e8d80] group-hover:text-[#34d399]'
                    }`}
                  >
                    <IconComponent size={19} strokeWidth={isActive ? 2.3 : 1.9} />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap ${
                      isMobileExpanded ? 'inline' : 'hidden lg:inline'
                    } ${isActive ? 'text-white font-bold' : 'font-medium'}`}
                  >
                    {item.label}
                  </span>
                </button>

                {/* Tooltip for collapsed mode (< lg when not expanded) */}
                {!isMobileExpanded && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block lg:group-hover:hidden rounded-md bg-[#051a16] border border-[#0d3b32] px-2.5 py-1 text-xs font-semibold text-[#a7f3d0] shadow-xl z-[80] whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Footer Status Badge */}
        <div className="p-3 border-t border-[#0d3b32] bg-[#051a16]/90 shrink-0 z-10">
          <div
            className={`flex items-center justify-center ${
              isMobileExpanded ? 'justify-between' : 'lg:justify-between'
            } px-3 py-2 rounded-lg bg-[#07241e] border border-[#0f443a] text-[#9dbfb7] text-xs font-medium shadow-xs hover:bg-[#0c352d] transition-colors`}
            title="Hệ thống Nha Khoa Crown đang hoạt động ổn định"
          >
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck size={16} className="text-[#34d399] shrink-0" />
              <span
                className={`truncate font-semibold text-[#b8dbd3] text-[12px] ${
                  isMobileExpanded ? 'inline' : 'hidden lg:inline'
                }`}
              >
                Crown Dental Active
              </span>
            </div>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}

import { useState } from 'react';
import {
  SlidersHorizontal,
  Calendar,
  CreditCard,
  BellRing,
  Save,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Smartphone,
  Gift,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_GENERAL_SETTINGS = {
  defaultDurationMinutes: 30,
  minAdvanceBookingHours: 2,
  maxAdvanceBookingDays: 30,
  autoCancelLateMinutes: 15,
  smsReminder24h: true,
  zaloZnsReminder2h: true,
  birthdayGreeting: true,
  bankName: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam',
  bankAccountNo: '0011004567899',
  bankAccountName: 'CONG TY CP NHA KHOA CROWN DENTAL',
  autoQrInvoice: true,
};

export default function GeneralSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('crown_dental_general_settings');
    return saved ? JSON.parse(saved) : DEFAULT_GENERAL_SETTINGS;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('crown_dental_general_settings', JSON.stringify(settings));
    toast.success('Đã lưu thiết lập chung thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <SlidersHorizontal size={22} className="text-teal-700" />
            <span>Thiết Lập Vận Hành Hệ Thống (General Settings)</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Cấu hình các quy chuẩn đặt hẹn khám, thanh toán tự động VietQR và chăm sóc khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-teal-800 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Save size={16} />
          <span>Lưu Cấu Hình</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Box 1: Quy trình khám & Đặt lịch hẹn - Bo góc nhọn, chữ to rõ */}
          <div className="rounded border border-slate-300 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3.5 border-b border-slate-200 pb-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-teal-50 text-teal-800 border border-teal-200">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Cấu Hình Đặt Hẹn & Khung Giờ Khám
                </h3>
                <p className="text-xs text-slate-500">
                  Thời lượng điều trị chuẩn và giới hạn book lịch cho bệnh nhân.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Thời lượng mỗi ca khám mặc định
                </label>
                <select
                  value={settings.defaultDurationMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultDurationMinutes: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                >
                  <option value={15}>15 phút / ca (Tư vấn nhanh / Kiểm tra định kỳ)</option>
                  <option value={30}>30 phút / ca (Tiêu chuẩn khám & cạo vôi)</option>
                  <option value={45}>45 phút / ca (Tiểu phẫu / Trám răng chuyên sâu)</option>
                  <option value={60}>60 phút / ca (Phục hình thẩm mỹ / Cấy ghép)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Thời gian bệnh nhân phải đặt trước tối thiểu
                </label>
                <select
                  value={settings.minAdvanceBookingHours}
                  onChange={(e) =>
                    setSettings({ ...settings, minAdvanceBookingHours: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                >
                  <option value={1}>Trước 1 tiếng</option>
                  <option value={2}>Trước 2 tiếng</option>
                  <option value={4}>Trước 4 tiếng</option>
                  <option value={24}>Trước 1 ngày (24 giờ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Mở lịch khám trước tối đa
                </label>
                <select
                  value={settings.maxAdvanceBookingDays}
                  onChange={(e) =>
                    setSettings({ ...settings, maxAdvanceBookingDays: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                >
                  <option value={14}>14 ngày tới</option>
                  <option value={30}>30 ngày tới</option>
                  <option value={60}>60 ngày tới</option>
                  <option value={90}>90 ngày tới</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Tự động hủy lịch nếu bệnh nhân trễ hẹn quá
                </label>
                <select
                  value={settings.autoCancelLateMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, autoCancelLateMinutes: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                >
                  <option value={15}>15 phút</option>
                  <option value={30}>30 phút</option>
                  <option value={0}>Không tự động hủy (Chờ nhân viên lễ tân gọi xác nhận)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Box 2: Tài khoản thanh toán & VietQR - Bo góc nhọn, chữ to rõ */}
          <div className="rounded border border-slate-300 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3.5 border-b border-slate-200 pb-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-teal-50 text-teal-800 border border-teal-200">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tài Khoản Thu Viện Phí & Mã VietQR
                </h3>
                <p className="text-xs text-slate-500">
                  Cấu hình tài khoản ngân hàng nhận thanh toán tại quầy và in trên hóa đơn.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Ngân hàng thụ hưởng
                </label>
                <input
                  type="text"
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Số tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  value={settings.bankAccountNo}
                  onChange={(e) => setSettings({ ...settings, bankAccountNo: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-black text-teal-900 outline-none focus:border-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Tên chủ tài khoản (In hoa không dấu)
                </label>
                <input
                  type="text"
                  value={settings.bankAccountName}
                  onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.autoQrInvoice}
                    onChange={(e) => setSettings({ ...settings, autoQrInvoice: e.target.checked })}
                    className="h-4 w-4 rounded text-teal-700 focus:ring-teal-700 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900 text-sm">
                    Tự động tạo mã VietQR động theo số tiền hóa đơn tại quầy thu ngân
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Box 3: Thông báo tự động */}
          <div className="rounded border border-slate-300 bg-white p-5 shadow-2xs space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3.5 border-b border-slate-200 pb-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-teal-50 text-teal-800 border border-teal-200">
                <BellRing size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Cấu Hình Tự Động Hóa Chăm Sóc Khách Hàng (CRM Automation)
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động kích hoạt thông báo nhắc hẹn qua tin nhắn SMS và Zalo ZNS.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <label className="flex items-start gap-3 rounded border border-slate-200 p-4 hover:bg-slate-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.smsReminder24h}
                  onChange={(e) => setSettings({ ...settings, smsReminder24h: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-teal-700 focus:ring-teal-700"
                />
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Smartphone size={16} className="text-teal-700" /> Nhắc hẹn SMS trước 24h
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Gửi tin nhắn SMS Brandname cho bệnh nhân xác nhận lịch hẹn vào ngày hôm sau.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded border border-slate-200 p-4 hover:bg-slate-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.zaloZnsReminder2h}
                  onChange={(e) =>
                    setSettings({ ...settings, zaloZnsReminder2h: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded text-teal-700 focus:ring-teal-700"
                />
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Clock size={16} className="text-teal-700" /> Nhắc Zalo ZNS trước 2h
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Gửi thông báo Zalo Official Account nhắc khách sắp đến giờ khám để chuẩn bị.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded border border-slate-200 p-4 hover:bg-slate-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.birthdayGreeting}
                  onChange={(e) => setSettings({ ...settings, birthdayGreeting: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded text-teal-700 focus:ring-teal-700"
                />
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Gift size={16} className="text-teal-700" /> Chúc mừng sinh nhật
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Tự động gửi tin nhắn chúc mừng và mã voucher giảm giá 20% các dịch vụ thẩm mỹ.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded bg-teal-700 px-7 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <Save size={16} />
            <span>Lưu Tất Cả Thiết Lập</span>
          </button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, FileText, CalendarCheck, Sparkles, CheckCircle2, Tag } from 'lucide-react';
import { createAppointmentRequest } from '../../services/appointmentRequest.service';
import { getBranches } from '../../services/clinic.service';
import toast from 'react-hot-toast';

const QUICK_TAGS = [
  'Khám răng tổng quát',
  'Tư vấn niềng răng',
  'Trồng răng Implant',
  'Răng sứ thẩm mỹ',
];

export default function AppointmentRequestModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    description: '',
    branchId: '',
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getBranches().then(setBranches).catch((error) => {
      console.error('Failed to load branches:', error);
      toast.error('Không thể tải danh sách chi nhánh');
    });
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagClick = (tag) => {
    setFormData((prev) => {
      if (!prev.description) return { ...prev, description: tag };
      if (prev.description.includes(tag)) return prev;
      return { ...prev, description: `${prev.description}, ${tag}` };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.branchId) {
      toast.error('Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Chi nhánh!');
      return;
    }

    // Phone number basic regex validation
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng kiểm tra lại.');
      return;
    }

    try {
      setLoading(true);
      await createAppointmentRequest({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        description: formData.description.trim(),
        branchId: formData.branchId,
      });

      setIsSuccess(true);
      toast.success('Gửi yêu cầu đặt lịch thành công!');
    } catch (error) {
      console.error('Lỗi gửi yêu cầu lịch hẹn:', error);
      toast.error(
        error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({ fullName: '', phone: '', description: '', branchId: '' });
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleResetAndClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 z-10 my-auto max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-[#1f4fb2] to-[#00a859] px-4 sm:px-6 py-3.5 sm:py-4 text-white shrink-0">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white/90 backdrop-blur-md transition hover:bg-white/25 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="pr-10">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base sm:text-xl font-bold leading-tight text-white">
                    Đăng Ký Yêu Cầu Lịch Hẹn
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    <Sparkles size={11} className="text-yellow-300" />
                    Crown Dental
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] sm:text-xs text-white/85 font-normal">
                  Vui lòng nhập thông tin bên dưới, lễ tân phòng khám sẽ sớm liên hệ xác nhận xếp lịch hẹn.
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1">
              <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-stretch">
                {/* Left Column: Doctor Team Showcase (Full view, neat & professional) */}
                <div className="hidden md:flex md:flex-col justify-between rounded-xl bg-slate-50/70 border border-slate-200/80 p-5 shadow-xs">
                  <div>
                    {/* Full Image Container — Shows all doctors clearly without cropping */}
                    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
                      <img
                        src="/doctor-team.jpg"
                        alt="Đội ngũ bác sĩ nha khoa Crown Dental"
                        className="w-full h-auto aspect-[840/500] object-contain block"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1000&q=85'
                        }}
                      />
                    </div>

                    {/* Information & Credentials */}
                    <div className="pt-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200/60 text-[#1f4fb2] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          <Sparkles size={11} className="text-[#00a859]" />
                          Hội Đồng Bác Sĩ Crown Dental
                        </span>

                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        Đội Ngũ Bác Sĩ Nha Khoa Chuyên Sâu
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        Quy tụ đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm, hoàn thành các khóa tu nghiệp chuyên sâu tại Singapore, Mỹ, Đức — trực tiếp thăm khám và điều trị 1-1.
                      </p>
                    </div>
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="space-y-2 pt-3 border-t border-slate-200/70 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#00a859] shrink-0" />
                      <span>Trực tiếp khám & lên phác đồ cá nhân hóa 1-1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#00a859] shrink-0" />
                      <span>Bảo tồn tối đa răng thật, điều trị nhẹ nhàng không đau</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#00a859] shrink-0" />
                      <span>Cam kết hợp đồng minh bạch & bảo hành chính hãng</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  {isSuccess ? (
                    <div className="py-6 text-center space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 size={40} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-800">Đã Gửi Yêu Cầu Thành Công!</h4>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                          Cảm ơn bạn <span className="font-bold text-slate-900">{formData.fullName}</span>. Bộ phận lễ tân sẽ sớm liên hệ tới SĐT{' '}
                          <span className="font-bold text-slate-900">{formData.phone}</span> để tư vấn và chốt thời gian phù hợp nhất.
                        </p>
                      </div>
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={handleResetAndClose}
                          className="w-full rounded-xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 cursor-pointer"
                        >
                          Đóng cửa sổ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Họ tên */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Nguyễn Văn A"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                          />
                        </div>
                      </div>

                      {/* Số điện thoại */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0901 234 567"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Chi nhánh <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="branchId"
                          required
                          value={formData.branchId}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 outline-none focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                        >
                          <option value="">-- Chọn chi nhánh --</option>
                          {branches.map((branch) => (
                            <option key={branch.branchId} value={branch.branchId}>
                              {branch.branchName} ({branch.branchCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mô tả / Ghi chú */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Mô tả nhu cầu / Dịch vụ quan tâm
                        </label>
                        <div className="relative">
                          <FileText size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                          <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Nhập ghi chú, dịch vụ hoặc thời gian mong muốn..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                          />
                        </div>

                        {/* Quick suggestion tags */}
                        <div className="mt-2.5">
                          <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Tag size={12} /> Chọn nhanh dịch vụ:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_TAGS.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagClick(tag)}
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-[#1f4fb2]/10 hover:text-[#1f4fb2] active:scale-95 cursor-pointer"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>Đang gửi yêu cầu...</span>
                            </>
                          ) : (
                            <>
                              <CalendarCheck size={18} />
                              <span>Gửi Yêu Cầu Đặt Lịch</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-center text-[11px] text-slate-400">
                        Thông tin cá nhân của bạn được bảo mật tuyệt đối.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Calendar, Stethoscope, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CLINICAL_PROCEDURE_TEMPLATES = [
  'Gây tê tại chỗ, mở tủy, đo chiều dài làm việc, bơm rửa NaOCl và đặt thuốc sát khuẩn Ca(OH)2.',
  'Thử cone Gutta Percha chính, chụp X-quang kiểm tra chóp và trám bít ống tủy vĩnh viễn.',
  'Mài cùi răng đúng giải phẫu, quét dấu kỹ thuật số 3D gửi Labo, làm răng tạm bảo vệ.',
  'Thử mão sứ Zirconia trên miệng, kiểm tra điểm chạm khớp cắn và dán cố định bằng Cement Resin.',
  'Tháo chun, kiểm tra độ dịch chuyển răng, thay dây cung Niti mới và tăng lực kéo.',
  'Cạo sạch cao răng trên và dưới nướu, đánh bóng men răng toàn hàm bằng bột mịn.',
];

export function TreatmentVisitModal({
  isOpen,
  onClose,
  mode = 'ADD', // 'ADD' | 'EDIT'
  targetPhaseId,
  initialData = null,
  onSaveVisit,
}) {
  const [visitFormName, setVisitFormName] = useState('');
  const [visitFormOrder, setVisitFormOrder] = useState(1);
  const [visitFormDate, setVisitFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitFormStatus, setVisitFormStatus] = useState('PENDING');
  const [visitFormNotes, setVisitFormNotes] = useState('');

  // Đồng bộ form theo dữ liệu truyền vào khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'EDIT' && initialData) {
        setVisitFormName(initialData.visitName || '');
        setVisitFormOrder(Number(initialData.visitOrder) || 1);
        setVisitFormDate(initialData.start_date || new Date().toISOString().split('T')[0]);
        setVisitFormStatus(initialData.status || 'PENDING');
        setVisitFormNotes(initialData.clinical_notes || '');
      } else {
        const nextOrder = initialData?.visitOrder || 1;
        setVisitFormName(initialData?.visitName || `Buổi ${nextOrder}: `);
        setVisitFormOrder(nextOrder);
        setVisitFormDate(new Date().toISOString().split('T')[0]);
        setVisitFormStatus('PENDING');
        setVisitFormNotes('');
      }
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!visitFormName.trim()) {
      toast.error('Vui lòng nhập tên buổi điều trị!');
      return;
    }
    if (!targetPhaseId) {
      toast.error('Không tìm thấy giai đoạn điều trị tương ứng!');
      return;
    }

    const visitData = {
      visitId: mode === 'EDIT' && initialData?.visitId ? initialData.visitId : `vis-${Date.now()}`,
      visitName: visitFormName.trim(),
      visitOrder: Number(visitFormOrder) || 1,
      start_date: visitFormDate,
      status: visitFormStatus,
      clinical_notes: visitFormNotes.trim() || 'Thực hiện thủ thuật điều trị theo chỉ định bác sĩ.',
    };

    onSaveVisit(targetPhaseId, visitData, mode);
    toast.success(
      mode === 'ADD'
        ? `Đã thêm "${visitData.visitName}" vào giai đoạn!`
        : 'Đã cập nhật thông tin buổi điều trị!'
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Card - Rộng rãi max-w-3xl, không bị cắt chữ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <CalendarCheck className="text-indigo-600" size={22} />
                {mode === 'ADD' ? 'Thêm Buổi Điều Trị' : 'Cập Nhật Buổi Điều Trị'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tên buổi điều trị
                </label>
                <input
                  type="text"
                  required
                  value={visitFormName}
                  onChange={(e) => setVisitFormName(e.target.value)}
                  placeholder="VD: Buổi 1: Mở tủy, lấy tủy buồng & đặt thuốc diệt khuẩn..."
                  className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>

              {/* 3 cột rộng rãi: Thứ tự, Ngày hẹn, Trạng thái (hiển thị trọn vẹn văn bản) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Thứ tự buổi</label>
                  <input
                    type="number"
                    min={1}
                    value={visitFormOrder}
                    onChange={(e) => setVisitFormOrder(Number(e.target.value) || 1)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Ngày hẹn</label>
                  <input
                    type="date"
                    value={visitFormDate}
                    onChange={(e) => setVisitFormDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Trạng thái</label>
                  <select
                    value={visitFormStatus}
                    onChange={(e) => setVisitFormStatus(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 cursor-pointer"
                  >
                    <option value="PENDING">⏳ Chờ khám</option>
                    <option value="IN_PROGRESS">🔵 Đang thực hiện</option>
                    <option value="COMPLETED">✅ Đã hoàn thành</option>
                  </select>
                </div>
              </div>

              {/* Thông tin buổi đó làm gì / Ghi chú lâm sàng */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800">
                    Thông tin buổi đó làm gì / Ghi chú thủ thuật:
                  </label>
                  <span className="text-xs text-indigo-600 font-bold">
                    *Không chọn dịch vụ con
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={visitFormNotes}
                  onChange={(e) => setVisitFormNotes(e.target.value)}
                  placeholder="Ghi lại chi tiết buổi điều trị này bác sĩ làm gì: thủ thuật thực hiện, vật liệu sử dụng, diễn biến lâm sàng, hướng dẫn dặn dò bệnh nhân..."
                  className="w-full rounded-lg border border-slate-300 p-3.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 leading-relaxed font-medium"
                />

                {/* Các mẫu gợi ý nhanh thao tác thủ thuật */}
                <div className="space-y-2 mt-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                    Gợi ý nhanh nội dung thủ thuật lâm sàng (nhấp để chèn):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CLINICAL_PROCEDURE_TEMPLATES.map((templateText, tIdx) => (
                      <motion.button
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        key={tIdx}
                        type="button"
                        onClick={() =>
                          setVisitFormNotes((prev) =>
                            prev ? `${prev}\n- ${templateText}` : templateText
                          )
                        }
                        className="rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-medium p-2.5 cursor-pointer transition-colors text-left flex items-start gap-2"
                      >
                        <span className="text-indigo-600 font-bold shrink-0">+</span>
                        <span className="leading-snug">{templateText}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="rounded-lg bg-indigo-700 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-800 cursor-pointer flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>{mode === 'ADD' ? 'Thêm buổi điều trị' : 'Lưu cập nhật'}</span>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default TreatmentVisitModal;


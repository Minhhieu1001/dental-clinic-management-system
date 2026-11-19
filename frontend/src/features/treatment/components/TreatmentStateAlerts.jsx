import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  FileSpreadsheet,
  Stethoscope,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ClipboardList,
  AlertCircle,
  FolderOpen,
  ChevronRight,
  Plus,
  Layers,
} from 'lucide-react';

/**
 * 1. Trạng thái khi chưa chọn bệnh nhân
 */
export const NoPatientAlert = () => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="rounded-2xl border-2 border-dashed border-teal-300/80 bg-gradient-to-b from-teal-50/80 via-white to-slate-50/40 p-8 sm:p-12 text-center shadow-lg space-y-6 my-2 relative overflow-hidden"
  >
    {/* Hiệu ứng nền mềm */}
    <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

    {/* Biểu tượng chính */}
    <div className="relative mx-auto flex items-center justify-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white shadow-xl shadow-teal-600/30 ring-8 ring-teal-100">
        <Phone size={34} strokeWidth={2.2} />
      </div>
    </div>

    {/* Tiêu đề & Thông điệp */}
    <div className="space-y-2.5 max-w-xl mx-auto">
      <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1 text-xs font-black text-teal-900 border border-teal-300 shadow-2xs tracking-wide uppercase">
        <AlertCircle size={15} className="text-teal-700" />
        <span>Vui lòng chọn bệnh nhân</span>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        Chưa chọn bệnh nhân để lập kế hoạch điều trị
      </h3>

      <p className="text-sm text-slate-600 font-medium leading-relaxed">
        Vui lòng chọn nhanh từ danh sách bệnh nhân hoặc nhập số điện thoại tại thanh công cụ ở trên để tra cứu hồ sơ và lập kế hoạch điều trị theo từng đợt khám.
      </p>
    </div>
  </motion.div>
);

/**
 * 2. Trạng thái bệnh nhân chưa có bất kỳ đợt khám nào
 * Thiết kế nổi bật, có icon lớn với vòng sáng, thẻ quy trình và nút CTA rõ ràng
 */
export const NoExaminationAlert = ({ patient }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border-2 border-dashed border-amber-400/80 bg-gradient-to-b from-amber-50/90 via-orange-50/30 to-white p-8 sm:p-12 text-center shadow-lg space-y-6 my-2 relative overflow-hidden"
    >
      {/* Hiệu ứng nền mềm */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Tiêu đề & Thông điệp */}
      <div className="space-y-2.5 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-xs font-black text-amber-900 border border-amber-300 shadow-2xs tracking-wide uppercase">
          <AlertCircle size={15} className="text-amber-700" />
          <span>Chưa có đợt khám / điều trị</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Bệnh nhân {patient?.fullName ? `"${patient.fullName}"` : ''} chưa có đợt khám nào!
        </h3>

      </div>

      {/* Nút hành động nổi bật */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/dentist/medical-records', { state: { patient } })}
          className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-600/30 hover:shadow-xl hover:shadow-amber-600/40 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <ClipboardList size={18} strokeWidth={2.5} />
          <span>Quay lại hồ sơ bệnh án</span>
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/dentist/clinical-exam', { state: { patient } })}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-white hover:bg-amber-50 px-6 py-3.5 text-sm font-black text-amber-800 shadow-xs hover:border-amber-400 transition-all cursor-pointer"
        >
          <Stethoscope size={18} className="text-amber-600" />
          <span>Đi đến khám lâm sàng</span>
        </button>
      </div>

      {/* Thẻ hướng dẫn 3 bước */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
        <div className="rounded-xl border-2 border-amber-500 bg-amber-50/90 p-3.5 shadow-2xs space-y-1 relative">
          <div className="flex items-center justify-between text-amber-900 font-extrabold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white text-[11px] font-bold">1</span>
            <span className="text-[10px] uppercase font-black tracking-wider bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">Cần làm</span>
          </div>
          <div className="font-extrabold text-xs text-amber-900 pt-0.5">Hồ sơ bệnh án</div>
          <p className="text-[11px] text-amber-800/90 leading-tight font-medium">
            Tạo hồ sơ và khởi tạo đợt khám đầu tiên.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 shadow-2xs space-y-1 opacity-60">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-[11px]">2</span>
            <span>Khám lâm sàng</span>
          </div>
          <div className="font-bold text-xs text-slate-700">Sơ đồ răng & Chẩn đoán</div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Khám sơ đồ 32 răng và kết luận bệnh lý.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 shadow-2xs space-y-1 opacity-60">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-[11px]">3</span>
            <span>Kế hoạch điều trị</span>
          </div>
          <div className="font-bold text-xs text-slate-700">Lên phác đồ & Dịch vụ</div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Thiết lập giai đoạn và chi phí điều trị.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 3. Trạng thái đợt khám chưa có kết quả chẩn đoán
 * Thiết kế nổi bật, tông màu xanh y tế sắc sảo với icon lớn và nút hành động rõ ràng
 */
export const NoDiagnosisAlert = ({ patient, session }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border-2 border-dashed border-sky-400/80 bg-gradient-to-b from-sky-50/90 via-blue-50/30 to-white p-8 sm:p-12 text-center shadow-lg space-y-6 my-2 relative overflow-hidden"
    >
      {/* Hiệu ứng nền mềm */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Tiêu đề & Thông điệp */}
      <div className="space-y-2.5 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1 text-xs font-black text-sky-900 border border-sky-300 shadow-2xs tracking-wide uppercase">
          <AlertCircle size={15} className="text-sky-700" />
          <span>Chưa có chẩn đoán xác định</span>
        </div>

        <h3 className="text-xl sm:text-xl font-black text-slate-900 tracking-tight">
          Đợt khám {session?.label ? `"${session.label}"` : ''} chưa có kết luận chẩn đoán!
        </h3>


      </div>

      {/* Nút hành động nổi bật */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() =>
            navigate('/dentist/clinical-exam', {
              state: {
                patient,
                examinationResultId: session?.isRealDb ? (session?.examinationResultId || session?.id) : undefined,
                medicalRecordId: session?.medicalRecordId || session?.id,
              },
            })
          }
          className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 hover:from-sky-700 hover:to-blue-800 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-600/30 hover:shadow-xl hover:shadow-sky-600/40 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <RotateCcw size={18} strokeWidth={2.5} />
          <span>Quay lại màn hình khám bệnh & chẩn đoán</span>
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Thẻ hướng dẫn 3 bước */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-900 font-extrabold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">✓</span>
            <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900">Hoàn thành</span>
          </div>
          <div className="font-extrabold text-xs text-emerald-900 pt-0.5">Khởi tạo đợt khám</div>
          <p className="text-[11px] text-emerald-800/80 leading-tight font-medium">
            {session?.label || 'Đợt 1'} đã được tạo trong hệ thống.
          </p>
        </div>

        <div className="rounded-xl border-2 border-sky-500 bg-sky-50/90 p-3.5 shadow-2xs space-y-1 relative">
          <div className="flex items-center justify-between text-sky-900 font-extrabold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[11px] font-bold">2</span>
            <span className="text-[10px] uppercase font-black tracking-wider bg-sky-200 px-1.5 py-0.5 rounded text-sky-900">Cần thực hiện</span>
          </div>
          <div className="font-extrabold text-xs text-sky-900 pt-0.5">Chẩn đoán lâm sàng</div>
          <p className="text-[11px] text-sky-800/90 leading-tight font-medium">
            Ghi nhận chẩn đoán ICD-10 tại Bước 3 Khám bệnh.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 shadow-2xs space-y-1 opacity-60">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-[11px]">3</span>
            <span>Kế hoạch điều trị</span>
          </div>
          <div className="font-bold text-xs text-slate-700">Lên phác đồ & Dịch vụ</div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Sẵn sàng mở sau khi lưu ít nhất 1 chẩn đoán.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 4. Trạng thái đợt khám đã có chẩn đoán nhưng chưa có kế hoạch điều trị
 * Thiết kế nổi bật, rực rỡ với icon lớn, hiệu ứng vòng sáng, thanh tiến trình và nút CTA cực kỳ thu hút
 */
export const NoPlanForSessionAlert = ({ session, diagnosesCount = 0, onOpenCreatePlan }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="rounded-2xl border-2 border-dashed border-teal-400/80 bg-gradient-to-b from-teal-50/90 via-emerald-50/30 to-white p-8 sm:p-12 text-center shadow-lg space-y-6 my-2 relative overflow-hidden"
  >
    {/* Hiệu ứng nền mềm */}
    <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />


    {/* Tiêu đề & Thông điệp */}
    <div className="space-y-2.5 max-w-xl mx-auto">
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-xs font-black text-emerald-900 border border-emerald-300 shadow-2xs tracking-wide uppercase">
        <Sparkles size={15} className="text-emerald-700" />
        <span>Đã sẵn sàng lập kế hoạch ({diagnosesCount} chẩn đoán)</span>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        Đợt khám {session?.label ? `"${session.label}"` : ''} chưa có kế hoạch điều trị
      </h3>

    </div>

    {/* Nút hành động kêu gọi nổi bật */}
    <div className="flex items-center justify-center pt-2">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onOpenCreatePlan}
        className="group relative inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 px-9 py-4 text-sm font-black text-white shadow-xl shadow-teal-700/30 hover:shadow-2xl hover:shadow-teal-700/40 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider"
      >
        <Sparkles size={18} className="text-emerald-200" />
        <span>Lên kế hoạch điều trị ngay</span>
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
      </motion.button>
    </div>

    {/* Thẻ hướng dẫn 3 bước */}
    <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-emerald-900 font-extrabold text-xs">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">✓</span>
          <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900">Hoàn thành</span>
        </div>
        <div className="font-extrabold text-xs text-emerald-900 pt-0.5">Khởi tạo đợt khám</div>
        <p className="text-[11px] text-emerald-800/80 leading-tight font-medium">
          {session?.label || 'Đợt 1'} đã ghi nhận trong hệ thống.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-emerald-900 font-extrabold text-xs">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">✓</span>
          <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900">{diagnosesCount} chẩn đoán</span>
        </div>
        <div className="font-extrabold text-xs text-emerald-900 pt-0.5">Chẩn đoán lâm sàng</div>
        <p className="text-[11px] text-emerald-800/80 leading-tight font-medium">
          Đã xác nhận đầy đủ chẩn đoán theo từng răng.
        </p>
      </div>

      <div className="rounded-xl border-2 border-teal-500 bg-teal-50/90 p-3.5 shadow-2xs space-y-1 relative">
        <div className="flex items-center justify-between text-teal-900 font-extrabold text-xs">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white text-[11px] font-bold">3</span>
          <span className="text-[10px] uppercase font-black tracking-wider bg-teal-200 px-1.5 py-0.5 rounded text-teal-900">Sẵn sàng</span>
        </div>
        <div className="font-extrabold text-xs text-teal-900 pt-0.5">Lên phác đồ điều trị</div>
        <p className="text-[11px] text-teal-800/90 leading-tight font-medium">
          Thiết lập các giai đoạn và dịch vụ điều trị.
        </p>
      </div>
    </div>
  </motion.div>
);

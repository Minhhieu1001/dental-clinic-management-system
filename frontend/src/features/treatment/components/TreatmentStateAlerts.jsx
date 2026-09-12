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
} from 'lucide-react';

/**
 * 1. Trạng thái khi chưa chọn bệnh nhân
 */
export const NoPatientAlert = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs space-y-4"
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 mx-auto shadow-inner">
      <Phone size={28} />
    </div>
    <div className="space-y-1 max-w-md mx-auto">
      <h3 className="text-base font-bold text-slate-800">Chưa chọn bệnh nhân</h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        Vui lòng chọn từ danh sách hoặc nhập số điện thoại ở trên để tra cứu hồ sơ và lập kế hoạch điều trị theo từng đợt khám.
      </p>
    </div>
  </motion.div>
);

/**
 * 2. Trạng thái bệnh nhân chưa có bất kỳ đợt khám nào
 * Yêu cầu quay lại hồ sơ bệnh án
 */
export const NoExaminationAlert = ({ patient }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50/70 via-white to-amber-50/40 p-8 text-center shadow-2xs space-y-4"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mx-auto shadow-xs">
        <FolderOpen size={26} />
      </div>
      <div className="space-y-1.5 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-0.5 text-xs font-bold text-amber-900">
          <AlertCircle size={14} />
          Chưa có kết quả khám bệnh
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Bệnh nhân {patient?.fullName} chưa có đợt khám nào!
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Hệ thống ghi nhận bệnh nhân này chưa có dữ liệu khám lâm sàng hoặc kết quả khám bệnh. Để lập kế hoạch điều trị, vui lòng quay lại lập hồ sơ bệnh án hoặc thực hiện khám bệnh trước.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/dentist/medical-records', { state: { patient } })}
          className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
        >
          <ClipboardList size={15} />
          <span>Quay lại hồ sơ bệnh án</span>
        </button>
      </div>
    </motion.div>
  );
};

/**
 * 3. Trạng thái đợt khám chưa có kết quả chẩn đoán
 * Yêu cầu quay lại màn hình khám bệnh
 */
export const NoDiagnosisAlert = ({ patient, session }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-50/70 via-white to-sky-50/40 p-8 text-center shadow-2xs space-y-4"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 mx-auto shadow-xs">
        <Stethoscope size={26} />
      </div>
      <div className="space-y-1.5 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-0.5 text-xs font-bold text-sky-900">
          <AlertCircle size={14} />
          Chưa có chẩn đoán xác định
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Đợt khám này chưa có chẩn đoán của nha sĩ!
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Kế hoạch điều trị cần căn cứ trên kết quả chẩn đoán lâm sàng từng răng (ICD-10). Vui lòng quay lại màn hình khám bệnh để ghi nhận chẩn đoán trước khi lên phác đồ điều trị.
        </p>
      </div>

      <div className="flex items-center justify-center pt-2">
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
          className="flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
        >
          <RotateCcw size={15} />
          <span>Quay lại màn hình khám bệnh</span>
        </button>
      </div>
    </motion.div>
  );
};

/**
 * 4. Trạng thái đợt khám đã có chẩn đoán nhưng chưa có kế hoạch điều trị
 * Hiển thị nút "Lên kế hoạch điều trị"
 */
export const NoPlanForSessionAlert = ({ session, diagnosesCount = 0, onOpenCreatePlan }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-teal-200 bg-linear-to-br from-white via-teal-50/40 to-teal-50/80 p-8 text-center shadow-xs space-y-4"
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 mx-auto shadow-xs">
      <FileSpreadsheet size={26} />
    </div>
    <div className="space-y-1.5 max-w-lg mx-auto">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
        <Sparkles size={13} />
        Đã sẵn sàng lập kế hoạch ({diagnosesCount} chẩn đoán)
      </div>
      <h3 className="text-base font-bold text-slate-900">
        Đợt khám {session?.label || ''} chưa có kế hoạch điều trị
      </h3>
      <p className="text-xs text-slate-600 leading-relaxed">
        Đợt khám này đã có kết quả chẩn đoán lâm sàng từ nha sĩ. Hãy bấm nút bên dưới để thiết lập phác đồ, các giai đoạn và dịch vụ điều trị cho bệnh nhân.
      </p>
    </div>

    <div className="flex items-center justify-center pt-2">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onOpenCreatePlan}
        className="flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-6 py-3 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all cursor-pointer tracking-wide uppercase"
      >
        <Sparkles size={16} />
        <span>Lên kế hoạch điều trị</span>
        <ArrowRight size={15} />
      </motion.button>
    </div>
  </motion.div>
);

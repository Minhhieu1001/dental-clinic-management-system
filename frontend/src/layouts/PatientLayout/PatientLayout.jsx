import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, X, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PatientHeader from './PatientHeader.jsx';
import { roleRoutes } from '../../constants/roleRoutes.js';
import { useAuth } from '../../hooks/useAuth';
import { hasMissingPatientInformation } from '../../services/patient.service';

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDashboard = location.pathname === '/patient/dashboard' || location.pathname === '/patient';
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const patientId = user?.patientId || user?.id;
    if (!isDashboard || !patientId) {
      setShowProfileModal(false);
      return;
    }

    let active = true;
    hasMissingPatientInformation(patientId)
      .then((profileIncomplete) => {
        if (active && profileIncomplete) setShowProfileModal(true);
      })
      .catch((error) => {
        console.error('Không thể kiểm tra mức độ đầy đủ hồ sơ bệnh nhân:', error);
      });

    return () => {
      active = false;
    };
  }, [isDashboard, user?.patientId, user?.id]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      <PatientHeader config={roleRoutes.patient} />

      <main className={`flex-1 w-full ${isDashboard ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/60 bg-white py-4 text-center text-xs text-slate-500">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Crown Dental Clinic. Nền tảng chăm sóc sức khỏe nụ cười trọn đời.</p>
          <p className="text-slate-400">
            Hotline hỗ trợ bệnh nhân: <span className="font-semibold text-emerald-700">1900 1234</span> (24/7)
          </p>
        </div>
      </footer>

      {/* ================= MODAL CẬP NHẬT HỒ SƠ (HIỆU ỨNG MƯỢT MÀ, HEADER CHUẨN ERP) ================= */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop mượt mà */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setShowProfileModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-completion-title"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-md rounded-sm border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h2 id="profile-completion-title" className="text-sm font-bold text-slate-900">
                      Cập nhật thông tin cá nhân
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Hoàn thiện hồ sơ y tế trực tuyến
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="w-7 h-7 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                  title="Đóng modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-5 space-y-3.5 text-xs text-slate-600">

                {/* Danh sách lợi ích khi hoàn thiện hồ sơ */}
                <div className="rounded-sm bg-teal-50/50 border border-teal-100 p-3 space-y-2">
                  <div className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-teal-700" />
                    <span>Lợi ích khi hoàn tất hồ sơ:</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-teal-600 shrink-0" />
                      <span>Đặt lịch khám nhanh chóng và tiếp nhận ưu tiên tại phòng khám</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-teal-600 shrink-0" />
                      <span>Tra cứu dễ dàng hồ sơ bệnh án, đơn thuốc và lịch hẹn tái khám</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-teal-600 shrink-0" />
                      <span>Đảm bảo quyền lợi y tế và bảo mật thông tin khám chữa bệnh</span>
                    </li>
                  </ul>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Bạn có thể cập nhật ngay bây giờ hoặc bổ sung lại bất cứ lúc nào trong mục cài đặt tài khoản.
                </p>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-sm border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    navigate('/patient/profile');
                  }}
                  className="flex items-center gap-1.5 rounded-sm bg-teal-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Cập nhật ngay</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

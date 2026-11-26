import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, X, ArrowRight, ShieldCheck, CheckCircle2, Bot, Sparkles } from 'lucide-react';
import PatientHeader from './PatientHeader.jsx';
import Chatbot from '../../features/ai/Chatbot.jsx';
import { roleRoutes } from '../../constants/roleRoutes.js';
import { useAuth } from '../../hooks/useAuth';
import { hasMissingPatientInformation } from '../../services/patient.service';

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDashboard = location.pathname === '/patient/dashboard' || location.pathname === '/patient';
  const isLiveChatPage = location.pathname.startsWith('/patient/chat');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const profileModalVisible = isDashboard && showProfileModal;

  useEffect(() => {
    const patientId = user?.patientId;
    if (!isDashboard || !patientId) {
      return;
    }

    let active = true;
    hasMissingPatientInformation(patientId)
      .then((profileIncomplete) => {
        if (active) setShowProfileModal(Boolean(profileIncomplete));
      })
      .catch((error) => {
        console.error('Không thể kiểm tra mức độ đầy đủ hồ sơ bệnh nhân:', error);
      });

    return () => {
      active = false;
    };
  }, [isDashboard, user?.patientId]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      <PatientHeader config={roleRoutes.patient} />

      <main className={`flex-1 w-full ${isDashboard ? 'p-0' : 'px-2 sm:px-4 lg:px-6 py-3 sm:py-6'}`}>
        <Outlet />
      </main>

      {/* AI Chatbot Assistant có sẵn cho Bệnh nhân đã đăng nhập */}
      <Chatbot
        isOpen={isAiChatOpen && !profileModalVisible}
        onClose={() => setIsAiChatOpen(false)}
      />

      <AnimatePresence>
        {!isAiChatOpen && !profileModalVisible && (
          <motion.div
            key="patient-floating-ai-btn"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.6,
              y: 20,
              transition: { duration: 0.18, ease: 'easeOut' },
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`fixed right-4 sm:right-6 z-40 ${
              isLiveChatPage ? 'bottom-24 sm:bottom-24' : 'bottom-4 sm:bottom-6'
            }`}
          >
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsAiChatOpen(true)}
                className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                title="Trợ lý ảo AI tư vấn 24/7"
              >
                <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute top-0.5 right-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-emerald-400 border-2 border-white"></span>
                </span>
              </button>

              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden sm:block">
                <div className="rounded-lg bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Trợ lý AI tư vấn 24/7</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL CẬP NHẬT HỒ SƠ (HIỆU ỨNG MƯỢT MÀ, HEADER CHUẨN ERP) ================= */}
      <AnimatePresence>
        {profileModalVisible && (
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

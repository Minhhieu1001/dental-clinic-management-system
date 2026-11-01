import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Copy,
  AlertCircle,
  Crown,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RELATIONSHIP_LABELS, relationshipError } from '../../../../utils/relationshipUtils';



export default function LinkedProfilesModal({
  isOpen,
  onClose,
  profiles = [],
  loading = false,
  activeProfileId,
  onSelectProfile,
  onUnlinkProfile
}) {
  const [confirmUnlinkTarget, setConfirmUnlinkTarget] = useState(null);
  const [unlinking, setUnlinking] = useState(false);
  const unlinkingRef = useRef(false);
  const primaryProfile = profiles.find((profile) => profile.isPrimary);
  const linkedDependents = profiles.filter((profile) => !profile.isPrimary);
  const displayCards = primaryProfile ? [primaryProfile, ...linkedDependents] : linkedDependents;

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  const handleConfirmUnlink = async (profile) => {
    if (unlinkingRef.current) return;
    if (!profile.relationshipId) { toast.error('Không tìm thấy mã liên kết. Vui lòng tải lại danh sách.'); return; }
    unlinkingRef.current = true;
    setUnlinking(true);
    try {
      await onUnlinkProfile(profile.relationshipId);
      setConfirmUnlinkTarget(null);
      toast.success('Đã hủy liên kết hồ sơ của ' + profile.fullName);
    } catch (error) {
      toast.error(relationshipError(error, 'Hủy liên kết không thành công'));
    } finally { unlinkingRef.current = false; setUnlinking(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5">
          {/* Backdrop làm mờ mượt mà */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container với chuyển động Spring mượt mà */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
          >
            {/* Header Modal - Xanh ngọc nhạt thanh lịch */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4.5 border-b border-teal-100/60 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-white shrink-0">
              <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-200/60 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Users size={18} className="text-teal-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight truncate">
                      Quản lý liên kết
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-teal-100/80 text-teal-700 border border-teal-200/80 shrink-0">
                      {linkedDependents.length}/5
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
                    Danh sách hồ sơ bệnh án của bạn và người thân đang được quản lý.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ml-1.5"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Modal: Grid các Card hồ sơ */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">

              {/* Box thông báo chính sách y tế */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/60 text-teal-900 text-xs">
                <ShieldCheck size={16} className="text-teal-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Các hồ sơ được bảo trợ có thể xem đầy đủ lịch sử khám, phác đồ điều trị.
                  Chọn hồ sơ để xem bệnh án hoặc hủy liên kết khi không còn quản lý.
                </p>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-slate-500">Đang tải và ghép thông tin hồ sơ...</p>
                </div>
              ) : displayCards.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Chưa có hồ sơ liên kết nào
                </div>
              ) : (
                /* Grid danh sách các hồ sơ thực tế */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayCards.map((item) => {
                    const isPrimary = item.isPrimary;
                    const isCurrentActive = activeProfileId === item.patientId || activeProfileId === item.patientCode;
                    const isBoy = item.gender !== 'FEMALE';

                    return (
                      <motion.div
                        key={item.relationshipId || item.patientId || item.patientCode}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                        className={`relative rounded-2xl border p-4.5 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md ${isCurrentActive
                          ? 'border-teal-500 bg-teal-50/35 ring-2 ring-teal-400/20'
                          : isPrimary
                            ? 'border-emerald-200 bg-emerald-50/15 hover:border-emerald-300'
                            : 'border-slate-200/90 bg-white hover:border-slate-300'
                          }`}
                      >
                        {/* Badge góc phải: Đang xem HOẶC Chính chủ */}
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                          {isCurrentActive && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white shadow-2xs">
                              Đang xem
                            </span>
                          )}
                          {isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              <Crown size={10} className="text-amber-600" />
                              Chính chủ
                            </span>
                          )}
                        </div>

                        <div>
                          {/* Phần đầu Card: Avatar + Tên + Quan hệ */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-2xs shrink-0 ${isPrimary
                                ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 ring-2 ring-teal-100'
                                : isBoy
                                  ? 'bg-gradient-to-tr from-teal-500 to-cyan-500'
                                  : 'bg-gradient-to-tr from-rose-400 to-pink-500'
                                }`}
                            >
                              {item.fullName?.charAt(0) || 'P'}
                            </div>
                            <div className="min-w-0 pr-16">
                              <h4 className="font-black text-slate-900 text-sm truncate">
                                {item.fullName}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-0.5">
                                <span className={`px-2 py-0.2 rounded-md font-bold text-[10px] ${isPrimary
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isBoy
                                    ? 'bg-cyan-100 text-cyan-800'
                                    : 'bg-rose-100 text-rose-800'
                                  }`}>
                                  {isPrimary
                                    ? 'Bản thân'
                                    : (RELATIONSHIP_LABELS[item.relationshipType] || item.relationshipLabel || 'Người thân')}
                                </span>
                                <span>•</span>
                                <span>{calculateAge(item.dateOfBirth)} tuổi</span>
                              </div>
                            </div>
                          </div>

                          {/* Phần thông tin chi tiết */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                            {/* Mã bệnh nhân */}
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="text-slate-400">Mã bệnh nhân:</span>
                              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                                <span>{item.patientCode || item.patientId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.patientCode || item.patientId, 'Mã bệnh nhân')}
                                  className="text-slate-400 hover:text-teal-600 cursor-pointer transition-colors"
                                  title="Sao chép"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            </div>

                            {/* Ngày sinh */}
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="text-slate-400">Ngày sinh:</span>
                              <span className="font-semibold text-slate-800">
                                {formatDateDisplay(item.dateOfBirth)}
                              </span>
                            </div>

                            {/* Số điện thoại / SĐT bảo trợ */}
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="text-slate-400">{isPrimary ? 'Số điện thoại:' : 'SĐT bảo trợ:'}</span>
                              <span className="font-mono font-semibold text-slate-800">
                                {isPrimary
                                  ? (item.phoneMasked || item.phone || 'Chưa cập nhật')
                                  : (item.sponsorPhoneMasked || item.phoneMasked || item.phone || 'Chưa cập nhật')}
                              </span>
                            </div>

                            {/* Số CCCD (cho chính chủ) hoặc Ngày liên kết (cho người thân) */}
                            {isPrimary ? (
                              <div className="flex items-center justify-between text-slate-600">
                                <span className="text-slate-400">Số CCCD / CMND:</span>
                                <span className="font-mono font-semibold text-slate-800">
                                  {item.cccdMasked || item.cccd || 'Chưa cập nhật'}
                                </span>
                              </div>
                            ) : (
                              <>
                                {(item.cccdMasked || item.cccd) && (
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-slate-400">Số CCCD / CMND:</span>
                                    <span className="font-mono font-semibold text-slate-800">
                                      {item.cccdMasked || item.cccd}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="text-slate-400">Ngày liên kết:</span>
                                  <span className="font-semibold text-slate-600">
                                    {formatDateDisplay(item.linkedAt || item.linkedDate)}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Phần nút hành động */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProfile(item);
                              onClose();
                              toast.success(`Đang mở hồ sơ bệnh án của ${isPrimary ? 'bạn' : item.fullName}`);
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${isCurrentActive
                              ? 'bg-slate-100 text-slate-600 cursor-default'
                              : 'bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white shadow-2xs'
                              }`}
                          >
                            <ExternalLink size={13} />
                            <span>{isCurrentActive ? 'Đang mở hồ sơ này' : 'Xem bệnh án'}</span>
                          </button>

                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => setConfirmUnlinkTarget(item)}
                              className="w-8.5 h-8.5 rounded-xl border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                              title="Hủy liên kết hồ sơ"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {isPrimary && (
                            <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200/80 inline-flex items-center gap-1 shrink-0">
                              <ShieldCheck size={13} className="text-teal-600" />
                              Chủ hồ sơ
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Footer Modal: Luôn ghim dưới đáy, có nút Đóng / Quay lại to rõ ràng */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Hệ thống phòng khám nha khoa Crown Dental
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors duration-200 cursor-pointer shadow-2xs inline-flex items-center justify-center gap-2 active:scale-95"
              >
                <ArrowLeft size={14} />
                <span>Đóng & Quay lại</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Dialog hủy liên kết */}
      <AnimatePresence>
        {confirmUnlinkTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!unlinkingRef.current) setConfirmUnlinkTarget(null); }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle size={26} />
              </div>
              <div className="text-center">
                <h4 className="text-base font-black text-slate-900">Xác nhận hủy liên kết?</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn hủy liên kết hồ sơ của{' '}
                  <strong className="text-slate-800">{confirmUnlinkTarget.fullName}</strong> ({confirmUnlinkTarget.patientCode || confirmUnlinkTarget.patientId})?
                  Sau khi hủy, hồ sơ này sẽ được gỡ khỏi danh sách quản lý của bạn.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { if (!unlinkingRef.current) setConfirmUnlinkTarget(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={unlinking}
                  onClick={() => handleConfirmUnlink(confirmUnlinkTarget)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  {unlinking ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

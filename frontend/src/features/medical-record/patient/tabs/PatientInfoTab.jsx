import React from 'react';
import {
  Phone,
  ShieldCheck,
  Calendar,
  Mail,
  MapPin,
  HeartPulse,
  Activity,
  AlertTriangle,
  Pill,
  Scissors,
  Stethoscope,
  Copy,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateAge, formatDateDisplay } from '../../admin/components/medicalRecordDictionaries';

export default function PatientInfoTab({ selectedRecord }) {
  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  return (
    <div className="min-w-0 bg-white">

      {/* ================= PHẦN ĐẦU: TỔNG QUAN HỒ SƠ BỆNH NHÂN ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 sm:gap-4">
          {selectedRecord?.avatar ? (
            <img
              src={selectedRecord.avatar}
              alt={selectedRecord?.patientName}
              className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-teal-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-800 to-emerald-700 text-white font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-teal-100 shadow-sm shrink-0">
              {selectedRecord?.patientName?.charAt(0) || 'P'}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight truncate">
                {selectedRecord?.patientName || 'Bệnh nhân'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                {selectedRecord?.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span>{selectedRecord?.gender === 'FEMALE' ? '♀ Nữ' : selectedRecord?.gender === 'MALE' ? '♂ Nam' : 'Khác'}</span>
              <span>•</span>
              <span>{calculateAge(selectedRecord?.dateOfBirth)} tuổi</span>
              <span>•</span>
              <span>Ngày sinh: {formatDateDisplay(selectedRecord?.dateOfBirth)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 font-mono font-bold shadow-2xs text-[11px] sm:text-xs">
            <span>Mã BN: {selectedRecord?.patientCode || 'PA-Chưa cấp'}</span>
            {selectedRecord?.patientCode && (
              <button
                type="button"
                onClick={() => handleCopyText(selectedRecord.patientCode, 'Mã bệnh nhân')}
                className="text-slate-400 hover:text-teal-900 cursor-pointer transition-colors"
                title="Sao chép"
              >
                <Copy size={12} />
              </button>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-800 text-white font-mono font-bold shadow-2xs text-[11px] sm:text-xs">
            <span>Hồ sơ: {selectedRecord?.recordCode}</span>
          </div>
        </div>
      </div>

      {/* ================= PHẦN THÂN: 2 CỘT NẰM CHUNG TRONG 1 KHỐI ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-4">

        {/* CỘT TRÁI: THÔNG TIN LIÊN LẠC & ĐỊA CHỈ CƯ TRÚ */}
        <div className="space-y-4 sm:space-y-5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            Thông tin liên lạc & Địa chỉ cư trú
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 sm:gap-y-4 text-xs">
            {/* Số điện thoại */}
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Số điện thoại:</span>
              <div className="flex items-center gap-2 font-mono font-bold text-sm text-slate-900">
                <Phone size={14} className="text-teal-600 shrink-0" />
                <span>{selectedRecord?.phone || 'Chưa cập nhật'}</span>
                {selectedRecord?.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedRecord.phone, 'Số điện thoại')}
                    className="text-slate-400 hover:text-teal-700 cursor-pointer"
                    title="Sao chép"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Số CCCD / CMND */}
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Số CCCD / CMND:</span>
              <div className="flex items-center gap-2 font-mono font-bold text-sm text-slate-900">
                <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                <span>{selectedRecord?.cccd || 'Chưa cập nhật'}</span>
                {selectedRecord?.cccd && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedRecord.cccd, 'Số CCCD')}
                    className="text-slate-400 hover:text-teal-700 cursor-pointer"
                    title="Sao chép"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Địa chỉ Email */}
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block mb-1">Địa chỉ Email:</span>
              <div className="flex items-center gap-2 text-slate-900 font-medium text-sm truncate">
                <Mail size={14} className="text-teal-600 shrink-0" />
                <span className="truncate">{selectedRecord?.email || 'Chưa cập nhật'}</span>
              </div>
            </div>

            {/* Địa chỉ thường trú */}
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-semibold block mb-1">Địa chỉ thường trú / Hiện tại:</span>
              <div className="flex items-start gap-2 text-sm text-slate-900 font-medium leading-relaxed">
                <MapPin size={15} className="text-teal-600 shrink-0 mt-0.5" />
                <span>{selectedRecord?.address || 'Chưa cập nhật địa chỉ'}</span>
              </div>
            </div>

            {/* Thông tin người liên hệ khẩn cấp */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Người liên hệ khẩn cấp:</span>
              <div className="flex items-center gap-3 text-sm text-slate-900 font-medium flex-wrap">
                <span className="font-bold">{selectedRecord?.contactName || 'Chưa cập nhật'}</span>
                {selectedRecord?.contactRelationship && (
                  <span className="text-slate-600">({selectedRecord.contactRelationship})</span>
                )}
                {selectedRecord?.contactPhone && (
                  <span className="font-mono font-bold text-teal-800">SĐT: {selectedRecord.contactPhone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Khung Bác sĩ & Ngày mở hồ sơ */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Bác sĩ phụ trách:</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-teal-800">
                <Stethoscope size={14} className="text-teal-600 shrink-0" />
                <span>{selectedRecord?.dentistName || 'BS. Nha khoa'}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Ngày mở hồ sơ:</span>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                <Calendar size={14} className="text-teal-600 shrink-0" />
                <span>{formatDateDisplay(selectedRecord?.createdAt || selectedRecord?.recordDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TIỀN SỬ Y TẾ & CẢNH BÁO SỨC KHỎE (TRÌNH BÀY DẠNG VĂN BẢN, KHÔNG DÙNG TEXTBOX) */}
        <div className="space-y-4 sm:space-y-5 border-t border-slate-100 pt-5 lg:border-t-0 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-8">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            Tiền sử y tế & Cảnh báo sức khỏe
          </h4>

          <div className="space-y-4 text-xs">
            {/* Bệnh lý nền toàn thân */}
            <div>
              <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                <Activity size={13} className="text-rose-600" />
                Bệnh lý nền toàn thân:
              </span>
              {Array.isArray(selectedRecord?.systemicDiseases) && selectedRecord.systemicDiseases.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedRecord.systemicDiseases.map((dis, i) => (
                    <span
                      key={i}
                      className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold"
                    >
                      {dis}
                    </span>
                  ))}
                </div>
              ) : selectedRecord?.systemicDisease ? (
                <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                  <HeartPulse size={14} className="text-rose-500 shrink-0" />
                  <span>{selectedRecord.systemicDisease}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                  <HeartPulse size={14} className="text-slate-400 shrink-0" />
                  <span>Không có bệnh lý nền</span>
                </div>
              )}
            </div>

            {/* Dị ứng thuốc / thức ăn */}
            <div>
              <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-500" />
                Tiền sử dị ứng:
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span>{selectedRecord?.allergies || 'Không'}</span>
              </div>
            </div>

            {/* Thuốc đang sử dụng */}
            <div>
              <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                <Pill size={13} className="text-purple-600" />
                Thuốc đang sử dụng:
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span>{selectedRecord?.currentMedications || 'Không'}</span>
              </div>
            </div>

            {/* Tiền sử phẫu thuật */}
            <div>
              <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                <Scissors size={13} className="text-indigo-600" />
                Tiền sử phẫu thuật:
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span>{selectedRecord?.surgicalHistory || 'Không'}</span>
              </div>
            </div>

            {/* Ghi chú điều trị (nếu có) */}
            {selectedRecord?.treatmentNotes && (
              <div>
                <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-teal-600" />
                  Ghi chú điều trị:
                </span>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span>{selectedRecord.treatmentNotes}</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

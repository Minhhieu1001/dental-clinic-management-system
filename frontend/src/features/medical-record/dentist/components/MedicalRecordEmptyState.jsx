import React from 'react';
import {
  AlertCircle,
  FileQuestion,
  Search,
  Sparkles,
  UserPlus,
  ArrowRight,
  FolderHeart,
  FileText,
} from 'lucide-react';

export const MedicalRecordEmptyState = ({
  onFocusSearch,
  onNavigatePatients,
  onLoadSample,
}) => {
  const handleSearchClick = () => {
    if (onFocusSearch) {
      onFocusSearch();
    } else {
      const input = document.getElementById('header-phone-search-input');
      if (input) input.focus();
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-teal-300/80 bg-gradient-to-b from-teal-50/80 via-emerald-50/20 to-white p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-md relative overflow-hidden my-1">
      {/* Hiệu ứng nền mềm */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Biểu tượng chính với hiệu ứng vòng sáng nổi bật */}
      <div className="relative mx-auto flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-3xl bg-teal-400/20 animate-ping" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white shadow-xl shadow-teal-600/30 ring-8 ring-teal-100">
          <FolderHeart size={36} strokeWidth={2.2} />
        </div>
      </div>

      {/* Tiêu đề & Thông điệp */}
      <div className="space-y-2.5 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1 text-xs font-black text-teal-900 border border-teal-300 shadow-2xs tracking-wide uppercase">
          <AlertCircle size={15} className="text-teal-700" />
          <span>Chưa chọn hồ sơ bệnh nhân</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Vui lòng chọn hồ sơ bệnh nhân để tiếp tục
        </h3>

      </div>



      {/* Thẻ hướng dẫn tra cứu nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-xl text-left pt-2">
        <div
          onClick={handleSearchClick}
          className="p-4 rounded-xl border-2 border-teal-200/80 bg-white hover:bg-teal-50/50 hover:border-teal-400 transition-all cursor-pointer group shadow-2xs"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleSearchClick();
          }}
        >
          <div className="flex items-center gap-2 text-teal-900 font-extrabold text-xs mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-700 group-hover:scale-110 transition-transform">
              <Search size={13} />
            </span>
            <span>Tra cứu theo SĐT</span>
          </div>
          <p className="text-[12px] text-slate-600 font-medium leading-snug">
            Nhập số điện thoại vào thanh Header phía trên để tự động mở hồ sơ tương ứng.
          </p>
        </div>

        {onNavigatePatients && (
          <div
            onClick={onNavigatePatients}
            className="p-4 rounded-xl border-2 border-teal-200/80 bg-white hover:bg-teal-50/50 hover:border-teal-400 transition-all cursor-pointer group shadow-2xs"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigatePatients();
            }}
          >
            <div className="flex items-center gap-2 text-teal-900 font-extrabold text-xs mb-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-700 group-hover:scale-110 transition-transform">
                <UserPlus size={13} />
              </span>
              <span>Danh sách bệnh nhân</span>
            </div>
            <p className="text-[12px] text-slate-600 font-medium leading-snug">
              Truy cập danh sách bệnh nhân để tra cứu hoặc thêm bệnh nhân mới vào hệ thống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordEmptyState;

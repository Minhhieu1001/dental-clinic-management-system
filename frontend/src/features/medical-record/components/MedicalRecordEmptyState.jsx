import React from 'react';
import { AlertCircle, FileQuestion, Search, Sparkles, UserPlus } from 'lucide-react';

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
    <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5">
      {/* Glowing Aura + Icon */}
      <div className="relative">
        <div className="absolute -inset-2 rounded-full bg-teal-100/60 blur-md animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-50 via-white to-emerald-50 border border-teal-200/80 shadow-md">
          <FileQuestion size={44} className="text-teal-700" />
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5 max-w-md">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle size={13} />
          Chưa có thông tin hồ sơ bệnh án
        </span>
        <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight pt-1">
          Chưa Chọn Hồ Sơ Bệnh Nhân
        </h3>

      </div>

      {/* Quick Action Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg text-left pt-1">
        <div
          onClick={handleSearchClick}
          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/40 hover:border-teal-300 transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleSearchClick();
          }}
        >
          <div className="flex items-center gap-2 text-teal-800 font-bold text-xs mb-1">
            <Search size={14} className="group-hover:scale-110 transition-transform text-teal-700" />
            <span>Tra cứu theo SĐT</span>
          </div>
          <p className="text-[11.5px] text-slate-500 leading-snug">
            Nhập số điện thoại vào thanh Header phía trên để tự động mở hồ sơ tương ứng.
          </p>
        </div>

        {onNavigatePatients && (
          <div
            onClick={onNavigatePatients}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/40 hover:border-teal-300 transition-all cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigatePatients();
            }}
          >
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs mb-1">
              <UserPlus size={14} className="group-hover:scale-110 transition-transform text-teal-700" />
              <span>Danh sách bệnh nhân</span>
            </div>
            <p className="text-[11.5px] text-slate-500 leading-snug">
              Truy cập danh sách bệnh nhân để chọn hoặc thêm bệnh nhân mới vào hệ thống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordEmptyState;

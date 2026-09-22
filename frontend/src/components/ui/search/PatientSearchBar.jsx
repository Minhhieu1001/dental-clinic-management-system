import React from 'react';
import { Phone, Search, RefreshCw, X, RotateCcw } from 'lucide-react';

/**
 * PatientSearchBar - Component tìm kiếm và chọn nhanh bệnh nhân dùng chung
 * Tái sử dụng ở Khám bệnh (Clinical Examination), Kế hoạch điều trị (Treatment Plans), Hồ sơ bệnh án (Medical Records)...
 */
export default function PatientSearchBar({
  patientOptions = [],
  loadingPatientOptions = false,
  selectedPatient = null,
  selectedPatientId = null,
  onSelectPatient,
  onClearPatient,
  phoneSearchQuery = '',
  setPhoneSearchQuery,
  onSearchPhone,
  searchingPhone = false,
  hasPatient = false,
  className = '',
  selectLabel = 'Chọn nhanh bệnh nhân:',
  inputLabel = 'Hoặc nhập SĐT cần tìm:',
  selectPlaceholder = '-- Chọn bệnh nhân từ danh sách (SĐT — Họ tên) --',
  inputPlaceholder = 'Nhập SĐT...',
  showBorder = true,
  hideLabels = false,
}) {
  const currentVal =
    selectedPatientId ||
    selectedPatient?.id ||
    selectedPatient?.patientCode ||
    '';

  const isPatientActive = Boolean(hasPatient || selectedPatient || selectedPatientId);

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    if (!val) {
      if (onClearPatient) onClearPatient();
      return;
    }

    const found = patientOptions.find(
      (p) =>
        String(p.id) === String(val) ||
        String(p.patientCode) === String(val)
    );

    if (found && onSelectPatient) {
      onSelectPatient(found);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSearchPhone) {
      onSearchPhone(e);
    }
  };

  const basePaddingClass = className.includes('p-0') ? '' : 'px-4 py-2.5';
  const baseBgClass = className.includes('bg-') ? '' : 'bg-slate-50/90';
  const borderClass = showBorder && isPatientActive ? 'border-b border-slate-200/80' : '';

  return (
    <div className={`${basePaddingClass} ${baseBgClass} ${borderClass} ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        {/* Dropdown chọn nhanh bệnh nhân */}
        <div className="w-full sm:w-[320px] md:w-[380px] shrink-0">
          {!hideLabels && selectLabel && (
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Phone size={12} className="text-teal-700" />
              <span>{selectLabel}</span>
              {loadingPatientOptions && (
                <RefreshCw size={11} className="animate-spin text-teal-700 ml-1" />
              )}
            </label>
          )}
          <select
            value={currentVal}
            disabled={loadingPatientOptions}
            onChange={handleDropdownChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs truncate transition-all disabled:opacity-60"
          >
            <option value="">
              {loadingPatientOptions
                ? '-- Đang tải danh sách bệnh nhân... --'
                : selectPlaceholder}
            </option>
            {patientOptions.map((p) => {
              const phoneStr =
                p.phone || p.phoneNumber || p.user?.phone || 'Chưa có SĐT';
              const codeStr = p.patientCode ? ` (${p.patientCode})` : '';
              const nameStr =
                p.fullName || p.patientName || p.user?.fullName || 'Bệnh nhân';
              const keyVal = p.id || p.patientCode;

              return (
                <option key={keyVal} value={keyVal}>
                  {phoneStr} — {nameStr}
                  {codeStr}
                </option>
              );
            })}
          </select>
        </div>

        {/* Ô nhập SĐT tìm kiếm trực tiếp */}
        <form onSubmit={handleFormSubmit} className="flex items-end gap-2 shrink-0">
          <div>
            {!hideLabels && inputLabel && (
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {inputLabel}
              </label>
            )}
            <div className="relative">
              <input
                type="text"
                value={phoneSearchQuery}
                onChange={(e) => setPhoneSearchQuery && setPhoneSearchQuery(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-40 sm:w-48 rounded-lg border border-slate-300 bg-white pl-8 pr-7 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
              <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-700" />
              {phoneSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPhoneSearchQuery && setPhoneSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={searchingPhone}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap h-[32px]"
          >
            {searchingPhone ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Search size={13} />
            )}
            <span>{searchingPhone ? 'Đang tìm...' : 'Tìm kiếm'}</span>
          </button>

          {isPatientActive && onClearPatient && (
            <button
              type="button"
              onClick={onClearPatient}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer h-[32px]"
              title="Đóng hồ sơ bệnh nhân hiện tại để tìm bệnh nhân khác"
            >
              <RotateCcw size={12} />
              <span>Đổi BN</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

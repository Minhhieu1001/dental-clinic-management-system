import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

/**
 * Loading Component - Dùng chung toàn hệ thống
 * @param {string} title - Tiêu đề trạng thái loading (VD: 'Đang tải danh sách hóa đơn...')
 * @param {string} subtitle - Mô tả phụ bên dưới (VD: 'Vui lòng đợi trong giây lát')
 * @param {'sm' | 'md' | 'lg'} size - Kích thước của spinner
 * @param {boolean} overlay - Nếu true, phủ lớp mờ (overlay) lên component cha
 * @param {boolean} fullscreen - Nếu true, phủ kín toàn màn hình
 * @param {string} className - Class CSS tùy biến thêm
 */
export default function Loading({
  title = 'Đang tải dữ liệu...',
  subtitle = '',
  size = 'md',
  overlay = false,
  fullscreen = false,
  className = '',
}) {
  const sizeMap = {
    sm: {
      spinner: 'w-6 h-6 border-2',
      title: 'text-xs',
      subtitle: 'text-[10px]',
      gap: 'gap-1.5',
      py: 'py-4',
    },
    md: {
      spinner: 'w-10 h-10 border-3',
      title: 'text-sm',
      subtitle: 'text-xs',
      gap: 'gap-2.5',
      py: 'py-8',
    },
    lg: {
      spinner: 'w-14 h-14 border-4',
      title: 'text-base',
      subtitle: 'text-xs sm:text-sm',
      gap: 'gap-3.5',
      py: 'py-12',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center text-center ${currentSize.gap} ${currentSize.py} ${className}`}>
      {/* Animated Spinner with Dual Ring & Pulse */}
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-teal-500/20 blur-md animate-pulse"></div>

        {/* Outer rotating ring */}
        <div
          className={`${currentSize.spinner} rounded-full border-teal-100 border-t-teal-600 border-r-teal-600 animate-spin`}
        ></div>

        {/* Inner subtle pulse icon */}
        <div className="absolute w-2 h-2 rounded-full bg-teal-600 animate-ping"></div>
      </div>

      {/* Title & Subtitle */}
      {title && (
        <div className="space-y-0.5 max-w-sm px-4">
          <p className={`font-bold text-slate-700 ${currentSize.title} tracking-tight`}>
            {title}
          </p>
          {subtitle && (
            <p className={`font-medium text-slate-400 ${currentSize.subtitle}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-2xs rounded-inherit transition-all">
        {content}
      </div>
    );
  }

  return content;
}

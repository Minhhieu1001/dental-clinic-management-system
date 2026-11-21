import React from 'react';
import { X, Smile, Sparkles } from 'lucide-react';

export const DENTAL_STICKERS = [
  'https://cdn-icons-png.flaticon.com/256/6467/6467786.png',
  'https://cdn-icons-png.flaticon.com/256/4193/4193312.png',
  'https://cdn-icons-png.flaticon.com/256/7871/7871445.png',
  'https://cdn-icons-png.flaticon.com/256/6578/6578835.png',
  'https://cdn-icons-png.flaticon.com/256/5784/5784082.png',
  'https://cdn-icons-png.flaticon.com/256/6983/6983861.png',
  'https://cdn-icons-png.flaticon.com/256/10776/10776375.png',
  'https://cdn-icons-png.flaticon.com/256/6578/6578650.png',
];

/**
 * Modal hiển thị danh sách Sticker nha khoa
 * @param {boolean} isOpen - Trạng thái hiển thị modal
 * @param {function} onClose - Hàm đóng modal
 * @param {function} onSelectSticker - Hàm callback khi chọn 1 sticker (nhận URL sticker)
 */
export default function ChatStickerModal({ isOpen, onClose, onSelectSticker }) {
  if (!isOpen) return null;

  const handleSelect = (url) => {
    if (onSelectSticker) {
      onSelectSticker(url);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Chọn sticker nha khoa"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-5 w-full max-w-sm sm:max-w-md shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Smile size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Sticker Nha Khoa
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Chọn sticker vui nhộn để gửi trong đoạn chat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Đóng bảng sticker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Danh sách Sticker Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto p-1 no-scrollbar">
          {DENTAL_STICKERS.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(url)}
              title={`Gửi sticker #${idx + 1}`}
              className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-teal-50/80 border border-slate-100 hover:border-teal-300 transition-all duration-150 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95"
            >
              <img
                src={url}
                alt={`Sticker nha khoa ${idx + 1}`}
                loading="lazy"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain transition-transform duration-200 group-hover:rotate-3"
              />
              <span className="absolute bottom-1 text-[9px] font-bold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">
                Gửi ngay
              </span>
            </button>
          ))}
        </div>

        {/* Footer ghi chú */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" /> Nhấp vào sticker để gửi ngay
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

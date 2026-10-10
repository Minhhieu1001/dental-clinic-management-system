import React from 'react';
import { Image } from 'lucide-react';

export default function DentalImagesTab() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Image size={16} className="text-teal-700" />
                    Danh mục hình ảnh chẩn đoán, Phim X-Quang & Ảnh lâm sàng
                </h4>
                <span className="text-xs font-semibold text-slate-400">Đang cập nhật module AI X-Quang</span>
            </div>

            <div className="p-10 text-center bg-white rounded-sm border border-dashed border-slate-300 space-y-3">
                <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-700 shadow-inner">
                    <Image size={32} />
                </div>
                <h5 className="font-bold text-sm text-slate-800">Chưa có hình ảnh hoặc phim chụp lưu trữ</h5>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tính năng phân tích hình ảnh AI X-Quang và thư viện phim Panorama/Cephalo của bệnh nhân đang trong lộ trình hoàn thiện.
                </p>
            </div>
        </div>
    );
}

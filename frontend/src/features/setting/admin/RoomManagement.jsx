import React, { useState } from 'react';
import {
  DoorOpen,
  Plus,
  Building2,
  Search,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function RoomManagement() {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <DoorOpen size={24} className="text-teal-700" />
            <span>Quản Lý Phòng Khám</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Quản lý danh sách phòng khám, ghế nha khoa và phân bổ theo từng chi nhánh.
          </p>
        </div>

        {/* Nút hành động thêm mới (Placeholder) */}
        <button
          type="button"
          onClick={() => alert('Chức năng thêm phòng khám sẽ được xây dựng tại đây.')}
          className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-teal-800 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm phòng mới</span>
        </button>
      </div>

      {/* Toolbar lọc tìm kiếm (Khung sườn mẫu) */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm phòng khám theo tên, số phòng..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded border border-slate-300 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-sm border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-teal-600 cursor-pointer"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            <option value="CN1">Chi nhánh Gò Vấp</option>
            <option value="CN2">Chi nhánh Bình Thạnh</option>
            <option value="CN3">Chi nhánh Quận 1</option>
          </select>
        </div>
      </div>

      {/* Vùng nội dung trống để bạn tiếp tục build UI */}
      <div className="min-h-[420px] rounded border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-4 shadow-xs">
          <DoorOpen size={32} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Khu vực Quản lý Phòng khám (UI sẵn sàng để build)
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-5 leading-relaxed">
          Trang đã được liên kết thành công vào menu hệ thống. Bạn có thể xây dựng bảng danh sách phòng khám, trạng thái ghế điều trị (Trống / Đang khám / Vệ sinh), và trang thiết bị theo nhu cầu.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
          <Sparkles size={14} className="text-amber-500" />
          <span>File component: <code>frontend/src/features/setting/admin/RoomManagement.jsx</code></span>
        </div>
      </div>
    </div>
  );
}

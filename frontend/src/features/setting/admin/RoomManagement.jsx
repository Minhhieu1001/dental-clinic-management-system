import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DoorOpen,
  Plus,
  Building2,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Check,
  RefreshCw,
  Layers,
  Sparkles,
  AlertTriangle,
  Stethoscope,
  Activity,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getBranches } from '../../../services/clinic.service';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../../services/appointment.service';

export default function RoomManagement() {
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formBranchId, setFormBranchId] = useState('');
  const [formRoomName, setFormRoomName] = useState('');
  const [formFloorName, setFormFloorName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch branches and rooms
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [branchRes, roomRes] = await Promise.all([
        getBranches().catch(() => []),
        getRooms(selectedBranch === 'ALL' ? undefined : selectedBranch).catch(() => []),
      ]);

      const branchList = Array.isArray(branchRes) ? branchRes : [];
      setBranches(branchList);

      const rawRooms = Array.isArray(roomRes?.data) ? roomRes.data : Array.isArray(roomRes) ? roomRes : [];
      setRooms(rawRooms);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu phòng khám:', err);
      toast.error('Không thể tải danh sách phòng khám');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique floors for quick filter
  const uniqueFloors = useMemo(() => {
    const set = new Set();
    rooms.forEach((r) => {
      if (r.floorName && r.floorName.trim()) {
        set.add(r.floorName.trim());
      }
    });
    return Array.from(set).sort();
  }, [rooms]);

  // Open modal for Create or Edit
  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormRoomName(room.roomName || '');
      setFormFloorName(room.floorName || '');
      setFormBranchId(room.branchId || '');
    } else {
      setEditingRoom(null);
      setFormRoomName('');
      setFormFloorName('');
      setFormBranchId(selectedBranch !== 'ALL' ? selectedBranch : branches[0]?.branchId || '');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormRoomName('');
    setFormFloorName('');
    setFormBranchId('');
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const trimmedName = formRoomName.trim();
    if (!trimmedName) {
      toast.error('Vui lòng nhập tên phòng khám');
      return;
    }
    if (!formBranchId) {
      toast.error('Vui lòng chọn chi nhánh cho phòng khám');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        roomName: trimmedName,
        floorName: formFloorName.trim() || undefined,
        branchId: formBranchId,
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        toast.success(`Cập nhật phòng "${trimmedName}" thành công!`);
      } else {
        await createRoom(payload);
        toast.success(`Thêm mới phòng "${trimmedName}" thành công!`);
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Lỗi lưu phòng khám:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu phòng khám';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRoom(deleteTarget.id);
      toast.success(`Đã xóa phòng "${deleteTarget.roomName}"`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Lỗi xóa phòng khám:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể xóa phòng khám đang có dữ liệu';
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered rooms by search term, branch and floor
  const filteredRooms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rooms.filter((room) => {
      // Filter by branch
      if (selectedBranch !== 'ALL' && room.branchId !== selectedBranch) {
        return false;
      }
      // Filter by floor
      if (selectedFloor !== 'ALL' && (room.floorName || '').trim() !== selectedFloor) {
        return false;
      }
      // Filter by search term
      if (term) {
        const nameMatch = room.roomName?.toLowerCase().includes(term);
        const floorMatch = room.floorName?.toLowerCase().includes(term);
        const branchMatch = (room.branchName || branches.find((b) => b.branchId === room.branchId)?.branchName || '')
          .toLowerCase()
          .includes(term);
        if (!nameMatch && !floorMatch && !branchMatch) return false;
      }
      return true;
    });
  }, [rooms, selectedBranch, selectedFloor, searchTerm, branches]);

  // Statistics
  const stats = useMemo(() => {
    const total = rooms.length;
    const branchesWithRooms = new Set(rooms.map((r) => r.branchId).filter(Boolean)).size;
    const floorsCount = new Set(rooms.map((r) => r.floorName?.trim()).filter(Boolean)).size;
    return { total, branchesWithRooms, floorsCount };
  }, [rooms]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner & Quick Action */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-sm ring-4 ring-teal-700/10">
              <DoorOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Quản Lý Phòng Khám & Ghế Điều Trị
                </h2>
                <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-teal-800 border border-teal-200">
                  <ShieldCheck size={12} /> Crown Dental ERP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập hệ thống phòng khám, tầng điều trị và phân bổ ghế theo từng chi nhánh.
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            title="Tải lại danh sách"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-teal-700' : 'text-slate-500'} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-teal-800 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm phòng mới</span>
          </button>
        </div>
      </div>

      {/* 2. Stat KPI Cards - Minimalist Dental Clean Aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tổng số phòng khám */}
        <div className="relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Tổng số phòng khám
              </p>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</span>
                <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  Phòng điều trị
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal pt-0.5 flex items-center gap-1.5">
                <Stethoscope size={13} className="text-teal-600/70 shrink-0" />
                Ghế điều trị trên toàn hệ thống
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100/60">
              <DoorOpen size={20} className="stroke-[1.8]" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Trạng thái</span>
            <span className="text-teal-700 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600"></span>
              Sẵn sàng hoạt động
            </span>
          </div>
        </div>

        {/* Card 2: Chi nhánh phân bổ */}
        <div className="relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Chi nhánh phân bổ
              </p>
              <div className="flex items-baseline gap-1.5 pt-0.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.branchesWithRooms}</span>
                <span className="text-xs font-normal text-slate-400">/ {branches.length} cơ sở</span>
                <span className="ml-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                  {branches.length > 0 ? Math.round((stats.branchesWithRooms / branches.length) * 100) : 0}% phủ sóng
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal pt-0.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                Chi nhánh đã thiết lập phòng
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-200/70">
              <Building2 size={20} className="stroke-[1.8]" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Hệ thống mạng lưới</span>
            <span className="text-slate-700 font-medium">{branches.length} Chi nhánh trực thuộc</span>
          </div>
        </div>

        {/* Card 3: Phân bố số tầng */}
        <div className="relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Phân bố số tầng
              </p>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.floorsCount || 1}</span>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                  Phân tầng điều trị
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal pt-0.5 flex items-center gap-1.5">
                <Layers size={13} className="text-slate-400 shrink-0" />
                Khu vực / tầng chuyên môn
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-200/70">
              <Layers size={20} className="stroke-[1.8]" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Khu vực phân bố</span>
            <span className="text-slate-700 font-medium">{uniqueFloors.length > 0 ? uniqueFloors.join(', ') : 'Tầng 1'}</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Tìm kiếm & Bộ lọc Dropdown Chi Nhánh */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên phòng, số tầng, chi nhánh..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter theo Chi Nhánh */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs">
            <Building2 size={14} className="text-teal-700 shrink-0" />
            <span className="text-slate-500 font-medium hidden sm:inline">Chi nhánh:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Tất cả chi nhánh ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.branchId} value={b.branchId}>
                  {b.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter theo Tầng nếu có */}
          {uniqueFloors.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs">
              <Layers size={14} className="text-slate-500 shrink-0" />
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">Tất cả tầng</option>
                {uniqueFloors.map((fl) => (
                  <option key={fl} value={fl}>
                    {fl}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset button khi có lọc */}
          {(selectedBranch !== 'ALL' || selectedFloor !== 'ALL' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedBranch('ALL');
                setSelectedFloor('ALL');
                setSearchTerm('');
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={12} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Table Danh sách phòng khám hiện đại */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
            <RefreshCw size={26} className="animate-spin text-teal-700" />
            <span className="text-xs font-bold text-slate-600">Đang đồng bộ danh sách phòng khám...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-3 shadow-2xs">
              <DoorOpen size={30} />
            </div>
            <h4 className="text-base font-extrabold text-slate-800">Chưa có phòng khám phù hợp</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              {selectedBranch !== 'ALL'
                ? 'Chi nhánh này chưa có phòng khám nào được cấu hình. Bấm nút dưới để thêm phòng điều trị cho chi nhánh này.'
                : 'Không tìm thấy phòng khám nào theo điều kiện tìm kiếm hiện tại.'}
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition-all cursor-pointer"
            >
              <Plus size={14} /> Thêm phòng khám ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Tên phòng khám / Ghế điều trị</th>
                  <th className="py-3.5 px-4 w-36">Vị trí / Tầng</th>
                  <th className="py-3.5 px-4">Chi nhánh trực thuộc</th>
                  <th className="py-3.5 px-4 w-32 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room, idx) => {
                  const bName =
                    room.branchName ||
                    branches.find((b) => b.branchId === room.branchId)?.branchName ||
                    'Chưa gán chi nhánh';

                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-teal-50/30 transition-colors group"
                    >
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Room Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/70 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <DoorOpen size={16} />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-[13px] block">
                              {room.roomName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {String(room.id).split('-')[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Floor */}
                      <td className="py-3.5 px-4">
                        {room.floorName ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            <Layers size={11} className="text-slate-500" />
                            {room.floorName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa xác định</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 size={13} className="text-teal-700 shrink-0" />
                          <span className="truncate max-w-xs">{bName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Sẵn sàng
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(room)}
                            className="p-1.5 rounded-md hover:bg-teal-50 text-slate-500 hover:text-teal-800 border border-transparent hover:border-teal-200 transition-colors cursor-pointer"
                            title="Chỉnh sửa phòng"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(room)}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Xóa phòng"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 text-[11px] text-slate-500">
              <span className="font-medium">
                Đang hiển thị <strong className="text-slate-800 font-bold">{filteredRooms.length}</strong> trên tổng số <strong className="text-slate-800 font-bold">{rooms.length}</strong> phòng khám
              </span>

            </div>
          </div>
        )}
      </div>

      {/* 5. Modal Thêm / Chỉnh Sửa Phòng Khám (Chuẩn ERP Nha Khoa) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) handleCloseModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto animate-scaleUp">
            {/* Header đồng bộ gradient teal chuẩn ERP */}
            <div className="flex items-center justify-between border-b border-teal-100/80 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 shadow-xs shrink-0">
                  <DoorOpen size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight">
                    {editingRoom ? 'Chỉnh Sửa Phòng Khám' : 'Thêm Phòng Khám Mới'}
                  </h3>
                  <p className="text-[11px] text-teal-100/80">
                    Phân bổ ghế nha khoa & khu vực tiếp nhận theo từng chi nhánh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveRoom} className="p-6 space-y-4">
              {/* Chi nhánh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-teal-700" />
                    <span>Thuộc chi nhánh</span>
                    <span className="text-rose-500">*</span>
                  </span>
                </label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                >
                  <option value="">-- Chọn chi nhánh áp dụng --</option>
                  {branches.map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.branchName} ({b.branchCode || 'CN'})
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Bác sĩ khi tiếp nhận bệnh nhân tại chi nhánh nào sẽ chỉ hiển thị danh sách phòng thuộc chi nhánh đó.
                </p>
              </div>

              {/* Tên phòng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <DoorOpen size={13} className="text-teal-700" />
                    <span>Tên phòng khám / Ghế điều trị</span>
                    <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={formRoomName}
                  onChange={(e) => setFormRoomName(e.target.value)}
                  placeholder="Ví dụ: Phòng khám 01, Phòng Chỉnh nha 02, Ghế nha số 03..."
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Vị trí tầng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-teal-700" />
                    <span>Vị trí / Tầng / Phân khu</span>
                    <span className="text-slate-400 font-normal">(tùy chọn)</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={formFloorName}
                  onChange={(e) => setFormFloorName(e.target.value)}
                  placeholder="Ví dụ: Tầng 1, Tầng 2, Khu Điều trị Kỹ thuật cao..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Info Box */}
              <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-xs text-teal-900 flex items-start gap-2.5">
                <Sparkles size={16} className="text-teal-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Phòng khám sau khi tạo sẽ lập tức hiển thị trên màn hình <strong>Bác sĩ gọi vào</strong> và trong <strong>hệ thống điều phối tiếp nhận bệnh nhân</strong> của chi nhánh đã chọn.
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-all shadow-md shadow-teal-700/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-white" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{editingRoom ? 'Lưu thay đổi' : 'Tạo phòng ngay'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Xác Nhận Xóa Phòng Khám */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shrink-0">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Xác nhận xóa phòng khám?</h4>
                <p className="text-xs text-slate-500">Thao tác này sẽ xóa phòng khám khỏi hệ thống</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              Bạn có chắc chắn muốn xóa phòng{' '}
              <strong className="text-slate-900 font-extrabold">&ldquo;{deleteTarget.roomName}&rdquo;</strong>?
              Nếu phòng đã từng được gán lịch hẹn điều trị, hệ thống sẽ từ chối xóa để bảo vệ lịch sử bệnh án.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteRoom}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Users,
    User,
    Phone,
    Calendar,
    CreditCard,
    CheckCircle2,
    Link2,
    Plus,
    X,
    Trash2,
    Eye,
    Info,
    RefreshCw,
    AlertCircle,
    Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getRegisteredPatients } from '../../../services/patient.service';
import {
    getListPatientRelationshipByPatientId,
    deletePatientRelationship,
} from '../../../services/patientRelationship.service';
import ConfirmDelete from '../action/ConfirmDelete';
import EmployeeLinkProfileModal from '../action/EmployeeLinkProfileModal';

const RELATIONSHIP_LABELS = {
    CHILD: 'Con cái',
    SPOUSE: 'Vợ / Chồng',
    PARENT: 'Bố / Mẹ',
    GUARDIAN: 'Người giám hộ',
};

export default function EmployeeLinkedProfile({ readOnly = false }) {
    // Danh sách bệnh nhân có tài khoản đăng nhập (Chủ hộ) từ DB
    const [registeredPatients, setRegisteredPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);

    // Bệnh nhân chủ hộ đang được chọn bên trái
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Tìm kiếm chỉ theo số điện thoại ở bên hồ sơ chính chủ
    const [phoneSearchTerm, setPhoneSearchTerm] = useState('');

    // Danh sách các mối quan hệ lấy từ API getListPatientRelationshipByPatientId
    const [relationshipProfiles, setRelationshipProfiles] = useState([]);
    const [loadingRelationships, setLoadingRelationships] = useState(false);

    // Modal State liên kết hồ sơ mới
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // Modal State xác nhận xóa quan hệ
    const [deleteModalConfig, setDeleteModalConfig] = useState({
        open: false,
        relationshipId: null,
        targetName: '',
        targetCode: '',
        isDeleting: false,
    });

    // 1. Fetch danh sách bệnh nhân có tài khoản đăng nhập từ database
    const fetchRegisteredPatientsData = async () => {
        setLoadingPatients(true);
        try {
            const data = await getRegisteredPatients();
            const list = Array.isArray(data) ? data : data?.data || data?.result || [];
            setRegisteredPatients(list);
            if (list.length > 0) {
                // Nếu chưa chọn hoặc bệnh nhân đang chọn không còn trong list, chọn phần tử đầu tiên
                setSelectedPatient((prev) => {
                    if (!prev) return list[0];
                    const exists = list.find((p) => p.id === prev.id);
                    return exists || list[0];
                });
            } else {
                setSelectedPatient(null);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách bệnh nhân có tài khoản:', err);
            toast.error('Không thể tải danh sách hồ sơ có tài khoản đăng nhập.');
        } finally {
            setLoadingPatients(false);
        }
    };

    useEffect(() => {
        fetchRegisteredPatientsData();
    }, []);

    // 2. Fetch danh sách quan hệ khi chọn một bệnh nhân
    const fetchRelationships = async (patientId) => {
        if (!patientId) {
            setRelationshipProfiles([]);
            return;
        }
        setLoadingRelationships(true);
        try {
            const res = await getListPatientRelationshipByPatientId(patientId);
            const list = Array.isArray(res) ? res : res?.data || res?.result || [];
            setRelationshipProfiles(list);
        } catch (err) {
            console.error('Lỗi khi lấy danh sách mối quan hệ:', err);
            toast.error('Không thể tải danh sách hồ sơ liên kết.');
            setRelationshipProfiles([]);
        } finally {
            setLoadingRelationships(false);
        }
    };

    useEffect(() => {
        if (selectedPatient?.id) {
            fetchRelationships(selectedPatient.id);
        } else {
            setRelationshipProfiles([]);
        }
    }, [selectedPatient?.id]);

    // Lọc danh sách chủ hộ CHỈ theo số điện thoại
    const filteredPatients = useMemo(() => {
        if (!phoneSearchTerm.trim()) return registeredPatients;
        const cleanSearch = phoneSearchTerm.trim().replace(/[\s.-]/g, '');
        return registeredPatients.filter((p) => {
            const pPhone = (p.phone || p.phoneNumber || '').replace(/[\s.-]/g, '');
            return pPhone.includes(cleanSearch);
        });
    }, [registeredPatients, phoneSearchTerm]);

    // Tách Hồ sơ chính chủ và Các hồ sơ liên kết từ API response
    const primaryProfile = useMemo(() => {
        const primary = relationshipProfiles.find((p) => p.isPrimary);
        if (primary) return primary;
        if (selectedPatient) {
            return {
                patientId: selectedPatient.id,
                isPrimary: true,
                fullName: selectedPatient.fullName,
                patientCode: selectedPatient.patientCode,
                phoneMasked: selectedPatient.phone || selectedPatient.phoneNumber,
                cccdMasked: selectedPatient.cccd,
                dateOfBirth: selectedPatient.dateOfBirth ? selectedPatient.dateOfBirth.split('T')[0] : '',
            };
        }
        return null;
    }, [relationshipProfiles, selectedPatient]);

    const linkedProfiles = useMemo(() => {
        return relationshipProfiles.filter((p) => !p.isPrimary);
    }, [relationshipProfiles]);

    // Format ngày sinh DD/MM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Chưa cập nhật';
        const clean = String(dateStr).split('T')[0];
        const parts = clean.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    };

    // Tính tuổi
    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthYear = new Date(dob).getFullYear();
        if (isNaN(birthYear)) return '';
        const age = new Date().getFullYear() - birthYear;
        return `${age} tuổi`;
    };

    // Mở modal xác nhận xóa quan hệ
    const handleOpenDelete = (profile) => {
        if (!profile.relationshipId) {
            toast.error('Không tìm thấy mã liên kết để xóa.');
            return;
        }
        setDeleteModalConfig({
            open: true,
            relationshipId: profile.relationshipId,
            targetName: profile.fullName,
            targetCode: profile.patientCode,
            isDeleting: false,
        });
    };

    // Xác nhận xóa quan hệ
    const handleConfirmDelete = async () => {
        if (!deleteModalConfig.relationshipId) return;
        setDeleteModalConfig((prev) => ({ ...prev, isDeleting: true }));

        try {
            await deletePatientRelationship(deleteModalConfig.relationshipId);
            toast.success(`Đã hủy liên kết hồ sơ của ${deleteModalConfig.targetName} thành công!`);
            setDeleteModalConfig({
                open: false,
                relationshipId: null,
                targetName: '',
                targetCode: '',
                isDeleting: false,
            });
            // Tải lại danh sách quan hệ
            if (selectedPatient?.id) {
                await fetchRelationships(selectedPatient.id);
            }
        } catch (err) {
            console.error('Lỗi khi hủy liên kết:', err);
            const msg = err.response?.data?.message || 'Không thể hủy liên kết hồ sơ. Vui lòng thử lại.';
            toast.error(msg);
            setDeleteModalConfig((prev) => ({ ...prev, isDeleting: false }));
        }
    };

    return (
        <div className="space-y-3">
            {/* TOOLBAR HEADER TAB 2 (CHUẨN ERP: GÓC BO SM, VIỀN SẮC NÉT) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-sm border border-slate-200 bg-white shadow-2xs">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-teal-700" size={17} />
                        Quản Lý Hồ Sơ Đã Liên Kết
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                        Dữ liệu thật từ hệ thống: Danh sách bệnh nhân có tài khoản đăng nhập và các hồ sơ người thân được bảo trợ.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={fetchRegisteredPatientsData}
                        disabled={loadingPatients}
                        className="flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw
                            size={13}
                            className={loadingPatients ? 'animate-spin text-teal-600' : 'text-slate-500'}
                        />
                        <span>Làm mới</span>
                    </button>

                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => setIsLinkModalOpen(true)}
                            className="flex items-center justify-center gap-1.5 rounded-sm bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition-colors cursor-pointer"
                        >
                            <Link2 size={14} />
                            <span>Liên kết hồ sơ mới</span>
                        </button>
                    )}
                </div>
            </div>

            {/* LAYOUT 2 CỘT CHÍNH (CHUẨN ERP: CỘT TRÁI CHỌN CHỦ HỘ -> CỘT PHẢI XEM CHI TIẾT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">

                {/* ================= CỘT TRÁI (5 COLS): DANH SÁCH HỒ SƠ CÓ TÀI KHOẢN ĐĂNG NHẬP ================= */}
                <div className="lg:col-span-5 space-y-2.5 rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs">

                    {/* Header Cột Trái */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-sm bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center justify-center">
                                1
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                Hồ sơ có tài khoản đăng nhập
                            </h3>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                            <strong className="text-teal-700">{filteredPatients.length}</strong> hồ sơ
                        </span>
                    </div>

                    {/* THANH TÌM KIẾM CHỈ THEO SỐ ĐIỆN THOẠI (KHÔNG CẦN BỘ LỌC) */}
                    <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={phoneSearchTerm}
                            onChange={(e) => setPhoneSearchTerm(e.target.value)}
                            placeholder="Nhập số điện thoại để tìm chủ tài khoản..."
                            className="w-full rounded-sm border border-slate-300 bg-slate-50/50 pl-8.5 pr-8 py-2 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-teal-700 focus:bg-white focus:outline-none transition-colors"
                        />
                        {phoneSearchTerm && (
                            <button
                                type="button"
                                onClick={() => setPhoneSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Xóa tìm kiếm"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* DANH SÁCH CÁC HỒ SƠ CHÍNH CHỦ CÓ TÀI KHOẢN (CLICK CHỌN ITEM NÀO SHOW BÊN PHẢI ITEM ĐÓ, NỔI BẬT ITEM ĐANG CHỌN) */}
                    <div className="space-y-2 max-h-[580px] overflow-y-auto pr-0.5">
                        {loadingPatients ? (
                            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                                <RefreshCw size={18} className="animate-spin text-teal-600" />
                                <span>Đang tải danh sách hồ sơ có tài khoản...</span>
                            </div>
                        ) : filteredPatients.length > 0 ? (
                            filteredPatients.map((p) => {
                                const isSelected = p.id === selectedPatient?.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedPatient(p)}
                                        className={`relative p-3 rounded-sm border transition-all cursor-pointer ${isSelected
                                            ? 'border-teal-700 bg-teal-50/70 shadow-xs ring-1 ring-teal-700'
                                            : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50/60'
                                            }`}
                                    >
                                        {/* Indicator dải màu bên trái khi được chọn */}
                                        {isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-700 rounded-l-sm" />
                                        )}

                                        {/* Header Item */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`w-9 h-9 rounded-sm font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${isSelected
                                                        ? 'bg-teal-700 text-white'
                                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}
                                                >
                                                    {(p.fullName || 'BN')
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .slice(-2)
                                                        .join('')}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-slate-900">{p.fullName}</span>
                                                        <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                                            Chính chủ
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] font-bold text-teal-800">
                                                        {p.patientCode}
                                                    </div>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-teal-700 text-white shrink-0">
                                                    Đang xem
                                                </span>
                                            )}
                                        </div>

                                        {/* THUỘC TÍNH SĐT, CCCD, NGÀY SINH CỦA CHỦ HỘ */}
                                        <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                                            {/* SĐT */}
                                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                                                <Phone size={12} className="text-slate-400 shrink-0" />
                                                <span>{p.phone || p.phoneNumber || 'Chưa cập nhật'}</span>
                                            </div>

                                            {/* CCCD / CMND */}
                                            <div className="flex items-center gap-1.5 text-slate-700 truncate">
                                                <CreditCard size={12} className="text-slate-400 shrink-0" />
                                                <span className="font-medium">CCCD: {p.cccd || 'Chưa cập nhật'}</span>
                                            </div>

                                            {/* Ngày sinh & Tuổi */}
                                            <div className="flex items-center gap-1.5 text-slate-600 truncate col-span-2">
                                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                                <span>
                                                    {formatDate(p.dateOfBirth)}{' '}
                                                    <span className="text-slate-400">({calculateAge(p.dateOfBirth)})</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-sm">
                                Không tìm thấy hồ sơ có tài khoản nào khớp số điện thoại: "<strong>{phoneSearchTerm}</strong>"
                            </div>
                        )}
                    </div>
                </div>

                {/* ================= CỘT PHẢI (7 COLS): CHI TIẾT HỒ SƠ LIÊN KẾT THEO CHỦ HỘ ĐANG CHỌN ================= */}
                <div className="lg:col-span-7 space-y-3 rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs">

                    {/* Header Cột Phải: Hiển thị tên và thông tin chính chủ của item */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-sm bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center justify-center">
                                    2
                                </div>
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Chi tiết hồ sơ liên kết
                                </h3>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Chủ tài khoản bảo trợ:{' '}
                                <strong className="text-teal-800 font-bold">
                                    {selectedPatient?.fullName || 'Chưa chọn'}
                                </strong>{' '}
                                ({selectedPatient?.patientCode || 'N/A'} — SĐT: {selectedPatient?.phone || selectedPatient?.phoneNumber || 'N/A'})
                            </p>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0 self-start sm:self-auto">
                            <CheckCircle2 size={13} className="text-teal-700" />
                            <span>{linkedProfiles.length} hồ sơ liên kết</span>
                        </span>
                    </div>


                    {/* BẢNG CHI TIẾT DANH SÁCH HỒ SƠ ĐÃ LIÊN KẾT (TỪ API THẬT) */}
                    <div className="rounded-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                            <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2.5">BỆNH NHÂN</th>
                                    <th className="px-3 py-2.5">MÃ BỆNH NHÂN</th>
                                    <th className="px-3 py-2.5">NGÀY SINH</th>
                                    <th className="px-3 py-2.5">MỐI QUAN HỆ</th>
                                    <th className="px-3 py-2.5">TRẠNG THÁI</th>
                                    {!readOnly && <th className="px-3 py-2.5 text-right">THAO TÁC</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingRelationships ? (
                                    <tr>
                                        <td colSpan={readOnly ? 5 : 6} className="px-4 py-8 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <RefreshCw size={16} className="animate-spin text-teal-600" />
                                                <span>Đang tải danh sách hồ sơ liên kết...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : linkedProfiles.length > 0 ? (
                                    linkedProfiles.map((p) => (
                                        <tr key={p.relationshipId || p.patientId} className="hover:bg-teal-50/30 transition-colors">
                                            {/* Bệnh nhân (Avatar + Tên + SĐT) */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-xs">{p.fullName}</div>
                                                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                            <Phone size={10} className="text-slate-400" />
                                                            <span>{p.phoneMasked || p.phone || 'Chưa cập nhật'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Mã bệnh nhân */}
                                            <td className="px-3 py-2.5 font-bold text-teal-800 whitespace-nowrap">
                                                {p.patientCode}
                                            </td>

                                            {/* Ngày sinh / Tuổi */}
                                            <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                                <span>{formatDate(p.dateOfBirth)}</span>
                                                <span className="text-slate-400 ml-1">({calculateAge(p.dateOfBirth)})</span>
                                            </td>

                                            {/* Mối quan hệ */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                    {RELATIONSHIP_LABELS[p.relationshipType] || p.relationshipType || 'Người thân'}
                                                </span>
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={11} />
                                                    Đã liên kết
                                                </span>
                                            </td>

                                            {/* Thao tác (Hủy liên kết với modal xác nhận) */}
                                            {!readOnly && (
                                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDelete(p)}
                                                        className="rounded-sm border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                                                        title="Hủy liên kết hồ sơ này"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={readOnly ? 5 : 6} className="px-4 py-8 text-center text-slate-400">
                                            Chủ tài khoản <strong>{selectedPatient?.fullName}</strong> chưa có hồ sơ người thân nào được liên kết.
                                            {!readOnly && (
                                                <div className="mt-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsLinkModalOpen(true)}
                                                        className="inline-flex items-center gap-1.5 rounded-sm bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 transition-colors cursor-pointer"
                                                    >
                                                        <Plus size={13} />
                                                        <span>Liên kết ngay</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Dải thông báo xác thực dưới cùng (Góc bo sm) */}
                    <div className="flex items-center gap-2 p-2.5 rounded-sm bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                        <Info size={14} className="text-teal-700 shrink-0" />
                        <span>
                            Các hồ sơ phụ thuộc được cấp quyền theo dõi bệnh án và lịch khám trực tiếp dưới tài khoản của chủ hộ{' '}
                            <strong>{selectedPatient?.fullName || 'được chọn'}</strong>.
                        </span>
                    </div>
                </div>

            </div>

            {/* ================= MODAL XÁC NHẬN HỦY LIÊN KẾT & LIÊN KẾT HỒ SƠ ================= */}
            {!readOnly && (
                <>
                    <ConfirmDelete
                        isOpen={deleteModalConfig.open}
                        onClose={() =>
                            setDeleteModalConfig({
                                open: false,
                                relationshipId: null,
                                targetName: '',
                                targetCode: '',
                                isDeleting: false,
                            })
                        }
                        onConfirm={handleConfirmDelete}
                        isDeleting={deleteModalConfig.isDeleting}
                        targetName={deleteModalConfig.targetName}
                        targetCode={deleteModalConfig.targetCode}
                        guardianName={selectedPatient?.fullName}
                    />

                    <EmployeeLinkProfileModal
                        isOpen={isLinkModalOpen}
                        onClose={() => setIsLinkModalOpen(false)}
                        onSuccess={() => {
                            if (selectedPatient?.id) {
                                fetchRelationships(selectedPatient.id);
                            }
                        }}
                        initialGuardian={selectedPatient}
                    />
                </>
            )}
        </div>
    );
}

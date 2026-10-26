import {
    Award,
    Building2,
    Calendar,
    CalendarRange,
    FileText,
    GraduationCap,
    LockKeyhole,
    Mail,
    MapPin,
    Pencil,
    Phone,
    ShieldCheck,
    Sun,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DentistStatusDot, SpecialtyBadge } from './DentistBadges';

function DetailRow({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                {children}
            </div>
        </div>
    );
}

function CertificateView({ cert }) {
    const isPracticeLicense = cert.type === 'practice_license' || (cert.certificate_name || '').includes('hành nghề');
    return (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className={`px-3 py-1.5 border-b border-slate-100 flex items-center justify-between ${isPracticeLicense ? 'bg-red-50/50' : 'bg-blue-50/50'
                }`}>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className={`w-3.5 h-3.5 ${isPracticeLicense ? 'text-red-500' : 'text-blue-500'}`} />
                    {cert.certificate_name}
                </h4>
                {cert.specialization && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        {cert.specialization}
                    </span>
                )}
            </div>
            <div className="p-3 flex gap-3">
                {cert.certificate_file_url && (
                    <a
                        href={cert.certificate_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-20 h-14 shrink-0 rounded border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity"
                        title="Click để xem ảnh lớn"
                    >
                        <img
                            src={cert.certificate_file_url}
                            alt={cert.certificate_name}
                            className="w-full h-full object-cover"
                        />
                    </a>
                )}
                <div className="flex-1 space-y-1 text-xs">
                    <div className="grid grid-cols-[70px_1fr] gap-1">
                        <span className="text-slate-400 text-[11px]">Số CC:</span>
                        <span className="font-medium text-slate-700 text-[11px]">{cert.certificate_number}</span>
                    </div>
                    <div className="grid grid-cols-[70px_1fr] gap-1">
                        <span className="text-slate-400 text-[11px]">Nơi cấp:</span>
                        <span className="font-medium text-slate-700 text-[11px]">{cert.issued_by}</span>
                    </div>
                    <div className="grid grid-cols-[70px_1fr] gap-1">
                        <span className="text-slate-400 text-[11px]">Thời hạn:</span>
                        <span className="font-medium text-slate-700 text-[11px]">
                            {cert.issue_date} → {cert.expiry_date}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DentistDetailPanel({ isOpen, onClose, dentist, onEdit, onToggleLock, processing }) {
    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);

    // Mượt mà animation trượt từ phải sang và chặn thao tác trên màn hình chính bằng Backdrop
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            const timer = setTimeout(() => {
                setActive(true);
            }, 20);
            document.body.style.overflow = 'hidden';
            return () => clearTimeout(timer);
        } else {
            setActive(false);
            const timer = setTimeout(() => {
                setMounted(false);
            }, 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted) return null;

    const isLocked = dentist?.displayStatus === 'locked';

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop làm mờ & ngăn mọi thao tác trên màn hình chính khi hiển thị drawer */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
                    active ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Slide-in Panel - Cố định chiều cao (h-full), thu nhỏ chiều rộng (w-full max-w-[380px]), trượt mượt từ phải sang */}
            <div
                className={`fixed top-0 right-0 bottom-0 h-full w-full max-w-[380px] bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300 ease-out z-50 ${
                    active ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header - Cố định ở trên */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
                    <h2 className="text-sm font-bold text-slate-800">Thông tin chi tiết</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content - Cuộn nội dung riêng trong khung cố định */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {dentist ? (
                        <div className="space-y-4">
                            {/* Profile Header */}
                            <div className="rounded-lg border border-slate-200 bg-white p-4 relative flex flex-col items-center shadow-2xs">
                                <div className="absolute top-3 right-3">
                                    <DentistStatusDot status={dentist.displayStatus} />
                                </div>
                                <img
                                    src={dentist.avatar}
                                    alt={dentist.name}
                                    className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-50 shadow-xs"
                                />
                                <h3 className="mt-3 text-base font-bold text-slate-900 text-center">{dentist.name}</h3>
                                <div className="mt-1.5">
                                    <SpecialtyBadge labels={dentist.displaySpecializations} />
                                </div>
                            </div>

                            {/* Info Groups */}
                            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs">
                                <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">Thông tin cá nhân</h4>
                                <div className="space-y-2.5">
                                    {dentist.dentistCode && (
                                        <DetailRow icon={FileText} label="Mã bác sĩ">
                                            <p className="text-xs font-mono font-bold text-teal-800">
                                                {dentist.dentistCode}
                                            </p>
                                        </DetailRow>
                                    )}

                                    <DetailRow icon={Mail} label="Email">
                                        <p className="text-xs font-semibold text-slate-700 truncate">
                                            {dentist.email || 'Chưa cập nhật'}
                                        </p>
                                    </DetailRow>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <DetailRow icon={Phone} label="Số điện thoại">
                                            <p className="text-xs font-semibold text-slate-700">
                                                {dentist.phone || 'Chưa cập nhật'}
                                            </p>
                                        </DetailRow>
                                        <DetailRow icon={User} label="Giới tính">
                                            <p className="text-xs font-semibold text-slate-700">
                                                {dentist.gender || 'Chưa cập nhật'}
                                            </p>
                                        </DetailRow>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <DetailRow icon={Calendar} label="Ngày sinh">
                                            <p className="text-xs font-semibold text-slate-700">
                                                {dentist.dateOfBirth ? new Date(dentist.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                            </p>
                                        </DetailRow>
                                    </div>

                                    <DetailRow icon={MapPin} label="Địa chỉ">
                                        <p className="text-xs font-semibold text-slate-700 leading-relaxed break-words">
                                            {dentist.address || 'Chưa cập nhật'}
                                        </p>
                                    </DetailRow>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                                <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Chuyên môn & Công việc</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <DetailRow icon={ShieldCheck} label="Chuyên khoa">
                                            <div className="mt-0.5">
                                                <SpecialtyBadge labels={dentist.displaySpecializations} />
                                            </div>
                                        </DetailRow>
                                        <DetailRow icon={Award} label="Kinh nghiệm">
                                            <p className="text-xs font-semibold text-slate-700">{dentist.displayExperience}</p>
                                        </DetailRow>
                                    </div>

                                    <DetailRow icon={GraduationCap} label="Học vấn">
                                        <p className="text-xs font-semibold text-slate-700">{dentist.education || 'Chưa cập nhật'}</p>
                                    </DetailRow>
                                    <DetailRow icon={Building2} label="Chi nhánh">
                                        <p className="text-xs font-semibold text-slate-700">
                                            {dentist.branchName || 'Chưa phân chi nhánh'}
                                        </p>
                                    </DetailRow>

                                    <div className="grid grid-cols-2 gap-3">
                                        <DetailRow icon={CalendarRange} label="Ngày tham gia">
                                            <p className="text-xs font-semibold text-slate-700">{dentist.displayCreatedAt}</p>
                                        </DetailRow>
                                        <DetailRow icon={Sun} label="Ca làm việc">
                                            <p className="text-xs font-semibold text-slate-700">{dentist.displayShift}</p>
                                        </DetailRow>
                                    </div>
                                </div>
                            </div>

                            {/* Certificates Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-slate-800">Bằng cấp & Chứng chỉ</h4>
                                    <span className="flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full w-4 h-4">
                                        {dentist.certificates?.length || 0}
                                    </span>
                                </div>

                                {dentist.certificates && dentist.certificates.length > 0 ? (
                                    <div className="space-y-2">
                                        {dentist.certificates
                                            .filter(c => c.type === 'practice_license')
                                            .map(cert => (
                                                <CertificateView key={cert.certificate_id || cert.certificate_number} cert={cert} />
                                            ))}

                                        {dentist.certificates
                                            .filter(c => c.type !== 'practice_license')
                                            .map(cert => (
                                                <CertificateView key={cert.certificate_id || cert.certificate_number} cert={cert} />
                                            ))}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                                        <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                                        <p className="text-xs text-slate-500 font-medium">Chưa có chứng chỉ nào</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Cập nhật thông tin để thêm chứng chỉ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <User className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-xs font-medium">Không có thông tin bác sĩ</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions - Cố định ở đáy panel */}
                {dentist && (
                    <div className="p-3 border-t border-slate-200 bg-white flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => onEdit(dentist)}
                            className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Chỉnh sửa
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => onToggleLock(dentist)}
                            className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${isLocked
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                        >
                            <LockKeyhole className="h-3.5 w-3.5" />
                            {isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

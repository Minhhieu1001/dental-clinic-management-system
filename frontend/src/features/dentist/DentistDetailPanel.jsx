import {
    Award,
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
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 mt-0.5">
                <Icon className="h-4 w-4 text-slate-400" />
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
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className={`px-4 py-2 border-b border-slate-100 flex items-center justify-between ${isPracticeLicense ? 'bg-red-50/50' : 'bg-blue-50/50'
                }`}>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <FileText className={`w-3.5 h-3.5 ${isPracticeLicense ? 'text-red-500' : 'text-blue-500'}`} />
                    {cert.certificate_name}
                </h4>
                {cert.specialization && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {cert.specialization}
                    </span>
                )}
            </div>
            <div className="p-4 flex gap-4">
                {cert.certificate_file_url && (
                    <a
                        href={cert.certificate_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-24 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                        title="Click để xem ảnh lớn"
                    >
                        <img
                            src={cert.certificate_file_url}
                            alt={cert.certificate_name}
                            className="w-full h-full object-cover"
                        />
                    </a>
                )}
                <div className="flex-1 space-y-1.5 text-xs">
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                        <span className="text-slate-400">Số CC:</span>
                        <span className="font-medium text-slate-700">{cert.certificate_number}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                        <span className="text-slate-400">Nơi cấp:</span>
                        <span className="font-medium text-slate-700">{cert.issued_by}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                        <span className="text-slate-400">Thời hạn:</span>
                        <span className="font-medium text-slate-700">
                            {cert.issue_date} → {cert.expiry_date}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DentistDetailPanel({ isOpen, onClose, dentist, onEdit, onToggleLock, processing }) {
    const [isVisible, setIsVisible] = useState(false);

    // Xử lý animation khi mount/unmount
    useEffect(() => {
        let timer;
        if (isOpen) {
            // Use setTimeout to avoid synchronous setState warning and ensure CSS transition works
            timer = setTimeout(() => {
                setIsVisible(true);
                document.body.style.overflow = 'hidden';
            }, 10);
        } else {
            timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
        }
        return () => {
            if (timer) clearTimeout(timer);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const isLocked = dentist?.displayStatus === 'locked';

    return (
        <>
            {/* Slide-in Panel */}
            <div
                className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-[480px] bg-slate-50 shadow-[0_0_40px_rgba(0,0,0,0.1)] border-l border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-bold text-slate-800">Thông tin chi tiết</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {dentist ? (
                        <div className="space-y-6 pb-20">
                            {/* Profile Header */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 relative flex flex-col items-center">
                                <div className="absolute top-4 right-4">
                                    <DentistStatusDot status={dentist.displayStatus} />
                                </div>
                                <img
                                    src={dentist.avatar}
                                    alt={dentist.name}
                                    className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-50 shadow-md"
                                />
                                <h3 className="mt-4 text-xl font-bold text-slate-900 text-center">{dentist.name}</h3>
                                <div className="mt-2">
                                    <SpecialtyBadge labels={dentist.displaySpecializations} />
                                </div>
                            </div>

                            {/* Info Groups */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Thông tin cá nhân</h4>
                                <div className="space-y-4">
                                    <DetailRow icon={Mail} label="Email">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                            {dentist.email || 'Chưa cập nhật'}
                                        </p>
                                    </DetailRow>

                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow icon={Phone} label="Số điện thoại">
                                            <p className="text-sm font-medium text-slate-700">
                                                {dentist.phone || 'Chưa cập nhật'}
                                            </p>
                                        </DetailRow>
                                        <DetailRow icon={User} label="Giới tính">
                                            <p className="text-sm font-medium text-slate-700">
                                                {dentist.gender || 'Chưa cập nhật'}
                                            </p>
                                        </DetailRow>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow icon={Calendar} label="Ngày sinh">
                                            <p className="text-sm font-medium text-slate-700">
                                                {dentist.dateOfBirth ? new Date(dentist.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                            </p>
                                        </DetailRow>
                                        <DetailRow icon={MapPin} label="Địa chỉ">
                                            <p className="text-sm font-medium text-slate-700 truncate" title={dentist.address}>
                                                {dentist.address || 'Chưa cập nhật'}
                                            </p>
                                        </DetailRow>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Chuyên môn & Công việc</h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow icon={ShieldCheck} label="Chuyên khoa">
                                            <div className="mt-1">
                                                <SpecialtyBadge labels={dentist.displaySpecializations} />
                                            </div>
                                        </DetailRow>
                                        <DetailRow icon={Award} label="Kinh nghiệm">
                                            <p className="text-sm font-medium text-slate-700">{dentist.displayExperience}</p>
                                        </DetailRow>
                                    </div>

                                    <DetailRow icon={GraduationCap} label="Học vấn">
                                        <p className="text-sm font-medium text-slate-700">{dentist.education || 'Chưa cập nhật'}</p>
                                    </DetailRow>

                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow icon={CalendarRange} label="Ngày tham gia">
                                            <p className="text-sm font-medium text-slate-700">{dentist.displayCreatedAt}</p>
                                        </DetailRow>
                                        <DetailRow icon={Sun} label="Ca làm việc">
                                            <p className="text-sm font-medium text-slate-700">{dentist.displayShift}</p>
                                        </DetailRow>
                                    </div>
                                </div>
                            </div>

                            {/* Certificates Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-800">Bằng cấp & Chứng chỉ</h4>
                                    <span className="flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full w-5 h-5">
                                        {dentist.certificates?.length || 0}
                                    </span>
                                </div>

                                {dentist.certificates && dentist.certificates.length > 0 ? (
                                    <div className="space-y-3">
                                        {/* Hiển thị chứng chỉ hành nghề trước */}
                                        {dentist.certificates
                                            .filter(c => c.type === 'practice_license')
                                            .map(cert => (
                                                <CertificateView key={cert.certificate_id || cert.certificate_number} cert={cert} />
                                            ))}

                                        {/* Sau đó là các chứng chỉ chuyên môn */}
                                        {dentist.certificates
                                            .filter(c => c.type !== 'practice_license')
                                            .map(cert => (
                                                <CertificateView key={cert.certificate_id || cert.certificate_number} cert={cert} />
                                            ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Chưa có chứng chỉ nào</p>
                                        <p className="text-xs text-slate-400 mt-1">Cập nhật thông tin để thêm chứng chỉ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <User className="w-12 h-12 mb-4 opacity-20" />
                            <p>Không có thông tin bác sĩ</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions - Fixed at bottom */}
                {dentist && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white flex gap-3">
                        <button
                            type="button"
                            onClick={() => onEdit(dentist)}
                            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
                        >
                            <Pencil className="h-4 w-4" />
                            Chỉnh sửa
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => onToggleLock(dentist)}
                            className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${isLocked
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                        >
                            <LockKeyhole className="h-4 w-4" />
                            {isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

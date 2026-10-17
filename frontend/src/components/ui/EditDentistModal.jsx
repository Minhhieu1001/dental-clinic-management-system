import { useEffect, useRef, useState } from 'react';
import {
    Award,
    Building2,
    Calendar,
    Camera,
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    GraduationCap,
    ImagePlus,
    Info,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Plus,
    ShieldCheck,
    Stethoscope,
    Trash2,
    Upload,
    UserRound,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateDentist, updateUser } from '../../services/dentist.service';
import { getBranches } from '../../services/clinic.service';
import { uploadImage } from '../../services/media.service';
import { DEFAULT_DENTIST_SPECIALIZATION, SPECIALIZATION_OPTIONS } from '../../features/dentist/dentistHelpers';

const EMPTY_CERTIFICATE = {
    certificate_name: '',
    certificate_number: '',
    issued_by: '',
    issue_date: '',
    expiry_date: '',
    certificate_file: null,
    certificate_file_preview: null,
    specialization: DEFAULT_DENTIST_SPECIALIZATION,
};

const STEPS = [
    { label: 'Thông tin cá nhân', icon: UserRound },
    { label: 'Chứng chỉ hành nghề', icon: ShieldCheck },
    { label: 'Lưu thay đổi', icon: Check },
];

function StepIndicator({ currentStep }) {
    return (
        <div className="flex items-center justify-center gap-1 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/40">
            {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentStep;
                const isDone = idx < currentStep;

                return (
                    <div key={step.label} className="flex items-center">
                        {idx > 0 && (
                            <div className={`w-10 h-0.5 mx-1 rounded-full transition-colors duration-300 ${isDone ? 'bg-blue-500' : 'bg-slate-200'}`} />
                        )}
                        <div className="flex items-center gap-2">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110'
                                    : isDone
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span
                                className={`text-xs font-semibold hidden sm:inline transition-colors ${isActive ? 'text-blue-700' : isDone ? 'text-blue-500' : 'text-slate-400'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CertificateCard({ cert, index, onChange, onRemove, onFileChange, canRemove, label }) {
    const fileRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Kích thước file không được vượt quá 10MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => onFileChange(index, file, reader.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 relative group hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    {label}
                </h4>
                {canRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa chứng chỉ"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {cert.specialization !== undefined && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Chuyên khoa <span className="text-red-400">*</span></label>
                    <select
                        value={cert.specialization}
                        onChange={(e) => onChange(index, 'specialization', e.target.value)}
                        className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white"
                    >
                        {SPECIALIZATION_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Tên chứng chỉ <span className="text-red-400">*</span></label>
                    <input
                        required
                        type="text"
                        value={cert.certificate_name}
                        onChange={(e) => onChange(index, 'certificate_name', e.target.value)}
                        placeholder="VD: Chứng chỉ hành nghề"
                        className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Số chứng chỉ <span className="text-red-400">*</span></label>
                    <input
                        required
                        type="text"
                        value={cert.certificate_number}
                        onChange={(e) => onChange(index, 'certificate_number', e.target.value)}
                        placeholder="VD: CCHN-2024-001"
                        className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Nơi cấp <span className="text-red-400">*</span></label>
                <input
                    required
                    type="text"
                    value={cert.issued_by}
                    onChange={(e) => onChange(index, 'issued_by', e.target.value)}
                    placeholder="VD: Bộ Y Tế"
                    className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Ngày cấp <span className="text-red-400">*</span></label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            required
                            type="date"
                            value={cert.issue_date}
                            onChange={(e) => onChange(index, 'issue_date', e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Ngày hết hạn <span className="text-red-400">*</span></label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            required
                            type="date"
                            value={cert.expiry_date}
                            onChange={(e) => onChange(index, 'expiry_date', e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">File chứng chỉ <span className="text-red-400">*</span></label>
                {cert.certificate_file_preview ? (
                    <div className="relative group/img">
                        <img
                            src={cert.certificate_file_preview}
                            alt="Certificate"
                            className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 rounded-lg flex items-center justify-center gap-2 transition-opacity">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Thay đổi
                            </button>
                            <button
                                type="button"
                                onClick={() => onFileChange(index, null, null)}
                                className="px-3 py-1.5 bg-red-500 rounded-lg text-xs font-medium text-white hover:bg-red-600"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                    >
                        <Upload className="w-6 h-6 text-slate-300 mb-1" />
                        <p className="text-xs text-slate-400">Click để upload file chứng chỉ</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">PNG, JPG, PDF (tối đa 10MB)</p>
                    </div>
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    );
}

export default function EditDentistModal({ isOpen, onClose, onSuccess, mockMode = false, dentist }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const avatarInputRef = useRef(null);

    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        experienceYears: 1,
        gender: 'Nam',
        education: '',
        description: '',
        branchId: '',
    });
    const [branches, setBranches] = useState([]);

    // Practice license certificate (required)
    const [practiceLicense, setPracticeLicense] = useState({
        certificate_name: 'Chứng chỉ hành nghề bác sĩ',
        certificate_number: '',
        issued_by: '',
        issue_date: '',
        expiry_date: '',
        certificate_file: null,
        certificate_file_preview: null,
    });

    // Specialization certificates
    const [specCertificates, setSpecCertificates] = useState([]);

    useEffect(() => {
        if (isOpen && dentist) {
            setFormData({
                username: dentist.name || '',
                phone: dentist.phone || '',
                address: dentist.address || '',
                dateOfBirth: dentist.dateOfBirth ? (typeof dentist.dateOfBirth === 'string' ? dentist.dateOfBirth.split('T')[0] : dentist.dateOfBirth) : '',
                experienceYears: dentist.experienceYears || 0,
                gender: dentist.gender || 'Nam',
                education: dentist.education || dentist.qualification || '',
                description: dentist.description || '',
                branchId: dentist.branchId || '',
            });
            setAvatarPreview(dentist.avatar || null);
            setAvatarFile(null);
            setCurrentStep(0);
            setError(null);

            // Populate certificates
            if (dentist.certificates && dentist.certificates.length > 0) {
                const pLicense = dentist.certificates.find((c) => c.type === 'practice_license');
                if (pLicense) {
                    setPracticeLicense({
                        certificate_name: pLicense.certificate_name || 'Chứng chỉ hành nghề bác sĩ',
                        certificate_number: pLicense.certificate_number || '',
                        issued_by: pLicense.issued_by || '',
                        issue_date: pLicense.issue_date || '',
                        expiry_date: pLicense.expiry_date || '',
                        certificate_file: null,
                        certificate_file_preview: pLicense.certificate_file_url || null,
                    });
                } else {
                    // Reset if none found
                    setPracticeLicense({
                        certificate_name: 'Chứng chỉ hành nghề bác sĩ',
                        certificate_number: '',
                        issued_by: '',
                        issue_date: '',
                        expiry_date: '',
                        certificate_file: null,
                        certificate_file_preview: null,
                    });
                }

                const sCerts = dentist.certificates.filter((c) => c.type !== 'practice_license');
                setSpecCertificates(
                    sCerts.map((c) => ({
                        certificate_name: c.certificate_name || '',
                        certificate_number: c.certificate_number || '',
                        issued_by: c.issued_by || '',
                        issue_date: c.issue_date || '',
                        expiry_date: c.expiry_date || '',
                        specialization: c.specialization || DEFAULT_DENTIST_SPECIALIZATION,
                        certificate_file: null,
                        certificate_file_preview: c.certificate_file_url || null,
                    }))
                );
            } else {
                setPracticeLicense({
                    certificate_name: 'Chứng chỉ hành nghề bác sĩ',
                    certificate_number: '',
                    issued_by: '',
                    issue_date: '',
                    expiry_date: '',
                    certificate_file: null,
                    certificate_file_preview: null,
                });
                setSpecCertificates([]);
            }
        }
    }, [isOpen, dentist]);

    useEffect(() => {
        if (!isOpen) return;
        getBranches()
            .then(setBranches)
            .catch((err) => {
                console.error('Failed to load branches:', err);
                setError('Không thể tải danh sách chi nhánh.');
            });
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'experienceYears' ? Number(value) : value,
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước ảnh không được vượt quá 5MB');
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh hợp lệ');
            return;
        }
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = (e) => {
        e.stopPropagation();
        setAvatarFile(null);
        setAvatarPreview(null);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    // Practice license handlers
    const handlePracticeLicenseChange = (_, field, value) => {
        setPracticeLicense((prev) => ({ ...prev, [field]: value }));
    };

    const handlePracticeLicenseFile = (_, file, preview) => {
        setPracticeLicense((prev) => ({
            ...prev,
            certificate_file: file,
            certificate_file_preview: preview,
        }));
    };

    // Specialization certificate handlers
    const handleSpecCertChange = (index, field, value) => {
        setSpecCertificates((prev) =>
            prev.map((cert, i) => (i === index ? { ...cert, [field]: value } : cert))
        );
    };

    const handleSpecCertFile = (index, file, preview) => {
        setSpecCertificates((prev) =>
            prev.map((cert, i) =>
                i === index ? { ...cert, certificate_file: file, certificate_file_preview: preview } : cert
            )
        );
    };

    const addSpecCertificate = () => {
        setSpecCertificates((prev) => [...prev, { ...EMPTY_CERTIFICATE }]);
    };

    const removeSpecCertificate = (index) => {
        setSpecCertificates((prev) => prev.filter((_, i) => i !== index));
    };

    // Validation
    const isPracticeLicenseValid = () => {
        return (
            practiceLicense.certificate_name.trim() &&
            practiceLicense.certificate_number.trim() &&
            practiceLicense.issued_by.trim() &&
            practiceLicense.issue_date &&
            practiceLicense.expiry_date &&
            practiceLicense.certificate_file_preview
        );
    };

    const isStep1Valid = () => {
        return formData.username.trim() && formData.phone.trim() && formData.education.trim() && formData.branchId;
    };

    const isStep2Valid = () => {
        if (!isPracticeLicenseValid()) return false;
        for (const cert of specCertificates) {
            if (
                !cert.certificate_name.trim() ||
                !cert.certificate_number.trim() ||
                !cert.issued_by.trim() ||
                !cert.issue_date ||
                !cert.expiry_date ||
                !cert.certificate_file_preview
            ) {
                return false;
            }
        }
        return true;
    };

    const canProceed = () => {
        if (currentStep === 0) return isStep1Valid();
        if (currentStep === 1) return isStep2Valid();
        return true;
    };

    const handleNext = () => {
        if (currentStep < 2 && canProceed()) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            let avatarUrl = dentist.avatar;
            if (avatarFile) {
                const uploadResult = await uploadImage(avatarFile);
                avatarUrl = uploadResult.url || uploadResult.secure_url || uploadResult;
            } else if (!avatarPreview) {
                avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.username)}&background=random`;
            }

            // --- REAL API CALL ---
            if (dentist.userId) {
                ``
                await updateUser(dentist.userId, {
                    username: formData.username,
                    phone: formData.phone,
                    address: formData.address,
                    avatarUrl,
                });
            }

            const specializations = specCertificates.length > 0
                ? specCertificates.map((c) => c.specialization)
                : [DEFAULT_DENTIST_SPECIALIZATION];

            // Helper to upload certificate file and map to DTO
            const uploadAndMapCertificate = async (cert) => {
                let fileUrl = cert.certificate_file_preview || '';
                // Only upload if it's a new file (not a string URL)
                if (cert.certificate_file) {
                    const res = await uploadImage(cert.certificate_file);
                    fileUrl = res.url || res.secure_url || res;
                }
                return {
                    certificateName: cert.certificate_name,
                    certificateNumber: cert.certificate_number,
                    issuedBy: cert.issued_by,
                    issueDate: cert.issue_date ? new Date(cert.issue_date).toISOString() : null,
                    expiryDate: cert.expiry_date ? new Date(cert.expiry_date).toISOString() : null,
                    certificateFileUrl: fileUrl,
                };
            };

            const isCertValid = (c) => c && c.certificate_name?.trim() && c.certificate_number?.trim();

            const practiceCertData = isCertValid(practiceLicense) ? await uploadAndMapCertificate(practiceLicense) : null;
            const specCertsData = await Promise.all(
                specCertificates.filter(isCertValid).map(uploadAndMapCertificate)
            );
            const allCertificates = [practiceCertData, ...specCertsData].filter(Boolean);

            await updateDentist(dentist.id, {
                fullName: formData.username,
                dateOfBirth: formData.dateOfBirth || null,
                address: formData.address || null,
                specialization: specializations[0],
                specializations: specializations,
                certificates: allCertificates,
                experienceYears: formData.experienceYears,
                gender: formData.gender,
                qualification: formData.education,
                description: formData.description,
                branchId: formData.branchId,
            });
            // ⚠️ Note: the actual backend may need a specific endpoint to update certificates

            toast.success('Cập nhật thông tin thành công!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
                <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative group cursor-pointer"
                >
                    <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-blue-50 shadow-md bg-slate-100 flex items-center justify-center transition-all group-hover:ring-blue-200">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                        ) : (
                            <ImagePlus className="h-8 w-8 text-slate-300" />
                        )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                </div>
                {avatarPreview && (
                    <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                        Xóa ảnh
                    </button>
                )}
            </div>

            <div className="h-px bg-slate-100" />

            <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Thông tin liên hệ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Họ và tên <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                required
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Nhập họ và tên"
                                className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Email (Không thể sửa)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                value={dentist?.email || ''}
                                disabled
                                className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Số điện thoại <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                required
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Nhập số điện thoại"
                                className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Ngày sinh</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Số năm kinh nghiệm</label>
                        <div className="relative">
                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                min="0"
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Giới tính <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                required
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white cursor-pointer"
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Học vấn <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                required
                                type="text"
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                placeholder="VD: Tiến sĩ, Thạc sĩ..."
                                className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Nhập địa chỉ"
                            className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="mt-4 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-blue-500" /> Chi nhánh
                        </span>
                        <span className="text-red-400"> *</span>
                    </label>
                    <select
                        required
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleChange}
                        className="w-full px-3 h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white cursor-pointer"
                    >
                        <option value="">-- Chọn chi nhánh --</option>
                        {branches.map((branch) => (
                            <option key={branch.branchId} value={branch.branchId}>
                                {branch.branchName} ({branch.branchCode})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-4 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Mô tả / Giới thiệu</label>
                    <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Nhập mô tả thêm về bác sĩ..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm resize-none"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                        <ShieldCheck className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Chứng chỉ hành nghề</h3>
                        <p className="text-[11px] text-red-500 font-medium">Bắt buộc</p>
                    </div>
                </div>
                <CertificateCard
                    cert={practiceLicense}
                    index={0}
                    onChange={handlePracticeLicenseChange}
                    onFileChange={handlePracticeLicenseFile}
                    onRemove={() => { }}
                    canRemove={false}
                    label="Giấy phép hành nghề bác sĩ"
                />
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-slate-50 px-3 text-xs text-slate-400 font-medium">Chứng chỉ chuyên môn</span>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                        <Stethoscope className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Chứng chỉ chuyên môn</h3>
                        <p className="text-[11px] text-slate-400">Tùy chọn</p>
                    </div>
                </div>

                {!isPracticeLicenseValid() ? (
                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center">
                        <Info className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                        <p className="text-sm text-amber-600 font-medium">Vui lòng điền đầy đủ chứng chỉ hành nghề trước</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {specCertificates.map((cert, idx) => (
                            <CertificateCard
                                key={idx}
                                cert={cert}
                                index={idx}
                                onChange={handleSpecCertChange}
                                onFileChange={handleSpecCertFile}
                                onRemove={removeSpecCertificate}
                                canRemove={true}
                                label={`Chứng chỉ chuyên môn #${idx + 1}`}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={addSpecCertificate}
                            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50/50 hover:border-blue-300 transition-all active:scale-[0.99]"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm chứng chỉ chuyên môn
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => {
        const specCertsDisplay = specCertificates.filter(
            (c) => c.certificate_name.trim() && c.certificate_number.trim()
        );

        return (
            <div className="space-y-6">
                <div className="text-center py-2">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-3">
                        <Check className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Xác nhận thay đổi</h3>
                    <p className="text-sm text-slate-400 mt-1">Vui lòng kiểm tra lại thông tin đã cập nhật</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin cá nhân</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-slate-400">Họ tên:</span>
                            <span className="ml-2 font-medium text-slate-700">{formData.username}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">SĐT:</span>
                            <span className="ml-2 font-medium text-slate-700">{formData.phone}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Ngày sinh:</span>
                            <span className="ml-2 font-medium text-slate-700">{formData.dateOfBirth || 'Chưa cập nhật'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Giới tính:</span>
                            <span className="ml-2 font-medium text-slate-700">{formData.gender}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chứng chỉ hành nghề</h4>
                    <div className="flex gap-4">
                        {practiceLicense.certificate_file_preview && (
                            <img
                                src={practiceLicense.certificate_file_preview}
                                alt="Practice license"
                                className="w-24 h-16 object-cover rounded-lg border border-slate-200"
                            />
                        )}
                        <div className="text-sm space-y-1 flex-1">
                            <p className="font-medium text-slate-700">{practiceLicense.certificate_name}</p>
                            <p className="text-slate-400">Số: {practiceLicense.certificate_number}</p>
                            <p className="text-slate-400">Nơi cấp: {practiceLicense.issued_by}</p>
                        </div>
                    </div>
                </div>

                {specCertsDisplay.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Chứng chỉ chuyên môn ({specCertsDisplay.length})
                        </h4>
                        <div className="space-y-3">
                            {specCertsDisplay.map((cert, idx) => (
                                <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-slate-50">
                                    {cert.certificate_file_preview && (
                                        <img
                                            src={cert.certificate_file_preview}
                                            alt="Certificate"
                                            className="w-16 h-12 object-cover rounded-md border border-slate-200"
                                        />
                                    )}
                                    <div className="text-sm space-y-0.5 flex-1 min-w-0">
                                        <p className="font-medium text-slate-700 truncate">{cert.certificate_name}</p>
                                        <p className="text-xs text-slate-400">
                                            {cert.specialization} • Số: {cert.certificate_number}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Cập nhật thông tin Bác sĩ</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stepper */}
                <StepIndicator currentStep={currentStep} />

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-start gap-3">
                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form id="edit-dentist-form" onSubmit={handleSubmit}>
                        {currentStep === 0 && renderStep1()}
                        {currentStep === 1 && renderStep2()}
                        {currentStep === 2 && renderStep3()}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-2xl">
                    <div>
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 h-10 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm"
                        >
                            Hủy
                        </button>

                        {currentStep < 2 ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    form="edit-dentist-form"
                                    disabled={loading || !isStep1Valid()}
                                    className="inline-flex items-center gap-2 px-5 h-10 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Lưu
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canProceed()}
                                    className="inline-flex items-center gap-1.5 px-5 h-10 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                >
                                    Tiếp theo
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                form="edit-dentist-form"
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-5 h-10 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

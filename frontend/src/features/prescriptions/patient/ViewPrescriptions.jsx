import React, { useState, useEffect, useMemo } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    TextField,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import {
    FileText,
    Calendar,
    User,
    Printer,
    Search,
    ChevronRight,
    Hash,
    MapPin,
} from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';
import { getPrescriptionById, getPrescriptionsByPatientId } from '../../../services/prescription.service';
import { getPatientById } from '../../../services/patient.service';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { mapPrescriptionsWithBranch, isAdviceEmpty } from './prescriptionMapper';
import PrescriptionPrintModal from '../dentist/components/PrescriptionPrintModal';
import Loading from '../../../components/ui/Loading';

export default function ViewPrescriptions() {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [patientProfile, setPatientProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [loadingPrint, setLoadingPrint] = useState(false);
    const [printSnapshot, setPrintSnapshot] = useState(null);

    const patientId = user?.patientId || user?.id;

    // Chuẩn hóa ngày sinh từ Backend (hỗ trợ cả ISO string lẫn mảng timestamp [YYYY, MM, DD])
    const normalizeDob = (dob) => {
        if (!dob) return null;
        if (Array.isArray(dob) && dob.length >= 3) {
            return `${dob[0]}-${String(dob[1]).padStart(2, '0')}-${String(dob[2]).padStart(2, '0')}`;
        }
        return dob;
    };

    // Lấy danh sách đơn thuốc và hồ sơ bệnh nhân từ Backend
    const fetchPrescriptions = async (pid) => {
        try {
            setLoading(true);
            const [prescriptionsRes, patientRes] = await Promise.allSettled([
                getPrescriptionsByPatientId(pid),
                getPatientById(pid),
            ]);

            let mapped = [];
            if (prescriptionsRes.status === 'fulfilled') {
                mapped = await mapPrescriptionsWithBranch(prescriptionsRes.value);
                setPrescriptions(mapped);
                if (mapped.length > 0) {
                    setSelectedId(mapped[0].id);
                }
            } else {
                console.error('Lỗi khi tải đơn thuốc từ backend:', prescriptionsRes.reason);
                setPrescriptions([]);
            }

            if (patientRes.status === 'fulfilled' && patientRes.value) {
                setPatientProfile(patientRes.value);
            } else if (mapped.length > 0 && mapped[0]?.raw?.patientId) {
                // Fallback nếu pid trong auth không phải là id bệnh nhân thì lấy từ đơn thuốc
                try {
                    const fallbackProfile = await getPatientById(mapped[0].raw.patientId);
                    if (fallbackProfile) setPatientProfile(fallbackProfile);
                } catch (err) {
                    console.warn('Lỗi lấy patientProfile fallback:', err);
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu đơn thuốc:', error);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) {
            fetchPrescriptions(patientId);
        } else {
            setLoading(false);
        }
    }, [patientId]);

    // Lọc danh sách theo từ khóa tìm kiếm (tên đơn thuốc, mã đơn, bác sĩ, ngày kê, tên thuốc)
    const filteredPrescriptions = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return prescriptions;

        return prescriptions.filter((item) => {
            return (
                item.title.toLowerCase().includes(q) ||
                item.prescriptionCode.toLowerCase().includes(q) ||
                item.doctor.toLowerCase().includes(q) ||
                item.date.includes(q) ||
                item.medicines.some((m) => m.name.toLowerCase().includes(q))
            );
        });
    }, [prescriptions, searchQuery]);

    // Đơn thuốc đang được chọn xem chi tiết
    const currentPrescription =
        prescriptions.find((p) => p.id === selectedId) || prescriptions[0] || null;

    // Dữ liệu bệnh nhân cho modal in chuẩn y khoa (đầy đủ tuổi, sđt, địa chỉ, mã BN)
    const printPatientData = useMemo(() => {
        const rawDob = patientProfile?.dateOfBirth || user?.dateOfBirth || user?.dob || null;
        return {
            fullName: patientProfile?.fullName || currentPrescription?.patientName || user?.fullName || user?.name || 'Bệnh nhân',
            dateOfBirth: normalizeDob(rawDob),
            gender: patientProfile?.gender || user?.gender || 'MALE',
            patientCode: patientProfile?.patientCode || currentPrescription?.patientCode || user?.patientCode || user?.code || 'PA-000000',
            phone: patientProfile?.phone || user?.phone || user?.phoneNumber || '',
            address: patientProfile?.address || user?.address || 'TP. Hồ Chí Minh',
        };
    }, [patientProfile, currentPrescription, user]);

    const handlePrint = async () => {
        if (!currentPrescription || loadingPrint) return;
        setLoadingPrint(true);
        try {
            // Đảm bảo hồ sơ bệnh nhân có số điện thoại và tuổi trước khi mở popup in
            let pProfile = patientProfile;
            const targetPatientId = pProfile?.id || currentPrescription?.raw?.patientId || patientId;
            if ((!pProfile?.phone || !pProfile?.dateOfBirth) && targetPatientId) {
                try {
                    const fetchedPatient = await getPatientById(targetPatientId);
                    if (fetchedPatient) {
                        setPatientProfile(fetchedPatient);
                    }
                } catch (e) {
                    console.warn('Không thể tải chi tiết bệnh nhân khi in:', e);
                }
            }

            const latest = await getPrescriptionById(currentPrescription.id);
            setPrintSnapshot(latest);
            setIsPrintModalOpen(true);
        } catch (error) {
            console.error('Không thể tải dữ liệu in đơn thuốc:', error);
            toast.error('Không thể tải đơn thuốc để in. Vui lòng thử lại.');
        } finally {
            setLoadingPrint(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-[420px] flex items-center justify-center bg-white rounded-lg border border-slate-200">
                <Loading
                    title="Đang tải danh sách đơn thuốc..."
                    subtitle="Vui lòng đợi trong giây lát, hệ thống đang đồng bộ dữ liệu"
                    size="md"
                />
            </div>
        );
    }

    if (prescriptions.length === 0) {
        return (
            <Paper
                variant="outlined"
                sx={{ borderRadius: '8px', borderColor: '#e2e8f0', p: 6 }}
                className="text-center bg-white"
            >
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Chưa có đơn thuốc nào</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Hiện tại bạn chưa có đơn thuốc nào được ghi nhận trên hệ thống.
                </p>
            </Paper>
        );
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] gap-5 items-start">
                {/* ======================================================== */}
                {/* CỘT TRÁI: DANH SÁCH ĐƠN THUỐC                            */}
                {/* ======================================================== */}
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: '8px',
                        borderColor: '#e2e8f0',
                        p: { xs: 2, sm: 2.5 },
                        backgroundColor: '#ffffff',
                    }}
                    className="shadow-xs no-print"
                >
                    <div className="flex items-center justify-between mb-3.5">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            Danh sách đơn thuốc
                        </h2>
                        <span className="text-xs font-semibold text-slate-500">
                            {filteredPrescriptions.length} đơn thuốc
                        </span>
                    </div>

                    {/* Ô tìm kiếm */}
                    <div className="mb-3.5">
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm theo tên thuốc, bác sĩ, mã đơn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    backgroundColor: '#f8fafc',
                                    '& fieldset': { borderColor: '#e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                                },
                            }}
                        />
                    </div>

                    {/* Danh sách thẻ đơn thuốc */}
                    <div className="space-y-2.5">
                        {filteredPrescriptions.length > 0 ? (
                            filteredPrescriptions.map((item) => {
                                const isSelected = item.id === currentPrescription?.id;

                                return (
                                    <Paper
                                        key={item.id}
                                        variant="outlined"
                                        onClick={() => setSelectedId(item.id)}
                                        sx={{
                                            borderRadius: '8px',
                                            p: 1.8,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease-in-out',
                                            borderWidth: isSelected ? '1.5px' : '1px',
                                            borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                                            backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                                            boxShadow: isSelected
                                                ? '0 1px 3px rgba(37, 99, 235, 0.1)'
                                                : 'none',
                                            '&:hover': {
                                                borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                                                backgroundColor: isSelected ? '#f0f7ff' : '#f8fafc',
                                            },
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Icon ở giữa theo chiều dọc */}
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}
                                            >
                                                <FileText className="h-5 w-5" />
                                            </div>

                                            {/* Nội dung bên phải */}
                                            <div className="min-w-0 flex-1">
                                                {/* Hàng 1: Tên đơn thuốc thoải mái toàn bộ chiều rộng */}
                                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate mb-1">
                                                    {item.title}
                                                </h3>

                                                {/* Hàng 2: Ngày kê */}
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                                                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                                    <span className="truncate">
                                                        Ngày kê: <span className="font-semibold text-slate-700">{item.date}</span>
                                                    </span>
                                                </div>

                                                {/* Hàng 3: Tên bác sĩ bên trái + Mã đơn thuốc ở góc dưới bên phải */}
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0 truncate">
                                                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">{item.doctor}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-xs shrink-0">
                                                        {item.prescriptionCode}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mũi tên */}
                                            <ChevronRight
                                                className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                                                    }`}
                                            />
                                        </div>
                                    </Paper>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                Không tìm thấy đơn thuốc nào phù hợp.
                            </div>
                        )}
                    </div>
                </Paper>

                {/* ======================================================== */}
                {/* CỘT PHẢI: CHI TIẾT ĐƠN THUỐC                             */}
                {/* ======================================================== */}
                {currentPrescription && (
                    <Paper
                        id="printable-prescription"
                        variant="outlined"
                        sx={{
                            borderRadius: '8px',
                            borderColor: '#e2e8f0',
                            p: { xs: 2.5, sm: 3 },
                            backgroundColor: '#ffffff',
                        }}
                        className="space-y-5 shadow-xs"
                    >
                        {/* Header chi tiết đơn thuốc + Nút In MUI */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600 shrink-0">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                                        {currentPrescription.title}
                                    </h1>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Mã đơn: <span className="font-semibold text-slate-800">{currentPrescription.prescriptionCode}</span>
                                        {currentPrescription.branchName && (
                                            <span className="ml-2 pl-2 border-l border-slate-200">
                                                Cơ sở: <span className="font-semibold text-slate-800">{currentPrescription.branchName}</span>
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Printer className="h-4 w-4" />}
                                onClick={handlePrint}
                                disabled={loadingPrint}
                                className="no-print"
                                sx={{
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    borderColor: '#2563eb',
                                    color: '#2563eb',
                                    px: 2,
                                    py: 0.8,
                                    '&:hover': {
                                        backgroundColor: '#eff6ff',
                                        borderColor: '#1d4ed8',
                                    },
                                }}
                            >
                                {loadingPrint ? 'Đang tải bản in...' : 'In đơn thuốc'}
                            </Button>
                        </div>

                        {/* 3 Thẻ thông tin tóm tắt: Mã đơn, Ngày kê, Bác sĩ */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: '6px',
                                    borderColor: '#e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    p: 1.5,
                                }}
                                className="flex items-center gap-2.5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                    <Hash className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        Mã đơn
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                        {currentPrescription.prescriptionCode}
                                    </p>
                                </div>
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: '6px',
                                    borderColor: '#e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    p: 1.5,
                                }}
                                className="flex items-center gap-2.5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                    <Calendar className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        Ngày kê đơn
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                        {currentPrescription.date}
                                    </p>
                                </div>
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: '6px',
                                    borderColor: '#e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    p: 1.5,
                                }}
                                className="flex items-center gap-2.5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                    <User className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        Bác sĩ kê đơn
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                        {currentPrescription.doctor}
                                    </p>
                                </div>
                            </Paper>
                        </div>

                        {/* Thông tin Chi nhánh & Cơ sở khám bệnh (lấy từ getDentistAddressById) */}
                        {(currentPrescription.branchAddress || currentPrescription.branchName) && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: '6px',
                                    borderColor: '#e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    p: 1.5,
                                }}
                                className="flex items-start gap-2.5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                    <MapPin className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                            Cơ sở khám bệnh
                                        </p>
                                        {currentPrescription.dentalClinicName && (
                                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-xs">
                                                {currentPrescription.dentalClinicName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                                        {currentPrescription.branchName || 'Phòng khám Nha khoa'}
                                    </p>
                                    {currentPrescription.branchAddress && (
                                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                                            Địa chỉ: {currentPrescription.branchAddress}
                                        </p>
                                    )}
                                </div>
                            </Paper>
                        )}

                        {/* Bảng Danh sách thuốc dùng MUI Table */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-2.5">
                                Danh sách thuốc ({currentPrescription.medicines.length} loại thuốc)
                            </h3>

                            <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={{
                                    borderRadius: '6px',
                                    borderColor: '#e2e8f0',
                                    overflowX: { xs: 'auto', lg: 'hidden' },
                                }}
                            >
                                <Table size="small" sx={{ width: '100%', minWidth: { xs: 580, lg: '100%' } }}>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#64748b',
                                                    py: 1.2,
                                                    width: 44,
                                                    borderColor: '#e2e8f0',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                STT
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#64748b',
                                                    py: 1.2,
                                                    borderColor: '#e2e8f0',
                                                    minWidth: 150,
                                                }}
                                            >
                                                Tên thuốc
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#64748b',
                                                    py: 1.2,
                                                    borderColor: '#e2e8f0',
                                                    minWidth: 180,
                                                }}
                                            >
                                                Liều dùng
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#64748b',
                                                    py: 1.2,
                                                    borderColor: '#e2e8f0',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                Số lượng
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#64748b',
                                                    py: 1.2,
                                                    borderColor: '#e2e8f0',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                Đơn vị
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#64748b',
                                                    py: 1.2,
                                                    borderColor: '#e2e8f0',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                Đơn giá
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#64748b',
                                                    py: 1.2,
                                                    borderColor: '#e2e8f0',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                Thành tiền
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {currentPrescription.medicines.length > 0 ? (
                                            currentPrescription.medicines.map((med) => (
                                                <TableRow
                                                    key={med.stt}
                                                    sx={{
                                                        '&:hover': { backgroundColor: '#f8fafc' },
                                                        transition: 'background-color 0.15s',
                                                    }}
                                                >
                                                    <TableCell
                                                        align="center"
                                                        sx={{
                                                            fontSize: '12px',
                                                            color: '#64748b',
                                                            borderColor: '#f1f5f9',
                                                            py: 1.3,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {med.stt}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            color: '#0f172a',
                                                            borderColor: '#f1f5f9',
                                                            py: 1.3,
                                                            minWidth: 150,
                                                        }}
                                                    >
                                                        <div>
                                                            <p className="font-bold text-slate-800">{med.name}</p>
                                                            {med.medicineCode && (
                                                                <p className="text-[10px] text-slate-400 font-medium">
                                                                    {med.medicineCode}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontSize: '12px',
                                                            color: '#334155',
                                                            borderColor: '#f1f5f9',
                                                            py: 1.3,
                                                            minWidth: 180,
                                                        }}
                                                    >
                                                        {med.dosage}
                                                    </TableCell>
                                                    <TableCell
                                                        align="center"
                                                        sx={{
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            color: '#0f172a',
                                                            borderColor: '#f1f5f9',
                                                            py: 1.3,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {med.quantity}
                                                    </TableCell>
                                                    <TableCell
                                                        align="center"
                                                        sx={{
                                                            fontSize: '12px',
                                                            color: '#64748b',
                                                            borderColor: '#f1f5f9',
                                                            py: 1.3,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {med.unit}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontSize: '12px',
                                                            color: '#475569',
                                                            borderColor: '#f1f5f9',
                                                            py: 1.3,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {med.unitPrice ? `${med.unitPrice.toLocaleString('vi-VN')} đ` : '-'}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            color: '#047857',
                                                            borderColor: '#f1f5f9',
                                                            py: 1.3,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {med.totalPrice ? `${med.totalPrice.toLocaleString('vi-VN')} đ` : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    align="center"
                                                    sx={{ py: 3, color: '#94a3b8', fontSize: '12px' }}
                                                >
                                                    Đơn thuốc chưa có danh mục thuốc chi tiết.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Tổng tiền đơn thuốc */}
                                {currentPrescription.totalAmount > 0 && (
                                    <div className="flex justify-end items-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs">
                                        <span className="text-slate-500 font-medium">Tổng tiền đơn thuốc:</span>
                                        <span className="text-sm font-black text-emerald-700">
                                            {currentPrescription.totalAmount.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                )}
                            </TableContainer>
                        </div>

                        {/* Lời khuyên từ bác sĩ (Xử lý HTML chuẩn từ react-quill-new) */}
                        <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: '6px',
                                backgroundColor: '#eff6ff',
                                border: '1px dashed #93c5fd',
                                p: 2,
                            }}
                        >
                            <div className="flex items-start gap-2.5">

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1.5">
                                        Lời khuyên từ bác sĩ
                                    </h4>
                                    {!isAdviceEmpty(currentPrescription.doctorAdvice) ? (
                                        <div className="ql-snow">
                                            <div
                                                className="ql-editor !p-0 !min-h-0 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal"
                                                dangerouslySetInnerHTML={{ __html: currentPrescription.doctorAdvice }}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">
                                            Bác sĩ không có lời khuyên thêm cho đơn thuốc này.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Paper>
                    </Paper>
                )}
            </div>

            {/* Modal Xem trước và In Đơn Thuốc Y Khoa (chuẩn như Role Bác sĩ) */}
            <PrescriptionPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                prescription={printSnapshot}
                patient={printPatientData}
            />
        </div>
    );
}

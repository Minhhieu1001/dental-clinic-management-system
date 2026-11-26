import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    FileText,
    Stethoscope,
    Search,
    RotateCcw,
    RefreshCw,
    Phone,
    Mail,
    Activity,
    Eye,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Download,
    ClipboardList,
    Sparkles,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
} from '@mui/material';

import Loading from '../../../components/ui/Loading';
import MonthYearPicker from '../../../components/common/MonthYearPicker';
import MedicalRecordDetailModal from './components/MedicalRecordDetailModal';
import { formatDateDisplay, calculateAge } from './components/medicalRecordDictionaries';

import { getPatients } from '../../../services/patient.service';
import {
    getAllMedicalRecords,
    getMedicalRecordById,
} from '../../../services/medicalRecord.service';
import { getExaminationResultsByMedicalRecordId } from '../../../services/examinationResult.service';
import { getTreatmentPlansByPatientId } from '../../../services/treatmentPlan.service';
import { getPrescriptions } from '../../../services/prescription.service';
import { getDentistsList } from '../../../services/dentist.service';
import { getXrayAnalysisHistory } from '../../../services/xrayAi.service';

export default function MedicalRecordList() {
    // State danh sách tổng
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [dentists, setDentists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState('ALL');
    const [doctorFilter, setDoctorFilter] = useState('ALL');
    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState('ALL');

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Detail Modal State
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Data chi tiết của hồ sơ đang mở
    const [detailExams, setDetailExams] = useState([]);
    const [detailPlans, setDetailPlans] = useState([]);
    const [detailPrescriptions, setDetailPrescriptions] = useState([]);
    const [detailXrays, setDetailXrays] = useState([]);
    const [xrayError, setXrayError] = useState(false);

    // Tải dữ liệu từ API thực tế kèm theo bộ lọc
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (genderFilter !== 'ALL') params.gender = genderFilter;
            if (doctorFilter !== 'ALL') params.dentistName = doctorFilter;
            if (selectedYear !== 'ALL') params.year = parseInt(selectedYear, 10);
            if (selectedMonth !== 'ALL') params.month = parseInt(selectedMonth, 10);

            const [patientsRes, recordsRes, dentistsRes] = await Promise.allSettled([
                getPatients().catch(() => []),
                getAllMedicalRecords(params).catch(() => []),
                getDentistsList().catch(() => []),
            ]);

            const rawPatients = patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value) ? patientsRes.value : [];
            const rawRecords = recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value) ? recordsRes.value : [];
            const rawDentists = dentistsRes.status === 'fulfilled' && Array.isArray(dentistsRes.value?.data || dentistsRes.value)
                ? (dentistsRes.value?.data || dentistsRes.value)
                : [];

            setDentists(rawDentists);

            // Gộp thông tin bệnh nhân và bác sĩ vào record
            const patientMap = new Map();
            rawPatients.forEach((p) => {
                if (p.id) patientMap.set(String(p.id), p);
                if (p.patientId) patientMap.set(String(p.patientId), p);
                if (p.patientCode) patientMap.set(String(p.patientCode), p);
                if (p.code) patientMap.set(String(p.code), p);
            });

            const dentistMap = new Map();
            rawDentists.forEach((d) => {
                if (d.id) dentistMap.set(String(d.id), d.fullName || d.name || d.dentistName);
                if (d.dentistId) dentistMap.set(String(d.dentistId), d.fullName || d.name || d.dentistName);
                if (d.userId) dentistMap.set(String(d.userId), d.fullName || d.name || d.dentistName);
            });

            const merged = rawRecords.map((rec) => {
                const pat = patientMap.get(String(rec.patientId || rec.patient?.id || '')) || rec.patient || {};
                const dentistName =
                    rec.dentistName ||
                    dentistMap.get(String(rec.dentistId || rec.doctorId || rec.assignedDoctorId || '')) ||
                    rec.doctorName ||
                    'BS. Nha khoa';

                const displayCode = rec.medicalRecordCode || rec.recordCode || (rec.id ? `HSBA-${String(rec.id).replace(/-/g, '').slice(0, 6).toUpperCase()}` : 'HSBA-00001');

                return {
                    ...rec,
                    id: rec.id || rec.medicalRecordId,
                    recordCode: displayCode,
                    patientId: pat.id || rec.patientId,
                    patientCode: rec.patientCode || pat.patientCode || pat.code,
                    patientName: rec.patientName || pat.fullName || pat.name || 'Bệnh nhân',
                    phone: rec.patientPhone || pat.phone || pat.phoneNumber || rec.phone || '',
                    email: rec.patientEmail || pat.email || rec.email || '',
                    gender: rec.patientGender || pat.gender || rec.gender || 'OTHER',
                    dateOfBirth: rec.patientDob || pat.dateOfBirth || pat.dob || rec.dateOfBirth,
                    cccd: rec.patientCccd || pat.cccd || pat.idCard || pat.citizenId || rec.cccd || '',
                    address: rec.patientAddress || pat.address || rec.address || '',
                    contactName: rec.contactName || '',
                    contactPhone: rec.contactPhone || '',
                    contactRelationship: rec.contactRelationship || '',
                    allergies: rec.allergies || pat.allergies || '',
                    systemicDiseases: rec.systemicDisease ? [rec.systemicDisease] : (pat.systemicDiseases || []),
                    currentMedications: rec.currentMedications || pat.currentMedications || '',
                    surgicalHistory: rec.surgicalHistory || pat.surgicalHistory || '',
                    dentistName: dentistName,
                    dentistId: rec.dentistId || rec.doctorId,
                    createdAt: rec.recordDate || rec.createdAt || rec.createdDate || new Date().toISOString(),
                    status: rec.status || 'ACTIVE',
                    avatar: pat.avatar || pat.profilePicture || null,
                };
            });

            // Sắp xếp hồ sơ mới nhất lên đầu
            merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setMedicalRecords(merged);
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu hồ sơ bệnh án:', err);
            toast.error('Không thể tải danh sách hồ sơ bệnh án!');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, genderFilter, doctorFilter, selectedYear, selectedMonth]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    // Mở modal chi tiết hồ sơ bệnh án và tải dữ liệu 4 tabs
    const handleOpenRecordDetail = async (record) => {
        setSelectedRecord(record);
        setDetailModalOpen(true);
        setLoadingDetail(true);
        setDetailXrays([]);
        setXrayError(false);

        try {
            const patientId = record.patientId;
            const recordId = record.id;

            const [singleRecordRes, examsRes, plansRes, presRes, xrayRes] = await Promise.allSettled([
                recordId ? getMedicalRecordById(recordId).catch(() => null) : Promise.resolve(null),
                recordId ? getExaminationResultsByMedicalRecordId(recordId).catch(() => []) : Promise.resolve([]),
                patientId ? getTreatmentPlansByPatientId(patientId).catch(() => []) : Promise.resolve([]),
                patientId ? getPrescriptions({ patientId }).catch(() => []) : Promise.resolve([]),
                recordId ? getXrayAnalysisHistory({ medicalRecordId: recordId }) : Promise.resolve([]),
            ]);

            // 1. Cập nhật thông tin chi tiết hồ sơ
            if (singleRecordRes.status === 'fulfilled' && singleRecordRes.value) {
                const fullRec = singleRecordRes.value?.data || singleRecordRes.value;
                if (fullRec && typeof fullRec === 'object') {
                    setSelectedRecord((prev) => ({
                        ...prev,
                        ...fullRec,
                        allergies: fullRec.allergies || prev.allergies,
                        contactName: fullRec.contactName || '',
                        contactPhone: fullRec.contactPhone || '',
                        contactRelationship: fullRec.contactRelationship || '',
                        systemicDiseases: fullRec.systemicDiseases || prev.systemicDiseases,
                        currentMedications: fullRec.currentMedications || prev.currentMedications,
                        surgicalHistory: fullRec.surgicalHistory || prev.surgicalHistory,
                    }));
                }
            }

            // 2. Tab 1: Khám lâm sàng & chẩn đoán
            let loadedExams = [];
            if (examsRes.status === 'fulfilled') {
                const rawEx = examsRes.value?.data || examsRes.value;
                if (Array.isArray(rawEx)) {
                    loadedExams = rawEx;
                }
            }
            setDetailExams(loadedExams);

            // 3. Tab 2: Kế hoạch điều trị
            let loadedPlans = [];
            if (plansRes.status === 'fulfilled') {
                const rawPlans = plansRes.value?.data || plansRes.value;
                if (Array.isArray(rawPlans)) {
                    loadedPlans = rawPlans;
                }
            }
            setDetailPlans(loadedPlans);

            // 4. Tab 3: Đơn thuốc
            let loadedPrescriptions = [];
            if (presRes.status === 'fulfilled') {
                const rawPres = presRes.value?.data || presRes.value;
                if (Array.isArray(rawPres)) {
                    loadedPrescriptions = rawPres;
                } else if (rawPres?.items && Array.isArray(rawPres.items)) {
                    loadedPrescriptions = rawPres.items;
                }
            }
            setDetailPrescriptions(loadedPrescriptions);
            if (xrayRes.status === 'fulfilled') {
                setDetailXrays(xrayRes.value);
            } else {
                setXrayError(true);
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết hồ sơ bệnh án:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu chi tiết của hồ sơ bệnh án!');
        } finally {
            setLoadingDetail(false);
        }
    };

    // Danh sách các bác sĩ duy nhất trong hệ thống để lọc
    const doctorOptions = useMemo(() => {
        const set = new Set();
        dentists.forEach((d) => {
            const name = d.fullName || d.name || d.dentistName;
            if (name) set.add(name);
        });
        medicalRecords.forEach((r) => {
            if (r.dentistName && r.dentistName !== 'BS. Nha khoa') {
                set.add(r.dentistName);
            }
        });
        return Array.from(set);
    }, [dentists, medicalRecords]);

    // Lọc hồ sơ theo Search & Dropdowns (kết hợp API + lọc tức thì)
    const filteredRecords = useMemo(() => {
        return medicalRecords.filter((rec) => {
            // 1. Text Search (Mã hồ sơ, Mã BN, Họ tên, SĐT, CCCD)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchCode = String(rec.recordCode || rec.medicalRecordCode || '').toLowerCase().includes(q);
                const matchPatientCode = String(rec.patientCode || '').toLowerCase().includes(q);
                const matchName = String(rec.patientName || '').toLowerCase().includes(q);
                const matchPhone = String(rec.phone || '').toLowerCase().includes(q);
                const matchCccd = String(rec.cccd || '').toLowerCase().includes(q);
                if (!matchCode && !matchPatientCode && !matchName && !matchPhone && !matchCccd) {
                    return false;
                }
            }

            // 2. Giới tính
            if (genderFilter !== 'ALL') {
                const recGender = String(rec.gender || '').toUpperCase();
                if (recGender !== genderFilter.toUpperCase()) return false;
            }

            // 3. Bác sĩ phụ trách
            if (doctorFilter !== 'ALL') {
                const recDoctor = String(rec.dentistName || '').toLowerCase().trim();
                const targetDoctor = doctorFilter.toLowerCase().trim();
                if (recDoctor !== targetDoctor) return false;
            }

            // 4. Năm tạo & Tháng tạo
            if (rec.createdAt) {
                const d = new Date(rec.createdAt);
                if (!isNaN(d.getTime())) {
                    if (selectedYear !== 'ALL') {
                        if (d.getFullYear().toString() !== selectedYear) return false;
                    }
                    if (selectedMonth !== 'ALL') {
                        const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
                        if (mStr !== selectedMonth) return false;
                    }
                }
            }

            return true;
        });
    }, [medicalRecords, searchQuery, genderFilter, doctorFilter, selectedYear, selectedMonth]);

    // Thống kê nhanh KPI
    const stats = useMemo(() => {
        const total = filteredRecords.length;
        const inTreatment = filteredRecords.filter((r) => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS' || !r.status).length;
        const completed = filteredRecords.filter((r) => r.status === 'COMPLETED').length;

        // Hồ sơ mới trong tháng hiện tại
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();
        const newThisMonth = filteredRecords.filter((r) => {
            if (!r.createdAt) return false;
            const d = new Date(r.createdAt);
            return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear;
        }).length;

        return { total, inTreatment, completed, newThisMonth };
    }, [filteredRecords]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setGenderFilter('ALL');
        setDoctorFilter('ALL');
        setSelectedYear('ALL');
        setSelectedMonth('ALL');
        setPage(0);
    };

    // Xuất file CSV danh sách hồ sơ
    const handleExportCSV = () => {
        if (filteredRecords.length === 0) {
            toast.error('Không có dữ liệu để xuất file!');
            return;
        }

        const headers = [
            'STT',
            'Mã hồ sơ',
            'Mã bệnh nhân',
            'Họ tên bệnh nhân',
            'Số điện thoại',
            'Giới tính',
            'Ngày sinh',
            'CCCD',
            'Địa chỉ',
            'Bác sĩ phụ trách',
            'Trạng thái',
            'Ngày tạo',
        ];

        const rows = filteredRecords.map((r, idx) => [
            idx + 1,
            r.recordCode,
            r.patientCode,
            `"${r.patientName}"`,
            `"${r.phone}"`,
            r.gender === 'FEMALE' ? 'Nữ' : r.gender === 'MALE' ? 'Nam' : 'Khác',
            formatDateDisplay(r.dateOfBirth),
            `"${r.cccd}"`,
            `"${r.address}"`,
            `"${r.dentistName}"`,
            r.status,
            formatDateDisplay(r.createdAt),
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Danh_sach_ho_so_benh_an_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Đã xuất danh sách hồ sơ ra file CSV thành công!');
    };

    return (
        <div className="space-y-4 p-1 w-full">
            {/* 1. TOP HEADER TOOLBAR & BREADCRUMB */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-slate-500 font-bold text-base sm:text-lg">
                            <ClipboardList size={18} className="text-slate-400" />
                            Hồ sơ bệnh án
                        </span>
                        <ChevronRight size={16} className="text-slate-400" />
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                            <Stethoscope size={22} className="text-teal-700" />
                            <span>Quản lý hồ sơ bệnh án</span>
                        </h1>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Theo dõi toàn diện hồ sơ bệnh nhân, lịch sử điều trị, kế hoạch phác đồ và đơn thuốc nha khoa
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 rounded-sm bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-800 shadow-2xs transition-all cursor-pointer"
                        title="Xuất danh sách ra file CSV"
                    >
                        <Download size={14} />
                        <span className="hidden sm:inline">Xuất CSV</span>
                    </button>

                    <button
                        onClick={() => {
                            fetchData();
                            toast.success('Đã làm mới dữ liệu hồ sơ bệnh án!');
                        }}
                        disabled={loading}
                        title="Làm mới dữ liệu"
                        className="flex h-9 w-9 items-center justify-center rounded-sm bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-teal-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin text-teal-700' : ''} />
                    </button>
                </div>
            </div>

            {/* 2. SUMMARY KPI STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Card 1: Tổng hồ sơ */}
                <div className="bg-white p-3.5 rounded-sm border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng hồ sơ bệnh án</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Lưu trữ trên toàn hệ thống</p>
                    </div>
                    <div className="w-11 h-11 rounded-sm bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                        <FileText size={22} />
                    </div>
                </div>

                {/* Card 2: Đang điều trị */}
                <div className="bg-white p-3.5 rounded-sm border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Đang điều trị</p>
                        <p className="text-2xl font-black text-teal-800 mt-0.5">{stats.inTreatment}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Bệnh nhân có lộ trình đang chạy</p>
                    </div>
                    <div className="w-11 h-11 rounded-sm bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                        <Activity size={22} />
                    </div>
                </div>

                {/* Card 3: Hoàn thành điều trị */}
                <div className="bg-white p-3.5 rounded-sm border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã hoàn thành</p>
                        <p className="text-2xl font-black text-emerald-800 mt-0.5">{stats.completed}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Đã kết thúc kế hoạch phác đồ</p>
                    </div>
                    <div className="w-11 h-11 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={22} />
                    </div>
                </div>

                {/* Card 4: Hồ sơ mới trong tháng */}
                <div className="bg-white p-3.5 rounded-sm border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Hồ sơ mới tháng này</p>
                        <p className="text-2xl font-black text-amber-800 mt-0.5">{stats.newThisMonth}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Khởi tạo trong tháng hiện tại</p>
                    </div>
                    <div className="w-11 h-11 rounded-sm bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                        <Sparkles size={22} />
                    </div>
                </div>
            </div>

            {/* 3. SEARCH & FILTER TOOLBAR */}
            <div className="bg-white p-3 rounded-sm border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                    {/* Main search box (Thu nhỏ gọn gàng) */}
                    <div className="w-full sm:w-72 lg:w-80 shrink-0">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="Tìm Mã HS, Tên BN, SĐT, CCCD..."
                                className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Filter dropdowns in single row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Giới tính */}
                        <div className="w-28 sm:w-32">
                            <select
                                value={genderFilter}
                                onChange={(e) => {
                                    setGenderFilter(e.target.value);
                                    setPage(0);
                                }}
                                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-900 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">Tất cả giới tính</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="MALE">Nam</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>

                        {/* Bác sĩ phụ trách */}
                        <div className="w-36 sm:w-44">
                            <select
                                value={doctorFilter}
                                onChange={(e) => {
                                    setDoctorFilter(e.target.value);
                                    setPage(0);
                                }}
                                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-900 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">Tất cả bác sĩ phụ trách</option>
                                {doctorOptions.map((doc) => (
                                    <option key={doc} value={doc}>
                                        {doc}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Bộ lọc Tháng & Năm hiện đại (Căn lề phải để không bị tràn màn hình) */}
                        <MonthYearPicker
                            selectedYear={selectedYear}
                            selectedMonth={selectedMonth}
                            align="right"
                            onYearChange={(y) => {
                                setSelectedYear(y);
                                setPage(0);
                            }}
                            onMonthChange={(m) => {
                                setSelectedMonth(m);
                                setPage(0);
                            }}
                        />

                        {/* Nút đặt lại bộ lọc */}
                        <button
                            onClick={handleResetFilters}
                            title="Đặt lại bộ lọc"
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer border border-slate-300 shrink-0"
                        >
                            <RotateCcw size={13} />
                            <span className="hidden sm:inline">Đặt lại</span>
                        </button>
                    </div>
                </div>

                {/* Tip: double click */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                    <span>
                        Hiển thị <strong>{filteredRecords.length}</strong> hồ sơ bệnh án
                    </span>
                </div>
            </div>

            {/* 4. MEDICAL RECORDS TABLE */}
            <Paper elevation={0} className="relative rounded-sm border border-slate-200 overflow-hidden bg-white shadow-xs min-h-[300px]">
                {loading && (
                    <Loading
                        overlay={true}
                        title="Đang tải danh sách hồ sơ bệnh án..."
                        subtitle="Hệ thống đang truy xuất thông tin lâm sàng và bệnh nhân"
                        size="md"
                    />
                )}

                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead className="bg-slate-100/80">
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1', width: 60 }} align="center">
                                    STT
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                    Mã hồ sơ
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                    Bệnh nhân & Mã BN
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                    Số điện thoại / Email
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                    Giới tính & Tuổi
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                    Ngày tạo hồ sơ
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                    Bác sĩ phụ trách
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }} align="center">
                                    Hành động
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <AlertCircle size={30} className="text-amber-500" />
                                            <p className="font-bold text-xs text-slate-700">Không tìm thấy hồ sơ bệnh án nào phù hợp.</p>
                                            <p className="text-[11px] text-slate-400">Vui lòng thử tìm kiếm với từ khóa hoặc bộ lọc khác.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((rec, index) => {
                                        const rowNumber = page * rowsPerPage + index + 1;
                                        return (
                                            <TableRow
                                                key={rec.id}
                                                hover
                                                onDoubleClick={() => handleOpenRecordDetail(rec)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': { backgroundColor: '#f8fafc' },
                                                    transition: 'background-color 0.15s ease',
                                                }}
                                            >
                                                {/* STT */}
                                                <TableCell align="center" sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                    {rowNumber}
                                                </TableCell>

                                                {/* Mã hồ sơ */}
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <span className="font-bold text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-sm">
                                                        {rec.recordCode}
                                                    </span>
                                                </TableCell>

                                                {/* Bệnh nhân & Mã BN */}
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        {rec.avatar ? (
                                                            <img
                                                                src={rec.avatar}
                                                                alt={rec.patientName}
                                                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                                {rec.patientName?.charAt(0) || 'P'}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-xs text-slate-900 truncate">{rec.patientName}</p>
                                                            <span className="text-[11px] font-semibold text-slate-500">Mã: {rec.patientCode}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Số điện thoại / Email */}
                                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                                    <p className="font-bold text-slate-800 flex items-center gap-1">
                                                        <Phone size={12} className="text-slate-400" />
                                                        {rec.phone || 'Chưa cập nhật'}
                                                    </p>
                                                    {rec.email && (
                                                        <p className="text-[11px] text-slate-500 truncate max-w-[160px] flex items-center gap-1">
                                                            <Mail size={11} className="text-slate-400" />
                                                            {rec.email}
                                                        </p>
                                                    )}
                                                </TableCell>

                                                {/* Giới tính & Tuổi */}
                                                <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                    <p className="font-semibold text-slate-800">
                                                        {rec.gender === 'FEMALE' ? '♀ Nữ' : rec.gender === 'MALE' ? '♂ Nam' : 'Khác'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {calculateAge(rec.dateOfBirth)} tuổi ({formatDateDisplay(rec.dateOfBirth)})
                                                    </p>
                                                </TableCell>

                                                {/* Ngày tạo hồ sơ */}
                                                <TableCell sx={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    {formatDateDisplay(rec.createdAt)}
                                                </TableCell>

                                                {/* Bác sĩ phụ trách */}
                                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f766e', whiteSpace: 'nowrap' }}>
                                                    {rec.dentistName}
                                                </TableCell>

                                                {/* Hành động */}
                                                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                                    <button
                                                        onClick={() => handleOpenRecordDetail(rec)}
                                                        className="inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                                        title="Xem chi tiết hồ sơ bệnh án"
                                                    >
                                                        <Eye size={13} />
                                                        <span>Chi tiết</span>
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    component="div"
                    count={filteredRecords.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Số dòng/trang:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
                    sx={{ borderTop: '1px solid #e2e8f0', fontSize: '0.75rem' }}
                />
            </Paper>

            {/* 5. FULL-SCREEN / COMPREHENSIVE DETAIL MODAL */}
            <MedicalRecordDetailModal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                selectedRecord={selectedRecord}
                detailExams={detailExams}
                detailPlans={detailPlans}
                detailPrescriptions={detailPrescriptions}
                detailXrays={detailXrays}
                xrayError={xrayError}
                loadingDetail={loadingDetail}
            />
        </div>
    );
}

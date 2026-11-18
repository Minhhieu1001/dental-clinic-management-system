import { useState, useEffect } from 'react';
import { Menu, Tooltip } from '@mui/material';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
    Alert,
    Dialog,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Button,
    Chip,
    Avatar,
    Tabs,
    Tab,
    Paper,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    LinearProgress,
    Stack,
    Divider,
    CircularProgress,
    Select,
    MenuItem,
    Pagination,
} from '@mui/material';
import {
    Calendar,
    Gift,
    Heart,
    Link2,
    Megaphone,
    Phone,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    X,
    Plus,
    Mail,
    MapPin,
    Clock,
    Check,
    Star,
    Tag,
    Headphones,
    Receipt,
    User,
    CreditCard,
} from 'lucide-react';
import customerCareService from '../../../../services/customerCare.service';
import { getPatientById } from '../../../../services/patient.service';
import { getTreatmentPlansByPatientId } from '../../../../services/treatmentPlan.service';
import { getInvoicesByPatientId } from '../../../../services/invoice.service';
import { getFollowUpAppointments } from '../../../../services/followUpAppointment.service';
import { getTodayPromotions } from '../../../../services/promotion.service';
import { getEmployeesList } from '../../../../services/employee.service';
import CustommerCareModal from './components/CustommerCareModal';
import CareRecordDialog from './components/CareRecordDialog';
import Loading from '../../../../components/ui/Loading';
import { getSuggestionDateLabel } from './suggestionDate';
import {
    formatDate as formatDateValue,
    formatDateTime as formatDateTimeValue,
    calculateAge,
    calculateDaysUntilBirthday,
} from '../../../../utils/dateUtils';


// Custom Tooth SVG with MUI green theme
function IconTooth({ size = 18, color = '#15803d' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 3C4.5 3 3 5 3 8c0 3.5 1.5 6 2 9.5.5 3.5 2 4.5 3.5 4.5 1.5 0 2-2 3.5-2s2 2 3.5 2c1.5 0 3-1 3.5-4.5.5-3.5 2-6 2-9.5 0-3-1.5-5-4-5-2 0-3 1.5-4.5 1.5S9 3 7 3z" />
        </svg>
    );
}

const money = (val) => (val == null || !Number.isFinite(Number(val)) ? '' : Number(val).toLocaleString('vi-VN') + ' đ');
const formatDate = (value) => formatDateValue(value, '');
const formatDateTime = (value) => formatDateTimeValue(value, '');
const paymentLabels = {
    PAID: 'Đã thanh toán',
    PARTIALLY_PAID: 'Thanh toán một phần',
    UNPAID: 'Chưa thanh toán',
    CANCELLED: 'Đã hủy',
};

export default function CustomerCareDetail({
    open,
    onClose,
    customer: rawCustomer,
    onPrev,
    onNext,
    currentIndex = 1,
    totalCount = null,
}) {
    const routeParams = useParams();
    const patientId = open === undefined ? routeParams.id : rawCustomer?.id;

    const [activeTab, setActiveTab] = useState(0);
    const [invoiceMonthFilter, setInvoiceMonthFilter] = useState('ALL');
    const [careMonthFilter, setCareMonthFilter] = useState('ALL');
    const [recentCarePage, setRecentCarePage] = useState(1);
    const [tabCarePage, setTabCarePage] = useState(1);
    const [loadResult, setLoadResult] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [careModalOpen, setCareModalOpen] = useState(false);
    const [careRecord, setCareRecord] = useState(null);
    const [careActionMenu, setCareActionMenu] = useState(null);
    const [careModalCategory, setCareModalCategory] = useState('THANK_YOU');

    const [careObjectId, setCareObjectId] = useState('');

    const handleOpenCareModal = (category = 'THANK_YOU', objectId = '') => {
        setCareObjectId(objectId);
        setCareModalCategory(category);
        setCareModalOpen(true);
    };
    const isOpen = open !== false;

    useEffect(() => {
        if (!patientId || !isOpen) return;
        let cancelled = false;
        Promise.all([
            getPatientById(patientId),
            customerCareService.getAll(),
            customerCareService.getSuggestions({ patientId }),
            getTreatmentPlansByPatientId(patientId),
            getInvoicesByPatientId(patientId),
            getFollowUpAppointments({ patientId }),
            getTodayPromotions(),
            getEmployeesList(),
        ])
            .then(([patient, allCare, suggestions, treatmentPlans, invoices, followUps, promotions, employees]) => {
                if (cancelled) return;
                if (patient?.id !== patientId || ![allCare, suggestions, treatmentPlans, invoices, followUps, promotions, employees].every(Array.isArray)) {
                    throw new Error('Dữ liệu trả về không hợp lệ.');
                }
                setLoadResult({
                    patientId,
                    reloadKey,
                    data: {
                        patient,
                        careHistory: allCare.filter((care) => care.patientId === patientId),
                        suggestions,
                        treatmentPlans,
                        invoices,
                        followUps,
                        promotions,
                        employees,
                    },
                });
            })
            .catch(() => {
                if (!cancelled) setLoadResult({ patientId, reloadKey, error: 'Không thể tải hồ sơ chăm sóc. Vui lòng thử lại.' });
            });
        return () => { cancelled = true; };
    }, [patientId, isOpen, reloadKey]);

    const loaded = loadResult?.patientId === patientId && loadResult?.reloadKey === reloadKey;
    const loading = Boolean(patientId) && !loaded;
    const loadError = loaded ? loadResult.error : null;
    const { patient, careHistory = [], suggestions = [], treatmentPlans = [], invoices = [], followUps = [], promotions = [], employees = [] } =
        loaded && !loadError ? loadResult.data : {};

    const hasPendingDelivery = careHistory.some((care) => ['QUEUED', 'SENDING'].includes(care.status));
    useEffect(() => {
        if (!isOpen || !hasPendingDelivery) return;
        let cancelled = false;
        let inFlight = false;
        const timer = setInterval(async () => {
            if (inFlight) return;
            inFlight = true;
            try {
                const allCare = await customerCareService.getAll();
                if (cancelled || !Array.isArray(allCare)) return;
                setLoadResult((current) => current?.patientId === patientId && current.reloadKey === reloadKey && current.data
                    ? { ...current, data: { ...current.data, careHistory: allCare.filter((care) => care.patientId === patientId) } }
                    : current);
            } catch {
                // Keep the last server-confirmed state and retry on the next poll.
            } finally { inFlight = false; }
        }, 2000);
        return () => { cancelled = true; clearInterval(timer); };
    }, [patientId, reloadKey, isOpen, hasPendingDelivery]);

    if (open !== undefined && !open) return null;
    if (!rawCustomer && !routeParams?.id) return null;

    // Lấy dữ liệu bệnh nhân trực tiếp từ state
    const currentPatient = patient ?? {};
    const vouchers = promotions.filter((promotion) => Boolean(promotion.couponCode));
    const outstandingInvoices = invoices.filter((invoice) => invoice.paymentStatus !== 'CANCELLED');
    const totalDebt = outstandingInvoices.every((invoice) => invoice.remainingAmount != null && Number.isFinite(Number(invoice.remainingAmount)))
        ? outstandingInvoices.reduce((total, invoice) => total + Math.max(0, Number(invoice.remainingAmount)), 0)
        : null;
    const followUpSuggestion = suggestions.find((s) => s.type === 'FOLLOW_UP');
    const daysUntilBirthday = calculateDaysUntilBirthday(currentPatient.dateOfBirth);

    // Lọc hóa đơn theo tháng đã chọn
    const filteredInvoices = invoices.filter((inv) => {
        if (invoiceMonthFilter === 'ALL') return true;
        const dateStr = inv.invoiceDate;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() + 1 === Number(invoiceMonthFilter);
    });

    const getMonthFromDate = (val) => {
        if (!val) return null;
        if (Array.isArray(val) && val.length >= 2) return Number(val[1]);
        if (typeof val === 'string') {
            const clean = val.split('T')[0];
            const parts = clean.split('-');
            if (parts.length >= 2) return Number(parts[1]);
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d.getMonth() + 1;
    };

    const getFollowUpStatusInfo = (dateVal) => {
        if (!dateVal) return { label: 'Chưa có ngày', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
        let itemDate;
        if (Array.isArray(dateVal)) {
            itemDate = new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
        } else if (typeof dateVal === 'string') {
            const clean = dateVal.split('T')[0];
            const parts = clean.split('-');
            if (parts.length === 3) {
                itemDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else {
                itemDate = new Date(dateVal);
            }
        } else {
            itemDate = new Date(dateVal);
        }

        if (isNaN(itemDate.getTime())) {
            return { label: 'Chưa có ngày', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
        }

        const now = new Date();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const itemZero = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();

        if (itemZero < todayZero) {
            return { label: 'Đã qua', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
        } else if (itemZero === todayZero) {
            return { label: 'Hôm nay', color: '#15803d', bg: '#ecfdf3', border: '#86efac' };
        } else {
            return { label: 'Sắp tới', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' };
        }
    };

    // Lọc lịch sử chăm sóc theo tháng đã chọn
    const filteredCareHistory = careHistory.filter((item) => {
        if (careMonthFilter === 'ALL') return true;
        const month = getMonthFromDate(item.createAt || item.createdAt || item.careDate);
        return month === Number(careMonthFilter);
    });

    const recentCarePageSize = 5;
    const totalRecentCarePages = Math.ceil(filteredCareHistory.length / recentCarePageSize);
    const paginatedRecentCare = filteredCareHistory.slice(
        (recentCarePage - 1) * recentCarePageSize,
        recentCarePage * recentCarePageSize
    );

    const tabCarePageSize = 5;
    const totalTabCarePages = Math.ceil(filteredCareHistory.length / tabCarePageSize);
    const paginatedTabCareHistory = filteredCareHistory.slice(
        (tabCarePage - 1) * tabCarePageSize,
        tabCarePage * tabCarePageSize
    );

    const content = (
        <Box sx={{ bgcolor: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 1. TOP HEADER */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '4px',
                            bgcolor: '#ecfdf3',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Headphones size={18} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#166534' }}>
                        Hồ sơ chăm sóc khách hàng
                    </Typography>
                    {loading && <CircularProgress size={16} sx={{ color: '#15803d', ml: 1 }} />}
                </Stack>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {/* Navigation Controls */}
                    {onPrev && onNext && (
                        <Paper
                            variant="outlined"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                                bgcolor: '#f8fafc',
                                borderColor: '#e2e8f0',
                            }}
                        >
                            <IconButton size="small" onClick={onPrev} title="Khách hàng trước" sx={{ p: 0.5 }}>
                                <ChevronLeft size={16} />
                            </IconButton>
                            <Typography sx={{ px: 1, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                                {currentIndex} / {totalCount?.toLocaleString('vi-VN') ?? ''}
                            </Typography>
                            <IconButton size="small" onClick={onNext} title="Khách hàng tiếp theo" sx={{ p: 0.5 }}>
                                <ChevronRight size={16} />
                            </IconButton>
                        </Paper>
                    )}

                    {/* Close button */}
                    {onClose && (
                        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', p: 0.5 }}>
                            <X size={20} />
                        </IconButton>
                    )}
                </Stack>
            </Box>

            {/* 2. BODY: LEFT SIDEBAR (PATIENT INFO) + RIGHT MAIN CONTENT */}
            <DialogContent sx={{ p: 2, bgcolor: '#f8fafc', overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '260px minmax(0, 1fr)' },
                        gap: 2,
                        minWidth: 0,
                        alignItems: 'start',
                    }}
                >
                    {/* === CỘT TRÁI: THÔNG TIN BỆNH NHÂN (Lấy từ getPatientById) === */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: '4px',
                            bgcolor: '#ffffff',
                            borderColor: '#e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.75,
                            minWidth: 0,
                        }}
                    >
                        {/* Avatar & Tên & Mã KH */}
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: '#ecfdf3',
                                    color: '#15803d',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    border: '2px solid #bbf7d0',
                                    flexShrink: 0,
                                }}
                            >
                                {currentPatient.fullName?.charAt(0)?.toUpperCase() ?? ''}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }} noWrap>
                                    {currentPatient.fullName ?? ''}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        size="small"
                                        label={currentPatient.patientCode ?? ''}
                                        sx={{
                                            height: 20,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            bgcolor: '#ecfdf3',
                                            color: '#15803d',
                                            borderRadius: '4px',
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Stack>

                        <Divider sx={{ borderColor: '#f1f5f9' }} />

                        {/* Các thông tin cơ bản của bệnh nhân */}
                        <Stack spacing={1.25} sx={{ fontSize: 12, color: 'text.secondary' }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Calendar size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ fontSize: 12 }}>
                                    {formatDate(currentPatient.dateOfBirth)} {currentPatient.dateOfBirth ? `(${calculateAge(currentPatient.dateOfBirth)} tuổi)` : ''}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <User size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ fontSize: 12 }}>
                                    Giới tính: <strong style={{ color: '#0f172a' }}>{currentPatient.gender === 'MALE' ? 'Nam' : currentPatient.gender === 'FEMALE' ? 'Nữ' : (currentPatient.gender ?? '')}</strong>
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Phone size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                    {currentPatient.phone ?? ''}
                                </Typography>
                            </Stack>

                            {currentPatient.email && currentPatient.email !== '-' && (
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', overflow: 'hidden' }}>
                                    <Mail size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontSize: 12 }} noWrap>
                                        {currentPatient.email}
                                    </Typography>
                                </Stack>
                            )}

                            {currentPatient.address && currentPatient.address !== '-' && (
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', overflow: 'hidden' }}>
                                    <MapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontSize: 12 }} noWrap>
                                        {currentPatient.address}
                                    </Typography>
                                </Stack>
                            )}

                            {currentPatient.cccd && currentPatient.cccd !== '-' && (
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <CreditCard size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontSize: 12 }}>
                                        CCCD: <strong style={{ color: '#0f172a' }}>{currentPatient.cccd}</strong>
                                    </Typography>
                                </Stack>
                            )}

                            {currentPatient.job && currentPatient.job !== '-' && (
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <Tag size={14} color="#64748b" style={{ flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontSize: 12 }}>
                                        Nghề nghiệp: <strong style={{ color: '#0f172a' }}>{currentPatient.job}</strong>
                                    </Typography>
                                </Stack>
                            )}

                            {currentPatient.systemicDisease && !['không', 'khong', 'none', 'no', '-', ''].includes(String(currentPatient.systemicDisease).trim().toLowerCase()) && (
                                <Box sx={{ mt: 0.5, p: 1, bgcolor: '#fef2f2', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                                    <Typography sx={{ fontSize: 11, color: '#b91c1c' }}>
                                        • Bệnh lý: {currentPatient.systemicDisease}
                                    </Typography>
                                </Box>
                            )}

                            {currentPatient.allergies && !['không', 'khong', 'none', 'no', '-', ''].includes(String(currentPatient.allergies).trim().toLowerCase()) && (
                                <Box sx={{ mt: 0.5, p: 1, bgcolor: '#fef2f2', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                                    <Typography sx={{ fontSize: 11, color: '#b91c1c' }}>
                                        • Dị ứng: {currentPatient.allergies}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>

                        <Divider sx={{ borderColor: '#f1f5f9' }} />

                        {/* Nút Tạo chăm sóc */}
                        <Button
                            variant="contained"
                            startIcon={<Plus size={16} />}
                            onClick={() => handleOpenCareModal('THANK_YOU')}
                            sx={{
                                bgcolor: '#15803d',
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: 13,
                                borderRadius: '4px',
                                py: 1,
                                '&:hover': { bgcolor: '#166534' },
                                boxShadow: 'none',
                            }}
                        >
                            Tạo chăm sóc
                        </Button>

                        {/* 3 nút hành động nhanh */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={() => handleOpenCareModal('THANK_YOU')}
                                sx={{
                                    flexDirection: 'column',
                                    p: 0.75,
                                    borderRadius: '4px',
                                    borderColor: '#e2e8f0',
                                    color: '#15803d',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                }}
                            >
                                <Phone size={16} style={{ marginBottom: 4 }} />
                                Gọi điện
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => handleOpenCareModal('THANK_YOU')}
                                sx={{
                                    flexDirection: 'column',
                                    p: 0.75,
                                    borderRadius: '4px',
                                    borderColor: '#e2e8f0',
                                    color: '#15803d',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    lineHeight: 1.1,
                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                }}
                            >
                                <MessageSquare size={16} style={{ marginBottom: 4 }} />
                                Nhắn tin
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => setActiveTab(5)}
                                sx={{
                                    flexDirection: 'column',
                                    p: 0.75,
                                    borderRadius: '4px',
                                    borderColor: '#e2e8f0',
                                    color: '#15803d',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                }}
                            >
                                <Gift size={16} style={{ marginBottom: 4 }} />
                                Gửi voucher
                            </Button>
                        </Box>
                    </Paper>

                    {/* === CỘT PHẢI: CÁC TAB CHỨC NĂNG === */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0, overflow: 'hidden' }}>
                        {/* Tabs Header - Đồng bộ màu xanh lá */}
                        <Paper variant="outlined" sx={{ borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', minWidth: 0 }}>
                            <Tabs
                                value={activeTab}
                                onChange={(_, newVal) => setActiveTab(newVal)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    minHeight: 40,
                                    '& .MuiTab-root': {
                                        minHeight: 40,
                                        py: 1,
                                        px: 2,
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        color: '#64748b',
                                        '&.Mui-selected': {
                                            color: '#15803d',
                                        },
                                    },
                                    '& .MuiTabs-indicator': {
                                        bgcolor: '#15803d',
                                        height: 3,
                                        borderRadius: '2px 2px 0 0',
                                    },
                                }}
                            >
                                <Tab label="Tổng quan" />
                                <Tab label="Tiến trình điều trị" />
                                <Tab label="Danh sách hóa đơn" />
                                <Tab label="Lịch tái khám" />
                                <Tab label="Lịch sử chăm sóc" />
                                <Tab label="Khuyến mãi" />
                            </Tabs>
                        </Paper>

                        {/* TAB 0: TỔNG QUAN */}
                        {activeTab === 0 && (
                            <Stack spacing={1.5} sx={{ minWidth: 0 }}>
                                {/* 4 Thẻ tóm tắt trên cùng: Đảm bảo độ rộng chia đều chuẩn minmax(0, 1fr) */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                                        gap: 1.5,
                                        width: '100%',
                                    }}
                                >
                                    {/* Card 1: Tổng số lần chăm sóc (từ getAll length) */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '4px',
                                            borderColor: '#e2e8f0',
                                            bgcolor: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: '4px',
                                                bgcolor: '#ecfdf3',
                                                color: '#15803d',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <IconTooth size={20} color="#15803d" />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
                                                Tổng chăm sóc
                                            </Typography>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }} noWrap>
                                                {careHistory.length} lần
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: '#15803d',
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                }}
                                            >
                                                Lịch sử tương tác
                                            </Typography>
                                        </Box>
                                    </Paper>

                                    {/* Card 2: Công nợ còn lại (từ getSuggestions) */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '4px',
                                            borderColor: '#e2e8f0',
                                            bgcolor: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: '4px',
                                                bgcolor: '#fef2f2',
                                                color: '#dc2626',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                fontWeight: 700,
                                                fontSize: 16,
                                            }}
                                        >
                                            $
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
                                                Công nợ còn lại
                                            </Typography>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: totalDebt > 0 ? '#dc2626' : '#15803d' }} noWrap>
                                                {money(totalDebt)}
                                            </Typography>
                                            <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
                                                {invoices.length === 0 ? 'Chưa có hóa đơn' : totalDebt == null ? '' : totalDebt > 0 ? 'Còn nợ' : 'Không còn nợ'}
                                            </Typography>
                                        </Box>
                                    </Paper>

                                    {/* Card 3: Lịch tái khám gần nhất (từ getSuggestions) */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '4px',
                                            borderColor: '#e2e8f0',
                                            bgcolor: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: '4px',
                                                bgcolor: '#eff6ff',
                                                color: '#2563eb',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Calendar size={18} />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
                                                Lịch tái khám gần nhất
                                            </Typography>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }} noWrap>
                                                {followUpSuggestion?.suggestedDate ? formatDate(followUpSuggestion.suggestedDate) : 'Chưa có lịch'}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: '#2563eb',
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                }}
                                                title={followUpSuggestion?.suggestedContent}
                                            >
                                                {followUpSuggestion
                                                    ? followUpSuggestion.suggestedContent.replace(/^Nhắc lịch tái khám:\s*/i, '')
                                                    : 'Không có lịch hẹn'}
                                            </Typography>
                                        </Box>
                                    </Paper>

                                    {/* Card 4: Sinh nhật (tự map ngày sinh) */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '4px',
                                            borderColor: '#e2e8f0',
                                            bgcolor: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: '4px',
                                                bgcolor: '#fef3c7',
                                                color: '#d97706',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Gift size={18} />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
                                                Sinh nhật
                                            </Typography>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }} noWrap>
                                                {formatDate(currentPatient.dateOfBirth)}
                                            </Typography>
                                            <Typography sx={{ fontSize: 10, color: '#d97706', fontWeight: 600 }} noWrap>
                                                {daysUntilBirthday === 0
                                                    ? 'Hôm nay sinh nhật!'
                                                    : daysUntilBirthday != null
                                                        ? `(còn ${daysUntilBirthday} ngày)`
                                                        : '-'}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Phần giữa: Lịch chăm sóc sắp tới (getSuggestions) & Gợi ý chăm sóc nhanh */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.25fr) minmax(0, 1fr)' },
                                        gap: 1.5,
                                        width: '100%',
                                        minWidth: 0,
                                    }}
                                >
                                    {/* Left: Lịch chăm sóc sắp tới (Dữ liệu từ getSuggestions) */}
                                    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', minWidth: 0, overflow: 'hidden' }}>
                                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                <Calendar size={16} color="#15803d" />
                                                <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                                                    Lịch chăm sóc sắp tới
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        <Stack spacing={1} sx={{ pt: 1, minWidth: 0 }}>
                                            {suggestions.length > 0 ? (
                                                suggestions.map((item, idx) => {
                                                    let ItemIcon = Calendar;
                                                    let iconColor = '#15803d';
                                                    let badgeBg = '#eff6ff';
                                                    let badgeColor = '#2563eb';

                                                    if (item.type === 'BIRTHDAY') {
                                                        ItemIcon = Gift;
                                                        iconColor = '#d97706';
                                                        badgeBg = '#fef3c7';
                                                        badgeColor = '#b45309';
                                                    } else if (item.type === 'TREATMENT_PROGRESS') {
                                                        ItemIcon = Link2;
                                                        iconColor = '#15803d';
                                                    } else if (item.type === 'DEBT') {
                                                        ItemIcon = Receipt;
                                                        iconColor = '#dc2626';
                                                        badgeBg = '#fef2f2';
                                                        badgeColor = '#dc2626';
                                                    }

                                                    return (
                                                        <Stack
                                                            key={item.patientId + '-' + item.type + '-' + idx}
                                                            direction="row"
                                                            sx={{
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                py: 0.75,
                                                                px: 1,
                                                                borderRadius: '4px',
                                                                bgcolor: '#f8fafc',
                                                                minWidth: 0,
                                                                gap: 1,
                                                                '&:hover': { bgcolor: '#f0fdf4' },
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                                                                <ItemIcon size={14} color={iconColor} style={{ flexShrink: 0 }} />
                                                                <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }} noWrap>
                                                                    {item.suggestedContent}
                                                                </Typography>
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                                                                {item.type !== 'TREATMENT_PROGRESS' && item.suggestedDate && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                                                                    {formatDate(item.suggestedDate)}
                                                                </Typography>}
                                                                <Chip
                                                                    size="small"
                                                                    icon={<Clock size={12} />}
                                                                    label={getSuggestionDateLabel(item)}
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: 10,
                                                                        fontWeight: 600,
                                                                        bgcolor: badgeBg,
                                                                        color: badgeColor,
                                                                        borderRadius: '4px',
                                                                        '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                                                    }}
                                                                />
                                                            </Stack>
                                                        </Stack>
                                                    );
                                                })
                                            ) : (
                                                <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontSize: 12 }}>
                                                    Không có lịch chăm sóc nào cần nhắc trong tháng này
                                                </Box>
                                            )}
                                        </Stack>
                                    </Paper>

                                    {/* Right: Gợi ý chăm sóc nhanh */}
                                    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', minWidth: 0, overflow: 'hidden' }}>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                                            <Star size={16} color="#15803d" />
                                            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                                                Gợi ý chăm sóc nhanh
                                            </Typography>
                                        </Stack>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, pt: 1, width: '100%', minWidth: 0 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Heart size={14} color="#15803d" style={{ flexShrink: 0 }} />}
                                                onClick={() => handleOpenCareModal('THANK_YOU')}
                                                sx={{
                                                    width: '100%',
                                                    minWidth: 0,
                                                    justifyContent: 'flex-start',
                                                    px: 1,
                                                    py: 0.85,
                                                    borderRadius: '4px',
                                                    borderColor: '#e2e8f0',
                                                    textTransform: 'none',
                                                    '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                                }}
                                            >
                                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }} noWrap>
                                                    Cảm ơn sau khám
                                                </Typography>
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                startIcon={<Calendar size={14} color="#15803d" style={{ flexShrink: 0 }} />}
                                                onClick={() => handleOpenCareModal('FOLLOW_UP')}
                                                sx={{
                                                    width: '100%',
                                                    minWidth: 0,
                                                    justifyContent: 'flex-start',
                                                    px: 1,
                                                    py: 0.85,
                                                    borderRadius: '4px',
                                                    borderColor: '#e2e8f0',
                                                    textTransform: 'none',
                                                    '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                                }}
                                            >
                                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }} noWrap>
                                                    Nhắc tái khám
                                                </Typography>
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                startIcon={<Receipt size={14} color="#15803d" style={{ flexShrink: 0 }} />}
                                                onClick={() => handleOpenCareModal('DEBT')}
                                                sx={{
                                                    width: '100%',
                                                    minWidth: 0,
                                                    justifyContent: 'flex-start',
                                                    px: 1,
                                                    py: 0.85,
                                                    borderRadius: '4px',
                                                    borderColor: '#e2e8f0',
                                                    textTransform: 'none',
                                                    '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                                }}
                                            >
                                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }} noWrap>
                                                    Nhắc công nợ
                                                </Typography>
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                startIcon={<Gift size={14} color="#15803d" style={{ flexShrink: 0 }} />}
                                                onClick={() => handleOpenCareModal('BIRTHDAY')}
                                                sx={{
                                                    width: '100%',
                                                    minWidth: 0,
                                                    justifyContent: 'flex-start',
                                                    px: 1,
                                                    py: 0.85,
                                                    borderRadius: '4px',
                                                    borderColor: '#e2e8f0',
                                                    textTransform: 'none',
                                                    '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                                }}
                                            >
                                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }} noWrap>
                                                    Chúc mừng sinh nhật
                                                </Typography>
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                startIcon={<Link2 size={14} color="#15803d" style={{ flexShrink: 0 }} />}
                                                onClick={() => handleOpenCareModal('TREATMENT_PROGRESS')}
                                                sx={{
                                                    width: '100%',
                                                    minWidth: 0,
                                                    justifyContent: 'flex-start',
                                                    px: 1,
                                                    py: 0.85,
                                                    borderRadius: '4px',
                                                    borderColor: '#e2e8f0',
                                                    textTransform: 'none',
                                                    '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                                }}
                                            >
                                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }} noWrap>
                                                    Nhắc tiến trình
                                                </Typography>
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                startIcon={<Megaphone size={14} color="#15803d" style={{ flexShrink: 0 }} />}
                                                onClick={() => handleOpenCareModal('PROMOTION')}
                                                sx={{
                                                    width: '100%',
                                                    minWidth: 0,
                                                    justifyContent: 'flex-start',
                                                    px: 1,
                                                    py: 0.85,
                                                    borderRadius: '4px',
                                                    borderColor: '#e2e8f0',
                                                    textTransform: 'none',
                                                    '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' },
                                                }}
                                            >
                                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }} noWrap>
                                                    Gửi CT khuyến mãi
                                                </Typography>
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Phần dưới: Lịch sử chăm sóc gần đây (Lấy từ getAll đã lọc) */}
                                <Paper variant="outlined" sx={{ borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', overflow: 'hidden', width: '100%', minWidth: 0 }}>
                                    <Stack
                                        direction="row"
                                        sx={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', px: 2, py: 1.25, borderBottom: '1px solid #f1f5f9' }}
                                    >
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Headphones size={16} color="#15803d" />
                                            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                                                Lịch sử chăm sóc gần đây
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                <Typography sx={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                                                    Lọc theo tháng:
                                                </Typography>
                                                <Select
                                                    size="small"
                                                    value={careMonthFilter}
                                                    onChange={(e) => {
                                                        setCareMonthFilter(e.target.value);
                                                        setRecentCarePage(1);
                                                    }}
                                                    sx={{ minWidth: 135, height: 28, fontSize: 11.5, bgcolor: '#ffffff', borderRadius: '4px' }}
                                                >
                                                    <MenuItem value="ALL" sx={{ fontSize: 11.5 }}>Tất cả các tháng</MenuItem>
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                        <MenuItem key={m} value={String(m)} sx={{ fontSize: 11.5 }}>
                                                            Tháng {m}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Stack>

                                        </Stack>
                                    </Stack>

                                    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Thời gian</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Hạng mục</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Nội dung</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Kênh</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Nhân viên</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Kết quả</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredCareHistory.length > 0 ? (
                                                    paginatedRecentCare.map((row) => (
                                                        <TableRow key={row.careTaskId} hover>
                                                            <TableCell sx={{ fontSize: 11.5, fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>
                                                                {formatDateTime(row.createAt)}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                                                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                                    <Heart size={13} color="#15803d" />
                                                                    <span>{row.careCategory ?? ''}</span>
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 11.5, color: '#334155', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    title={row.careContent ?? ''}
                                                                    sx={{
                                                                        fontSize: 11.5,
                                                                        color: '#334155',
                                                                        maxWidth: 260,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        display: 'block',
                                                                    }}
                                                                >
                                                                    {row.careContent ? String(row.careContent).replace(/\r?\n|\r/g, ' ') : ''}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                                                                <Chip
                                                                    size="small"
                                                                    label={row.contactChannel ?? ''}
                                                                    sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: '#f1f5f9', borderRadius: '4px' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                                                                {row.employeeName ?? ''}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                                <Chip
                                                                    size="small"
                                                                    icon={<Check size={12} />}
                                                                    label={{ QUEUED: 'Chờ gửi', SENDING: 'Đang gửi', SENT: 'Đã gửi', FAILED: 'Gửi thất bại', COMPLETED: 'Hoàn thành' }[row.status] ?? row.status ?? ''}
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: 10,
                                                                        fontWeight: 600,
                                                                        bgcolor: row.status === 'COMPLETED' ? '#ecfdf3' : '#eff6ff',
                                                                        color: row.status === 'COMPLETED' ? '#15803d' : '#2563eb',
                                                                        borderRadius: '4px',
                                                                        '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                                                    }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: 12 }}>
                                                            {careMonthFilter !== 'ALL'
                                                                ? `Không có lịch sử chăm sóc nào trong Tháng ${careMonthFilter}`
                                                                : 'Chưa có lịch sử chăm sóc nào cho bệnh nhân này'}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {totalRecentCarePages > 1 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.25, borderTop: '1px solid #f1f5f9' }}>
                                            <Pagination
                                                count={totalRecentCarePages}
                                                page={recentCarePage}
                                                onChange={(_, page) => setRecentCarePage(page)}
                                                size="small"
                                                sx={{
                                                    '& .Mui-selected': {
                                                        bgcolor: '#15803d !important',
                                                        color: '#ffffff',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Paper>
                            </Stack>
                        )}

                        {/* TAB 1: TIẾN TRÌNH ĐIỀU TRỊ (TIMELINE CÁC GIAI ĐOẠN ĐIỀU TRỊ) */}
                        {activeTab === 1 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {treatmentPlans.length > 0 ? (
                                    treatmentPlans.map((plan) => {
                                        const phases = plan.phases ?? [];
                                        const totalPhases = phases.length;
                                        const completedPhases = phases.filter((p) => p.status === 'COMPLETED').length;
                                        const progressPercent = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

                                        return (
                                            <Paper
                                                key={plan.id}
                                                variant="outlined"
                                                sx={{ p: 2, borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', minWidth: 0 }}
                                            >
                                                {/* Header tóm tắt kế hoạch */}
                                                <Box sx={{ p: 1.75, bgcolor: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0', mb: 2 }}>
                                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#166534' }}>
                                                                {plan.planName ?? ''}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 12, color: '#15803d', mt: 0.5 }}>
                                                                Bác sĩ phụ trách: <strong>{plan.dentistName ?? ''}</strong>
                                                                {plan.startDate && ` · Từ: ${formatDate(plan.startDate)}`}
                                                                {plan.endDate && ` đến ${formatDate(plan.endDate)}`}
                                                                {plan.estimatedCost != null && ` · Chi phí dự kiến: ${money(plan.estimatedCost)}`}
                                                            </Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                            <Chip
                                                                size="small"
                                                                label={
                                                                    plan.status === 'COMPLETED'
                                                                        ? 'Đã hoàn thành'
                                                                        : plan.status === 'IN_PROGRESS'
                                                                            ? 'Đang điều trị'
                                                                            : plan.status ?? ''
                                                                }
                                                                sx={{
                                                                    bgcolor:
                                                                        plan.status === 'COMPLETED'
                                                                            ? '#dcfce7'
                                                                            : plan.status === 'IN_PROGRESS'
                                                                                ? '#eff6ff'
                                                                                : '#f1f5f9',
                                                                    color:
                                                                        plan.status === 'COMPLETED'
                                                                            ? '#15803d'
                                                                            : plan.status === 'IN_PROGRESS'
                                                                                ? '#1d4ed8'
                                                                                : '#475569',
                                                                    border: '1px solid',
                                                                    borderColor:
                                                                        plan.status === 'COMPLETED'
                                                                            ? '#86efac'
                                                                            : plan.status === 'IN_PROGRESS'
                                                                                ? '#bfdbfe'
                                                                                : '#cbd5e1',
                                                                    fontWeight: 700,
                                                                    borderRadius: '4px',
                                                                    fontSize: 11,
                                                                    height: 24,
                                                                }}
                                                            />
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<Headphones size={13} />}
                                                                onClick={() => handleOpenCareModal('TREATMENT_PROGRESS', plan.id)}
                                                                disabled={plan.status !== 'IN_PROGRESS'}
                                                                sx={{
                                                                    bgcolor: '#15803d',
                                                                    color: '#ffffff',
                                                                    fontSize: 11,
                                                                    fontWeight: 600,
                                                                    borderRadius: '4px',
                                                                    py: 0.5,
                                                                    px: 1.25,
                                                                    textTransform: 'none',
                                                                    boxShadow: 'none',
                                                                    '&:hover': { bgcolor: '#166534', boxShadow: 'none' },
                                                                }}
                                                            >
                                                                Chăm sóc
                                                            </Button>
                                                        </Stack>
                                                    </Stack>

                                                    {totalPhases > 0 && (
                                                        <Box sx={{ mt: 1.5 }}>
                                                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                <Typography sx={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>
                                                                    Tiến độ điều trị: {completedPhases}/{totalPhases} giai đoạn ({progressPercent}%)
                                                                </Typography>
                                                            </Stack>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={progressPercent}
                                                                sx={{
                                                                    height: 8,
                                                                    borderRadius: 4,
                                                                    bgcolor: '#dcfce7',
                                                                    '& .MuiLinearProgress-bar': { bgcolor: '#15803d' },
                                                                }}
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* Timeline các giai đoạn dạng hàng ngang */}
                                                <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#1e293b', mb: 1 }}>
                                                    Lộ trình các giai đoạn điều trị
                                                </Typography>

                                                {phases.length > 0 ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'stretch',
                                                            gap: 1.5,
                                                            overflowX: 'auto',
                                                            py: 1,
                                                            px: 0.5,
                                                            '&::-webkit-scrollbar': { height: 6 },
                                                            '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 3 },
                                                        }}
                                                    >
                                                        {[...phases]
                                                            .sort((a, b) => (Number(a.phaseOrder) || 0) - (Number(b.phaseOrder) || 0))
                                                            .map((phase, pIdx, arr) => {
                                                                const statusUpper = String(phase.status || '').toUpperCase();
                                                                const isDone = statusUpper === 'COMPLETED' || statusUpper === 'DONE';
                                                                const isCancelled = statusUpper === 'CANCELLED' || statusUpper === 'CANCEL' || statusUpper === 'FAILED';

                                                                // Chỉ có 3 trạng thái: Hoàn thành (Xanh), Đang điều trị (Vàng), Hủy (Đỏ)
                                                                let statusColor = '#d97706'; // Vàng
                                                                let statusBg = '#fffbeb';
                                                                let statusBorder = '#fde68a';
                                                                let statusBadgeBg = '#fef3c7';
                                                                let statusBadgeColor = '#b45309';
                                                                let statusLabel = statusUpper === 'IN_PROGRESS' ? 'Đang điều trị' : statusUpper === 'PENDING' ? 'Chờ điều trị' : '';

                                                                if (isDone) {
                                                                    statusColor = '#15803d'; // Xanh
                                                                    statusBg = '#f0fdf4';
                                                                    statusBorder = '#bbf7d0';
                                                                    statusBadgeBg = '#dcfce7';
                                                                    statusBadgeColor = '#15803d';
                                                                    statusLabel = 'Hoàn thành';
                                                                } else if (isCancelled) {
                                                                    statusColor = '#dc2626'; // Đỏ
                                                                    statusBg = '#fef2f2';
                                                                    statusBorder = '#fecaca';
                                                                    statusBadgeBg = '#fee2e2';
                                                                    statusBadgeColor = '#dc2626';
                                                                    statusLabel = 'Đã hủy';
                                                                }

                                                                const rawName = String(phase.phaseName || '').trim();
                                                                const phaseTitle = rawName;
                                                                const timeText =
                                                                    phase.expectedStartDate || phase.expectedEndDate
                                                                        ? `${formatDate(phase.expectedStartDate)} - ${formatDate(phase.expectedEndDate)}`
                                                                        : 'Chưa có ngày';

                                                                return (
                                                                    <Box
                                                                        key={phase.id}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'stretch',
                                                                            flex: '0 0 auto',
                                                                        }}
                                                                    >
                                                                        <Paper
                                                                            variant="outlined"
                                                                            sx={{
                                                                                p: 1.5,
                                                                                width: 250,
                                                                                minWidth: 250,
                                                                                maxWidth: 250,
                                                                                borderRadius: '4px',
                                                                                borderColor: statusBorder,
                                                                                bgcolor: statusBg,
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                justifyContent: 'space-between',
                                                                                gap: 1.25,
                                                                                boxSizing: 'border-box',
                                                                            }}
                                                                        >
                                                                            {/* Hàng 1: Icon trạng thái + Label trạng thái */}
                                                                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <Box
                                                                                    sx={{
                                                                                        width: 22,
                                                                                        height: 22,
                                                                                        borderRadius: '50%',
                                                                                        bgcolor: statusColor,
                                                                                        color: '#ffffff',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        fontSize: 11,
                                                                                        fontWeight: 700,
                                                                                        flexShrink: 0,
                                                                                    }}
                                                                                >
                                                                                    {isDone ? (
                                                                                        <Check size={13} />
                                                                                    ) : isCancelled ? (
                                                                                        <X size={13} />
                                                                                    ) : (
                                                                                        phase.phaseOrder ?? ''
                                                                                    )}
                                                                                </Box>

                                                                                <Chip
                                                                                    size="small"
                                                                                    label={statusLabel}
                                                                                    sx={{
                                                                                        height: 20,
                                                                                        fontSize: 10,
                                                                                        fontWeight: 700,
                                                                                        borderRadius: '4px',
                                                                                        bgcolor: statusBadgeBg,
                                                                                        color: statusBadgeColor,
                                                                                    }}
                                                                                />
                                                                            </Stack>

                                                                            {/* Hàng 2: Tên giai đoạn (TỰ XUỐNG DÒNG, KHÔNG CHẤM CHẤM) */}
                                                                            <Typography
                                                                                sx={{
                                                                                    fontSize: 12.5,
                                                                                    fontWeight: 700,
                                                                                    color: '#0f172a',
                                                                                    lineHeight: 1.35,
                                                                                    whiteSpace: 'normal',
                                                                                    wordBreak: 'break-word',
                                                                                }}
                                                                            >
                                                                                {phaseTitle}
                                                                            </Typography>

                                                                            {/* Hàng 3: Thời gian */}
                                                                            <Stack
                                                                                direction="row"
                                                                                spacing={0.75}
                                                                                sx={{
                                                                                    alignItems: 'center',
                                                                                    bgcolor: '#ffffff',
                                                                                    px: 1,
                                                                                    py: 0.5,
                                                                                    borderRadius: '4px',
                                                                                    border: '1px solid #e2e8f0',
                                                                                }}
                                                                            >
                                                                                <Clock size={13} color={statusColor} style={{ flexShrink: 0 }} />
                                                                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0f172a', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                                                    {timeText}
                                                                                </Typography>
                                                                            </Stack>
                                                                        </Paper>

                                                                        {/* Mũi tên nối sang giai đoạn kế tiếp */}
                                                                        {pIdx < arr.length - 1 && (
                                                                            <Box sx={{ px: 1, display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                                                                                <ChevronRight size={20} />
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                );
                                                            })}
                                                    </Box>
                                                ) : (
                                                    <Typography sx={{ fontSize: 12, color: 'text.secondary', py: 1 }}>
                                                        Kế hoạch này chưa thiết lập các giai đoạn điều trị.
                                                    </Typography>
                                                )}
                                            </Paper>
                                        );
                                    })
                                ) : (
                                    <Paper variant="outlined" sx={{ p: 4, borderRadius: '4px', textAlign: 'center', borderColor: '#e2e8f0', bgcolor: '#ffffff' }}>
                                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                                            Bệnh nhân chưa có kế hoạch điều trị nào được lập trong hệ thống.
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        )}

                        {/* TAB 2: DANH SÁCH HÓA ĐƠN (CÓ THANH LỌC THEO THÁNG) */}
                        {activeTab === 2 && (
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', minWidth: 0 }}>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                                            Danh sách hóa đơn & Công nợ ({filteredInvoices.length} hóa đơn)
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
                                                Lọc theo tháng:
                                            </Typography>
                                            <Select
                                                size="small"
                                                value={invoiceMonthFilter}
                                                onChange={(e) => setInvoiceMonthFilter(e.target.value)}
                                                sx={{ minWidth: 145, height: 32, fontSize: 12, bgcolor: '#ffffff', borderRadius: '4px' }}
                                            >
                                                <MenuItem value="ALL" sx={{ fontSize: 12 }}>Tất cả các tháng</MenuItem>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                    <MenuItem key={m} value={String(m)} sx={{ fontSize: 12 }}>
                                                        Tháng {m}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </Stack>
                                    </Stack>

                                    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Mã hóa đơn</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Ngày tạo</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Tổng tiền</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Đã thanh toán</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Còn nợ</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Trạng thái</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>Thao tác</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredInvoices.length > 0 ? (
                                                    filteredInvoices.map((inv) => (
                                                        <TableRow key={inv.id} hover>
                                                            <TableCell sx={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>
                                                                {inv.invoiceCode ?? ''}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12 }}>
                                                                {formatDate(inv.invoiceDate)}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
                                                                {money(inv.finalAmount)}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, color: '#15803d' }}>
                                                                {money(inv.paidAmount)}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, fontWeight: 700, color: Number(inv.remainingAmount || 0) > 0 ? '#dc2626' : '#15803d' }}>
                                                                {money(inv.remainingAmount)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    size="small"
                                                                    label={paymentLabels[inv.paymentStatus] ?? ''}
                                                                    sx={{
                                                                        fontSize: 10,
                                                                        fontWeight: 600,
                                                                        borderRadius: '4px',
                                                                        bgcolor:
                                                                            inv.paymentStatus === 'PAID'
                                                                                ? '#ecfdf3'
                                                                                : inv.paymentStatus === 'PARTIALLY_PAID'
                                                                                    ? '#fef3c7'
                                                                                    : '#fef2f2',
                                                                        color:
                                                                            inv.paymentStatus === 'PAID'
                                                                                ? '#15803d'
                                                                                : inv.paymentStatus === 'PARTIALLY_PAID'
                                                                                    ? '#b45309'
                                                                                    : '#dc2626',
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    startIcon={<Headphones size={13} />}
                                                                    onClick={() => handleOpenCareModal('DEBT', inv.id)}
                                                                    disabled={inv.paymentStatus === 'CANCELLED' || !(Number(inv.remainingAmount) > 0)}
                                                                    sx={{
                                                                        bgcolor: '#15803d',
                                                                        color: '#ffffff',
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                        borderRadius: '4px',
                                                                        py: 0.5,
                                                                        px: 1.25,
                                                                        textTransform: 'none',
                                                                        boxShadow: 'none',
                                                                        '&:hover': { bgcolor: '#166534', boxShadow: 'none' },
                                                                    }}
                                                                >
                                                                    Chăm sóc
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: 12 }}>
                                                            {invoiceMonthFilter !== 'ALL'
                                                                ? `Không có hóa đơn nào trong Tháng ${invoiceMonthFilter}`
                                                                : 'Chưa có hóa đơn nào cho bệnh nhân này'}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Stack>
                            </Paper>
                        )}

                        {/* TAB 3: LỊCH TÁI KHÁM (HIỂN THỊ DANH SÁCH LỊCH TÁI KHÁM) */}
                        {activeTab === 3 && (
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', minWidth: 0 }}>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                                            Danh sách lịch hẹn tái khám ({followUps.length})
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<Plus size={14} />}
                                            disabled title="Chức năng này chưa khả dụng"
                                            sx={{
                                                bgcolor: '#15803d',
                                                color: '#ffffff',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                borderRadius: '4px',
                                                '&:hover': { bgcolor: '#166534' },
                                            }}
                                        >
                                            Đặt lịch hẹn mới
                                        </Button>
                                    </Stack>

                                    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Ngày hẹn tái khám</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Lý do / Nội dung tái khám</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Bác sĩ phụ trách</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Ghi chú</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Trạng thái</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>Thao tác</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {followUps.length > 0 ? (
                                                    followUps.map((item) => (
                                                        <TableRow key={item.id} hover>
                                                            <TableCell sx={{ fontSize: 12, fontWeight: 600, color: '#15803d', whiteSpace: 'nowrap' }}>
                                                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                                    <Calendar size={14} />
                                                                    <span>{formatDate(item.followUpDate)}</span>
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                                                {item.reason ?? ''}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12 }}>
                                                                {item.dentistName ?? ''}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, color: '#64748b' }}>
                                                                {item.note ?? ''}
                                                            </TableCell>
                                                            <TableCell>
                                                                {(() => {
                                                                    const statusInfo = getFollowUpStatusInfo(item.followUpDate);
                                                                    return (
                                                                        <Chip
                                                                            size="small"
                                                                            label={statusInfo.label}
                                                                            sx={{
                                                                                fontSize: 10.5,
                                                                                fontWeight: 600,
                                                                                borderRadius: '4px',
                                                                                bgcolor: statusInfo.bg,
                                                                                color: statusInfo.color,
                                                                                border: `1px solid ${statusInfo.border || 'transparent'}`,
                                                                            }}
                                                                        />
                                                                    );
                                                                })()}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    startIcon={<Headphones size={13} />}
                                                                    onClick={() => handleOpenCareModal('FOLLOW_UP', item.id)}
                                                                    sx={{
                                                                        bgcolor: '#15803d',
                                                                        color: '#ffffff',
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                        borderRadius: '4px',
                                                                        py: 0.5,
                                                                        px: 1.25,
                                                                        textTransform: 'none',
                                                                        boxShadow: 'none',
                                                                        '&:hover': { bgcolor: '#166534', boxShadow: 'none' },
                                                                    }}
                                                                >
                                                                    Chăm sóc
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: 12 }}>
                                                            Chưa có lịch hẹn tái khám nào cho bệnh nhân này
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Stack>
                            </Paper>
                        )}

                        {/* TAB 4: LỊCH SỬ CHĂM SÓC (Lấy từ getAll) */}
                        {activeTab === 4 && (
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff', minWidth: 0 }}>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                                            Toàn bộ lịch sử chăm sóc & liên hệ ({filteredCareHistory.length})
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
                                                    Lọc theo tháng:
                                                </Typography>
                                                <Select
                                                    size="small"
                                                    value={careMonthFilter}
                                                    onChange={(e) => {
                                                        setCareMonthFilter(e.target.value);
                                                        setRecentCarePage(1);
                                                        setTabCarePage(1);
                                                    }}
                                                    sx={{ minWidth: 140, height: 32, fontSize: 12, bgcolor: '#ffffff', borderRadius: '4px' }}
                                                >
                                                    <MenuItem value="ALL" sx={{ fontSize: 12 }}>Tất cả các tháng</MenuItem>
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                        <MenuItem key={m} value={String(m)} sx={{ fontSize: 12 }}>
                                                            Tháng {m}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Stack>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<Plus size={14} />}
                                                onClick={() => handleOpenCareModal('THANK_YOU')}
                                                sx={{
                                                    bgcolor: '#15803d',
                                                    color: '#ffffff',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    borderRadius: '4px',
                                                    '&:hover': { bgcolor: '#166534' },
                                                }}
                                            >
                                                Ghi nhận chăm sóc
                                            </Button>
                                        </Stack>
                                    </Stack>

                                    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Thời gian</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Hạng mục</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Nội dung trao đổi</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Kênh</TableCell>
                                                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>Nhân viên</TableCell>
                                                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>Kết quả</TableCell>
                                                    <TableCell align="right">Thao tác</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredCareHistory.length > 0 ? (
                                                    paginatedTabCareHistory.map((c) => (
                                                        <TableRow key={c.careTaskId} hover>
                                                            <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                                                {formatDateTime(c.createAt)}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
                                                                {c.careCategory ?? ''}
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    title={c.careContent ?? ''}
                                                                    sx={{
                                                                        fontSize: 12,
                                                                        color: '#334155',
                                                                        maxWidth: 280,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        display: 'block',
                                                                    }}
                                                                >
                                                                    {c.careContent ? String(c.careContent).replace(/\r?\n|\r/g, ' ') : ''}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12 }}>
                                                                <Chip size="small" label={c.contactChannel ?? ''} sx={{ height: 20, fontSize: 10, borderRadius: '4px' }} />
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>
                                                                {c.employeeName ?? ''}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Chip
                                                                    size="small"
                                                                    icon={<Check size={12} />}
                                                                    label={{ QUEUED: 'Chờ gửi', SENDING: 'Đang gửi', SENT: 'Đã gửi', FAILED: 'Gửi thất bại', COMPLETED: 'Hoàn thành' }[c.status] ?? c.status ?? ''}
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: 10,
                                                                        fontWeight: 600,
                                                                        bgcolor: c.status === 'COMPLETED' ? '#ecfdf3' : '#eff6ff',
                                                                        color: c.status === 'COMPLETED' ? '#15803d' : '#2563eb',
                                                                        borderRadius: '4px',
                                                                        '& .MuiChip-icon': { color: 'inherit' },
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                                <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                    <Tooltip title="Xem chi tiết" arrow>
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="Xem chi tiết"
                                                                            onClick={() => setCareRecord({ id: c.careTaskId, patientId, mode: 'view' })}
                                                                            sx={{ color: '#15803d', '&:hover': { bgcolor: '#ecfdf3' }, p: 0.5 }}
                                                                        >
                                                                            <Eye size={16} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Chỉnh sửa" arrow>
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="Chỉnh sửa"
                                                                            onClick={() => setCareRecord({ id: c.careTaskId, patientId, mode: 'edit' })}
                                                                            sx={{ color: '#2563eb', '&:hover': { bgcolor: '#eff6ff' }, p: 0.5 }}
                                                                        >
                                                                            <Pencil size={16} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Xóa" arrow>
                                                                        <IconButton
                                                                            size="small"
                                                                            aria-label="Xóa"
                                                                            onClick={() => setCareRecord({ id: c.careTaskId, patientId, mode: 'delete' })}
                                                                            sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fef2f2' }, p: 0.5 }}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Stack>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: 12 }}>
                                                            {careMonthFilter !== 'ALL'
                                                                ? `Không có lịch sử chăm sóc nào trong Tháng ${careMonthFilter}`
                                                                : 'Chưa có lịch sử chăm sóc nào cho bệnh nhân này'}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {totalTabCarePages > 1 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5, borderTop: '1px solid #f1f5f9' }}>
                                            <Pagination
                                                count={totalTabCarePages}
                                                page={tabCarePage}
                                                onChange={(_, page) => setTabCarePage(page)}
                                                size="small"
                                                sx={{
                                                    '& .Mui-selected': {
                                                        bgcolor: '#15803d !important',
                                                        color: '#ffffff',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>
                        )}

                        {/* TAB 5: KHUYẾN MÃI (CHUYỂN THÀNH ITEM CARD ĐẸP MẮT) */}
                        {activeTab === 5 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, width: '100%' }}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: '4px',
                                        borderColor: '#e2e8f0',
                                        bgcolor: '#ffffff',
                                        minWidth: 0,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        sx={{
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2,
                                            pb: 1.5,
                                            borderBottom: '1px solid #f1f5f9',
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Gift size={18} color="#15803d" />
                                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#166534' }}>
                                                Chương trình khuyến mãi & Voucher có hiệu lực ({vouchers.length})
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    {vouchers.length > 0 ? (
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: {
                                                    xs: '1fr',
                                                    md: 'repeat(2, 1fr)',
                                                },
                                                gap: 2,
                                                minWidth: 0,
                                                width: '100%',
                                            }}
                                        >
                                            {vouchers.map((v) => {
                                                const discountText =
                                                    v.discountPercent != null && Number(v.discountPercent) > 0
                                                        ? `Giảm ${v.discountPercent}%`
                                                        : v.discountAmount != null && Number(v.discountAmount) > 0
                                                            ? `Giảm ${money(v.discountAmount)}`
                                                            : '';

                                                const timeText =
                                                    v.startDate || v.endDate
                                                        ? `${formatDate(v.startDate)} - ${formatDate(v.endDate)}`
                                                        : 'Không thời hạn';

                                                const totalLimit = v.usageLimit != null ? Number(v.usageLimit) : null;
                                                const used = v.usedCount != null ? Number(v.usedCount) : null;

                                                return (
                                                    <Paper
                                                        key={v.id}
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: '4px',
                                                            borderColor: '#e2e8f0',
                                                            bgcolor: '#ffffff',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'space-between',
                                                            gap: 1.5,
                                                            position: 'relative',
                                                            transition: 'all 0.2s',
                                                            minWidth: 0,
                                                            boxSizing: 'border-box',
                                                            '&:hover': {
                                                                borderColor: '#15803d',
                                                                boxShadow: '0 4px 12px rgba(21, 128, 61, 0.08)',
                                                            },
                                                        }}
                                                    >
                                                        {/* Header: Mã KM & Giá giảm */}
                                                        <Stack
                                                            direction="row"
                                                            sx={{
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    px: 1.25,
                                                                    py: 0.5,
                                                                    bgcolor: '#ecfdf3',
                                                                    color: '#15803d',
                                                                    border: '1px dashed #15803d',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 700,
                                                                    fontSize: 11,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                    maxWidth: '65%',
                                                                    minWidth: 0,
                                                                    overflow: 'hidden',
                                                                }}
                                                            >
                                                                <Tag size={12} style={{ flexShrink: 0 }} />
                                                                <Typography
                                                                    component="span"
                                                                    sx={{
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                    title={v.couponCode}
                                                                >
                                                                    {v.couponCode ?? ''}
                                                                </Typography>
                                                            </Box>

                                                            <Chip
                                                                size="small"
                                                                label={discountText}
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: 11,
                                                                    bgcolor: '#fef3c7',
                                                                    color: '#b45309',
                                                                    borderRadius: '4px',
                                                                    height: 24,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        </Stack>

                                                        {/* Tên khuyến mãi */}
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: 13.5,
                                                                    color: '#0f172a',
                                                                    lineHeight: 1.35,
                                                                    minHeight: 36,
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                }}
                                                                title={v.title}
                                                            >
                                                                {v.title ?? ''}
                                                            </Typography>
                                                        </Box>

                                                        <Divider sx={{ borderColor: '#f1f5f9' }} />

                                                        {/* Thời gian & Số lượng / Đã sử dụng */}
                                                        <Stack spacing={0.75} sx={{ fontSize: 11.5, color: '#64748b', minWidth: 0 }}>
                                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                                                                <Clock size={13} color="#64748b" style={{ flexShrink: 0 }} />
                                                                <Typography variant="body2" sx={{ fontSize: 11.5, color: '#334155' }} noWrap>
                                                                    {timeText}
                                                                </Typography>
                                                            </Stack>

                                                            <Stack
                                                                direction="row"
                                                                sx={{
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    bgcolor: '#f8fafc',
                                                                    p: 0.75,
                                                                    borderRadius: '4px',
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <Typography sx={{ fontSize: 11, color: '#475569' }}>
                                                                    Số lượng: <strong>{totalLimit != null ? totalLimit.toLocaleString('vi-VN') : 'Không giới hạn'}</strong>
                                                                </Typography>
                                                                <Typography sx={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                                                                    Đã dùng: <strong>{used?.toLocaleString('vi-VN') ?? ''}</strong>
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>

                                                        {/* Nút Gửi voucher */}
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            fullWidth
                                                            startIcon={<Gift size={14} />}
                                                            onClick={() => handleOpenCareModal('PROMOTION', v.id)}
                                                            sx={{
                                                                bgcolor: '#15803d',
                                                                color: '#ffffff',
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                borderRadius: '4px',
                                                                py: 0.75,
                                                                textTransform: 'none',
                                                                boxShadow: 'none',
                                                                '&:hover': { bgcolor: '#166534', boxShadow: 'none' },
                                                            }}
                                                        >
                                                            Soạn chăm sóc khuyến mãi
                                                        </Button>
                                                    </Paper>
                                                );
                                            })}
                                        </Box>
                                    ) : (
                                        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                                            <Gift size={36} color="#cbd5e1" style={{ marginBottom: 8 }} />
                                            <Typography sx={{ fontSize: 13 }}>
                                                Hiện không có chương trình khuyến mãi nào đang có hiệu lực
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Box>
    );

    const displayedContent = loading ? (
        <Box role="status" sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Loading
                title="Đang tải hồ sơ chăm sóc bệnh nhân..."
                subtitle="Đang lấy thông tin kế hoạch điều trị, hóa đơn và lịch tái khám"
                size="md"
            />
        </Box>
    ) : loadError ? (
        <Box sx={{ p: 2 }}>
            <Alert severity="error" action={<Button onClick={() => setReloadKey((key) => key + 1)}>Thử lại</Button>}>{loadError}</Alert>
            {onClose && <Button onClick={onClose} sx={{ mt: 1 }}>Đóng</Button>}
        </Box>
    ) : content;

    const modalElement = (
        <>
            <Menu open={Boolean(careActionMenu) && careActionMenu.patientId === patientId} anchorEl={careActionMenu?.anchor} onClose={() => setCareActionMenu(null)}
                slotProps={{ paper: { sx: { borderRadius: '4px' } } }}>
                {[{ mode: 'view', label: 'Xem', Icon: Eye }, { mode: 'edit', label: 'Sửa', Icon: Pencil }, { mode: 'delete', label: 'Xóa', Icon: Trash2 }].map(({ mode, label, Icon }) => (
                    <Tooltip title={label} placement="left" key={mode}>
                        <MenuItem aria-label={label} onClick={() => {
                            setCareRecord({ id: careActionMenu.id, patientId, mode });
                            setCareActionMenu(null);
                        }} sx={{ justifyContent: 'center', color: mode === 'delete' ? '#dc2626' : '#15803d' }}><Icon size={18} /></MenuItem>
                    </Tooltip>
                ))}
            </Menu>
            {careRecord?.patientId === patientId && <CareRecordDialog
                key={`${patientId}-${careRecord.id}-${careRecord.mode}`}
                id={careRecord.id}
                patient={currentPatient}
                careData={{ invoices, treatmentPlans, followUps, promotions }}
                employees={employees}
                mode={careRecord.mode}
                onClose={() => setCareRecord(null)}
                onSuccess={() => setReloadKey((value) => value + 1)}
            />}
            {careModalOpen && loaded && !loadError && <CustommerCareModal
                key={patientId}
                onClose={() => setCareModalOpen(false)}
                patient={currentPatient}
                initialCategory={careModalCategory}
                initialObjectId={careObjectId}
                careData={{ invoices, treatmentPlans, followUps, promotions }}
                employees={employees}
                onSuccess={() => setReloadKey((value) => value + 1)}
            />}
        </>
    );

    if (open !== undefined) {
        return (
            <>
                <Dialog
                    open={open}
                    onClose={(event, reason) => {
                        if (reason === 'backdropClick') return;
                        onClose?.();
                    }}
                    maxWidth="xl"
                    fullWidth
                    slotProps={{
                        paper: {
                            sx: {
                                maxWidth: 1320,
                                width: '95vw',
                                height: '90vh',
                                maxHeight: '90vh',
                                borderRadius: 1, // Bo góc chuẩn sm (4px)
                                overflow: 'hidden',
                                bgcolor: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                            },
                        },
                    }}
                >
                    {displayedContent}
                </Dialog>
                {modalElement}
            </>
        );
    }

    return (
        <>
            {displayedContent}
            {modalElement}
        </>
    );
}

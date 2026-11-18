import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import customerCareService from '../../../../../services/customerCare.service';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    Chip,
    Avatar,
    Stack,
    TextField,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Paper,
    Divider,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Headphones,
    X,
    Heart,
    Wallet,
    Gift,
    Calendar,
    Megaphone,
    Clock,
    Mail,
    MessageSquare,
    Eye,
    Send,
    Check,
    TrendingUp,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link2,
    Image,
    Code,
    Maximize2,
} from 'lucide-react';
import { formatDate } from '../../../../../utils/dateUtils';
import { useAuthStore } from '../../../../../store/authStore';
import { buildCareContent, CARE_OBJECT_LABELS, getCareObjectLabel, getCareObjects } from './careTemplates';

// Danh sách 6 hạng mục chăm sóc chính xác theo ảnh
const CARE_CATEGORIES = [
    {
        key: 'THANK_YOU',
        title: 'Cảm ơn sau khám',
        icon: Heart,
        defaultSubject: 'Cảm ơn Quý khách đã tin tưởng Crown Dental',
    },
    {
        key: 'DEBT',
        title: 'Nhắc công nợ',
        icon: Wallet,
        defaultSubject: 'Thông báo khoản thanh toán còn lại – Crown Dental Phố Huế',
    },
    {
        key: 'BIRTHDAY',
        title: 'Sinh nhật',
        icon: Gift,
        defaultSubject: 'Chúc mừng sinh nhật từ Crown Dental',
    },
    {
        key: 'TREATMENT_PROGRESS',
        title: 'Nhắc điều trị',
        icon: TrendingUp,
        defaultSubject: 'Cập nhật tiến trình điều trị của Anh/Chị – Crown Dental',
    },
    {
        key: 'FOLLOW_UP',
        title: 'Nhắc tái khám',
        icon: Calendar,
        defaultSubject: 'Nhắc lịch tái khám – Crown Dental',
    },
    {
        key: 'PROMOTION',
        title: 'Khuyến mãi',
        icon: Megaphone,
        defaultSubject: 'Chương trình ưu đãi từ Crown Dental',
    },
];

export default function CustommerCareModal({
    onClose,
    patient,
    initialCategory = 'THANK_YOU',
    initialObjectId = '',
    careData,
    employees,
    onSuccess,
    record = null,
    mode = 'create',
}) {
    const readOnly = mode === 'view';
    const editing = mode === 'edit';
    const savedContent = record?.careContent ?? '';
    const separator = savedContent.indexOf('\n\n');
    const patientName = patient.fullName ?? '';
    const patientPhone = patient.phone ?? '';
    const patientEmail = patient.email ?? '';
    const patientCode = patient.patientCode ?? '';
    const [selectedCategory, setSelectedCategory] = useState(record ? record.careCategory : initialCategory);
    const [contactChannel, setContactChannel] = useState(record ? record.contactChannel : 'EMAIL');
    const currentAuthUser = useAuthStore((state) => state.user);
    const assignedEmployee = (employees && employees.find((employee) =>
        employee.id === currentAuthUser?.employeeId ||
        employee.id === currentAuthUser?.id ||
        employee.userId === currentAuthUser?.id
    )) || (employees && employees[0]) || null;
    const [activeTab, setActiveTab] = useState(0);
    const [confirmCheck, setConfirmCheck] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedObjectId, setSelectedObjectId] = useState(initialObjectId);
    const objects = getCareObjects(selectedCategory, careData);
    const selectedObject = objects.find((item) => item.id === selectedObjectId);
    const requiresObject = !['BIRTHDAY', 'THANK_YOU'].includes(selectedCategory);

    const [subject, setSubject] = useState(() => record
        ? (separator >= 0 ? savedContent.slice(0, separator) : '')
        : CARE_CATEGORIES.find((category) => category.key === initialCategory)?.defaultSubject ?? '');
    const [content, setContent] = useState(() => {
        if (record) return separator >= 0 ? savedContent.slice(separator + 2) : savedContent;
        const initialObject = getCareObjects(initialCategory, careData).find((item) => item.id === initialObjectId) || getCareObjects(initialCategory, careData)[0];
        return buildCareContent(initialCategory, patient, initialObject);
    });

    // Tự động chọn đối tượng đầu tiên khi mở hoặc đổi hạng mục nếu có dữ liệu
    useEffect(() => {
        if (!record && objects.length > 0) {
            const exists = objects.some((o) => o.id === selectedObjectId);
            if (!exists) {
                const first = objects[0];
                setSelectedObjectId(first.id);
                setContent(buildCareContent(selectedCategory, patient, first));
            }
        }
    }, [selectedCategory, objects]);

    const changeObject = (id) => {
        setSelectedObjectId(id);
        const obj = objects.find((item) => item.id === id);
        setContent(buildCareContent(selectedCategory, patient, obj));
    };

    const changeCategory = (category) => {
        if (record || saving) return;
        setSelectedCategory(category);
        setSubject(CARE_CATEGORIES.find((item) => item.key === category).defaultSubject);
        const newObjects = getCareObjects(category, careData);
        if (newObjects.length > 0) {
            const first = newObjects[0];
            setSelectedObjectId(first.id);
            setContent(buildCareContent(category, patient, first));
        } else {
            setSelectedObjectId('');
            setContent(buildCareContent(category, patient, undefined));
        }
    };

    const canSave = Boolean((editing ? (record?.employeeId || assignedEmployee?.id) : assignedEmployee?.id)
        && content.trim()
        && subject.trim()
        && confirmCheck
        && !saving
        && !readOnly
        && (editing || patientEmail));

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const empId = editing ? (record.employeeId || assignedEmployee?.id) : assignedEmployee?.id;
            const payload = {
                patientId: patient.id,
                employeeId: empId,
                careCategory: selectedCategory,
                careContent: subject.trim() ? `${subject.trim()}\n\n${content.trim()}` : content.trim(),
                contactChannel,
            };
            if (editing) await customerCareService.update(record.careTaskId, payload);
            else await customerCareService.create(payload);
        } catch (error) {
            toast.error(error.response?.data?.message ?? 'Không thể lưu chăm sóc khách hàng.');
            setSaving(false);
            return;
        }
        toast.success(editing ? 'Đã cập nhật chăm sóc khách hàng.' : 'Đã lưu chăm sóc khách hàng và xếp hàng gửi email.');
        onClose();
        onSuccess?.();
    };

    return (
        <Dialog
            open
            onClose={(event, reason) => {
                if (reason === 'backdropClick') return;
                if (!saving) onClose?.();
            }}
            maxWidth="lg"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        maxWidth: 1140,
                        width: '92vw',
                        maxHeight: '88vh',
                        borderRadius: 1, // 4px
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: '#ffffff',
                        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
                    },
                },
            }}
        >
            {/* 1. TOP HEADER (Gọn gàng py: 1.25) */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.25,
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#ffffff',
                    flexShrink: 0,
                }}
            >
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 30,
                            height: 30,
                            borderRadius: '4px',
                            bgcolor: '#ecfdf3',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Headphones size={17} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#166534' }}>
                        {readOnly ? 'Chi tiết chăm sóc khách hàng' : editing ? 'Cập nhật chăm sóc khách hàng' : 'Tạo chăm sóc khách hàng'}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    {/* Logo Crown Dental nhỏ */}
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pr: 1, borderRight: '1px solid #e2e8f0' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 3C4.5 3 3 5 3 8c0 3.5 1.5 6 2 9.5.5 3.5 2 4.5 3.5 4.5 1.5 0 2-2 3.5-2s2 2 3.5 2c1.5 0 3-1 3.5-4.5.5-3.5 2-6 2-9.5 0-3-1.5-5-4-5-2 0-3 1.5-4.5 1.5S9 3 7 3z" />
                        </svg>
                        <Box sx={{ lineHeight: 1 }}>
                            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>Crown Dental</Typography>
                            <Typography sx={{ fontSize: 9, color: '#64748b' }}>Phòng khám nha khoa</Typography>
                        </Box>
                    </Stack>

                    <IconButton size="small" onClick={onClose} disabled={saving} sx={{ color: 'text.secondary', p: 0.5 }}>
                        <X size={18} />
                    </IconButton>
                </Stack>
            </Box>

            {/* 2. BODY DIALOG (GRID 2 CỘT TỐI ƯU KÍCH THƯỚC: TRÁI 320PX & PHẢI 1FR) */}
            <DialogContent sx={{ p: 2, bgcolor: '#f8fafc', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '320px minmax(0, 1fr)' },
                        gap: 2,
                        alignItems: 'start',
                    }}
                >
                    {/* === CỘT TRÁI: THÔNG TIN & CẤU HÌNH CHĂM SÓC === */}
                    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
                        {/* 1. Thông tin bệnh nhân */}
                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '4px', borderColor: '#e2e8f0', bgcolor: '#ffffff' }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                Thông tin bệnh nhân
                            </Typography>
                            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#ecfdf3',
                                        color: '#15803d',
                                        fontWeight: 700,
                                        fontSize: 16,
                                        border: '2px solid #bbf7d0',
                                        flexShrink: 0,
                                    }}
                                >
                                    {patientName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }} noWrap>
                                            {patientName}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={patientCode}
                                            sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#ecfdf3', color: '#15803d', borderRadius: '4px' }}
                                        />
                                    </Stack>
                                    <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, fontSize: 11, color: '#64748b' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <span>📞</span>
                                            <span>{patientPhone}</span>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                                            <span>✉</span>
                                            <Typography sx={{ fontSize: 11 }} noWrap>{patientEmail}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* 2. Hạng mục chăm sóc (6 ô lựa chọn) */}
                        <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1e293b', mb: 0.75 }}>
                                Hạng mục chăm sóc <span style={{ color: '#dc2626' }}>*</span>
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.85 }}>
                                {CARE_CATEGORIES.map((cat) => {
                                    const IconComponent = cat.icon;
                                    const isSelected = selectedCategory === cat.key;
                                    return (
                                        <Paper
                                            key={cat.key}
                                            variant="outlined"
                                            onClick={() => changeCategory(cat.key)}
                                            sx={{
                                                p: 1,
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                borderColor: isSelected ? '#15803d' : '#e2e8f0',
                                                bgcolor: isSelected ? '#f0fdf4' : '#ffffff',
                                                boxShadow: isSelected ? '0 0 0 1px #15803d' : 'none',
                                                position: 'relative',
                                                transition: 'all 0.15s ease',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 0.85,
                                                '&:hover': {
                                                    borderColor: isSelected ? '#15803d' : '#cbd5e1',
                                                    bgcolor: isSelected ? '#f0fdf4' : '#f8fafc',
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    color: isSelected ? '#15803d' : '#64748b',
                                                    mt: 0.2,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <IconComponent size={16} />
                                            </Box>
                                            <Box sx={{ minWidth: 0, flex: 1, pr: isSelected ? 1.5 : 0 }}>
                                                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: isSelected ? '#166534' : '#0f172a', lineHeight: 1.2 }}>
                                                    {cat.title}
                                                </Typography>
                                            </Box>

                                            {isSelected && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        width: 14,
                                                        height: 14,
                                                        borderRadius: '50%',
                                                        bgcolor: '#15803d',
                                                        color: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Check size={9} strokeWidth={3} />
                                                </Box>
                                            )}
                                        </Paper>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* 2.1 Thanh Select Box chọn đối tượng cụ thể (Hóa đơn công nợ, Lịch tái khám, Kế hoạch điều trị, Khuyến mãi) */}
                        {!record && selectedCategory !== 'THANK_YOU' && (
                            <Box>
                                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#334155', mb: 0.5 }}>
                                    {CARE_OBJECT_LABELS[selectedCategory] || 'Dữ liệu áp dụng'} {requiresObject && <span style={{ color: '#dc2626' }}>*</span>}
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={selectedObjectId || ''}
                                    onChange={(event) => changeObject(event.target.value)}
                                    disabled={readOnly || saving}
                                    helperText={objects.length === 0 ? 'Chưa có dữ liệu nào phù hợp với hạng mục này' : ''}
                                    SelectProps={{
                                        displayEmpty: true,
                                    }}
                                    sx={{
                                        bgcolor: '#ffffff',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '4px',
                                            fontSize: 12,
                                            bgcolor: '#ffffff',
                                        },
                                        '& .MuiSelect-select': {
                                            py: 1,
                                            fontSize: 12,
                                        },
                                    }}
                                >
                                    <MenuItem value="" sx={{ fontSize: 12 }}>
                                        <em>-- Chọn {CARE_OBJECT_LABELS[selectedCategory]?.toLowerCase() || 'đối tượng'} --</em>
                                    </MenuItem>
                                    {objects.map((item) => (
                                        <MenuItem key={item.id} value={item.id} sx={{ fontSize: 12 }}>
                                            {getCareObjectLabel(selectedCategory, item)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        )}

                        {/* 3. Kênh liên hệ (Email, Zalo, SMS) */}
                        <Box>
                            <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#334155', mb: 0.5 }}>
                                Kênh liên hệ <span style={{ color: '#dc2626' }}>*</span>
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                                {[
                                    { key: 'EMAIL', label: 'Email', icon: Mail },
                                    { key: 'ZALO', label: 'Zalo', icon: MessageSquare },
                                    { key: 'SMS', label: 'SMS', icon: MessageSquare },
                                ].map((channel) => {
                                    const isChSelected = contactChannel === channel.key;
                                    const ChannelIcon = channel.icon;
                                    return (
                                        <Button
                                            key={channel.key}
                                            variant="outlined"
                                            onClick={() => setContactChannel(channel.key)}
                                            disabled={Boolean(record) || channel.key !== 'EMAIL' || saving}
                                            startIcon={<ChannelIcon size={13} />}
                                            sx={{
                                                height: 32,
                                                fontSize: 11.5,
                                                fontWeight: 600,
                                                borderRadius: '4px',
                                                borderColor: isChSelected ? '#15803d' : '#e2e8f0',
                                                bgcolor: isChSelected ? '#ecfdf3' : '#ffffff',
                                                color: isChSelected ? '#15803d' : '#334155',
                                                textTransform: 'none',
                                                p: 0.5,
                                                '&:hover': {
                                                    borderColor: '#15803d',
                                                    bgcolor: isChSelected ? '#ecfdf3' : '#f8fafc',
                                                },
                                            }}
                                        >
                                            {channel.label}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* 5. Nhân viên phụ trách & Trạng thái */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 1 }}>
                            <Box>
                                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#334155', mb: 0.5 }}>
                                    Nhân viên phụ trách <span style={{ color: '#dc2626' }}>*</span>
                                </Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    value={record ? record.employeeName ?? '' : assignedEmployee?.name ?? ''}
                                    helperText={record || assignedEmployee ? '' : 'Tài khoản đăng nhập chưa có thông tin nhân viên.'}
                                    slotProps={{ input: { readOnly: true } }}
                                    sx={{ '& .MuiOutlinedInput-root': { fontSize: 11.5, bgcolor: '#ffffff', borderRadius: '4px' } }}
                                />
                            </Box>

                            <Box>
                                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#334155', mb: 0.5 }}>
                                    Trạng thái <span style={{ color: '#dc2626' }}>*</span>
                                </Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    value={record ? record.status : 'QUEUED'}
                                    disabled
                                    sx={{ height: 34, fontSize: 11.5, bgcolor: '#ffffff', borderRadius: '4px' }}
                                    startAdornment={<Clock size={13} color="#64748b" style={{ marginRight: 6 }} />}
                                >
                                    <MenuItem value={record ? record.status : 'QUEUED'} sx={{ fontSize: 11.5 }}>
                                        {{ QUEUED: 'Chờ gửi', SENDING: 'Đang gửi', SENT: 'Đã gửi', FAILED: 'Gửi thất bại', PENDING: 'Chờ xử lý' }[record ? record.status : 'QUEUED'] ?? record?.status}
                                    </MenuItem>
                                </Select>
                            </Box>
                        </Box>
                    </Stack>

                    {/* === CỘT PHẢI: NỘI DUNG SOẠN THẢO & XEM TRƯỚC === */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 1.75,
                            borderRadius: '4px',
                            borderColor: '#e2e8f0',
                            bgcolor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            minWidth: 0,
                        }}
                    >
                        {/* 1. Tabs: Nội dung email vs Xem trước email */}
                        <Box sx={{ borderBottom: '1px solid #e2e8f0' }}>
                            <Tabs
                                value={activeTab}
                                onChange={(e, val) => setActiveTab(val)}
                                sx={{
                                    minHeight: 32,
                                    '& .MuiTab-root': {
                                        minHeight: 32,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        px: 1.5,
                                        color: '#64748b',
                                        '&.Mui-selected': { color: '#15803d' },
                                    },
                                    '& .MuiTabs-indicator': { bgcolor: '#15803d' },
                                }}
                            >
                                <Tab icon={<Mail size={14} />} iconPosition="start" label="Nội dung chăm sóc" />
                                <Tab icon={<Eye size={14} />} iconPosition="start" label="Xem trước email" />
                            </Tabs>
                        </Box>

                        {/* TAB 0: Soạn thảo nội dung */}
                        {activeTab === 0 && (
                            <Stack spacing={1.25}>
                                {/* Tiêu đề email */}
                                <Box>
                                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#334155', mb: 0.5 }}>
                                        Tiêu đề email <span style={{ color: '#dc2626' }}>*</span>
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={subject}
                                        disabled={readOnly || saving}
                                        onChange={(e) => setSubject(e.target.value)}
                                        sx={{
                                            bgcolor: '#ffffff',
                                            '& .MuiOutlinedInput-root': { borderRadius: '4px', fontSize: 12 },
                                        }}
                                    />
                                </Box>

                                {/* Vùng soạn thảo nội dung (rộng rãi, dễ nhìn) */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#334155', mb: 0.5 }}>
                                        Nội dung chăm sóc <span style={{ color: '#dc2626' }}>*</span>
                                    </Typography>

                                    <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Toolbar */}
                                        <Box sx={{ p: 0.6, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap' }}>
                                            <Button size="small" variant="text" sx={{ minWidth: 55, height: 24, fontSize: 10.5, color: '#334155', textTransform: 'none', px: 0.5 }}>
                                                Đoạn văn ⌵
                                            </Button>
                                            <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 14 }} />
                                            <IconButton size="small" sx={{ p: 0.4 }}><Bold size={13} /></IconButton>
                                            <IconButton size="small" sx={{ p: 0.4 }}><Italic size={13} /></IconButton>
                                            <IconButton size="small" sx={{ p: 0.4 }}><Underline size={13} /></IconButton>
                                            <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 14 }} />
                                            <IconButton size="small" sx={{ p: 0.4 }}><List size={13} /></IconButton>
                                            <IconButton size="small" sx={{ p: 0.4 }}><ListOrdered size={13} /></IconButton>
                                            <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 14 }} />
                                            <IconButton size="small" sx={{ p: 0.4 }}><Link2 size={13} /></IconButton>
                                            <IconButton size="small" sx={{ p: 0.4 }}><Image size={13} /></IconButton>
                                            <IconButton size="small" sx={{ p: 0.4 }}><Code size={13} /></IconButton>
                                            <IconButton size="small" sx={{ p: 0.4, ml: 'auto' }}><Maximize2 size={13} /></IconButton>
                                        </Box>

                                        {/* Editor Textarea rộng rãi, hiển thị trọn vẹn thư */}
                                        <TextField
                                            multiline
                                            rows={12}
                                            fullWidth
                                            value={content}
                                            disabled={readOnly || saving}
                                            onChange={(e) => setContent(e.target.value)}
                                            variant="standard"
                                            InputProps={{
                                                disableUnderline: true,
                                                sx: { p: 1.5, fontSize: 12.5, lineHeight: 1.5, fontFamily: 'inherit' },
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Stack>
                        )}

                        {/* TAB 1: Xem trước email chân thực */}
                        {activeTab === 1 && (
                            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                    {/* Email Header preview */}
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', pb: 1.5, mb: 1.5, borderBottom: '2px solid #15803d' }}>
                                        <Box>
                                            <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>
                                                CROWN DENTAL PHỐ HUẾ
                                            </Typography>
                                            <Typography sx={{ fontSize: 10.5, color: '#64748b' }}>
                                                Hệ thống Nha khoa Thẩm mỹ & Chuyên sâu
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: 10.5, color: '#94a3b8' }}>
                                            {formatDate(new Date())}
                                        </Typography>
                                    </Stack>

                                    {/* Subject */}
                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                                        {subject}
                                    </Typography>

                                    {/* Body text */}
                                    <Typography sx={{ fontSize: 12, color: '#334155', whiteSpace: 'pre-line', overflowWrap: 'anywhere', lineHeight: 1.55, mb: 2 }}>
                                        {content}
                                    </Typography>


                                    {/* Email Footer */}
                                    <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', fontSize: 10.5, color: '#64748b' }}>
                                        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
                                            Phòng khám Nha khoa Crown Dental Phố Huế
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </DialogContent>

            {/* 3. DIALOG ACTIONS FOOTER (py: 1 gọn gàng, nút bấm vừa vặn) */}
            <DialogActions
                sx={{
                    px: 2.5,
                    py: 1,
                    borderTop: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={confirmCheck}
                            disabled={readOnly || saving}
                            onChange={(e) => setConfirmCheck(e.target.checked)}
                            sx={{ color: '#15803d', '&.Mui-checked': { color: '#15803d' } }}
                        />
                    }
                    label={
                        <Typography sx={{ fontSize: 11.5, color: '#475569', fontWeight: 500 }}>
                            Tôi đã kiểm tra nội dung và thông tin khách hàng.
                        </Typography>
                    }
                />

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onClose}
                        disabled={saving}

                        sx={{
                            color: '#475569',
                            borderColor: '#cbd5e1',
                            borderRadius: '4px',
                            fontSize: 11.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 1.75,
                            height: 32,
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                        }}
                    >
                        Hủy
                    </Button>

                    {!readOnly && <Button
                        variant="contained"
                        size="small"
                        startIcon={<Send size={13} />}
                        disabled={!canSave}
                        onClick={handleSave}
                        sx={{
                            bgcolor: '#15803d',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: 11.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 2,
                            height: 32,
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#166534', boxShadow: 'none' },
                            '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
                        }}
                    >
                        {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Lưu và gửi email'}
                    </Button>}
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

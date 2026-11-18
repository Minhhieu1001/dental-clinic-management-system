import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment, Menu, MenuItem,
  Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, ThemeProvider, Tooltip, Typography, createTheme,
} from '@mui/material';
import { Gift, HeartHandshake, Mail, MoreHorizontal, RefreshCw, RotateCcw, Search, Send, Tag, Users, Wallet } from 'lucide-react';
import customerCareService from '../../../services/customerCare.service';
import { getTodayPromotions } from '../../../services/promotion.service';
import CustomerCareDetail from './action/CustomerCareDetail';
import PromotionSelectionPanel from './components/PromotionSelectionPanel';
import Loading from '../../../components/ui/Loading';
import { formatDate } from '../../../utils/dateUtils';
import toast from 'react-hot-toast';

const careCategoryLabels = {
  THANK_YOU: 'Cảm ơn sau khám',
  DEBT: 'Nhắc công nợ',
  TREATMENT_PROGRESS: 'Nhắc điều trị',
  FOLLOW_UP: 'Nhắc tái khám',
  BIRTHDAY: 'Chúc mừng sinh nhật',
  PROMOTION: 'Gửi khuyến mãi',
};

const theme = createTheme({
  palette: { primary: { main: '#15803d', light: '#f0fdf4', dark: '#166534' } },
  shape: { borderRadius: 4 },
  typography: { fontFamily: 'inherit', fontSize: 13, button: { textTransform: 'none' } },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTableCell: { styleOverrides: { root: { borderColor: '#f1f5f9' }, head: { fontWeight: 600, backgroundColor: '#f8faf9' } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 4 } } },
  },
});

const paymentLabels = {
  UNPAID: 'Chưa thanh toán',
  PARTIALLY_PAID: 'Thanh toán một phần',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
};

const money = (value) => (value == null ? '' : Number(value).toLocaleString('vi-VN') + ' đ');

function InvoiceStatus({ invoice }) {
  const label = paymentLabels[invoice.paymentStatus];
  return label ? (
    <Chip
      size="small"
      label={label}
      icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />}
      sx={{
        width: 'max-content',
        maxWidth: '100%',
        height: 24,
        flexShrink: 0,
        color: 'primary.dark',
        bgcolor: '#ecfdf3',
        border: 'none',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: '4px',
        '& .MuiChip-icon': { color: 'inherit', ml: 1, mr: 0 },
        '& .MuiChip-label': { px: 1, lineHeight: '24px' },
      }}
    />
  ) : null;
}

const PAGE_SIZE = 6;

const getCreatedMonthYear = (value) => {
  if (!value) return null;
  const parts = Array.isArray(value) ? value : String(value).split('T')[0].split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  return Number.isInteger(year) && year > 0 && month >= 1 && month <= 12
    ? { year: String(year), month: String(month) }
    : null;
};

export default function CustomerCare() {
  const [patients, setPatients] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [promotionError, setPromotionError] = useState('');
  const [sendPreviewOpen, setSendPreviewOpen] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const bulkInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const results = await Promise.allSettled([
        customerCareService.getPatientsWithInvoices(),
        customerCareService.getSummary(),
        getTodayPromotions(),
      ]);
      if (cancelled) return;
      const errors = [];
      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
        setPatients(results[0].value);
        setSelectedIds((ids) => ids.filter((id) => results[0].value.some((patient) => patient.id === id)));
      } else {
        errors.push('Không thể tải danh sách khách hàng.');
      }
      if (results[1].status === 'fulfilled' && results[1].value) {
        setSummary(results[1].value);
      } else {
        errors.push('Không thể tải thống kê chăm sóc khách hàng.');
      }
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
        const available = results[2].value.filter((promotion) => promotion.isValid === true);
        setPromotions(available);
        setSelectedPromotion((previous) => available.find((promotion) => promotion.id === previous?.id) ?? null);
        setPromotionError('');
      } else {
        setPromotions([]);
        setSelectedPromotion(null);
        setPromotionError('Không thể tải khuyến mãi. Vui lòng thử lại.');
        errors.push('Không thể tải danh sách khuyến mãi.');
      }
      setLoadErrors(errors);
      setLoading(false);
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const customers = useMemo(() => (patients ?? []).map((patient) => {
    const invoices = patient.invoices;
    const activeInvoices = invoices?.filter((invoice) => invoice.paymentStatus !== 'CANCELLED');
    const hasDebtData = Array.isArray(activeInvoices) && activeInvoices.every(
      (invoice) => invoice.remainingAmount != null && Number.isFinite(Number(invoice.remainingAmount))
    );
    const care = patient.latestCare ?? null;
    return {
      ...patient,
      code: patient.patientCode ?? '',
      name: patient.fullName ?? '',
      phone: patient.phone ?? '',
      finalAmount: Array.isArray(invoices) && invoices.every(
        (invoice) => invoice.finalAmount != null && Number.isFinite(Number(invoice.finalAmount)),
      ) ? invoices.reduce((total, invoice) => total + Number(invoice.finalAmount), 0) : null,
      debt: hasDebtData
        ? activeInvoices.reduce((total, invoice) => total + Math.max(0, Number(invoice.remainingAmount)), 0)
        : null,
      service: '',
      progressText: '',
      nextSchedule: '',
      lastCare: care?.careCategory ?? '',
      careObj: care,
      status: '',
      group: '',
    };
  }), [patients]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [createdMonthFilter, setCreatedMonthFilter] = useState('ALL');
  const [createdYearFilter, setCreatedYearFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState(null);
  const [careCustomer, setCareCustomer] = useState(null);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [detailIndex, setDetailIndex] = useState(1);

  const availableBranches = useMemo(() => {
    const branches = new Map();
    customers.forEach((patient) => {
      if (patient.createdBranchId != null) branches.set(patient.createdBranchId, patient.createdBranchName ?? '');
    });
    return Array.from(branches, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [customers]);

  const availableYears = useMemo(() => {
    const years = new Set([String(new Date().getFullYear())]);
    customers.forEach((patient) => {
      const parts = getCreatedMonthYear(patient.createdAt);
      if (parts) years.add(parts.year);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [customers]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setBranchFilter('ALL');
    setCreatedMonthFilter('ALL');
    setCreatedYearFilter('ALL');
    setPage(1);
  };

  const handleOpenDetail = (patient) => {
    setDetailCustomer(patient);
    const idx = filteredCustomers.findIndex((p) => p.id === patient.id);
    setDetailIndex(idx >= 0 ? idx + 1 : 1);
  };

  const handlePrevCustomer = () => {
    if (detailIndex > 1) {
      const prevCust = filteredCustomers[detailIndex - 2];
      if (prevCust) {
        setDetailCustomer(prevCust);
        setDetailIndex((prev) => prev - 1);
      }
    }
  };

  const handleNextCustomer = () => {
    if (detailIndex < filteredCustomers.length) {
      const nextCust = filteredCustomers[detailIndex];
      if (nextCust) {
        setDetailCustomer(nextCust);
        setDetailIndex((prev) => prev + 1);
      }
    }
  };

  const filteredCustomers = useMemo(() => customers.filter((patient) => {
    const query = searchQuery.toLocaleLowerCase('vi-VN').trim();
    const matchesSearch = [patient.patientCode, patient.fullName, patient.phone]
      .some((value) => (value ?? '').toLocaleLowerCase('vi-VN').includes(query));
    if (!matchesSearch) return false;

    const matchesStatus = statusFilter === 'ALL'
      || (statusFilter === 'NO_INVOICE' && Array.isArray(patient.invoices) && patient.invoices.length === 0)
      || (patient.invoices ?? []).some((invoice) => invoice.paymentStatus === statusFilter);
    if (!matchesStatus) return false;

    if (branchFilter !== 'ALL' && patient.createdBranchId !== branchFilter) return false;
    const dateParts = getCreatedMonthYear(patient.createdAt);
    if (createdMonthFilter !== 'ALL' && dateParts?.month !== createdMonthFilter) return false;
    if (createdYearFilter !== 'ALL' && dateParts?.year !== createdYearFilter) return false;
    return true;
  }), [customers, searchQuery, statusFilter, branchFilter, createdMonthFilter, createdYearFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleCustomers = filteredCustomers.slice(pageStart, pageStart + PAGE_SIZE);
  const selectedVisibleCount = visibleCustomers.filter((patient) => selectedIds.includes(patient.id)).length;
  const allSelected = visibleCustomers.length > 0 && selectedVisibleCount === visibleCustomers.length;

  const summaryCards = [
    { label: 'Tổng khách hàng', value: patients?.length, icon: Users },
    { label: 'Sinh nhật tháng này', value: summary?.birthdayPatientCount, icon: Gift },
    { label: 'Hóa đơn còn nợ', value: summary?.outstandingInvoiceCount, icon: Wallet },
    { label: 'Khuyến mãi', value: summary?.activePromotionCount, icon: Tag },
  ];

  const selectedPatients = customers.filter((patient) => selectedIds.includes(patient.id));
  const canSendPromotion = selectedPromotion && selectedPatients.length > 0;

  const handleBulkSend = async () => {
    if (!canSendPromotion || bulkInFlight.current) return;
    if (selectedPatients.length > 500) {
      toast.error('Mỗi đợt gửi tối đa 500 khách hàng. Vui lòng chia nhỏ danh sách.');
      return;
    }
    const patientIds = selectedPatients.map((patient) => patient.id).sort();
    bulkInFlight.current = true;
    setBulkSending(true);
    try {
      const result = await customerCareService.createBulkPromotion({
        promotionId: selectedPromotion.id,
        patientIds,
      });
      if (result.failedCount > 0) {
        toast.success(`Đã đưa ${result.queuedCount} khách hàng vào hàng đợi gửi mail (${result.failedCount} khách thiếu email)`);
      } else {
        toast.success(`Đã đưa ${result.queuedCount} khách hàng vào hàng đợi gửi email khuyến mãi thành công!`);
      }
      setSelectedIds([]);
      setSelectedPromotion(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Gửi khuyến mãi thất bại. Vui lòng kiểm tra và thử lại.');
    } finally {
      bulkInFlight.current = false;
      setBulkSending(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Stack spacing={1.5} sx={{ width: '100%', color: '#1e293b', pb: canSendPromotion ? 14 : 0 }}>
        {/* Header Label Chăm sóc khách hàng */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box sx={{ p: 1, bgcolor: '#ecfdf3', color: '#15803d', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartHandshake size={24} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Chăm sóc khách hàng
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                Quản lý lịch sử tương tác, nhắc lịch hẹn tái khám và công nợ bệnh nhân
              </Typography>
            </Box>
          </Stack>
        </Box>

        {loadErrors.length > 0 && (
          <Alert
            severity="error"
            action={
              <Button
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
              >
                Thử lại
              </Button>
            }
          >
            {loadErrors.join(' ')}
          </Alert>
        )}
        {/* ===== 2-column: Khuyến mãi (trái) + Thống kê (phải) ===== */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' }, gap: 1.5, alignItems: 'stretch' }}>
          {/* --- Cột trái: Danh sách khuyến mãi đang áp dụng --- */}
          <PromotionSelectionPanel
            promotions={promotions}
            selectedId={selectedPromotion?.id}
            onSelect={setSelectedPromotion}
            loading={loading}
            error={promotionError}
          />

          {/* --- Cột phải: 4 thẻ thống kê (2×2) cao bằng item card --- */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, 1fr)', gap: 1.25, height: '100%' }}>
            {summaryCards.map(({ label, value, icon: Icon }) => (
              <Paper
                key={label}
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '4px',
                  bgcolor: 'white',
                  height: '100%',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#86efac',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  },
                }}
              >
                <Typography sx={{ fontSize: 13.5, color: '#334155', fontWeight: 600, lineHeight: 1.3 }}>
                  {label}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 'auto', pt: 1 }}>
                  <Box
                    sx={{
                      p: 1.1,
                      bgcolor: '#ecfdf3',
                      color: '#15803d',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} />
                  </Box>
                  <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                    {value?.toLocaleString('vi-VN') ?? '0'}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Thanh tìm kiếm và bộ lọc */}
        <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Tìm theo mã KH, họ tên, SĐT..."
            value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
            sx={{ flex: 1, minWidth: 200, bgcolor: 'white' }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search size={17} /></InputAdornment> },
              htmlInput: { 'aria-label': 'Tìm khách hàng' },
            }}
          />
          <TextField
            select
            size="small"
            label="Trạng thái hóa đơn"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
            sx={{ minWidth: 165, bgcolor: 'white' }}
          >
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="NO_INVOICE">Chưa có hóa đơn</MenuItem>
            <MenuItem value="UNPAID">Chưa thanh toán</MenuItem>
            <MenuItem value="PARTIALLY_PAID">Thanh toán một phần</MenuItem>
            <MenuItem value="PAID">Đã thanh toán</MenuItem>
            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Chi nhánh tạo hồ sơ"
            value={branchFilter}
            onChange={(event) => { setBranchFilter(event.target.value); setPage(1); }}
            sx={{ width: { xs: '100%', sm: 280 }, bgcolor: 'white' }}
          >
            <MenuItem value="ALL">Tất cả chi nhánh</MenuItem>
            {availableBranches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
            ))}
          </TextField>

          {/* Đặt lại bộ lọc (icon tiết kiệm) */}
          <TextField
            select
            size="small"
            label="Tháng tạo"
            value={createdMonthFilter}
            onChange={(event) => { setCreatedMonthFilter(event.target.value); setPage(1); }}
            sx={{ minWidth: 140, bgcolor: 'white' }}
          >
            <MenuItem value="ALL">Tất cả tháng</MenuItem>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <MenuItem key={month} value={String(month)}>Tháng {month}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Năm tạo"
            value={createdYearFilter}
            onChange={(event) => { setCreatedYearFilter(event.target.value); setPage(1); }}
            sx={{ minWidth: 130, bgcolor: 'white' }}
          >
            <MenuItem value="ALL">Tất cả năm</MenuItem>
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </TextField>

          <Tooltip title="Đặt lại bộ lọc">
            <span>
              <IconButton
                onClick={handleResetFilters}
                sx={{
                  bgcolor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  p: 0.9,
                  color: '#64748b',
                  '&:hover': { bgcolor: '#f8fafc', color: '#15803d' },
                }}
              >
                <RotateCcw size={18} />
              </IconButton>
            </span>
          </Tooltip>

          {/* Nút Làm mới (Refresh) */}
          <Tooltip title="Làm mới dữ liệu">
            <span>
              <IconButton
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
                sx={{
                  bgcolor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  p: 0.9,
                  color: '#64748b',
                  '&:hover': { bgcolor: '#f8fafc', color: '#15803d' },
                }}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 1150 }} aria-label="Danh sách khách hàng chăm sóc">
              <TableHead><TableRow>
                <TableCell padding="checkbox"><Checkbox checked={allSelected} indeterminate={selectedVisibleCount > 0 && !allSelected}
                  slotProps={{ input: { 'aria-label': 'Chọn tất cả khách hàng đang hiển thị' } }}
                  onChange={(event) => setSelectedIds((previous) => event.target.checked
                    ? [...new Set([...previous, ...visibleCustomers.map((patient) => patient.id)])]
                    : previous.filter((id) => !visibleCustomers.some((patient) => patient.id === id)))} /></TableCell>
                {['Mã KH', 'Họ tên', 'Ngày tạo', 'Số điện thoại', 'Tổng tiền', 'Công nợ', 'Trạng thái hóa đơn', 'Chăm sóc gần nhất', 'Thao tác'].map((label) => <TableCell key={label} sx={{ whiteSpace: 'nowrap' }}>{label}</TableCell>)}
              </TableRow></TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ py: 6 }}>
                      <Loading title="Đang tải danh sách khách hàng..." subtitle="Vui lòng đợi trong giây lát" size="md" />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      Không tìm thấy khách hàng phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleCustomers.map((patient) => (
                    <TableRow
                      key={patient.id}
                      hover
                      selected={selectedIds.includes(patient.id)}
                      onDoubleClick={() => handleOpenDetail(patient)}
                      sx={{ cursor: 'pointer' }}
                      title="Nhấp đúp chuột để xem chi tiết hồ sơ chăm sóc"
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.includes(patient.id)}
                        slotProps={{ input: { 'aria-label': 'Chọn ' + (patient.fullName ?? patient.patientCode ?? '') } }}
                        onChange={() => setSelectedIds((previous) => previous.includes(patient.id) ? previous.filter((id) => id !== patient.id) : [...previous, patient.id])} /></TableCell>
                      <TableCell
                        sx={{ color: 'primary.main', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => handleOpenDetail(patient)}
                      >
                        {patient.patientCode ?? ''}
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', fontWeight: 500, '&:hover': { color: 'primary.main' } }}
                        onClick={() => handleOpenDetail(patient)}
                      >
                        {patient.fullName ?? ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12, color: '#475569' }}>
                        {formatDate(patient.createdAt || patient.createAt)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{patient.phone ?? ''}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{money(patient.finalAmount)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{money(patient.debt)}</TableCell>
                      <TableCell sx={{ width: 190, minWidth: 175, py: 1 }}><Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                        {Array.isArray(patient.invoices) && patient.invoices.length === 0 && (
                          <Chip size="small" label="Chưa có hóa đơn" sx={{ borderRadius: '4px', bgcolor: '#f1f5f9', color: '#64748b' }} />
                        )}
                        {(patient.invoices ?? []).filter((invoice) => paymentLabels[invoice.paymentStatus]).map((invoice) => (
                          <Box key={invoice.id} sx={{ display: 'flex', maxWidth: '100%' }}>
                            <InvoiceStatus invoice={invoice} />
                          </Box>
                        ))}
                      </Stack></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {patient.careObj ? (
                          <Chip
                            size="small"
                            label={careCategoryLabels[patient.careObj.careCategory] || patient.careObj.careCategory}
                            sx={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              bgcolor: '#ecfdf3',
                              color: '#15803d',
                              borderRadius: '4px',
                              height: 24,
                            }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Chưa có</Typography>
                        )}
                      </TableCell>
                      <TableCell><IconButton size="small" color="primary" aria-label={'Thao tác ' + (patient.fullName ?? '')}
                        aria-haspopup="menu" aria-expanded={actionMenu?.patient.id === patient.id ? true : undefined}
                        aria-controls={actionMenu?.patient.id === patient.id ? 'customer-care-actions' : undefined}
                        onClick={(event) => setActionMenu({ anchor: event.currentTarget, patient })}><MoreHorizontal size={20} /></IconButton></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {patients !== null ? `Đang hiển thị ${filteredCustomers.length === 0 ? 0 : pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filteredCustomers.length)} / ${filteredCustomers.length} khách hàng` : ''}
              {selectedIds.length > 0 ? ' · Đã chọn ' + selectedIds.length + ' khách hàng' : ''}
            </Typography>
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(_, nextPage) => setPage(nextPage)}
              disabled={loading || filteredCustomers.length === 0}
              color="primary"
              size="small"
              shape="rounded"
              getItemAriaLabel={(type, number) => {
                if (type === 'page') return `Trang ${number}`;
                if (type === 'previous') return 'Trang trước';
                if (type === 'next') return 'Trang sau';
                return 'Phân trang';
              }}
            />
          </Box>
        </Paper>
        <Menu id="customer-care-actions" anchorEl={actionMenu?.anchor ?? null} open={Boolean(actionMenu)}
          onClose={() => setActionMenu(null)} slotProps={{ paper: { sx: { minWidth: 160, border: '1px solid #e2e8f0', mt: 0.5 } } }}>
          <MenuItem sx={{ gap: 1, color: 'primary.main', fontWeight: 600 }} onClick={() => { handleOpenDetail(actionMenu.patient); setActionMenu(null); }}>
            <HeartHandshake size={18} />Chăm sóc
          </MenuItem>
        </Menu>

        {/* Modal chi tiết hồ sơ khách hàng */}
        <CustomerCareDetail
          open={Boolean(detailCustomer)}
          onClose={() => setDetailCustomer(null)}
          customer={detailCustomer}
          onPrev={handlePrevCustomer}
          onNext={handleNextCustomer}
          currentIndex={detailIndex}
          totalCount={filteredCustomers.length}
        />
        <Dialog open={Boolean(careCustomer)} onClose={() => setCareCustomer(null)} fullWidth maxWidth="sm" aria-labelledby="care-dialog-title">
          <DialogTitle id="care-dialog-title" sx={{ color: 'primary.dark' }}>Chăm sóc khách hàng</DialogTitle>
          <DialogContent dividers>
            {careCustomer && <Stack spacing={2}>
              <TextField label="Họ tên" value={careCustomer.fullName ?? ''} size="small" slotProps={{ input: { readOnly: true } }} />
              <TextField label="Số điện thoại" value={careCustomer.phone ?? ''} size="small" slotProps={{ input: { readOnly: true } }} />
              <TextField label="Email" value={careCustomer.email ?? ''} size="small" slotProps={{ input: { readOnly: true } }} />
              <TextField label="Tổng tiền" value={money(careCustomer.finalAmount)} size="small" slotProps={{ input: { readOnly: true } }} />
              <TextField label="Công nợ" value={money(careCustomer.debt)} size="small" slotProps={{ input: { readOnly: true } }} />
              <TableContainer><Table size="small" aria-label="Hóa đơn khách hàng">
                <TableHead><TableRow><TableCell>Mã hóa đơn</TableCell><TableCell>Tổng tiền</TableCell><TableCell>Còn nợ</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead>
                <TableBody>{(careCustomer.invoices ?? []).map((invoice) => <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoiceCode ?? ''}</TableCell><TableCell>{money(invoice.finalAmount)}</TableCell><TableCell>{money(invoice.remainingAmount)}</TableCell><TableCell><InvoiceStatus invoice={invoice} /></TableCell>
                </TableRow>)}</TableBody>
              </Table></TableContainer>
            </Stack>}
          </DialogContent>
          <DialogActions><Button onClick={() => setCareCustomer(null)}>Đóng</Button></DialogActions>
        </Dialog>

        {/* Floating bar gửi khuyến mãi */}
        {canSendPromotion && (
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1.5,
              borderRadius: '4px',
              width: 'min(760px, calc(100% - 32px))',
              flexWrap: 'wrap',
              bgcolor: '#166534',
              color: 'white',
              boxShadow: '0 8px 32px rgba(21,128,61,.35)',
            }}
          >
            <Mail size={20} />
            <Box sx={{ flex: 1, minWidth: 120 }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                {selectedPromotion.title}
              </Typography>
              <Typography sx={{ fontSize: 11, opacity: .85 }}>
                Gửi đến {selectedIds.length} khách hàng đã chọn
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={bulkSending ? <CircularProgress size={15} sx={{ color: '#166534' }} /> : <Send size={15} />}
              sx={{
                ml: 1,
                bgcolor: 'white',
                color: '#166534',
                fontWeight: 700,
                '&:hover': { bgcolor: '#f0fdf4' },
                textTransform: 'none',
                borderRadius: '4px',
                px: 2.5,
              }}
              disabled={loading || bulkSending}
              onClick={handleBulkSend}
            >
              {bulkSending ? 'Đang gửi...' : 'Gửi mail'}
            </Button>
            <Tooltip title="Bỏ chọn khuyến mãi">
              <IconButton size="small" sx={{ color: 'white', opacity: .7, '&:hover': { opacity: 1 } }} onClick={() => setSelectedPromotion(null)}>
                <RotateCcw size={16} />
              </IconButton>
            </Tooltip>
          </Paper>
        )}
      </Stack>
    </ThemeProvider>
  );
}

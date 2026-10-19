import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Plus,
  Info,
  Download,
  RefreshCw,
  X,
  Bell,
  User,
  Users,
  Globe,
  Activity,
  Layers,
  MapPin,
  CreditCard,
  Filter,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ChevronDown,
  Ban,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Cake,
  Sparkles,
  CalendarCheck,
  Gift,
  HeartHandshake,
  MessageCircle,
  MessageSquare,
  Phone,
  Mail,
  Send,
  Check,
  Receipt,
  Copy,
  FileText,
  CheckCheck,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import customerCareService from '../../services/customerCare.service';
import { getInvoiceById } from '../../services/invoice.service';
import CustomerCareDetailModal from './CustomerCareDetailModal';

const TABS = [
  { id: 'FILTER', label: 'Lọc tổng hợp' },
  { id: 'GENERAL', label: 'Chăm sóc tổng hợp' },
  { id: 'APPOINTMENT', label: 'Nhắc lịch hẹn' },
  { id: 'BIRTHDAY', label: 'Ngày sinh nhật' },
  { id: 'PAYMENT', label: 'Thanh toán' },
];

export default function CustomerCare() {
  const { user } = useAuthStore();
  const currentStaffName = user?.username || 'Nguyệt Nguyễn';

  // Active Tab
  const [activeTab, setActiveTab] = useState('FILTER');
  const [newReportToggle, setNewReportToggle] = useState(true);
  const [showFilterCard, setShowFilterCard] = useState(true);

  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    dentists: [],
    employees: [],
    procedureGroups: [],
    procedures: [],
    customerGroups: [],
    customerSources: [],
    cities: [],
    districts: [],
  });

  // Common Search & Date filter for Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [careStatusFilter, setCareStatusFilter] = useState('ALL');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('ALL');
  const [dentistFilter, setDentistFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [careTypeFilter, setCareTypeFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Specific filters for Tab 1 (Lọc tổng hợp)
  const [tab1Filters, setTab1Filters] = useState({
    customerGroup: 'ALL',
    customerSource: 'ALL',
    createDateStart: '',
    createDateEnd: '',
    appointmentDateStart: '',
    appointmentDateEnd: '',
    dentistId: 'ALL',
    treatmentStatus: 'ALL',
    procedureGroup: 'ALL',
    procedureName: 'ALL',
    city: 'ALL',
    district: 'ALL',
    customerCard: '',
    careTreatment: false,
  });

  // Real Database Lists
  const [filterPatients, setFilterPatients] = useState([]);
  const [appointmentList, setAppointmentList] = useState([]);
  const [birthdayList, setBirthdayList] = useState([]);
  const [generalCareList, setGeneralCareList] = useState([]);
  const [paymentList, setPaymentList] = useState([]);

  // Clinical Quick Filters for Each Tab
  const [patientGroupQuickFilter, setPatientGroupQuickFilter] = useState('ALL');
  const [generalCareQuickFilter, setGeneralCareQuickFilter] = useState('ALL');
  const [aptQuickFilter, setAptQuickFilter] = useState('ALL');
  const [aptTypeFilter, setAptTypeFilter] = useState('ALL'); // 'ALL' | 'REGULAR' | 'FOLLOW_UP'
  const [bdayQuickFilter, setBdayQuickFilter] = useState('ALL');
  const [bdayCustomerGroupFilter, setBdayCustomerGroupFilter] = useState('ALL');
  const [paymentQuickFilter, setPaymentQuickFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentCareStatusFilter, setPaymentCareStatusFilter] = useState('ALL');

  // Unified Table Pagination
  const [pageSize, setPageSize] = useState(10);
  const [pageFilter, setPageFilter] = useState(1);
  const [pageGeneral, setPageGeneral] = useState(1);
  const [pageAppointment, setPageAppointment] = useState(1);
  const [pageBirthday, setPageBirthday] = useState(1);
  const [pagePayment, setPagePayment] = useState(1);

  // Expanded notes tracking for table rows
  const [expandedNoteIds, setExpandedNoteIds] = useState(new Set());
  const toggleExpandNote = (id) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const [stats, setStats] = useState({
    totalPending: 0,
    totalCompleted: 0,
    totalRecare: 0,
    totalFailed: 0,
    totalAppointments: 0,
    totalBirthdays: 0,
    totalGeneralCare: 0,
    satisfactionRate: 98.5,
  });

  const [loading, setLoading] = useState(false);

  // Modal State: "TẠO MỚI CHĂM SÓC"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalCareItem, setModalCareItem] = useState(null); // Reference item if clicked from row
  const [modalForm, setModalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    channel: 'PHONE',
    status: 'COMPLETED',
    careType: 'APPOINTMENT_REMINDER',
    notes: '',
    patientId: '',
    patientName: '',
    patientCode: '',
  });

  // Modal State: "CHI TIẾT CHĂM SÓC KHÁCH HÀNG" (i) - Đầy đủ 5 phần chuẩn ảnh
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailPatientId, setSelectedDetailPatientId] = useState(null);
  const [selectedDetailAppointmentId, setSelectedDetailAppointmentId] = useState(null);
  const [selectedDetailInvoiceId, setSelectedDetailInvoiceId] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Modal State: "XEM CHI TIẾT HÓA ĐƠN & GIAO DỊCH" (Receipt icon)
  const [quickInvoiceModal, setQuickInvoiceModal] = useState({
    isOpen: false,
    loading: false,
    invoice: null,
    contextCareItem: null,
    copiedBank: false,
  });

  // Modal State: "GỬI GMAIL TRỰC TIẾP CHO BỆNH NHÂN"
  const [isDirectEmailModalOpen, setIsDirectEmailModalOpen] = useState(false);
  const [directEmailForm, setDirectEmailForm] = useState({
    patientId: '',
    patientName: '',
    patientCode: '',
    phone: '',
    email: '',
    subject: '[Crown Dental] Thông tin chăm sóc khách hàng',
    message: '',
    careType: 'GENERAL_CARE',
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Load filter options & initial stats on mount
  useEffect(() => {
    loadFilterOptions();
    loadStats();
    loadAllPatientsForSelect();
  }, []);

  // Fetch data when active tab or filters change
  useEffect(() => {
    loadTabData();
  }, [
    activeTab,
    searchQuery,
    startDateFilter,
    endDateFilter,
    careStatusFilter,
    scheduleStatusFilter,
    dentistFilter,
    employeeFilter,
    careTypeFilter,
    paymentStatusFilter,
    paymentCareStatusFilter,
  ]);

  const loadFilterOptions = async () => {
    try {
      const res = await customerCareService.getFilterOptions();
      if (res.data) {
        setFilterOptions(res.data);
      }
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await customerCareService.getStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  // Pre-load all patients for dropdown selection in general care modal
  const [allPatients, setAllPatients] = useState([]);
  const loadAllPatientsForSelect = async () => {
    try {
      const res = await customerCareService.getFilterPatients({});
      setAllPatients(res.data || []);
    } catch (err) {
      console.error('Failed to load all patients', err);
    }
  };

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'FILTER') {
        const res = await customerCareService.getFilterPatients({
          customerGroup: tab1Filters.customerGroup !== 'ALL' ? tab1Filters.customerGroup : undefined,
          customerSource: tab1Filters.customerSource !== 'ALL' ? tab1Filters.customerSource : undefined,
          city: tab1Filters.city !== 'ALL' ? tab1Filters.city : undefined,
          district: tab1Filters.district !== 'ALL' ? tab1Filters.district : undefined,
          customerCard: tab1Filters.customerCard ? tab1Filters.customerCard.trim() : undefined,
          startDate: tab1Filters.createDateStart || undefined,
          endDate: tab1Filters.createDateEnd || undefined,
          appointmentStartDate: tab1Filters.appointmentDateStart || undefined,
          appointmentEndDate: tab1Filters.appointmentDateEnd || undefined,
          dentistId: tab1Filters.dentistId !== 'ALL' ? tab1Filters.dentistId : undefined,
          treatmentStatus: tab1Filters.treatmentStatus !== 'ALL' ? tab1Filters.treatmentStatus : undefined,
          procedureGroup: tab1Filters.procedureGroup !== 'ALL' ? tab1Filters.procedureGroup : undefined,
          procedureName: tab1Filters.procedureName !== 'ALL' ? tab1Filters.procedureName : undefined,
          careTreatment: tab1Filters.careTreatment ? true : undefined,
          search: searchQuery ? searchQuery.trim() : undefined,
        });
        setFilterPatients(res.data || []);
      } else if (activeTab === 'APPOINTMENT') {
        const res = await customerCareService.getAppointmentCareList({
          search: searchQuery || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
          careStatus: careStatusFilter !== 'ALL' ? careStatusFilter : undefined,
          scheduleStatus: scheduleStatusFilter !== 'ALL' ? scheduleStatusFilter : undefined,
          dentistId: dentistFilter !== 'ALL' ? dentistFilter : undefined,
        });
        setAppointmentList(res.data || []);
      } else if (activeTab === 'BIRTHDAY') {
        const res = await customerCareService.getBirthdayCareList({
          search: searchQuery || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
          careStatus: careStatusFilter !== 'ALL' ? careStatusFilter : undefined,
        });
        setBirthdayList(res.data || []);
      } else if (activeTab === 'GENERAL') {
        const res = await customerCareService.getAllCareRecords({
          search: searchQuery || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
          careType: careTypeFilter !== 'ALL' ? careTypeFilter : undefined,
          careStatus: careStatusFilter !== 'ALL' ? careStatusFilter : undefined,
        });
        setGeneralCareList(res.data || []);
      } else if (activeTab === 'PAYMENT') {
        const res = await customerCareService.getPaymentCareList({
          search: searchQuery ? searchQuery.trim() : undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
          paymentStatus: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined,
          careStatus: paymentCareStatusFilter !== 'ALL' ? paymentCareStatusFilter : (careStatusFilter !== 'ALL' ? careStatusFilter : undefined),
        });
        setPaymentList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load tab data', err);
      toast.error('Không thể tải dữ liệu chăm sóc khách hàng');
    } finally {
      setLoading(false);
    }
  };

  // Handle Search in Tab 1
  const handleTab1Search = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPageFilter(1);
    loadTabData();
    toast.success('Đã áp dụng bộ lọc dữ liệu thật!');
  };

  // Reset Tab 1 Filter
  const handleResetTab1Filters = () => {
    const defaultFilters = {
      customerGroup: 'ALL',
      customerSource: 'ALL',
      createDateStart: '',
      createDateEnd: '',
      appointmentDateStart: '',
      appointmentDateEnd: '',
      dentistId: 'ALL',
      treatmentStatus: 'ALL',
      procedureGroup: 'ALL',
      procedureName: 'ALL',
      city: 'ALL',
      district: 'ALL',
      customerCard: '',
      careTreatment: false,
    };
    setTab1Filters(defaultFilters);
    setSearchQuery('');
    setPatientGroupQuickFilter('ALL');
    setPageFilter(1);
    customerCareService.getFilterPatients({}).then((res) => {
      setFilterPatients(res.data || []);
      toast.success('Đã xóa bộ lọc và làm mới danh sách!');
    });
  };

  // Reset filters in other tabs
  const handleResetTabFilters = () => {
    setSearchQuery('');
    setStartDateFilter('');
    setEndDateFilter('');
    setCareStatusFilter('ALL');
    setScheduleStatusFilter('ALL');
    setDentistFilter('ALL');
    setEmployeeFilter('ALL');
    setCareTypeFilter('ALL');
    setAptTypeFilter('ALL');
    setAptQuickFilter('ALL');
    setBdayQuickFilter('ALL');
    setBdayCustomerGroupFilter('ALL');
    setPaymentQuickFilter('ALL');
    setPaymentStatusFilter('ALL');
    setPaymentCareStatusFilter('ALL');
    setPageAppointment(1);
    setPageBirthday(1);
    setPagePayment(1);
    toast.success('Đã làm mới bộ lọc');
  };

  // Open "TẠO MỚI CHĂM SÓC" Modal from Row (+)
  const handleOpenCreateCare = (item, type) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    let careTypeEnum = 'GENERAL_CARE';
    let defaultNotes = '';
    if (type === 'APPOINTMENT') {
      careTypeEnum = 'APPOINTMENT_REMINDER';
      defaultNotes = `Nhắc lịch hẹn khám cho khách hàng ${item?.patientName || item?.fullName || ''}.`;
    } else if (type === 'BIRTHDAY') {
      careTypeEnum = 'BIRTHDAY';
      defaultNotes = `Chúc mừng sinh nhật khách hàng ${item?.patientName || item?.fullName || ''}. Tặng voucher ưu đãi 20% dịch vụ trong tháng sinh nhật.`;
    } else if (type === 'PAYMENT') {
      careTypeEnum = 'PAYMENT';
      defaultNotes = item?.suggestedTemplate || `Chăm sóc thanh toán hóa đơn ${item?.invoiceCode || ''} cho khách hàng ${item?.patientName || ''}.`;
    }

    setModalCareItem({ ...item, contextType: type });
    setModalForm({
      date: dateStr,
      time: timeStr,
      channel: 'PHONE',
      status: 'COMPLETED',
      careType: careTypeEnum,
      notes: defaultNotes,
      invoiceId: item?.invoiceId || '',
      patientId: item?.patientId || '',
      patientName: item?.patientName || item?.fullName || '',
      patientCode: item?.patientCode || '',
    });
    setIsCreateModalOpen(true);
  };

  // Open "Tạo chăm sóc tổng hợp" Button
  const handleOpenGeneralCreateCare = () => {
    const now = new Date();
    setModalCareItem(null);
    setModalForm({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      channel: 'PHONE',
      status: 'COMPLETED',
      careType: 'GENERAL_CARE',
      notes: '',
      patientId: allPatients.length > 0 ? allPatients[0].patientId : '',
      patientName: allPatients.length > 0 ? allPatients[0].fullName : '',
      patientCode: allPatients.length > 0 ? allPatients[0].patientCode : '',
    });
    setIsCreateModalOpen(true);
  };

  // Submit "TẠO MỚI CHĂM SÓC" -> Lưu vào DB thật
  const handleSaveCare = async (e) => {
    e.preventDefault();
    if (!modalForm.notes.trim()) {
      toast.error('Vui lòng nhập nội dung chăm sóc');
      return;
    }

    try {
      const careDateTime = `${modalForm.date}T${modalForm.time}:00`;
      const payload = {
        patientId: modalForm.patientId || undefined,
        appointmentId: modalCareItem?.appointmentId || undefined,
        invoiceId: modalCareItem?.invoiceId || modalForm.invoiceId || undefined,
        careType: modalForm.careType,
        channel: modalForm.channel,
        status: modalForm.status,
        careTime: careDateTime,
        notes: modalForm.notes,
        createdByName: currentStaffName,
      };

      await customerCareService.createCareRecord(payload);
      if (modalForm.channel === 'GMAIL' || modalForm.channel === 'EMAIL') {
        toast.success('Đã lưu và gửi Gmail trực tiếp cho bệnh nhân thành công!');
      } else {
        toast.success('Đã lưu thông tin chăm sóc khách hàng vào CSDL thành công!');
      }
      setIsCreateModalOpen(false);
      loadTabData();
      loadStats();
    } catch (err) {
      console.error('Failed to create care record', err);
      toast.error('Không thể lưu thông tin chăm sóc');
    }
  };

  // Mở Modal gửi Gmail trực tiếp cho bệnh nhân
  const handleOpenDirectEmail = (item) => {
    if (isCareCompleted(item)) {
      toast.error('Bản ghi chăm sóc này đã được xử lý hoàn thành trước đó. Để gửi thông tin mới, vui lòng dùng nút (+) Thêm chăm sóc.');
      return;
    }
    const pId = item?.patientId || item?.id;
    const pName = item?.patientName || item?.fullName || '';
    const pCode = item?.patientCode || '';
    const phone = item?.phone || item?.phoneNumber || '';
    const patientObj = allPatients.find((p) => p.patientId === pId || p.id === pId);
    const email = item?.email || patientObj?.email || '';

    let defaultSubject = '[Crown Dental] Thông tin chăm sóc khách hàng';
    let defaultMsg = `Kính gửi Quý khách ${pName},\n\nNha Khoa Quốc Tế Crown Dental trân trọng gửi lời thăm hỏi đến Quý khách. Chúc Quý khách luôn có một hàm răng khỏe mạnh và nụ cười rạng rỡ.`;

    if (item?.careType === 'APPOINTMENT_REMINDER' || item?.contextType === 'APPOINTMENT') {
      defaultSubject = `[Crown Dental] Nhắc lịch hẹn tái khám của Quý khách ${pName}`;
      defaultMsg = `Kính gửi Quý khách ${pName},\n\nCrown Dental xin nhắc Quý khách về lịch hẹn khám tại phòng khám. Quý khách vui lòng đến trước 10 phút để được phục vụ tốt nhất. Nếu cần hỗ trợ dời lịch, xin vui lòng phản hồi email này hoặc liên hệ Hotline: 0343632524.`;
    } else if (item?.careType === 'BIRTHDAY' || item?.contextType === 'BIRTHDAY' || item?.birthdayFormatted || item?.dateOfBirth) {
      defaultSubject = `🎂 [Crown Dental] Chúc mừng sinh nhật Quý khách ${pName}! 🎉`;
      defaultMsg = `Kính gửi Quý khách ${pName},\n\nNhân dịp sinh nhật, Nha Khoa Quốc Tế Crown Dental xin gửi đến Quý khách lời chúc mừng sinh nhật nồng nhiệt và chân thành nhất! Chúc Quý khách một tuổi mới luôn dồi dào sức khỏe, tràn đầy niềm vui, hạnh phúc và thành công rực rỡ!\n\nNhân dịp đặc biệt này, Crown Dental xin gửi tặng Quý khách món quà tri ấn đặc biệt:\n🎁 Voucher giảm 20% toàn bộ dịch vụ chăm sóc & thẩm mỹ răng miệng áp dụng trong suốt tháng sinh nhật.\n\nKính chúc Quý khách luôn có một nụ cười rạng ngời và tự tin!\n\nTrân trọng,\nNha Khoa Quốc Tế Crown Dental\nHotline: 0343632524 | Website: crowndental.vn`;
    } else if (item?.careType === 'PAYMENT' || item?.contextType === 'PAYMENT' || item?.invoiceId) {
      const code = item?.invoiceCode || 'Hóa đơn';
      const finalAmt = (item?.finalAmount != null) ? Number(item.finalAmount).toLocaleString('vi-VN') + ' đ' : '0 đ';
      const paidAmt = (item?.paidAmount != null) ? Number(item.paidAmount).toLocaleString('vi-VN') + ' đ' : '0 đ';
      const remainAmt = (item?.remainingAmount != null) ? Number(item.remainingAmount).toLocaleString('vi-VN') + ' đ' : '0 đ';

      if (item?.paymentStatus === 'PAID') {
        defaultSubject = `[Crown Dental] Thư cảm ơn Quý khách ${pName} đã hoàn tất thanh toán (${code})`;
        defaultMsg = `Kính gửi Quý khách ${pName},\n\nNha Khoa Quốc Tế Crown Dental trân trọng gửi lời cảm ơn chân thành đến Quý khách đã tin tưởng sử dụng dịch vụ và hoàn tất thanh toán hóa đơn ${code} (Tổng chi phí: ${finalAmt}).\n\nToàn bộ dữ liệu hồ sơ điều trị của Quý khách đã được lưu trữ điện tử và kích hoạt chính sách bảo hành chính hãng tại phòng khám. Kính chúc Quý khách luôn có một nụ cười khỏe đẹp và rạng rỡ tự tin!\n\nNếu Quý khách cần hỗ trợ thêm thông tin hoặc tư vấn chăm sóc răng miệng định kỳ, xin vui lòng liên hệ Hotline: 0343632524.\n\nTrân trọng,\nNha Khoa Quốc Tế Crown Dental\nHotline: 0343632524 | Website: crowndental.vn`;
      } else {
        defaultSubject = `[Crown Dental] Thông báo công nợ dịch vụ hóa đơn ${code} - Quý khách ${pName}`;
        defaultMsg = `Kính gửi Quý khách ${pName},\n\nNha Khoa Quốc Tế Crown Dental xin gửi thông báo chi tiết tình trạng thanh toán dịch vụ điều trị của Quý khách:\n• Mã hóa đơn: ${code}\n• Tổng chi phí điều trị: ${finalAmt}\n• Số tiền đã thanh toán: ${paidAmt}\n• Số tiền còn nợ cần thanh toán: ${remainAmt}\n\nQuý khách có thể thanh toán trực tiếp tại quầy thu ngân phòng khám hoặc chuyển khoản theo thông tin chính thức sau:\n- Ngân hàng: MB Bank (Ngân Hàng Quân Đội)\n- Số tài khoản: 0343632524\n- Chủ tài khoản: NHA KHOA QUOC TE CROWN DENTAL\n- Nội dung chuyển khoản: ${code} - ${pName}\n\nXin trân trọng cảm ơn Quý khách!\nHotline hỗ trợ: 0343632524`;
      }
    } else if (item?.notes) {
      defaultMsg = item.notes;
    }

    const resolvedCareType = (item?.careType === 'BIRTHDAY' || item?.contextType === 'BIRTHDAY' || item?.birthdayFormatted || item?.dateOfBirth)
      ? 'BIRTHDAY'
      : (item?.careType === 'PAYMENT' || item?.contextType === 'PAYMENT' || item?.invoiceId)
        ? 'PAYMENT'
        : (item?.careType || 'GENERAL_CARE');

    setDirectEmailForm({
      patientId: pId,
      invoiceId: item?.invoiceId || null,
      invoiceCode: item?.invoiceCode || '',
      finalAmount: item?.finalAmount || 0,
      paidAmount: item?.paidAmount || 0,
      remainingAmount: item?.remainingAmount || 0,
      paymentStatus: item?.paymentStatus || '',
      patientName: pName,
      patientCode: pCode,
      phone: phone,
      email: email,
      subject: defaultSubject,
      message: defaultMsg,
      careType: resolvedCareType,
    });
    setIsDirectEmailModalOpen(true);
  };

  // Gửi Gmail trực tiếp qua backend SMTP
  const handleSendDirectEmail = async (e) => {
    e.preventDefault();
    if (!directEmailForm.email || !directEmailForm.email.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ Email người nhận hợp lệ');
      return;
    }
    if (!directEmailForm.message.trim()) {
      toast.error('Vui lòng nhập nội dung email gửi đến bệnh nhân');
      return;
    }

    setSendingEmail(true);
    try {
      await customerCareService.sendDirectCareEmail({
        patientId: directEmailForm.patientId,
        invoiceId: directEmailForm.invoiceId || undefined,
        email: directEmailForm.email,
        subject: directEmailForm.subject,
        message: directEmailForm.message,
        careType: directEmailForm.careType,
        createdByName: currentStaffName,
      });

      toast.success(`Đã gửi Gmail trực tiếp đến ${directEmailForm.email} thành công!`);
      setIsDirectEmailModalOpen(false);
      loadTabData();
      loadStats();
    } catch (err) {
      console.error('Failed to send direct email:', err);
      toast.error('Không thể gửi Gmail. Vui lòng kiểm tra lại cấu hình hoặc email người nhận.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Open "CHI TIẾT CHĂM SÓC KHÁCH HÀNG" Modal (i) -> Đầy đủ 5 phần chuẩn ảnh từ CSDL thật
  const handleOpenHistory = (item) => {
    const pId = item?.patientId || item?.id;
    if (!pId) {
      toast.error('Bệnh nhân chưa có hồ sơ liên kết trong hệ thống');
      return;
    }
    const aptId = item?.appointmentId || (item?.appointmentTime ? item?.id : null);
    const invId = item?.invoiceId || null;
    setSelectedDetailPatientId(pId);
    setSelectedDetailAppointmentId(aptId);
    setSelectedDetailInvoiceId(invId);
    setSelectedDetailItem(item);
    setIsDetailModalOpen(true);
  };

  // Open "XEM NHANH CHI TIẾT HÓA ĐƠN & GIAO DỊCH" Modal (Receipt Icon)
  const handleOpenQuickInvoice = async (item) => {
    if (!item?.invoiceId) {
      toast.error('Hóa đơn không tồn tại ID hợp lệ');
      return;
    }
    setQuickInvoiceModal({
      isOpen: true,
      loading: true,
      invoice: null,
      contextCareItem: item,
      copiedBank: false,
    });
    try {
      const invData = await getInvoiceById(item.invoiceId);
      setQuickInvoiceModal({
        isOpen: true,
        loading: false,
        invoice: invData,
        contextCareItem: item,
        copiedBank: false,
      });
    } catch (err) {
      console.error('Lỗi lấy chi tiết hóa đơn:', err);
      toast.error('Không thể tải chi tiết hóa đơn. Vui lòng thử lại.');
      setQuickInvoiceModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Trạng thái phân vùng sao chép (STK, SYNTAX, AMOUNT, ALL)
  const [copiedBankField, setCopiedBankField] = useState(null);

  // Sao chép từng mục riêng lẻ kèm visual feedback
  const handleCopyBankField = (text, fieldKey, successLabel) => {
    if (!text && text !== 0) return;
    navigator.clipboard?.writeText(String(text).trim());
    setCopiedBankField(fieldKey);
    toast.success(successLabel || 'Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => {
      setCopiedBankField((prev) => (prev === fieldKey ? null : prev));
    }, 2200);
  };

  // Helper tạo URL ảnh VietQR chuẩn Napas 24/7 (MB Bank)
  const getVietQrImageUrl = (amount, invCode, pName) => {
    const rawAmt = Math.round(Number(amount) || 0);
    const content = `${invCode || 'HD'} ${pName || ''}`.trim();
    const encodedContent = encodeURIComponent(content);
    return `https://img.vietqr.io/image/MB-0343632524-compact2.png?amount=${rawAmt}&addInfo=${encodedContent}&accountName=CROWN%20DENTAL`;
  };

  // Sao chép thông tin STK MB Bank vào clipboard (hỗ trợ cả sao chép tổng hợp)
  const handleCopyBankInfo = (invCode, pName, amount) => {
    const amtStr = Number(amount || 0) > 0 ? `${Number(amount).toLocaleString('vi-VN')} đ` : '';
    const text = [
      '--- THÔNG TIN CHUYỂN KHOẢN NHA KHOA CROWN DENTAL ---',
      '• Ngân hàng: MB Bank (Ngân Hàng Quân Đội)',
      '• Số tài khoản: 0343632524',
      '• Chủ tài khoản: CROWN DENTAL',
      amtStr ? `• Số tiền: ${amtStr}` : null,
      `• Cú pháp nội dung: ${invCode || ''} - ${pName || ''}`,
      'Quý khách vui lòng chuyển khoản đúng cú pháp để hệ thống tự động xác nhận hóa đơn.',
      '---------------------------------------------------'
    ].filter(Boolean).join('\n');

    handleCopyBankField(text, 'ALL', 'Đã sao chép toàn bộ thông tin tài khoản MB Bank!');
    setQuickInvoiceModal((prev) => ({ ...prev, copiedBank: true }));
    setTimeout(() => {
      setQuickInvoiceModal((prev) => ({ ...prev, copiedBank: false }));
    }, 2500);
  };

  // Export Table to CSV
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `cham_soc_khach_hang_${activeTab.toLowerCase()}.csv`;

    if (activeTab === 'APPOINTMENT') {
      headers = [
        'Mã hồ sơ',
        'Họ tên',
        'Điện thoại',
        'Thời gian hẹn',
        'Loại lịch hẹn',
        'Dịch vụ / Lý do khám',
        'Bác sĩ',
        'Trạng thái lịch',
        'Trạng thái chăm sóc',
        'Kênh chăm sóc',
        'Thời gian chăm sóc',
        'Nội dung',
      ];
      rows = appointmentList.map((a) => [
        a.patientCode || '',
        a.patientName || '',
        a.phone || '',
        formatDateTime(a.appointmentTime),
        a.isFollowUp || a.appointmentType === 'Tái khám' ? 'Lịch tái khám' : 'Lịch hẹn',
        a.serviceName || '',
        a.dentistName || '',
        a.scheduleStatus || '',
        a.careStatus || '',
        a.careChannel || '',
        formatDateTime(a.careTime),
        `"${(a.careNotes || '').replace(/"/g, '""')}"`,
      ]);
    } else if (activeTab === 'BIRTHDAY') {
      headers = [
        'Mã hồ sơ',
        'Họ tên',
        'Nhóm khách hàng',
        'Điện thoại',
        'Email',
        'Ngày sinh nhật',
        'Tuổi',
        'Trạng thái chăm sóc',
        'Kênh chăm sóc',
        'Thời gian chăm sóc',
        'Nội dung / Lời chúc',
      ];
      rows = filteredBirthdayList.map((b) => [
        b.patientCode || '',
        b.patientName || '',
        b.customerGroup || '',
        b.phone || '',
        b.email || '',
        b.birthdayFormatted || '',
        b.age ? `${b.age} tuổi` : (b.birthYear || ''),
        b.careStatus || '',
        b.careChannel || '',
        formatDateTime(b.careTime),
        `"${(b.careNotes || '').replace(/"/g, '""')}"`,
      ]);
    } else if (activeTab === 'GENERAL') {
      headers = [
        'Mã hồ sơ',
        'Họ tên',
        'Điện thoại',
        'Loại chăm sóc',
        'Kênh chăm sóc',
        'Trạng thái chăm sóc',
        'Thời gian chăm sóc',
        'Người thực hiện',
        'Nội dung',
      ];
      rows = generalCareList.map((c) => [
        c.patientCode || '',
        c.patientName || '',
        c.phone || '',
        c.careTypeLabel || '',
        c.channelLabel || '',
        c.statusLabel || '',
        formatDateTime(c.careTime),
        c.createdByName || '',
        `"${(c.notes || '').replace(/"/g, '""')}"`,
      ]);
    } else if (activeTab === 'PAYMENT') {
      filename = `cham_soc_thanh_toan_${new Date().toISOString().split('T')[0]}.csv`;
      headers = [
        'Mã hồ sơ',
        'Khách hàng',
        'Điện thoại',
        'Nhóm khách hàng',
        'Mã hóa đơn',
        'Ngày lập',
        'Tổng tiền (VNĐ)',
        'Đã thanh toán (VNĐ)',
        'Còn nợ (VNĐ)',
        'Trạng thái hóa đơn',
        'Trạng thái CSKH',
        'Thời gian CSKH',
        'Kênh CSKH',
        'Nội dung CSKH',
      ];
      rows = filteredPaymentList.map((p) => [
        p.patientCode || '',
        `"${p.patientName || ''}"`,
        p.phone || '',
        p.customerGroup || '',
        p.invoiceCode || '',
        p.invoiceDate ? formatDate(p.invoiceDate) : '',
        p.finalAmount ?? 0,
        p.paidAmount ?? 0,
        p.remainingAmount ?? 0,
        p.paymentStatusLabel || p.paymentStatus || '',
        p.careStatus || 'Chưa chăm sóc',
        p.careTime ? formatDateTime(p.careTime) : '',
        p.careChannel || '',
        `"${(p.careNotes || '').replace(/"/g, '""')}"`,
      ]);
    } else {
      headers = [
        'Mã hồ sơ',
        'Họ tên',
        'Giới tính',
        'Ngày sinh',
        'Năm sinh',
        'Điện thoại',
        'Email',
        'CCCD',
        'Nhóm khách hàng',
        'Nguồn khách hàng',
        'Thẻ thành viên',
        'Ngày tạo',
        'Tỉnh / Thành phố',
        'Quận / Huyện',
        'Địa chỉ',
        'Bác sĩ gần nhất',
        'Lượt khám',
        'Tình trạng điều trị',
        'Ghi chú',
      ];
      rows = filterPatients.map((p) => [
        p.patientCode || '',
        p.fullName || '',
        p.gender || '',
        p.dateOfBirth || '',
        p.birthYear || '',
        p.phoneNumber || '',
        p.email || '',
        p.cccd || '',
        p.customerGroup || '',
        p.customerSource || '',
        p.customerCard || '',
        formatDate(p.createdAt),
        p.city || '',
        p.district || '',
        `"${(p.address || '').replace(/"/g, '""')}"`,
        p.lastDentist || '',
        p.totalAppointments || 0,
        p.treatmentStatus || '',
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Xuất file báo cáo thành công!');
  };

  // Helper date formatters
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes('hoàn thành')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-300">
          Hoàn thành
        </span>
      );
    }
    if (s.includes('cần chăm sóc')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-300">
          Cần chăm sóc lại
        </span>
      );
    }
    if (s.includes('thất bại')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-300">
          Gửi thất bại
        </span>
      );
    }
    if (s.includes('không nghe máy')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">
          Không nghe máy
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50/90 text-rose-500 border border-rose-200">
        Chưa chăm sóc
      </span>
    );
  };

  // Render Care Type Tag
  const renderCareTypeTag = (type, label) => {
    const t = (type || '').toUpperCase();
    if (t === 'APPOINTMENT_REMINDER' || (label || '').toLowerCase().includes('nhắc lịch')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar size={11} className="text-blue-500" />
          {label || 'Nhắc lịch hẹn'}
        </span>
      );
    }
    if (t === 'BIRTHDAY' || (label || '').toLowerCase().includes('sinh nhật')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-pink-50 text-pink-700 border border-pink-200">
          <Gift size={11} className="text-pink-500" />
          {label || 'Ngày sinh nhật'}
        </span>
      );
    }
    if (t === 'PAYMENT' || (label || '').toLowerCase().includes('thanh toán')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CreditCard size={11} className="text-emerald-500" />
          {label || 'Thanh toán'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
        <HeartHandshake size={11} className="text-purple-500" />
        {label || 'Chăm sóc tổng hợp'}
      </span>
    );
  };

  // Kiểm tra xem bản ghi chăm sóc đã hoàn thành / đã xử lý chưa
  const isCareCompleted = (item) => {
    if (!item) return false;
    const rawStatus = (item.status || item.careStatus || item.statusLabel || '').toString().toUpperCase().trim();
    return (
      rawStatus === 'COMPLETED' ||
      rawStatus === 'HOÀN THÀNH' ||
      rawStatus === 'HOAN THANH' ||
      rawStatus === 'ĐÃ CHĂM SÓC' ||
      rawStatus === 'DA CHAM SOC'
    );
  };

  // Render Care Channel Tag (Khóa nếu đã xử lý hoàn thành, cho phép gửi/gọi nếu chưa xử lý)
  const renderChannelTag = (channel, label, item) => {
    const ch = (channel || '').toUpperCase();
    const isCompleted = isCareCompleted(item);
    const phone = item?.phone || item?.phoneNumber;

    // ==================== TRƯỜNG HỢP 1: ĐÃ XỬ LÝ (HOÀN THÀNH) ====================
    // Khi đã xử lý xong, khóa không cho gửi lại để tránh spam / gửi trùng lặp cho khách hàng
    if (isCompleted) {
      if (
        ch === 'GMAIL' ||
        ch === 'EMAIL' ||
        (label || '').toLowerCase().includes('gmail') ||
        (label || '').toLowerCase().includes('mail') ||
        ch === 'ZALO_SMS'
      ) {
        return (
          <span
            title={`Đã gửi Gmail hoàn thành (${formatDateTime(item?.careTime || item?.createdAt)}). Không thể gửi lại để tránh trùng lặp.`}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 cursor-default select-none shadow-2xs"
          >
            <Check size={11} className="text-emerald-600 stroke-[2.5]" />
            <Mail size={11} className="text-rose-500 opacity-80" />
            <span>Gmail</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-200">
              Đã gửi
            </span>
          </span>
        );
      }

      if (ch === 'PHONE' || (label || '').toLowerCase().includes('gọi')) {
        return (
          <span
            title={`Đã gọi điện hoàn thành (${formatDateTime(item?.careTime || item?.createdAt)}).`}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 cursor-default select-none shadow-2xs"
          >
            <Check size={11} className="text-emerald-600 stroke-[2.5]" />
            <Phone size={11} className="text-emerald-600 opacity-80" />
            <span>Gọi điện</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-200">
              Đã gọi
            </span>
          </span>
        );
      }

      if (ch === 'SMS' || (label || '').toLowerCase().includes('tin nhắn')) {
        return (
          <span
            title={`Đã gửi tin nhắn SMS hoàn thành (${formatDateTime(item?.careTime || item?.createdAt)}).`}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 cursor-default select-none shadow-2xs"
          >
            <Check size={11} className="text-emerald-600 stroke-[2.5]" />
            <MessageSquare size={11} className="text-amber-600 opacity-80" />
            <span>Tin nhắn</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-200">
              Đã gửi
            </span>
          </span>
        );
      }

      return (
        <span
          title={`Đã xử lý trực tiếp hoàn thành (${formatDateTime(item?.careTime || item?.createdAt)}).`}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 cursor-default select-none shadow-2xs"
        >
          <Check size={11} className="text-emerald-600 stroke-[2.5]" />
          <User size={11} className="text-slate-500" />
          <span>Trực tiếp</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-200">
            Đã xong
          </span>
        </span>
      );
    }

    // ==================== TRƯỜNG HỢP 2: CHƯA XỬ LÝ / CẦN XỬ LÝ LẠI / GỬI THẤT BẠI ====================
    // Cho phép xử lý liên lạc hoặc gửi thông tin trực tiếp ngay lập tức
    if (ch === 'PHONE' || (label || '').toLowerCase().includes('gọi')) {
      return (
        <a
          href={phone ? `tel:${phone}` : undefined}
          onClick={(e) => {
            if (!phone) {
              e.preventDefault();
              toast.info('Bệnh nhân chưa có số điện thoại để gọi trực tiếp');
            }
          }}
          title={phone ? `Gọi điện ngay: ${phone}` : 'Gọi điện'}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer shadow-2xs"
        >
          <Phone size={11} className="text-emerald-600 animate-pulse" />
          <span>Gọi ngay</span>
        </a>
      );
    }

    if (
      ch === 'GMAIL' ||
      ch === 'EMAIL' ||
      (label || '').toLowerCase().includes('gmail') ||
      (label || '').toLowerCase().includes('mail') ||
      ch === 'ZALO_SMS'
    ) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (item) {
              handleOpenDirectEmail(item);
            }
          }}
          title="Bản ghi chưa hoàn thành - Nhấp để gửi Gmail trực tiếp cho khách hàng"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 hover:border-rose-400 hover:shadow-2xs transition-all cursor-pointer animate-pulse"
        >
          <Mail size={11} className="text-rose-600" />
          <span>Gửi Gmail</span>
        </button>
      );
    }

    if (ch === 'SMS' || (label || '').toLowerCase().includes('tin nhắn')) {
      return (
        <a
          href={phone ? `sms:${phone}` : undefined}
          onClick={(e) => {
            if (!phone) {
              e.preventDefault();
              toast.info('Bệnh nhân chưa có số điện thoại để gửi tin nhắn');
            }
          }}
          title={phone ? `Nhắn tin SMS trực tiếp: ${phone}` : 'Tin nhắn'}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs"
        >
          <MessageSquare size={11} className="text-amber-600" />
          <span>Gửi SMS</span>
        </a>
      );
    }

    if (!ch || item?.careStatus === 'Chưa chăm sóc') {
      return (
        <span className="text-gray-400 italic text-[11px]">Chưa chăm sóc</span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200">
        <User size={11} className="text-gray-500" />
        {label || 'Trực tiếp'}
      </span>
    );
  };

  // Render Schedule Status
  const renderScheduleStatus = (status) => {
    if (!status || status === 'Chưa đến') {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Chưa đến
        </span>
      );
    }
    if (status === 'Đã đến' || status === 'Đã xong') {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {status}
        </span>
      );
    }
    if (status === 'Không đến' || status === 'Từ chối' || status === 'Đã hủy') {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {status}
        </span>
      );
    }
    if (status === 'Đang điều trị') {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">
        {status}
      </span>
    );
  };

  const getCareTypeLabel = (type) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return 'Nhắc lịch hẹn';
      case 'BIRTHDAY':
        return 'Ngày sinh nhật';
      case 'PAYMENT':
        return 'Thanh toán';
      case 'GENERAL_CARE':
      default:
        return 'Chăm sóc tổng hợp';
    }
  };

  // Render Customer Group Badge
  const renderCustomerGroupBadge = (group) => {
    if (!group) return null;
    if (group.includes('VIP')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
          {group}
        </span>
      );
    }
    if (group.includes('thân thiết')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {group}
        </span>
      );
    }
    if (group.includes('tiềm năng')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          {group}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
        {group}
      </span>
    );
  };

  // Render Treatment Status Badge
  const renderTreatmentStatusBadge = (status) => {
    if (!status) return <span className="text-gray-400 text-[11px]">—</span>;
    switch (status) {
      case 'Đang điều trị':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang điều trị
          </span>
        );
      case 'Đã đặt hẹn':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={10} />
            Đã đặt hẹn
          </span>
        );
      case 'Đã hoàn thành':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <CheckCircle2 size={10} />
            Đã hoàn thành
          </span>
        );
      case 'Đã khám':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
            Đã khám
          </span>
        );
      case 'Chưa khám':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-normal bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  // Unified Pagination Component
  const renderPagination = (totalItems, currentPage, setCurrentPage) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 text-xs focus:outline-hidden"
          >
            <option value={10}>10 dòng</option>
            <option value={25}>25 dòng</option>
            <option value={50}>50 dòng</option>
          </select>
          <span>/ trang (tổng {totalItems} bản ghi)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            {startIndex} - {endIndex} của {totalItems}
          </span>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium cursor-pointer"
          >
            <ChevronLeft size={13} /> Trước
          </button>
          <span className="font-semibold text-purple-700 px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium cursor-pointer"
          >
            Sau <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  // Active Filter Count for Tab 1
  const activeTab1FilterCount = useMemo(() => {
    let count = 0;
    if (tab1Filters.customerGroup && tab1Filters.customerGroup !== 'ALL') count++;
    if (tab1Filters.customerSource && tab1Filters.customerSource !== 'ALL') count++;
    if (tab1Filters.createDateStart || tab1Filters.createDateEnd) count++;
    if (tab1Filters.appointmentDateStart || tab1Filters.appointmentDateEnd) count++;
    if (tab1Filters.dentistId && tab1Filters.dentistId !== 'ALL') count++;
    if (tab1Filters.treatmentStatus && tab1Filters.treatmentStatus !== 'ALL') count++;
    if (tab1Filters.procedureGroup && tab1Filters.procedureGroup !== 'ALL') count++;
    if (tab1Filters.procedureName && tab1Filters.procedureName !== 'ALL') count++;
    if (tab1Filters.city && tab1Filters.city !== 'ALL') count++;
    if (tab1Filters.district && tab1Filters.district !== 'ALL') count++;
    if (tab1Filters.customerCard && tab1Filters.customerCard.trim()) count++;
    if (tab1Filters.careTreatment) count++;
    if (searchQuery && searchQuery.trim()) count++;
    return count;
  }, [tab1Filters, searchQuery]);

  // Filtered & Paginated Lists for Tab 1 (Patients)
  const filteredPatients = useMemo(() => {
    let list = filterPatients;

    // Quick filter pill
    if (patientGroupQuickFilter !== 'ALL') {
      list = list.filter((p) => p.customerGroup === patientGroupQuickFilter);
    }

    // Reactive client-side filtering safeguards
    if (tab1Filters.customerGroup && tab1Filters.customerGroup !== 'ALL') {
      list = list.filter((p) => p.customerGroup === tab1Filters.customerGroup);
    }

    if (tab1Filters.customerSource && tab1Filters.customerSource !== 'ALL') {
      list = list.filter((p) => p.customerSource === tab1Filters.customerSource);
    }

    if (tab1Filters.treatmentStatus && tab1Filters.treatmentStatus !== 'ALL') {
      list = list.filter((p) => (p.treatmentStatus || '').toLowerCase() === tab1Filters.treatmentStatus.toLowerCase());
    }

    if (tab1Filters.city && tab1Filters.city !== 'ALL') {
      const c = tab1Filters.city.toLowerCase();
      list = list.filter((p) => (p.city || p.address || '').toLowerCase().includes(c));
    }

    if (tab1Filters.district && tab1Filters.district !== 'ALL') {
      const d = tab1Filters.district.toLowerCase();
      list = list.filter((p) => (p.district || p.address || '').toLowerCase().includes(d));
    }

    if (tab1Filters.customerCard && tab1Filters.customerCard.trim()) {
      const card = tab1Filters.customerCard.trim().toLowerCase();
      list = list.filter((p) => (p.customerCard || '').toLowerCase().includes(card));
    }

    if (tab1Filters.procedureGroup && tab1Filters.procedureGroup !== 'ALL') {
      const pg = tab1Filters.procedureGroup.toLowerCase();
      list = list.filter((p) => (p.procedureGroup || '').toLowerCase().includes(pg));
    }

    if (tab1Filters.procedureName && tab1Filters.procedureName !== 'ALL') {
      const pn = tab1Filters.procedureName.toLowerCase();
      list = list.filter((p) => (p.procedureName || '').toLowerCase().includes(pn));
    }

    if (tab1Filters.careTreatment) {
      list = list.filter((p) => {
        const st = (p.treatmentStatus || '').toLowerCase();
        return st.includes('đang điều trị') || st.includes('đã đặt hẹn') || (p.totalAppointments && p.totalAppointments > 0);
      });
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        (p.patientCode && p.patientCode.toLowerCase().includes(q)) ||
        (p.fullName && p.fullName.toLowerCase().includes(q)) ||
        (p.phoneNumber && p.phoneNumber.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.cccd && p.cccd.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
      );
    }

    return list;
  }, [filterPatients, patientGroupQuickFilter, tab1Filters, searchQuery]);

  const paginatedPatients = useMemo(() => {
    const start = (pageFilter - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, pageFilter, pageSize]);

  // Filtered & Paginated Lists for Tab 2 (General Care)
  const filteredGeneralCareList = useMemo(() => {
    let list = generalCareList;
    if (generalCareQuickFilter !== 'ALL') {
      list = list.filter((c) => c.careType === generalCareQuickFilter);
    }
    if (careTypeFilter !== 'ALL') {
      list = list.filter((c) => c.careType === careTypeFilter);
    }
    if (careStatusFilter !== 'ALL') {
      list = list.filter((c) => (c.statusLabel || c.status) === careStatusFilter);
    }
    if (channelFilter !== 'ALL') {
      list = list.filter((c) => c.channel === channelFilter || (c.channelLabel || '').toLowerCase().includes(channelFilter.toLowerCase()));
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) =>
        (c.patientName && c.patientName.toLowerCase().includes(q)) ||
        (c.patientCode && c.patientCode.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.createdByName && c.createdByName.toLowerCase().includes(q))
      );
    }
    if (startDateFilter) {
      list = list.filter((c) => c.careTime && c.careTime.substring(0, 10) >= startDateFilter);
    }
    if (endDateFilter) {
      list = list.filter((c) => c.careTime && c.careTime.substring(0, 10) <= endDateFilter);
    }
    return list;
  }, [generalCareList, generalCareQuickFilter, careTypeFilter, careStatusFilter, channelFilter, searchQuery, startDateFilter, endDateFilter]);

  const paginatedGeneralCare = useMemo(() => {
    const start = (pageGeneral - 1) * pageSize;
    return filteredGeneralCareList.slice(start, start + pageSize);
  }, [filteredGeneralCareList, pageGeneral, pageSize]);

  // Filtered & Paginated Lists for Tab 3 (Appointments)
  const filteredAppointmentList = useMemo(() => {
    let list = appointmentList;

    // 1. Quick pill filter
    if (aptQuickFilter === 'TODAY') {
      list = list.filter((a) => a.isToday);
    } else if (aptQuickFilter === 'TOMORROW') {
      list = list.filter((a) => a.isTomorrow);
    } else if (aptQuickFilter === 'THIS_WEEK') {
      list = list.filter((a) => a.daysUntil >= 0 && a.daysUntil <= 7);
    } else if (aptQuickFilter === 'UNATTENDED') {
      list = list.filter((a) => a.careStatus === 'Chưa chăm sóc');
    } else if (aptQuickFilter === 'RECARE') {
      list = list.filter((a) => a.careStatus === 'Cần chăm sóc lại');
    }

    // 2. Appointment Type filter (Lịch hẹn thường vs Lịch tái khám)
    if (aptTypeFilter === 'REGULAR') {
      list = list.filter((a) => !a.isFollowUp && a.appointmentType !== 'Tái khám');
    } else if (aptTypeFilter === 'FOLLOW_UP') {
      list = list.filter((a) => a.isFollowUp || a.appointmentType === 'Tái khám');
    }

    // 3. Search query (Patient Code, Name, Phone, Service/Reason, Dentist, Notes)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.patientCode && a.patientCode.toLowerCase().includes(q)) ||
          (a.patientName && a.patientName.toLowerCase().includes(q)) ||
          (a.phone && a.phone.includes(q)) ||
          (a.serviceName && a.serviceName.toLowerCase().includes(q)) ||
          (a.dentistName && a.dentistName.toLowerCase().includes(q)) ||
          (a.careNotes && a.careNotes.toLowerCase().includes(q))
      );
    }

    // 4. Date range filter (on appointmentTime)
    if (startDateFilter) {
      list = list.filter((a) => {
        if (!a.appointmentTime) return false;
        const d = typeof a.appointmentTime === 'string' ? a.appointmentTime.substring(0, 10) : '';
        return d >= startDateFilter;
      });
    }
    if (endDateFilter) {
      list = list.filter((a) => {
        if (!a.appointmentTime) return false;
        const d = typeof a.appointmentTime === 'string' ? a.appointmentTime.substring(0, 10) : '';
        return d <= endDateFilter;
      });
    }

    // 5. Care status filter
    if (careStatusFilter !== 'ALL') {
      list = list.filter((a) => (a.careStatus || '') === careStatusFilter);
    }

    // 6. Schedule status filter
    if (scheduleStatusFilter !== 'ALL') {
      list = list.filter((a) => (a.scheduleStatus || '') === scheduleStatusFilter);
    }

    // 7. Dentist filter
    if (dentistFilter !== 'ALL') {
      const selectedDentist = filterOptions.dentists.find((d) => String(d.id) === String(dentistFilter));
      const dentistName = selectedDentist ? selectedDentist.name.toLowerCase() : '';
      list = list.filter((a) => {
        if (!a.dentistName) return false;
        return a.dentistName.toLowerCase().includes(dentistName);
      });
    }

    return list;
  }, [
    appointmentList,
    aptQuickFilter,
    aptTypeFilter,
    searchQuery,
    startDateFilter,
    endDateFilter,
    careStatusFilter,
    scheduleStatusFilter,
    dentistFilter,
    filterOptions.dentists,
  ]);

  const paginatedAppointments = useMemo(() => {
    const start = (pageAppointment - 1) * pageSize;
    return filteredAppointmentList.slice(start, start + pageSize);
  }, [filteredAppointmentList, pageAppointment, pageSize]);

  // Filtered & Paginated Lists for Tab 4 (Birthdays)
  const filteredBirthdayList = useMemo(() => {
    return birthdayList.filter((b) => {
      // 1. Quick filter (Pills)
      if (bdayQuickFilter === 'TODAY' && !b.isToday) return false;
      if (bdayQuickFilter === 'THIS_WEEK' && !(b.daysUntil >= 0 && b.daysUntil <= 7)) return false;
      if (bdayQuickFilter === 'THIS_MONTH' && !b.isThisMonth) return false;
      if (bdayQuickFilter === 'UNATTENDED' && b.careStatus !== 'Chưa chăm sóc') return false;

      // 2. Customer group filter
      if (bdayCustomerGroupFilter && bdayCustomerGroupFilter !== 'ALL') {
        if ((b.customerGroup || '').toLowerCase() !== bdayCustomerGroupFilter.toLowerCase()) return false;
      }

      // 3. Client-side Search filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (b.patientName && b.patientName.toLowerCase().includes(q)) ||
          (b.patientCode && b.patientCode.toLowerCase().includes(q)) ||
          (b.phone && b.phone.includes(q)) ||
          (b.email && b.email.toLowerCase().includes(q)) ||
          (b.careNotes && b.careNotes.toLowerCase().includes(q)) ||
          (b.birthdayFormatted && b.birthdayFormatted.includes(q)) ||
          (b.fullDobFormatted && b.fullDobFormatted.includes(q));
        if (!match) return false;
      }

      // 4. Care status filter (client fallback)
      if (careStatusFilter && careStatusFilter !== 'ALL') {
        if ((b.careStatus || '').toLowerCase() !== careStatusFilter.toLowerCase()) return false;
      }

      // 5. Birthday date range filter
      if (startDateFilter) {
        try {
          const s = new Date(startDateFilter);
          const sMonth = s.getMonth() + 1;
          const sDay = s.getDate();
          if (b.dateOfBirth) {
            const bDate = new Date(b.dateOfBirth);
            const bMonth = bDate.getMonth() + 1;
            const bDay = bDate.getDate();
            if (bMonth < sMonth || (bMonth === sMonth && bDay < sDay)) return false;
          }
        } catch (e) {}
      }
      if (endDateFilter) {
        try {
          const end = new Date(endDateFilter);
          const eMonth = end.getMonth() + 1;
          const eDay = end.getDate();
          if (b.dateOfBirth) {
            const bDate = new Date(b.dateOfBirth);
            const bMonth = bDate.getMonth() + 1;
            const bDay = bDate.getDate();
            if (bMonth > eMonth || (bMonth === eMonth && bDay > eDay)) return false;
          }
        } catch (e) {}
      }

      return true;
    });
  }, [
    birthdayList,
    bdayQuickFilter,
    bdayCustomerGroupFilter,
    searchQuery,
    careStatusFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Tab 4 Active Filter Count
  const activeBdayFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery && searchQuery.trim()) count++;
    if (startDateFilter || endDateFilter) count++;
    if (careStatusFilter !== 'ALL') count++;
    if (bdayQuickFilter !== 'ALL') count++;
    if (bdayCustomerGroupFilter !== 'ALL') count++;
    return count;
  }, [searchQuery, startDateFilter, endDateFilter, careStatusFilter, bdayQuickFilter, bdayCustomerGroupFilter]);

  const paginatedBirthdays = useMemo(() => {
    const start = (pageBirthday - 1) * pageSize;
    return filteredBirthdayList.slice(start, start + pageSize);
  }, [filteredBirthdayList, pageBirthday, pageSize]);

  // Tab 3 Appointment Counts
  const todayAptCount = useMemo(() => appointmentList.filter((a) => a.isToday).length, [appointmentList]);
  const tomorrowAptCount = useMemo(() => appointmentList.filter((a) => a.isTomorrow).length, [appointmentList]);
  const upcomingAptCount = useMemo(() => appointmentList.filter((a) => a.daysUntil >= 0 && a.daysUntil <= 7).length, [appointmentList]);
  const unattendedAptCount = useMemo(() => appointmentList.filter((a) => a.careStatus === 'Chưa chăm sóc').length, [appointmentList]);
  const recareAptCount = useMemo(() => appointmentList.filter((a) => a.careStatus === 'Cần chăm sóc lại').length, [appointmentList]);
  const regularAptCount = useMemo(() => appointmentList.filter((a) => !a.isFollowUp && a.appointmentType !== 'Tái khám').length, [appointmentList]);
  const followUpAptCount = useMemo(() => appointmentList.filter((a) => a.isFollowUp || a.appointmentType === 'Tái khám').length, [appointmentList]);

  // Tab 3 Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery && searchQuery.trim()) count++;
    if (startDateFilter || endDateFilter) count++;
    if (aptTypeFilter !== 'ALL') count++;
    if (scheduleStatusFilter !== 'ALL') count++;
    if (careStatusFilter !== 'ALL') count++;
    if (dentistFilter !== 'ALL') count++;
    if (aptQuickFilter !== 'ALL') count++;
    return count;
  }, [searchQuery, startDateFilter, endDateFilter, aptTypeFilter, scheduleStatusFilter, careStatusFilter, dentistFilter, aptQuickFilter]);

  // Tab 4 Birthday Counts
  const todayBdayCount = useMemo(() => birthdayList.filter((b) => b.isToday).length, [birthdayList]);
  const weekBdayCount = useMemo(() => birthdayList.filter((b) => b.daysUntil >= 0 && b.daysUntil <= 7).length, [birthdayList]);
  const monthBdayCount = useMemo(() => birthdayList.filter((b) => b.isThisMonth).length, [birthdayList]);
  const unattendedBdayCount = useMemo(() => birthdayList.filter((b) => b.careStatus === 'Chưa chăm sóc').length, [birthdayList]);

  // Currency Formatter
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  // Tab 5 Payment Computations
  const filteredPaymentList = useMemo(() => {
    return paymentList.filter((item) => {
      if (paymentQuickFilter === 'PAID' && item.paymentStatus !== 'PAID') return false;
      if (paymentQuickFilter === 'PARTIALLY_PAID' && item.paymentStatus !== 'PARTIALLY_PAID') return false;
      if (paymentQuickFilter === 'UNPAID' && item.paymentStatus !== 'UNPAID') return false;
      if (paymentQuickFilter === 'UNATTENDED' && item.careStatus !== 'Chưa chăm sóc') return false;

      if (paymentStatusFilter !== 'ALL' && item.paymentStatus !== paymentStatusFilter) return false;
      if (paymentCareStatusFilter !== 'ALL' && item.careStatus !== paymentCareStatusFilter) return false;

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (item.patientName && item.patientName.toLowerCase().includes(q)) ||
          (item.phone && item.phone.includes(q)) ||
          (item.patientCode && item.patientCode.toLowerCase().includes(q)) ||
          (item.invoiceCode && item.invoiceCode.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (startDateFilter && item.invoiceDate) {
        const start = new Date(startDateFilter);
        const invDate = new Date(item.invoiceDate);
        if (invDate < start) return false;
      }
      if (endDateFilter && item.invoiceDate) {
        const end = new Date(endDateFilter);
        end.setHours(23, 59, 59, 999);
        const invDate = new Date(item.invoiceDate);
        if (invDate > end) return false;
      }

      return true;
    });
  }, [paymentList, paymentQuickFilter, paymentStatusFilter, paymentCareStatusFilter, searchQuery, startDateFilter, endDateFilter]);

  const paginatedPayments = useMemo(() => {
    const start = (pagePayment - 1) * pageSize;
    return filteredPaymentList.slice(start, start + pageSize);
  }, [filteredPaymentList, pagePayment, pageSize]);

  const paidInvoiceCount = useMemo(() => paymentList.filter((p) => p.paymentStatus === 'PAID').length, [paymentList]);
  const debtInvoiceCount = useMemo(() => paymentList.filter((p) => p.paymentStatus === 'PARTIALLY_PAID').length, [paymentList]);
  const unpaidInvoiceCount = useMemo(() => paymentList.filter((p) => p.paymentStatus === 'UNPAID').length, [paymentList]);
  const unattendedPaymentCount = useMemo(() => paymentList.filter((p) => p.careStatus === 'Chưa chăm sóc').length, [paymentList]);
  const totalPaymentRevenue = useMemo(() => paymentList.reduce((sum, p) => sum + Number(p.finalAmount || 0), 0), [paymentList]);
  const totalPaidSum = useMemo(() => paymentList.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0), [paymentList]);
  const totalDebtSum = useMemo(() => paymentList.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0), [paymentList]);

  // Tab 5 Active Filter Count
  const activePaymentFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery && searchQuery.trim()) count++;
    if (startDateFilter || endDateFilter) count++;
    if (paymentQuickFilter !== 'ALL') count++;
    if (paymentStatusFilter !== 'ALL') count++;
    if (paymentCareStatusFilter !== 'ALL') count++;
    return count;
  }, [searchQuery, startDateFilter, endDateFilter, paymentQuickFilter, paymentStatusFilter, paymentCareStatusFilter]);

  return (
    <div className="w-full bg-[#f8f9fa] text-gray-800">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Chăm sóc khách hàng</h1>
        </div>

        <div className="flex items-center gap-5">
          {/* Toggle Báo cáo mới */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <span className="flex items-center gap-1 cursor-pointer">
              Báo cáo mới <Info size={13} className="text-gray-400" />
            </span>
            <button
              type="button"
              onClick={() => setNewReportToggle(!newReportToggle)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${newReportToggle ? 'bg-purple-600' : 'bg-gray-300'
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${newReportToggle ? 'translate-x-4' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 relative p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-purple-500 rounded-full" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs border border-gray-300">
              <User size={16} />
            </div>
            <span className="text-xs font-medium text-gray-700 hidden sm:inline-block">
              {currentStaffName}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: 4 TABS CHUẨN (Đã bỏ Nhắc uống thuốc và Hỏi thăm sau điều trị) */}
      <div className="bg-white border-b border-gray-200 px-6 pt-2.5 flex gap-8 text-sm overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className={`pb-2.5 font-medium transition-all whitespace-nowrap cursor-pointer relative ${isActive
                ? 'text-purple-600 font-semibold border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 max-w-[1600px] mx-auto space-y-3 pb-3">
        {/* ===================== TAB 1: LỌC TỔNG HỢP (IMAGE 1) ===================== */}
        {activeTab === 'FILTER' && (
          <div className="space-y-3">
            {/* Top Right Action Buttons */}
            <div className="flex justify-end items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenGeneralCreateCare}
                className="px-3.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer"
              >
                Tạo chăm sóc tổng hợp
              </button>
              <button
                type="button"
                onClick={() => setShowFilterCard(!showFilterCard)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border ${showFilterCard
                  ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-xs'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border-purple-200'
                  }`}
              >
                <Filter size={13} className="text-purple-600" />
                Bộ lọc
                {activeTab1FilterCount > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeTab1FilterCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 rounded-md transition-colors cursor-pointer"
              >
                <Download size={13} className="text-purple-600" />
                Export
              </button>
            </div>

            {/* Comprehensive Filter Form Card (Matches User Request & Subtle Radius) */}
            {showFilterCard && (
              <form
                onSubmit={handleTab1Search}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs space-y-3.5"
              >
                {/* Filter Header with Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Filter size={13} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Bộ lọc thông tin khách hàng đa chiều
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Tra cứu và phân nhóm bệnh nhân theo hồ sơ lâm sàng & hành chính
                      </p>
                    </div>
                  </div>

                  {activeTab1FilterCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                        Đang lọc: {activeTab1FilterCount} tiêu chí
                      </span>
                      <button
                        type="button"
                        onClick={handleResetTab1Filters}
                        className="text-[11px] text-gray-500 hover:text-purple-700 hover:underline cursor-pointer"
                      >
                        (Làm mới)
                      </button>
                    </div>
                  )}
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <Users size={12} className="text-purple-500" />
                      Nhóm khách hàng
                    </label>
                    <select
                      value={tab1Filters.customerGroup}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, customerGroup: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Nhóm khách hàng</option>
                      {(filterOptions.customerGroups?.length > 0 ? filterOptions.customerGroups : ['Khách VIP', 'Khách thân thiết', 'Khách mới', 'Khách tiềm năng']).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <Globe size={12} className="text-purple-500" />
                      Nguồn khách hàng
                    </label>
                    <select
                      value={tab1Filters.customerSource}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, customerSource: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Nguồn khách hàng</option>
                      {(filterOptions.customerSources?.length > 0 ? filterOptions.customerSources : ['Facebook', 'Website', 'Người quen giới thiệu', 'Trực tiếp', 'Hotline', 'Tiktok']).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <Calendar size={12} className="text-purple-500" />
                      Ngày tạo khách hàng
                    </label>
                    <div className="flex items-center gap-1.5 border border-gray-200 hover:border-gray-300 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-200 rounded-md px-2 py-1 bg-slate-50/70 hover:bg-white focus-within:bg-white text-xs text-gray-500 transition-all">
                      <input
                        type="date"
                        value={tab1Filters.createDateStart}
                        onChange={(e) => setTab1Filters({ ...tab1Filters, createDateStart: e.target.value })}
                        className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer"
                        title="Từ ngày tạo"
                      />
                      <span className="text-gray-400 font-bold">~</span>
                      <input
                        type="date"
                        value={tab1Filters.createDateEnd}
                        onChange={(e) => setTab1Filters({ ...tab1Filters, createDateEnd: e.target.value })}
                        className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer"
                        title="Đến ngày tạo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <CalendarCheck size={12} className="text-purple-500" />
                      Lịch hẹn
                    </label>
                    <div className="flex items-center gap-1.5 border border-gray-200 hover:border-gray-300 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-200 rounded-md px-2 py-1 bg-slate-50/70 hover:bg-white focus-within:bg-white text-xs text-gray-500 transition-all">
                      <input
                        type="date"
                        value={tab1Filters.appointmentDateStart}
                        onChange={(e) => setTab1Filters({ ...tab1Filters, appointmentDateStart: e.target.value })}
                        className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer"
                        title="Từ ngày hẹn"
                      />
                      <span className="text-gray-400 font-bold">~</span>
                      <input
                        type="date"
                        value={tab1Filters.appointmentDateEnd}
                        onChange={(e) => setTab1Filters({ ...tab1Filters, appointmentDateEnd: e.target.value })}
                        className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer"
                        title="Đến ngày hẹn"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <User size={12} className="text-purple-500" />
                      Bác sĩ điều trị
                    </label>
                    <select
                      value={tab1Filters.dentistId}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, dentistId: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Bác sĩ điều trị</option>
                      {filterOptions.dentists?.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <Activity size={12} className="text-purple-500" />
                      Tình trạng điều trị
                    </label>
                    <select
                      value={tab1Filters.treatmentStatus}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, treatmentStatus: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Tình trạng điều trị</option>
                      <option value="Đang điều trị">Đang điều trị</option>
                      <option value="Đã đặt hẹn">Đã đặt hẹn</option>
                      <option value="Đã hoàn thành">Đã hoàn thành</option>
                      <option value="Đã khám">Đã khám</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <Layers size={12} className="text-purple-500" />
                      Nhóm thủ thuật
                    </label>
                    <select
                      value={tab1Filters.procedureGroup}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, procedureGroup: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Nhóm thủ thuật</option>
                      {(filterOptions.procedureGroups?.length > 0 ? filterOptions.procedureGroups : [
                        'Nha khoa tổng quát',
                        'Phục hình răng sứ',
                        'Cấy ghép Implant',
                        'Chỉnh nha - Niềng răng',
                        'Phẫu thuật trong miệng',
                        'Nha khoa trẻ em',
                        'Thẩm mỹ nha khoa'
                      ]).map((pg) => (
                        <option key={pg} value={pg}>
                          {pg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <Sparkles size={12} className="text-purple-500" />
                      Tên thủ thuật
                    </label>
                    <select
                      value={tab1Filters.procedureName}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, procedureName: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Tên thủ thuật</option>
                      {(filterOptions.procedures?.length > 0 ? filterOptions.procedures : [
                        'Khám răng định kỳ & Tư vấn',
                        'Cạo vôi răng & Đánh bóng',
                        'Trám răng thẩm mỹ',
                        'Điều trị tủy răng',
                        'Nhổ răng khôn',
                        'Tẩy trắng răng',
                        'Bọc răng sứ Zirconia',
                        'Cấy ghép Implant Straumann',
                        'Niềng răng mắc cài kim loại',
                        'Niềng răng trong suốt Invisalign'
                      ]).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <MapPin size={12} className="text-purple-500" />
                      Tỉnh / Thành phố
                    </label>
                    <select
                      value={tab1Filters.city}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, city: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Tỉnh/thành phố</option>
                      {(filterOptions.cities?.length > 0 ? filterOptions.cities : ['TP. Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Hà Nội', 'Long An', 'Cần Thơ']).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <MapPin size={12} className="text-purple-500" />
                      Quận / Huyện
                    </label>
                    <select
                      value={tab1Filters.district}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, district: e.target.value })}
                      className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer"
                    >
                      <option value="ALL">Quận/huyện</option>
                      {(filterOptions.districts?.length > 0 ? filterOptions.districts : ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 'Bình Thạnh', 'Tân Bình', 'Thủ Đức']).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <CreditCard size={12} className="text-purple-500" />
                      Thẻ khách hàng
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tab1Filters.customerCard}
                        onChange={(e) => setTab1Filters({ ...tab1Filters, customerCard: e.target.value })}
                        placeholder="Thẻ khách hàng"
                        className="w-full text-xs bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all"
                      />
                      {tab1Filters.customerCard && (
                        <button
                          type="button"
                          onClick={() => setTab1Filters({ ...tab1Filters, customerCard: '' })}
                          className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                      <Search size={12} className="text-purple-500" />
                      Tìm kiếm nhanh
                    </label>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo mã hồ sơ, số đ..."
                        className="w-full text-xs pl-8 pr-7 py-1.5 bg-slate-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-md focus:outline-hidden focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 text-gray-700 transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 4: Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-100">
                  <label
                    htmlFor="careTreatmentCheck"
                    className="flex items-center gap-2 cursor-pointer select-none group"
                  >
                    <input
                      type="checkbox"
                      id="careTreatmentCheck"
                      checked={tab1Filters.careTreatment}
                      onChange={(e) => setTab1Filters({ ...tab1Filters, careTreatment: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer accent-purple-600 transition"
                    />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-purple-700 transition-colors">
                      Chăm sóc điều trị
                    </span>
                    <span className="text-[11px] text-gray-400 hidden sm:inline">
                      (Chỉ hiện bệnh nhân đang có kế hoạch hoặc lịch điều trị)
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetTab1Filters}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-md transition-all cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      Xóa bộ lọc
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 rounded-md shadow-xs transition-all cursor-pointer"
                    >
                      <Search size={12} />
                      Tìm kiếm
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Customer Group Quick Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500 mr-1.5">Phân loại khách:</span>
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'Khách VIP', label: 'Khách VIP' },
                  { id: 'Khách thân thiết', label: 'Khách thân thiết' },
                  { id: 'Khách mới', label: 'Khách mới' },
                  { id: 'Khách tiềm năng', label: 'Khách tiềm năng' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setPatientGroupQuickFilter(pill.id);
                      setPageFilter(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${patientGroupQuickFilter === pill.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Eye size={13} />
                  Hiển thị {filteredPatients.length}/{filterPatients.length}
                </span>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 rounded-md transition-colors cursor-pointer"
                >
                  <Download size={13} className="text-purple-600" />
                  Export
                </button>
              </div>
            </div>

            {/* Table: Lọc tổng hợp (Dữ liệu thật từ DB) */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
              <div className={`overflow-auto ${showFilterCard ? 'max-h-[calc(100vh-480px)]' : 'max-h-[calc(100vh-340px)]'} min-h-[300px] relative`}>
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Mã hồ sơ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Họ tên & Thông tin</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Điện thoại</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Nhóm khách hàng</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Nguồn khách hàng</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Tình trạng điều trị</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Bác sĩ / Thủ thuật</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Ngày tạo</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">Địa chỉ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 min-w-[180px]">Ghi chú</th>
                      <th className="sticky top-0 right-0 bg-slate-100 text-slate-700 z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] py-3 px-3 text-center font-bold whitespace-nowrap border-b border-slate-200 min-w-[85px]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedPatients.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-16 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Inbox size={42} strokeWidth={1.2} className="text-gray-300" />
                            <span className="text-xs font-medium">Không tìm thấy bệnh nhân phù hợp</span>
                            <span className="text-[11px] text-gray-400">Thử thay đổi hoặc xóa bớt tiêu chí lọc</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedPatients.map((p) => (
                        <tr key={p.patientId} className="group hover:bg-purple-50/40 transition-colors">
                          <td className="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{p.patientCode || '—'}</div>
                            {p.customerCard && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-xs text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                {p.customerCard}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-semibold text-purple-700 hover:text-purple-900 transition-colors">
                              {p.fullName}
                            </div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <span>{p.gender || '—'}</span>
                              <span>•</span>
                              <span>{p.birthYear || p.dateOfBirth || '—'}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap font-medium text-gray-800">
                            {p.phoneNumber || '—'}
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            {renderCustomerGroupBadge(p.customerGroup)}
                          </td>
                          <td className="py-2 px-2.5 text-gray-600 whitespace-nowrap">
                            {p.customerSource || 'Trực tiếp'}
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            {renderTreatmentStatusBadge(p.treatmentStatus)}
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{p.lastDentist || 'Chưa chỉ định'}</div>
                            <div className="text-[11px] text-gray-500 truncate max-w-[170px]" title={p.procedureName}>
                              {p.procedureName || '—'}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-gray-500 whitespace-nowrap">
                            {formatDate(p.createdAt)}
                          </td>
                          <td className="py-2 px-3 text-gray-600 max-w-[200px] truncate" title={p.address}>
                            {p.address || (p.city ? `${p.district ? p.district + ', ' : ''}${p.city}` : '—')}
                          </td>
                          <td className="py-2 px-3 min-w-[180px] max-w-[240px]">
                            <div className="relative">
                              <p
                                className={`text-xs text-gray-600 leading-snug break-words ${expandedNoteIds.has(p.patientId) ? '' : 'line-clamp-2'
                                  }`}
                                title={p.notes}
                              >
                                {p.notes || '—'}
                              </p>
                              {p.notes && p.notes.length > 50 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandNote(p.patientId);
                                  }}
                                  className="text-[10px] font-semibold text-[#7c3aed] hover:text-[#6d28d9] hover:underline mt-0.5 inline-block cursor-pointer"
                                >
                                  {expandedNoteIds.has(p.patientId) ? 'Thu gọn' : 'Xem thêm'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center sticky right-0 bg-white group-hover:bg-purple-50/90 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[85px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="Xem lịch sử chăm sóc"
                                onClick={() => handleOpenHistory(p)}
                                className="w-6 h-6 rounded-md border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Info size={13} />
                              </button>
                              <button
                                type="button"
                                title="Tạo mới chăm sóc"
                                onClick={() => handleOpenCreateCare(p, 'GENERAL')}
                                className="w-6 h-6 rounded-md border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(filteredPatients.length, pageFilter, setPageFilter)}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: CHĂM SÓC TỔNG HỢP ===================== */}
        {activeTab === 'GENERAL' && (
          <div className="space-y-3">
            {/* Unified Compact Toolbar: Gọn gàng, tinh tế, không trùng lặp */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs space-y-2.5">
              {/* Row 1: Phân loại ghi nhận (Pills) + Bộ đếm + Nút Thao tác */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-500 mr-1.5">Phân loại ghi nhận:</span>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'APPOINTMENT_REMINDER', label: 'Nhắc lịch hẹn' },
                    { id: 'BIRTHDAY', label: 'Ngày sinh nhật' },
                    { id: 'GENERAL_CARE', label: 'Chăm sóc tổng hợp' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        setGeneralCareQuickFilter(pill.id);
                        setPageGeneral(1);
                      }}
                      className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${generalCareQuickFilter === pill.id
                        ? 'bg-[#7c3aed] text-white shadow-xs font-semibold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium'
                        }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                    <Eye size={13} className="text-gray-400" />
                    Hiển thị <strong>{filteredGeneralCareList.length}</strong>/{generalCareList.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenGeneralCreateCare}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-md transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus size={14} />
                    Thêm chăm sóc
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer"
                    title="Xuất file báo cáo chăm sóc khách hàng"
                  >
                    <Download size={13} className="text-purple-600" />
                    Export
                  </button>
                </div>
              </div>

              {/* Row 2: Bộ tìm kiếm & Lọc chi tiết */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPageGeneral(1);
                    }}
                    placeholder="Tìm theo mã hồ sơ, họ tên, SĐT, nội dung..."
                    className="w-full text-xs pl-8 pr-7 py-1.5 border border-gray-300 rounded-md focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-400 transition-all bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPageGeneral(1);
                      }}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Date Range Picker */}
                <div className="flex items-center gap-1.5 border border-gray-300 rounded-md px-2.5 py-1 bg-white text-xs text-gray-500 shadow-2xs">
                  <Calendar size={13} className="text-gray-400 mr-1" />
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setPageGeneral(1);
                    }}
                    className="w-28 outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setPageGeneral(1);
                    }}
                    className="w-28 outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer"
                  />
                </div>

                {/* Care Type Select */}
                <select
                  value={careTypeFilter}
                  onChange={(e) => {
                    setCareTypeFilter(e.target.value);
                    setPageGeneral(1);
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 bg-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả loại chăm sóc</option>
                  <option value="APPOINTMENT_REMINDER">Nhắc lịch hẹn</option>
                  <option value="BIRTHDAY">Ngày sinh nhật</option>
                  <option value="PAYMENT">Thanh toán</option>
                  <option value="GENERAL_CARE">Chăm sóc tổng hợp</option>
                </select>

                {/* Care Status Select */}
                <select
                  value={careStatusFilter}
                  onChange={(e) => {
                    setCareStatusFilter(e.target.value);
                    setPageGeneral(1);
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 bg-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Cần chăm sóc lại">Cần chăm sóc lại</option>
                  <option value="Không nghe máy">Không nghe máy</option>
                  <option value="Chưa chăm sóc">Chưa chăm sóc</option>
                  <option value="Gửi thất bại">Gửi thất bại</option>
                </select>

                {/* Channel Select */}
                <select
                  value={channelFilter}
                  onChange={(e) => {
                    setChannelFilter(e.target.value);
                    setPageGeneral(1);
                  }}
                  className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 bg-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả kênh</option>
                  <option value="PHONE">Gọi điện</option>
                  <option value="GMAIL">Gmail</option>
                  <option value="SMS">Tin nhắn SMS</option>
                  <option value="DIRECT">Trực tiếp</option>
                </select>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={() => {
                    handleResetTabFilters();
                    setChannelFilter('ALL');
                    setGeneralCareQuickFilter('ALL');
                    setPageGeneral(1);
                  }}
                  title="Đặt lại bộ lọc"
                  className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
              <div className="overflow-auto max-h-[calc(100vh-340px)] min-h-[300px] relative w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-24">Mã hồ sơ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36">Họ tên</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28">Điện thoại</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36">Loại chăm sóc</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-24">Kênh</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 text-center font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-32">Trạng thái chăm sóc</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-32">Thời gian</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36">Người thực hiện</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 min-w-[200px] max-w-sm border-b border-slate-200">Nội dung</th>
                      <th className="sticky top-0 right-0 bg-slate-100 text-slate-700 z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] py-3 px-2 text-center font-bold whitespace-nowrap border-b border-slate-200 w-14">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                    {paginatedGeneralCare.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-gray-400">
                          <Inbox size={36} className="mx-auto mb-2 text-gray-300" />
                          Không tìm thấy bản ghi chăm sóc nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      paginatedGeneralCare.map((c) => (
                        <tr key={c.id} className="group hover:bg-purple-50/40 transition-colors">
                          <td
                            onClick={() =>
                              handleOpenHistory({
                                patientId: c.patientId,
                                patientName: c.patientName,
                                fullName: c.patientName,
                                patientCode: c.patientCode,
                                phoneNumber: c.phone,
                                phone: c.phone,
                              })
                            }
                            className="py-2 px-3 font-semibold text-indigo-600 hover:underline cursor-pointer whitespace-nowrap"
                          >
                            {c.patientCode || '—'}
                          </td>
                          <td
                            onClick={() =>
                              handleOpenHistory({
                                patientId: c.patientId,
                                patientName: c.patientName,
                                fullName: c.patientName,
                                patientCode: c.patientCode,
                                phoneNumber: c.phone,
                                phone: c.phone,
                              })
                            }
                            className="py-2 px-3 font-semibold text-purple-700 hover:underline cursor-pointer whitespace-nowrap"
                          >
                            {c.patientName}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-gray-700 whitespace-nowrap">{c.phone || '—'}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            {renderCareTypeTag(c.careType, c.careTypeLabel)}
                          </td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            {renderChannelTag(c.channel, c.channelLabel, c)}
                          </td>
                          <td className="py-2 px-2.5 text-center whitespace-nowrap">
                            {renderStatusBadge(c.statusLabel || c.status)}
                          </td>
                          <td className="py-2 px-2.5 text-gray-600 whitespace-nowrap">
                            {formatDateTime(c.careTime || c.createdAt)}
                          </td>
                          <td className="py-2 px-3 text-gray-800 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                                {(c.createdByName || 'N').charAt(0)}
                              </span>
                              <span className="font-medium text-xs">{c.createdByName || 'Nguyễn Thảo (Lễ tân)'}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 min-w-[200px] max-w-sm">
                            <div className="relative">
                              <p
                                className={`text-xs text-gray-700 leading-snug break-words ${expandedNoteIds.has(c.id) ? '' : 'line-clamp-2'
                                  }`}
                                title={c.notes}
                              >
                                {c.notes || '—'}
                              </p>
                              {c.notes && c.notes.length > 55 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandNote(c.id);
                                  }}
                                  className="text-[11px] font-semibold text-[#7c3aed] hover:text-[#6d28d9] hover:underline mt-0.5 inline-block cursor-pointer"
                                >
                                  {expandedNoteIds.has(c.id) ? 'Thu gọn' : 'Xem thêm'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center sticky right-0 bg-white group-hover:bg-purple-50/90 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[80px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="Xem chi tiết chăm sóc"
                                onClick={() =>
                                  handleOpenHistory({
                                    patientId: c.patientId,
                                    patientName: c.patientName,
                                    fullName: c.patientName,
                                    patientCode: c.patientCode,
                                    phoneNumber: c.phone,
                                    phone: c.phone,
                                    email: c.email,
                                  })
                                }
                                className="w-6 h-6 rounded-md border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Info size={13} />
                              </button>
                              <button
                                type="button"
                                title="Thêm chăm sóc mới"
                                onClick={() => handleOpenCreateCare(c, 'GENERAL')}
                                className="w-6 h-6 rounded-md border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(filteredGeneralCareList.length, pageGeneral, setPageGeneral)}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: NHẮC LỊCH HẸN (IMAGE 2) ===================== */}
        {activeTab === 'APPOINTMENT' && (
          <div className="space-y-3">
            {/* Unified Compact Toolbar for Tab 3 */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs space-y-3">
              {/* Tier 1: Quick Scope Pills (Left) + Counter & Action (Right) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-700 mr-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-purple-600" />
                    Nhắc hẹn:
                  </span>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'TODAY', label: 'Hôm nay' },
                    { id: 'TOMORROW', label: 'Ngày mai' },
                    { id: 'THIS_WEEK', label: '7 ngày tới' },
                    { id: 'UNATTENDED', label: 'Chưa chăm sóc' },
                    { id: 'RECARE', label: 'Cần gọi lại' },
                  ].map((pill) => {
                    const isActive = aptQuickFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => {
                          setAptQuickFilter(pill.id);
                          setPageAppointment(1);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${isActive
                          ? 'bg-[#7c3aed] text-white shadow-xs font-semibold'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80'
                          }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium shadow-2xs">
                    <Eye size={13} className="text-purple-600" />
                    <span>
                      Hiển thị <strong className="text-gray-900 font-bold">{filteredAppointmentList.length}</strong> / {appointmentList.length} lịch hẹn
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title="Xuất dữ liệu lịch hẹn ra CSV"
                  >
                    <Download size={13} className="text-purple-600" />
                    Export
                  </button>
                </div>
              </div>

              {/* Tier 2: Search Input & Date Range (Balanced Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                {/* Search input: 7 cols */}
                <div className="md:col-span-7 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPageAppointment(1);
                    }}
                    placeholder="Tìm kiếm theo mã hồ sơ, họ tên, số điện thoại, lý do khám, bác sĩ..."
                    className="w-full text-xs pl-8 pr-8 py-2 bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-gray-800 placeholder-gray-400 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPageAppointment(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 rounded-full hover:bg-gray-100"
                      title="Xóa tìm kiếm"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Date range picker: 5 cols */}
                <div className="md:col-span-5 flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50/60 hover:bg-white transition-all text-xs text-gray-700 shadow-2xs focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 focus-within:bg-white">
                  <Calendar size={13} className="text-purple-600 shrink-0" />
                  <span className="text-[11px] text-gray-500 shrink-0">Hẹn từ:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setPageAppointment(1);
                    }}
                    className="w-full outline-hidden text-xs text-gray-800 bg-transparent cursor-pointer font-medium"
                  />
                  <span className="text-gray-400 shrink-0">~</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setPageAppointment(1);
                    }}
                    className="w-full outline-hidden text-xs text-gray-800 bg-transparent cursor-pointer font-medium"
                  />
                  {(startDateFilter || endDateFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDateFilter('');
                        setEndDateFilter('');
                        setPageAppointment(1);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 shrink-0 cursor-pointer"
                      title="Xóa khoảng ngày"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tier 3: Dedicated Filter Strip (Categories & Selects) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mr-1">
                    <Filter size={13} className="text-purple-600" />
                    <span>Bộ lọc:</span>
                  </div>

                  {/* Filter 1: Loại lịch hẹn */}
                  <select
                    value={aptTypeFilter}
                    onChange={(e) => {
                      setAptTypeFilter(e.target.value);
                      setPageAppointment(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${aptTypeFilter !== 'ALL'
                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <option value="ALL">Loại lịch: Tất cả</option>
                    <option value="REGULAR">📅 Lịch hẹn thường</option>
                    <option value="FOLLOW_UP">🔄 Lịch tái khám</option>
                  </select>

                  {/* Filter 2: Trạng thái lịch */}
                  <select
                    value={scheduleStatusFilter}
                    onChange={(e) => {
                      setScheduleStatusFilter(e.target.value);
                      setPageAppointment(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${scheduleStatusFilter !== 'ALL'
                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <option value="ALL">Trạng thái lịch: Tất cả</option>
                    <option value="Chưa đến">Chưa đến</option>
                    <option value="Đã đến">Đã đến</option>
                    <option value="Đang điều trị">Đang điều trị</option>
                    <option value="Đã xong">Đã xong</option>
                    <option value="Không đến">Không đến</option>
                  </select>

                  {/* Filter 3: Trạng thái CSKH */}
                  <select
                    value={careStatusFilter}
                    onChange={(e) => {
                      setCareStatusFilter(e.target.value);
                      setPageAppointment(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${careStatusFilter !== 'ALL'
                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <option value="ALL">Trạng thái CSKH: Tất cả</option>
                    <option value="Chưa chăm sóc">Chưa chăm sóc</option>
                    <option value="Cần chăm sóc lại">Cần chăm sóc lại</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Không nghe máy">Không nghe máy</option>
                    <option value="Gửi thất bại">Gửi thất bại</option>
                  </select>

                  {/* Filter 4: Bác sĩ */}
                  <select
                    value={dentistFilter}
                    onChange={(e) => {
                      setDentistFilter(e.target.value);
                      setPageAppointment(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all max-w-[200px] truncate ${dentistFilter !== 'ALL'
                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <option value="ALL">Bác sĩ: Tất cả</option>
                    {filterOptions.dentists.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset / Clear Active Filters */}
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleResetTabFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                      title="Xóa tất cả các bộ lọc đang chọn"
                    >
                      <RotateCcw size={12} className="text-rose-500" />
                      <span>Xóa bộ lọc ({activeFilterCount})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetTabFilters}
                      title="Đặt lại về mặc định"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-xs"
                    >
                      <RotateCcw size={12} />
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px] relative w-full custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs h-fit">
                  <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-24">Mã hồ sơ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-44">Khách hàng & Nhóm</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28">Điện thoại</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-44">Thời gian & Phân loại</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 min-w-[170px] max-w-xs border-b border-slate-200">Dịch vụ / Lý do khám</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36">Bác sĩ phụ trách</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 text-center font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28">Trạng thái lịch</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 text-center font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-32">Trạng thái CSKH</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 min-w-[180px] max-w-xs border-b border-slate-200">Chăm sóc gần nhất</th>
                      <th className="sticky top-0 right-0 bg-slate-100 text-slate-700 z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] py-3 px-3 text-center font-bold whitespace-nowrap border-b border-slate-200 w-24">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 bg-white align-top">
                    {paginatedAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-gray-400">
                          <Inbox size={36} className="mx-auto mb-1 text-gray-300" />
                          Không tìm thấy lịch hẹn hoặc lịch tái khám phù hợp trong cơ sở dữ liệu
                        </td>
                      </tr>
                    ) : (
                      paginatedAppointments.map((apt) => (
                        <tr
                          key={apt.appointmentId}
                          className="group hover:bg-purple-50/40 transition-colors h-[54px]"
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(apt)}
                              title="Xem hồ sơ và lịch sử chăm sóc"
                              className="font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                            >
                              {apt.patientCode || '—'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">{apt.patientName || '—'}</span>
                              <div className="mt-0.5">{renderCustomerGroupBadge(apt.customerGroup)}</div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap align-middle">
                            <a
                              href={apt.phone ? `tel:${apt.phone}` : undefined}
                              title={apt.phone ? `Gọi ngay: ${apt.phone}` : 'Chưa có SĐT'}
                              className="font-medium text-gray-800 hover:text-purple-700 inline-flex items-center gap-1"
                            >
                              <Phone size={11} className="text-gray-400" />
                              {apt.phone || '—'}
                            </a>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-gray-900">{formatDateTime(apt.appointmentTime)}</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {apt.isToday && (
                                  <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    Hôm nay
                                  </span>
                                )}
                                {apt.isTomorrow && (
                                  <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Ngày mai
                                  </span>
                                )}
                                {apt.daysUntil > 1 && apt.daysUntil <= 7 && (
                                  <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    Còn {apt.daysUntil} ngày
                                  </span>
                                )}
                                {apt.isFollowUp || apt.appointmentType === 'Tái khám' ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    <RotateCcw size={9} />
                                    Tái khám
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                    <Calendar size={9} />
                                    Lịch hẹn
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-gray-800 max-w-xs font-medium align-middle" title={apt.serviceName}>
                            <div className="truncate">{apt.serviceName || 'Khám răng định kỳ & Tư vấn'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap align-middle font-medium">
                            {apt.dentistName || '—'}
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap align-middle">
                            {renderScheduleStatus(apt.scheduleStatus)}
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap align-middle">
                            {renderStatusBadge(apt.careStatus)}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 align-middle max-w-xs">
                            {apt.careChannel || apt.careTime || apt.careNotes ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderChannelTag(apt.careChannel, apt.careChannel, apt)}
                                  {apt.careTime && (
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      {formatDateTime(apt.careTime)}
                                    </span>
                                  )}
                                </div>
                                {apt.careNotes && (
                                  <p className="text-[11px] text-gray-600 truncate italic" title={apt.careNotes}>
                                    "{apt.careNotes}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Chưa chăm sóc</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center sticky right-0 bg-white group-hover:bg-[#fbf9fe] z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap align-middle w-24">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="Xem lịch sử chăm sóc & hồ sơ bệnh nhân"
                                onClick={() => handleOpenHistory(apt)}
                                className="w-7 h-7 rounded-md border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Info size={13} />
                              </button>
                              <button
                                type="button"
                                title="Ghi nhận chăm sóc mới"
                                onClick={() => handleOpenCreateCare(apt, 'APPOINTMENT')}
                                className="w-7 h-7 rounded-md border border-purple-400 text-purple-600 hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                              <button
                                type="button"
                                title="Gửi Gmail cho khách hàng"
                                onClick={() => handleOpenDirectEmail(apt)}
                                className="w-7 h-7 rounded-md border border-rose-300 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Mail size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(filteredAppointmentList.length, pageAppointment, setPageAppointment)}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: NGÀY SINH NHẬT (IMAGE 4) ===================== */}
        {activeTab === 'BIRTHDAY' && (
          <div className="space-y-4">
            {/* Unified 3-Tier Professional Toolbar for Tab 4 */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs space-y-2.5">
              {/* Tier 1: Quick Pills (Left) + Counter & Action (Right) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1.5 mr-2">
                    <Cake size={15} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-700">Chăm sóc sinh nhật:</span>
                  </div>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'TODAY', label: 'Hôm nay' },
                    { id: 'THIS_WEEK', label: 'Tuần này' },
                    { id: 'THIS_MONTH', label: 'Tháng này' },
                    { id: 'UNATTENDED', label: 'Chưa chúc mừng' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        setBdayQuickFilter(pill.id);
                        setPageBirthday(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${bdayQuickFilter === pill.id
                        ? 'bg-[#7c3aed] text-white shadow-xs font-semibold'
                        : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 font-medium'
                        }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                    <Eye size={13} className="text-gray-400" />
                    Hiển thị <strong>{filteredBirthdayList.length}</strong>/{birthdayList.length} sinh nhật
                  </span>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={13} className="text-purple-600" />
                    Export
                  </button>
                </div>
              </div>

              {/* Tier 2: Search Query & Date Range Picker */}
              <div className="grid grid-cols-12 gap-2.5">
                {/* Search box (7 cols on md) */}
                <div className="col-span-12 md:col-span-7 relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPageBirthday(1);
                    }}
                    placeholder="Tìm theo mã hồ sơ, họ tên, SĐT, ngày sinh (dd/MM)..."
                    className="w-full text-xs pl-8 pr-7 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-purple-500 bg-white placeholder:text-gray-400 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Birthday Date Range (5 cols on md) */}
                <div className="col-span-12 md:col-span-5 flex items-center gap-1.5 border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-500 shadow-2xs">
                  <Calendar size={13} className="text-purple-600 shrink-0" />
                  <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">Sinh nhật từ:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setPageBirthday(1);
                    }}
                    className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer min-w-0"
                  />
                  <span className="text-gray-400 shrink-0">~</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setPageBirthday(1);
                    }}
                    className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer min-w-0"
                  />
                  {(startDateFilter || endDateFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDateFilter('');
                        setEndDateFilter('');
                      }}
                      className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
                      title="Xóa khoảng ngày"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tier 3: Specialized Dropdowns & Reset Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mr-1">
                    <Filter size={13} className="text-purple-600" />
                    <span className="font-semibold text-gray-700">Bộ lọc:</span>
                  </div>

                  {/* Filter 1: Trạng thái chăm sóc */}
                  <select
                    value={careStatusFilter}
                    onChange={(e) => {
                      setCareStatusFilter(e.target.value);
                      setPageBirthday(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${careStatusFilter !== 'ALL'
                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <option value="ALL">Trạng thái CSKH: Tất cả</option>
                    <option value="Chưa chăm sóc">Chưa chăm sóc</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Cần chăm sóc lại">Cần chăm sóc lại</option>
                  </select>

                  {/* Filter 2: Nhóm khách hàng */}
                  <select
                    value={bdayCustomerGroupFilter}
                    onChange={(e) => {
                      setBdayCustomerGroupFilter(e.target.value);
                      setPageBirthday(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${bdayCustomerGroupFilter !== 'ALL'
                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <option value="ALL">Nhóm khách hàng: Tất cả</option>
                    {(filterOptions.customerGroups?.length > 0 ? filterOptions.customerGroups : ['Khách VIP', 'Khách thân thiết', 'Khách mới', 'Khách tiềm năng']).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset / Clear Active Filters */}
                <div className="flex items-center gap-2">
                  {activeBdayFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleResetTabFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                      title="Xóa tất cả các bộ lọc đang chọn"
                    >
                      <RotateCcw size={12} className="text-rose-500" />
                      <span>Xóa bộ lọc ({activeBdayFilterCount})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetTabFilters}
                      title="Đặt lại về mặc định"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-xs"
                    >
                      <RotateCcw size={12} />
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px] relative w-full custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs h-fit">
                  <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-24">Mã hồ sơ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-44">Khách hàng & Nhóm</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28">Điện thoại</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-44">Ngày sinh & Tuổi</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-32">Trạng thái CSKH</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36">Kênh chăm sóc</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36">Thời gian chăm sóc</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3.5 font-bold text-slate-700 min-w-[180px] border-b border-slate-200">Nội dung / Lời chúc</th>
                      <th className="sticky top-0 right-0 bg-slate-100 text-slate-700 z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] py-3 px-3 text-center font-bold min-w-[110px] whitespace-nowrap border-b border-slate-200">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedBirthdays.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-gray-400">
                          <Inbox size={36} className="mx-auto mb-1 text-gray-300" />
                          Không có sinh nhật khách hàng phù hợp với điều kiện tìm kiếm
                        </td>
                      </tr>
                    ) : (
                      paginatedBirthdays.map((b) => (
                        <tr
                          key={b.patientId}
                          className={`group hover:bg-purple-50/40 transition-colors ${b.isToday ? 'bg-amber-50/40 border-l-4 border-amber-400' : ''
                            }`}
                        >
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(b)}
                              className="font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                              title="Xem chi tiết hồ sơ chăm sóc (i)"
                            >
                              {b.patientCode || '—'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-purple-900 group-hover:text-purple-700 transition-colors">
                                {b.patientName}
                              </span>
                              <div className="mt-0.5">{renderCustomerGroupBadge(b.customerGroup)}</div>
                              {b.email && (
                                <span className="text-[10px] text-gray-400 truncate max-w-[170px]" title={b.email}>
                                  {b.email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            {b.phone ? (
                              <a
                                href={`tel:${b.phone}`}
                                className="font-medium text-gray-800 hover:text-purple-700 hover:underline inline-flex items-center gap-1"
                                title="Gọi điện cho khách hàng"
                              >
                                {b.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900 text-xs">{b.birthdayFormatted}</span>
                                {b.isToday ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-0.5 shadow-2xs">
                                    🎂 Hôm nay
                                  </span>
                                ) : b.daysUntil > 0 && b.daysUntil <= 7 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    Còn {b.daysUntil} ngày
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-[11px] text-gray-500 font-medium">
                                {b.age ? `${b.age} tuổi` : ''} {b.birthYear ? `(sinh ${b.birthYear})` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{renderStatusBadge(b.careStatus)}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {renderChannelTag(b.careChannel, b.careChannel, b)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {b.careTime ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-700">{formatDateTime(b.careTime)}</span>
                                {b.assignedEmployeeName && (
                                  <span className="text-[10px] text-gray-400">NV: {b.assignedEmployeeName}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-gray-600 max-w-xs" title={b.careNotes}>
                            {b.careNotes ? (
                              <span className="truncate block font-normal text-gray-700">{b.careNotes}</span>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">— Chưa có ghi chú —</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center sticky right-0 bg-white group-hover:bg-purple-50/90 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[110px]">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1. Info / History */}
                              <button
                                type="button"
                                title="Xem chi tiết lịch sử chăm sóc (i)"
                                onClick={() => handleOpenHistory(b)}
                                className="w-6 h-6 rounded-md border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Info size={13} />
                              </button>

                              {/* 2. Direct Birthday Email */}
                              <button
                                type="button"
                                title="Gửi Gmail chúc mừng sinh nhật kèm ưu đãi"
                                onClick={() => handleOpenDirectEmail({ ...b, careType: 'BIRTHDAY' })}
                                className="w-6 h-6 rounded-md border border-purple-400 text-purple-600 hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Mail size={13} />
                              </button>

                              {/* 3. Add Care Record */}
                              <button
                                type="button"
                                title="Ghi nhận chăm sóc mới (+)"
                                onClick={() => handleOpenCreateCare(b, 'BIRTHDAY')}
                                className="w-6 h-6 rounded-md border border-emerald-400 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(filteredBirthdayList.length, pageBirthday, setPageBirthday)}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: THANH TOÁN (PAYMENT CRM) ===================== */}
        {activeTab === 'PAYMENT' && (
          <div className="space-y-4">
            {/* Unified 3-Tier Professional Toolbar for Tab 5 */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-2xs space-y-2.5">
              {/* Tier 1: Quick Pills (Left) + Counter & Action (Right) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1.5 mr-2">
                    <CreditCard size={15} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-700">Chăm sóc thanh toán:</span>
                  </div>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'PAID', label: 'Đã thanh toán (Cảm ơn)' },
                    { id: 'PARTIALLY_PAID', label: 'Còn nợ (Nhắc nợ)' },
                    { id: 'UNPAID', label: 'Chưa thanh toán' },
                    { id: 'UNATTENDED', label: 'Chưa chăm sóc' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        setPaymentQuickFilter(pill.id);
                        setPagePayment(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        paymentQuickFilter === pill.id
                          ? 'bg-[#7c3aed] text-white shadow-xs font-semibold'
                          : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 font-medium'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                    <Eye size={13} className="text-gray-400" />
                    Hiển thị <strong>{filteredPaymentList.length}</strong>/{paymentList.length} hóa đơn
                  </span>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={13} className="text-purple-600" />
                    Export
                  </button>
                </div>
              </div>

              {/* Tier 2: Search Query & Date Range Picker */}
              <div className="grid grid-cols-12 gap-2.5">
                {/* Search box (7 cols on md) */}
                <div className="col-span-12 md:col-span-7 relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagePayment(1);
                    }}
                    placeholder="Tìm theo mã HĐ, mã hồ sơ, họ tên khách hàng, số điện thoại..."
                    className="w-full text-xs pl-8 pr-7 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-purple-500 bg-white placeholder:text-gray-400 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Invoice Date Range (5 cols on md) */}
                <div className="col-span-12 md:col-span-5 flex items-center gap-1.5 border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-500 shadow-2xs">
                  <Calendar size={13} className="text-purple-600 shrink-0" />
                  <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">Hóa đơn từ:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setPagePayment(1);
                    }}
                    className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer min-w-0"
                  />
                  <span className="text-gray-400 shrink-0">~</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setPagePayment(1);
                    }}
                    className="w-full outline-hidden text-xs text-gray-700 bg-transparent cursor-pointer min-w-0"
                  />
                  {(startDateFilter || endDateFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDateFilter('');
                        setEndDateFilter('');
                      }}
                      className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
                      title="Xóa khoảng ngày"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tier 3: Specialized Dropdowns & Reset Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mr-1">
                    <Filter size={13} className="text-purple-600" />
                    <span className="font-semibold text-gray-700">Bộ lọc:</span>
                  </div>

                  {/* Filter 1: Trạng thái hóa đơn */}
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => {
                      setPaymentStatusFilter(e.target.value);
                      setPagePayment(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${
                      paymentStatusFilter !== 'ALL'
                        ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <option value="ALL">Trạng thái HĐ: Tất cả</option>
                    <option value="PAID">Đã thanh toán đủ</option>
                    <option value="PARTIALLY_PAID">Thanh toán một phần (còn nợ)</option>
                    <option value="UNPAID">Chưa thanh toán</option>
                  </select>

                  {/* Filter 2: Trạng thái chăm sóc */}
                  <select
                    value={paymentCareStatusFilter}
                    onChange={(e) => {
                      setPaymentCareStatusFilter(e.target.value);
                      setPagePayment(1);
                    }}
                    className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${
                      paymentCareStatusFilter !== 'ALL'
                        ? 'border-purple-400 bg-purple-50/60 text-purple-900 font-semibold shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <option value="ALL">Trạng thái CSKH: Tất cả</option>
                    <option value="Chưa chăm sóc">Chưa chăm sóc</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Cần chăm sóc lại">Cần chăm sóc lại</option>
                    <option value="Không nghe máy">Không nghe máy / Chưa liên hệ</option>
                  </select>
                </div>

                {/* Reset / Clear Active Filters */}
                <div className="flex items-center gap-2">
                  {activePaymentFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleResetTabFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                      title="Xóa tất cả các bộ lọc đang chọn"
                    >
                      <RotateCcw size={12} className="text-rose-500" />
                      <span>Xóa bộ lọc ({activePaymentFilterCount})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetTabFilters}
                      title="Đặt lại về mặc định"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-xs"
                    >
                      <RotateCcw size={12} />
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Professional KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Tổng hóa đơn</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">{paymentList.length}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Tổng tiền: <span className="font-semibold text-gray-700">{formatCurrency(totalPaymentRevenue)}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <CreditCard size={20} />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Đã thanh toán (Cảm ơn)</p>
                  <p className="text-xl font-bold text-emerald-600 mt-0.5">{paidInvoiceCount}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Đã thu: <span className="font-semibold text-emerald-600">{formatCurrency(totalPaidSum)}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Còn nợ (Nhắc nợ)</p>
                  <p className="text-xl font-bold text-rose-600 mt-0.5">{debtInvoiceCount + unpaidInvoiceCount}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Còn nợ: <span className="font-semibold text-rose-600">{formatCurrency(totalDebtSum)}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Chưa chăm sóc</p>
                  <p className="text-xl font-bold text-amber-600 mt-0.5">{unattendedPaymentCount}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Cần gửi cảm ơn hoặc nhắc nợ</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <HeartHandshake size={20} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px] relative w-full custom-scrollbar">
                <table className="w-full min-w-[1520px] text-left border-collapse text-xs h-fit">
                  <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-24 min-w-[96px]">Mã hồ sơ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-48 min-w-[190px]">Khách hàng & Nhóm</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-2.5 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28 min-w-[110px]">Điện thoại</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-32 min-w-[130px]">Mã HĐ & Ngày</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28 min-w-[115px] text-right">Tổng tiền</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28 min-w-[115px] text-right">Đã trả</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-28 min-w-[115px] text-right">Còn nợ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36 min-w-[140px] text-center">Trạng thái HĐ</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-36 min-w-[145px] text-center">Trạng thái CSKH</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 w-40 min-w-[160px]">Kênh & Lần CS gần nhất</th>
                      <th className="sticky top-0 bg-slate-100 z-20 py-3 px-3.5 font-bold text-slate-700 min-w-[220px] border-b border-slate-200">Nội dung / Gợi ý chăm sóc</th>
                      <th className="sticky top-0 right-0 bg-slate-100 text-slate-700 z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] py-3 px-3 text-center font-bold w-36 min-w-[140px] whitespace-nowrap border-b border-slate-200">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-16 text-center text-gray-400">
                          <Inbox size={36} className="mx-auto mb-1 text-gray-300" />
                          Không có hóa đơn thanh toán phù hợp với điều kiện tìm kiếm
                        </td>
                      </tr>
                    ) : (
                      paginatedPayments.map((p) => {
                        const hasDebt = Number(p.remainingAmount || 0) > 0;
                        const isFullyPaid = p.paymentStatus === 'PAID';
                        return (
                          <tr
                            key={p.invoiceId || p.invoiceCode}
                            className={`group hover:bg-purple-50/40 transition-colors ${
                              hasDebt ? 'bg-rose-50/20' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenHistory(p)}
                                className="font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                                title="Xem chi tiết hồ sơ chăm sóc (i)"
                              >
                                {p.patientCode || '—'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-purple-900 group-hover:text-purple-700 transition-colors">
                                  {p.patientName}
                                </span>
                                <div className="mt-0.5">{renderCustomerGroupBadge(p.customerGroup)}</div>
                                {p.email && (
                                  <span className="text-[10px] text-gray-400 truncate max-w-[170px]" title={p.email}>
                                    {p.email}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 whitespace-nowrap">
                              {p.phone ? (
                                <a
                                  href={`tel:${p.phone}`}
                                  className="font-medium text-gray-800 hover:text-purple-700 hover:underline inline-flex items-center gap-1"
                                >
                                  <Phone size={11} className="text-gray-400" />
                                  {p.phone}
                                </a>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-purple-800">
                                  {p.invoiceCode || '—'}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  {formatDate(p.invoiceDate)}
                                </span>
                              </div>
                            </td>
                            {/* finalAmount */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <span className="font-bold text-gray-900">
                                {formatCurrency(p.finalAmount)}
                              </span>
                            </td>
                            {/* paidAmount */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(p.paidAmount)}
                              </span>
                            </td>
                            {/* remainingAmount */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {hasDebt ? (
                                <span className="font-bold text-rose-600">
                                  {formatCurrency(p.remainingAmount)}
                                </span>
                              ) : (
                                <span className="font-medium text-emerald-600">
                                  0 đ
                                </span>
                              )}
                            </td>
                            {/* Trạng thái HĐ */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {isFullyPaid ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Đã thanh toán
                                </span>
                              ) : p.paymentStatus === 'PARTIALLY_PAID' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  Thanh toán 1 phần
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                  Chưa thanh toán
                                </span>
                              )}
                            </td>
                            {/* Trạng thái CSKH */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {renderStatusBadge(p.careStatus)}
                            </td>
                            {/* Kênh & Lần CS gần nhất */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {p.careTime ? (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1">
                                    {renderChannelTag(p.careChannel, p.careChannel, p)}
                                    <span className="font-medium text-gray-700 text-[11px]">
                                      {formatDateTime(p.careTime)}
                                    </span>
                                  </div>
                                  {p.assignedEmployeeName && (
                                    <span className="text-[10px] text-gray-400">NV: {p.assignedEmployeeName}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">— Chưa CS —</span>
                              )}
                            </td>
                            {/* Nội dung / Gợi ý CS */}
                            <td className="py-2.5 px-3.5 text-gray-600 max-w-xs" title={p.careNotes || p.suggestedTemplate}>
                              {p.careNotes ? (
                                <div className="flex flex-col">
                                  <span className="truncate block font-normal text-gray-800">{p.careNotes}</span>
                                  <span className="text-[10px] text-emerald-600 font-medium">Đã ghi nhận chăm sóc</span>
                                </div>
                              ) : p.suggestedTemplate ? (
                                <div className="flex flex-col">
                                  <span className="truncate block text-gray-400 italic">{p.suggestedTemplate}</span>
                                  <span className="text-[10px] text-purple-600 font-medium">
                                    {isFullyPaid ? 'Gợi ý: Cảm ơn thanh toán' : 'Gợi ý: Nhắc nợ công nợ'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">— Chưa có ghi chú —</span>
                              )}
                            </td>
                            {/* Thao tác */}
                            <td className="py-2.5 px-3 text-center sticky right-0 bg-white group-hover:bg-purple-50/90 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* 1. Info / History */}
                                <button
                                  type="button"
                                  title="Xem chi tiết lịch sử chăm sóc & hồ sơ bệnh nhân (i)"
                                  onClick={() => handleOpenHistory(p)}
                                  className="w-6 h-6 rounded-md border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Info size={13} />
                                </button>

                                {/* 2. Xem nhanh dịch vụ & thanh toán (Receipt) */}
                                <button
                                  type="button"
                                  title="Xem nhanh chi tiết dịch vụ hóa đơn & lịch sử thanh toán"
                                  onClick={() => handleOpenQuickInvoice(p)}
                                  className="w-6 h-6 rounded-md border border-amber-500 text-amber-600 hover:bg-amber-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Receipt size={13} />
                                </button>

                                {/* 3. Direct Email: Cảm ơn đã thanh toán hoặc Nhắc nợ */}
                                <button
                                  type="button"
                                  title={
                                    isFullyPaid
                                      ? 'Gửi Email cảm ơn Quý khách đã thanh toán'
                                      : 'Gửi Email thông báo công nợ & nhắc thanh toán'
                                  }
                                  onClick={() => handleOpenDirectEmail({ ...p, careType: 'PAYMENT' })}
                                  className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                                    isFullyPaid
                                      ? 'border-emerald-400 text-emerald-600 hover:bg-emerald-50'
                                      : 'border-rose-400 text-rose-600 hover:bg-rose-50'
                                  }`}
                                >
                                  <Mail size={13} />
                                </button>

                                {/* 4. Ghi nhận chăm sóc mới (+) */}
                                <button
                                  type="button"
                                  title="Ghi nhận chăm sóc thanh toán mới (+)"
                                  onClick={() => handleOpenCreateCare(p, 'PAYMENT')}
                                  className="w-6 h-6 rounded-md border border-purple-400 text-purple-600 hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(filteredPaymentList.length, pagePayment, setPagePayment)}
            </div>
          </div>
        )}
      </div>

      {/* ===================== MODAL: TẠO MỚI CHĂM SÓC (IMAGE 5) ===================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 tracking-tight">TẠO MỚI CHĂM SÓC</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCare} className="p-6 space-y-4">
              {/* Row 1: Thời gian * */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Thời gian <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={modalForm.date}
                      onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-hidden focus:border-purple-500 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={modalForm.time}
                      onChange={(e) => setModalForm({ ...modalForm, time: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-hidden focus:border-purple-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Kênh chăm sóc * & Trạng thái * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kênh chăm sóc <Info size={12} className="inline text-gray-400 mr-0.5" />
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={modalForm.channel}
                    onChange={(e) => setModalForm({ ...modalForm, channel: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-hidden focus:border-purple-500 bg-white"
                  >
                    <option value="PHONE">Gọi điện</option>
                    <option value="GMAIL">Gmail</option>
                    <option value="SMS">Tin nhắn SMS</option>
                    <option value="DIRECT">Trực tiếp</option>
                    <option value="GIFT">Tặng quà</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Trạng thái <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-hidden focus:border-purple-500 bg-white"
                  >
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="PENDING">Chưa chăm sóc</option>
                    <option value="RECARE">Cần chăm sóc lại</option>
                    <option value="FAILED">Gửi thất bại</option>
                    <option value="NO_ANSWER">Không nghe máy</option>
                  </select>
                </div>
              </div>

              {/* If General Care opened: Select Patient from real DB */}
              {!modalCareItem && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Khách hàng / Bệnh nhân <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={modalForm.patientId}
                    onChange={(e) => {
                      const sel = allPatients.find((p) => p.patientId === e.target.value);
                      setModalForm({
                        ...modalForm,
                        patientId: e.target.value,
                        patientName: sel ? sel.fullName : '',
                        patientCode: sel ? sel.patientCode : '',
                      });
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-hidden focus:border-purple-500 bg-white"
                  >
                    <option value="">-- Chọn khách hàng / Bệnh nhân từ CSDL --</option>
                    {allPatients.map((p) => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.patientCode ? `[${p.patientCode}] ` : ''}
                        {p.fullName} - {p.phoneNumber || 'Không có SĐT'} ({p.customerGroup || 'Khách thường'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Patient info indicator if clicked from a row */}
              {modalCareItem && (
                <div className="bg-purple-50/60 border border-purple-200/80 rounded-md p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-purple-900">{modalForm.patientName}</span>
                    {modalForm.patientCode && (
                      <span className="text-gray-500 ml-2 font-mono">({modalForm.patientCode})</span>
                    )}
                  </div>
                  {modalCareItem.phone && (
                    <span className="text-purple-700 font-medium">{modalCareItem.phone}</span>
                  )}
                </div>
              )}

              {/* Row 3: Loại chăm sóc * */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Loại chăm sóc <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {modalCareItem ? (
                    <div className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 text-gray-600 bg-gray-100 flex items-center justify-between">
                      <span>{getCareTypeLabel(modalForm.careType)}</span>
                      <Ban size={14} className="text-red-400" />
                    </div>
                  ) : (
                    <select
                      value={modalForm.careType}
                      onChange={(e) => setModalForm({ ...modalForm, careType: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-hidden focus:border-purple-500 bg-white"
                    >
                      <option value="GENERAL_CARE">Chăm sóc tổng hợp</option>
                      <option value="APPOINTMENT_REMINDER">Nhắc lịch hẹn</option>
                      <option value="BIRTHDAY">Ngày sinh nhật</option>
                      <option value="PAYMENT">Thanh toán / Công nợ</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Row 4: Nội dung chăm sóc * */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nội dung chăm sóc <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  placeholder="Nội dung chăm sóc"
                  className="w-full text-xs border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-medium">
                  Người tạo: <span className="text-gray-700">{currentStaffName}</span>
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-semibold text-white bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    Lưu thông tin
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-6 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: GỬI GMAIL TRỰC TIẾP CHO KHÁCH HÀNG ===================== */}
      {isDirectEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                  <Mail size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                    Gửi Gmail Trực Tiếp
                    <span className="text-[10px] uppercase font-semibold bg-white/25 px-2 py-0.5 rounded-md tracking-wider">
                      SMTP Direct
                    </span>
                  </h3>
                  <p className="text-xs text-rose-100">
                    Gửi thư chăm sóc, tư vấn hoặc nhắc hẹn đến hòm thư bệnh nhân ngay lập tức
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectEmailModalOpen(false)}
                className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendDirectEmail} className="p-6 space-y-4">
              {/* Patient Badge Info */}
              <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 rounded-md p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Người nhận: </span>
                  <span className="font-bold text-gray-800 text-sm">
                    {directEmailForm.patientName || 'Khách hàng'}
                  </span>
                  {directEmailForm.patientCode && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-xs bg-white text-gray-600 font-mono text-[11px] border border-gray-200">
                      {directEmailForm.patientCode}
                    </span>
                  )}
                </div>
                {directEmailForm.phone && (
                  <div className="flex items-center gap-1 text-gray-600 font-mono">
                    <Phone size={12} className="text-emerald-600" />
                    {directEmailForm.phone}
                  </div>
                )}
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>
                    Địa chỉ Gmail người nhận <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">Hộp thư nhận thông báo</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={directEmailForm.email}
                    onChange={(e) => setDirectEmailForm({ ...directEmailForm, email: e.target.value })}
                    placeholder="ví dụ: benhnhan@gmail.com"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-400 bg-white"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tiêu đề email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directEmailForm.subject}
                  onChange={(e) => setDirectEmailForm({ ...directEmailForm, subject: e.target.value })}
                  placeholder="Tiêu đề thư gửi đến khách hàng"
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-400 bg-white"
                />
              </div>

              {/* Quick Template Chips */}
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Mẫu thư nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {directEmailForm.careType === 'PAYMENT' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const finalAmt = Number(directEmailForm.finalAmount || 0).toLocaleString('vi-VN') + ' đ';
                          setDirectEmailForm({
                            ...directEmailForm,
                            subject: `[Crown Dental] Thư cảm ơn Quý khách ${directEmailForm.patientName} đã hoàn tất thanh toán (${directEmailForm.invoiceCode || 'Hóa đơn'})`,
                            message: `Kính gửi Quý khách ${directEmailForm.patientName},\n\nNha Khoa Quốc Tế Crown Dental trân trọng gửi lời cảm ơn chân thành đến Quý khách đã tin tưởng và hoàn tất thanh toán hóa đơn ${directEmailForm.invoiceCode || ''} (${finalAmt}).\n\nToàn bộ dịch vụ điều trị đã được lưu trữ hồ sơ và kích hoạt bảo hành chính hãng. Kính chúc Quý khách luôn sở hữu hàm răng chắc khỏe và nụ cười rạng rỡ!\n\nTrân trọng,\nNha Khoa Quốc Tế Crown Dental\nHotline: 0343632524`,
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-md bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 text-emerald-700 transition-colors cursor-pointer font-medium"
                      >
                        ✓ Cảm ơn hoàn tất & Bảo hành
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const code = directEmailForm.invoiceCode || 'Hóa đơn';
                          const finalAmt = Number(directEmailForm.finalAmount || 0).toLocaleString('vi-VN') + ' đ';
                          const paidAmt = Number(directEmailForm.paidAmount || 0).toLocaleString('vi-VN') + ' đ';
                          const remainAmt = Number(directEmailForm.remainingAmount || 0).toLocaleString('vi-VN') + ' đ';
                          setDirectEmailForm({
                            ...directEmailForm,
                            subject: `[Crown Dental] Thông báo công nợ dịch vụ hóa đơn ${code} - Quý khách ${directEmailForm.patientName}`,
                            message: `Kính gửi Quý khách ${directEmailForm.patientName},\n\nNha Khoa Quốc Tế Crown Dental xin gửi thông báo chi tiết tình trạng thanh toán của Quý khách:\n• Mã hóa đơn: ${code}\n• Tổng chi phí điều trị: ${finalAmt}\n• Đã thanh toán: ${paidAmt}\n• Số tiền còn nợ: ${remainAmt}\n\nQuý khách có thể quét mã VietQR tự động được đính kèm ở chân email này để thanh toán nhanh chóng hoặc chuyển khoản theo thông tin sau:\n- Ngân hàng: MB Bank (Ngân Hàng Quân Đội)\n- Số tài khoản: 0343632524\n- Chủ tài khoản: CROWN DENTAL\n- Số tiền cần thanh toán: ${remainAmt}\n- Nội dung chuyển khoản: ${code} - ${directEmailForm.patientName}\n\nXin trân trọng cảm ơn Quý khách!\nHotline hỗ trợ: 0343632524`,
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-md bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 text-rose-700 transition-colors cursor-pointer font-medium"
                      >
                        ⚠️ Nhắc nợ & STK MB Bank
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const code = directEmailForm.invoiceCode || 'Hóa đơn';
                          const remainAmt = Number(directEmailForm.remainingAmount || 0).toLocaleString('vi-VN') + ' đ';
                          setDirectEmailForm({
                            ...directEmailForm,
                            subject: `[Crown Dental] Nhắc lịch hẹn & thanh toán đợt kế tiếp - Quý khách ${directEmailForm.patientName}`,
                            message: `Kính gửi Quý khách ${directEmailForm.patientName},\n\nNha Khoa Quốc Tế Crown Dental xin gửi lời chào đến Quý khách. Phòng khám xin nhắc Quý khách chuẩn bị lịch hẹn tái khám theo phác đồ điều trị và thực hiện thanh toán phần còn lại (${remainAmt}) của hóa đơn ${code}.\n\nNếu Quý khách cần đặt trước giờ hẹn thuận tiện nhất, xin vui lòng phản hồi email này hoặc liên hệ Hotline: 0343632524.\n\nTrân trọng cảm ơn Quý khách!`,
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-md bg-amber-50 hover:bg-amber-100 hover:text-amber-800 border border-amber-200 text-amber-700 transition-colors cursor-pointer font-medium"
                      >
                        🔄 Nhắc hẹn & thanh toán đợt sau
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setDirectEmailForm({
                            ...directEmailForm,
                            subject: `[Crown Dental] Thăm hỏi sức khỏe và dặn dò sau khám - ${directEmailForm.patientName}`,
                            message: `Kính gửi Quý khách ${directEmailForm.patientName},\n\nNha Khoa Quốc Tế Crown Dental xin gửi lời thăm hỏi đến Quý khách sau buổi khám tại phòng khám. Quý khách vui lòng tuân thủ dặn dò của bác sĩ và uống thuốc đúng liều lượng (nếu có).\n\nNếu có bất kỳ dấu hiệu đau nhức bất thường, xin vui lòng liên hệ ngay với chúng tôi qua số Hotline: 0343632524 để được hỗ trợ kịp thời.\n\nTrân trọng,\nĐội ngũ Bác sĩ Crown Dental`,
                          })
                        }
                        className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                      >
                        Thăm hỏi sau khám
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDirectEmailForm({
                            ...directEmailForm,
                            subject: `[Crown Dental] Nhắc lịch hẹn tái khám của Quý khách ${directEmailForm.patientName}`,
                            message: `Kính gửi Quý khách ${directEmailForm.patientName},\n\nCrown Dental xin trân trọng nhắc Quý khách về lịch hẹn tái khám sắp tới. Quý khách vui lòng đến trước giờ hẹn 10 phút để phòng khám đón tiếp chu đáo nhất.\n\nNếu Quý khách có việc bận cần đổi lịch, vui lòng phản hồi email này hoặc gọi hotline 0343632524 trước ít nhất 2 giờ.\n\nTrân trọng cảm ơn Quý khách!`,
                          })
                        }
                        className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                      >
                        Nhắc lịch hẹn
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDirectEmailForm({
                            ...directEmailForm,
                            subject: `[Crown Dental] Chúc mừng sinh nhật Quý khách ${directEmailForm.patientName}`,
                            message: `Kính gửi Quý khách ${directEmailForm.patientName},\n\nNhân dịp sinh nhật, toàn thể ban lãnh đạo và y bác sĩ Nha Khoa Crown Dental kính chúc Quý khách luôn ngập tràn niềm vui, sức khỏe dồi dào và thành công rực rỡ!\n\nCrown Dental trân trọng gửi tặng Quý khách phiếu ưu đãi 20% cho tất cả dịch vụ chăm sóc & làm đẹp răng miệng áp dụng trong tháng này.\n\nChúc Quý khách có một ngày sinh nhật thật ý nghĩa và hạnh phúc!`,
                          })
                        }
                        className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                      >
                        Chúc mừng sinh nhật
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Live VietQR Preview Box for Payment Reminders */}
              {directEmailForm.careType === 'PAYMENT' && Number(directEmailForm.remainingAmount || 0) > 0 && (
                <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/90 rounded-md p-3 flex flex-col sm:flex-row items-center gap-3.5 shadow-2xs">
                  <div className="shrink-0 bg-white p-1.5 rounded-md border border-blue-200 shadow-xs flex flex-col items-center">
                    <img
                      src={getVietQrImageUrl(
                        directEmailForm.remainingAmount,
                        directEmailForm.invoiceCode,
                        directEmailForm.patientName
                      )}
                      alt="VietQR MB Bank"
                      className="w-20 h-20 object-contain rounded"
                    />
                    <span className="text-[9px] font-bold text-[#132c68] tracking-wider mt-1 flex items-center gap-0.5">
                      <QrCode size={10} />
                      VIETQR NAPAS
                    </span>
                  </div>
                  <div className="flex-1 text-xs space-y-1 w-full min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#132c68] text-white">
                        MB BANK
                      </span>
                      <span className="font-semibold text-gray-800 text-[11px]">
                        Mã VietQR thu nợ tự động được đính kèm vào email gửi bệnh nhân
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Khách hàng chỉ cần mở app Ngân hàng (MB, VCB, Momo, Techcombank...) quét mã là hoàn tất thanh toán đúng số tiền và cú pháp hóa đơn mà không cần gõ STK.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] pt-1.5 border-t border-blue-200/60 font-mono text-gray-700">
                      <span>STK: <strong className="text-blue-700 font-bold">0343632524</strong></span>
                      <span>Số nợ: <strong className="text-rose-600 font-bold">{Number(directEmailForm.remainingAmount).toLocaleString('vi-VN')} đ</strong></span>
                      <span className="truncate">Cú pháp: <strong className="text-purple-700">{directEmailForm.invoiceCode || 'HĐ'} - {directEmailForm.patientName}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Body */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>
                    Nội dung email <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">Hỗ trợ định dạng xuống dòng tự động</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={directEmailForm.message}
                  onChange={(e) => setDirectEmailForm({ ...directEmailForm, message: e.target.value })}
                  placeholder="Nhập nội dung email muốn gửi tới khách hàng..."
                  className="w-full text-xs p-3 border border-gray-300 rounded-md text-gray-800 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-400 bg-white leading-relaxed resize-none font-sans"
                />
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-md p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
                <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <span>
                  Email sẽ được gửi trực tiếp từ hệ thống mail Crown Dental (SMTP). Sau khi gửi thành công, một bản ghi chăm sóc kênh <strong>Gmail</strong> sẽ được tự động lưu vào lịch sử.
                </span>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-500">
                  Người gửi: <strong className="text-gray-700">{currentStaffName}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDirectEmailModalOpen(false)}
                    disabled={sendingEmail}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer shadow-md shadow-rose-200 disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <>
                        <RotateCcw size={13} className="animate-spin" />
                        Đang gửi Gmail...
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        Gửi Gmail ngay
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: XEM CHI TIẾT HÓA ĐƠN & GIAO DỊCH (RECEIPT QUICK VIEW) ===================== */}
      {quickInvoiceModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0">
                  <Receipt size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                      Chi Tiết Hóa Đơn Dịch Vụ & Thanh Toán
                    </h3>
                    <span className="font-mono text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      {quickInvoiceModal.invoice?.invoiceCode || quickInvoiceModal.contextCareItem?.invoiceCode || 'HÓA ĐƠN'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Tra cứu danh mục điều trị, lịch sử đóng tiền và thông tin công nợ bệnh nhân
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickInvoiceModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1 text-xs bg-white">
              {quickInvoiceModal.loading ? (
                <div className="py-16 text-center text-gray-500">
                  <RefreshCw size={24} className="animate-spin mx-auto text-purple-600 mb-2" />
                  <p className="font-medium">Đang tải dữ liệu hóa đơn và giao dịch...</p>
                </div>
              ) : (
                <>
                  {/* Patient & Invoice Ribbon */}
                  <div className="bg-slate-50/80 border border-slate-200/90 rounded-md p-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Khách hàng</span>
                      <strong className="text-xs font-bold text-gray-900 block mt-0.5">
                        {quickInvoiceModal.invoice?.patientName || quickInvoiceModal.contextCareItem?.patientName || '—'}
                      </strong>
                      <span className="text-[11px] text-gray-500 font-mono">
                        Mã: {quickInvoiceModal.invoice?.patientCode || quickInvoiceModal.contextCareItem?.patientCode || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Số điện thoại</span>
                      <strong className="text-xs font-semibold text-gray-800 block mt-0.5 font-mono">
                        {quickInvoiceModal.invoice?.patientPhone || quickInvoiceModal.contextCareItem?.phone || '—'}
                      </strong>
                      <span className="text-[11px] text-gray-500">
                        Ngày tạo: {formatDate(quickInvoiceModal.invoice?.invoiceDate || quickInvoiceModal.contextCareItem?.invoiceDate)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Nhân viên thu ngân</span>
                      <strong className="text-xs font-semibold text-gray-800 block mt-0.5">
                        {quickInvoiceModal.invoice?.employeeName || 'Nguyệt Nguyễn'}
                      </strong>
                      <span className="text-[11px] text-gray-500">Crown Dental</span>
                    </div>

                    <div className="flex flex-col justify-center items-start md:items-end">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Trạng thái thanh toán</span>
                      {quickInvoiceModal.invoice?.paymentStatus === 'PAID' || quickInvoiceModal.contextCareItem?.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Đã thanh toán đủ
                        </span>
                      ) : (quickInvoiceModal.invoice?.paymentStatus === 'PARTIALLY_PAID' || quickInvoiceModal.contextCareItem?.paymentStatus === 'PARTIALLY_PAID') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} />
                          Thanh toán 1 phần
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle size={12} />
                          Chưa thanh toán
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Section 1: Dental Line Items */}
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-gray-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <Activity size={13} className="text-purple-600" />
                      Danh sách thủ thuật & Dịch vụ điều trị ({quickInvoiceModal.invoice?.invoiceDetails?.length || 0})
                    </h4>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-gray-50/90 border-b border-gray-200 text-gray-600 font-semibold text-[11px]">
                          <tr>
                            <th className="py-2 px-3 w-12 text-center">STT</th>
                            <th className="py-2 px-3">Tên dịch vụ điều trị</th>
                            <th className="py-2 px-3 w-20 text-center">Số lượng</th>
                            <th className="py-2 px-3 w-32 text-right">Đơn giá</th>
                            <th className="py-2 px-3 w-36 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {(!quickInvoiceModal.invoice?.invoiceDetails || quickInvoiceModal.invoice.invoiceDetails.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-gray-400 italic">
                                Không có chi tiết dịch vụ điều trị
                              </td>
                            </tr>
                          ) : (
                            quickInvoiceModal.invoice.invoiceDetails.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors">
                                <td className="py-2.5 px-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-medium text-gray-900">{item.itemName || 'Dịch vụ nha khoa'}</td>
                                <td className="py-2.5 px-3 text-center font-medium">{item.quantity || 1}</td>
                                <td className="py-2.5 px-3 text-right text-gray-600 font-mono">{formatCurrency(item.unitPrice)}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: Payment Transactions History */}
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-gray-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <CreditCard size={13} className="text-emerald-600" />
                      Lịch sử các lần giao dịch đóng tiền ({quickInvoiceModal.invoice?.paymentTransactions?.length || 0})
                    </h4>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-gray-50/90 border-b border-gray-200 text-gray-600 font-semibold text-[11px]">
                          <tr>
                            <th className="py-2 px-3 w-32">Mã GD</th>
                            <th className="py-2 px-3 w-36">Thời gian</th>
                            <th className="py-2 px-3 w-32">Phương thức</th>
                            <th className="py-2 px-3">Ghi chú / Người thu</th>
                            <th className="py-2 px-3 w-32 text-right">Số tiền đã thu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {(!quickInvoiceModal.invoice?.paymentTransactions || quickInvoiceModal.invoice.paymentTransactions.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="py-5 text-center text-rose-600 bg-rose-50/20 italic font-medium">
                                Chưa phát sinh giao dịch đóng tiền nào cho hóa đơn này
                              </td>
                            </tr>
                          ) : (
                            quickInvoiceModal.invoice.paymentTransactions.map((tx, idx) => (
                              <tr key={tx.id || idx} className="hover:bg-emerald-50/20 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-semibold text-emerald-800">{tx.transactionCode || '—'}</td>
                                <td className="py-2.5 px-3 text-gray-600">{formatDateTime(tx.paymentTime)}</td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                    {tx.paymentMethod === 'BANK_TRANSFER' ? '🏦 Chuyển khoản' : tx.paymentMethod === 'CASH' ? '💵 Tiền mặt' : tx.paymentMethod === 'POS' ? '💳 Quẹt thẻ POS' : (tx.paymentMethod || 'Tiền mặt')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-600">
                                  <span>{tx.note || '—'}</span>
                                  {tx.employeeName && <span className="block text-[10px] text-gray-400">Thu bởi: {tx.employeeName}</span>}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-600 font-mono">
                                  +{formatCurrency(tx.totalAmount || tx.amountReceived)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: Financial Summary 3-Card Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-md border border-gray-200 bg-white shadow-2xs">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Tổng hóa đơn</span>
                      <span className="text-base font-bold text-gray-900 font-mono block mt-0.5">
                        {formatCurrency(quickInvoiceModal.invoice?.finalAmount || quickInvoiceModal.contextCareItem?.finalAmount)}
                      </span>
                      {Number(quickInvoiceModal.invoice?.discountAmount || 0) > 0 ? (
                        <span className="text-[10px] text-emerald-600 block mt-0.5">
                          (Đã giảm: {formatCurrency(quickInvoiceModal.invoice.discountAmount)})
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 block mt-0.5">Chi phí điều trị</span>
                      )}
                    </div>

                    <div className="p-3 rounded-md border border-gray-200 bg-white shadow-2xs">
                      <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Đã thanh toán
                      </span>
                      <span className="text-base font-bold text-emerald-600 font-mono block mt-0.5">
                        {formatCurrency(quickInvoiceModal.invoice?.paidAmount || quickInvoiceModal.contextCareItem?.paidAmount)}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Đã đối soát ghi nhận</span>
                    </div>

                    <div className={`p-3 rounded-md border shadow-2xs ${
                      Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0) > 0
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-emerald-200 bg-emerald-50/20'
                    }`}>
                      <span className={`text-[11px] font-medium uppercase tracking-wider block flex items-center gap-1 ${
                        Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0) > 0
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}>
                        {Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0) > 0 ? (
                          <AlertCircle size={12} className="text-rose-600" />
                        ) : (
                          <CheckCircle2 size={12} className="text-emerald-600" />
                        )}
                        Còn nợ
                      </span>
                      <span className={`text-base font-bold font-mono block mt-0.5 ${
                        Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0) > 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}>
                        {formatCurrency(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount)}
                      </span>
                      <span className={`text-[10px] block mt-0.5 ${
                        Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0) > 0
                          ? 'text-rose-600 font-medium'
                          : 'text-emerald-600 font-medium'
                      }`}>
                        {Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0) > 0
                          ? 'Cần theo dõi & đôn đốc thu'
                          : 'Đã hoàn thành 100%'}
                      </span>
                    </div>
                  </div>

                  {/* Section 4: Segmented Bank Transfer Info & Dynamic VietQR for Remaining Debt */}
                  {Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0) > 0 && (() => {
                    const invCode = quickInvoiceModal.invoice?.invoiceCode || quickInvoiceModal.contextCareItem?.invoiceCode || '';
                    const pName = quickInvoiceModal.invoice?.patientName || quickInvoiceModal.contextCareItem?.patientName || '';
                    const remAmt = Number(quickInvoiceModal.invoice?.remainingAmount || quickInvoiceModal.contextCareItem?.remainingAmount || 0);
                    const remAmtFormatted = formatCurrency(remAmt);
                    const syntax = `${invCode} - ${pName}`;
                    const qrUrl = getVietQrImageUrl(remAmt, invCode, pName);

                    return (
                      <div className="bg-slate-50/95 border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
                        {/* Header: Title and Copy All button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-[#132c68] text-white flex items-center justify-center font-bold text-[9px] tracking-wider shrink-0 shadow-xs">
                              MB
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-xs">
                                Phân vùng tài khoản MB Bank & Mã VietQR thu công nợ
                              </h4>
                              <p className="text-[10px] text-gray-500">
                                Bấm sao chép nhanh từng trường dữ liệu hoặc quét mã VietQR tự động
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyBankInfo(invCode, pName, remAmt)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300 rounded text-[11px] font-medium shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                            title="Sao chép toàn bộ thông tin tài khoản, số tiền và cú pháp để gửi qua tin nhắn Zalo/SMS"
                          >
                            {copiedBankField === 'ALL' || quickInvoiceModal.copiedBank ? (
                              <>
                                <CheckCheck size={12} className="text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">Đã chép toàn bộ!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} className="text-gray-500" />
                                <span>Sao chép toàn bộ</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Grid: Left = Segmented Copy Fields (8 cols), Right = VietQR Code Card (4 cols) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                          {/* Left Column: Phân vùng từng trường có nút copy riêng */}
                          <div className="lg:col-span-8 space-y-2">
                            {/* Row 1: STK */}
                            <div className="bg-white border border-gray-200 rounded p-2.5 flex items-center justify-between gap-2 hover:border-blue-300 transition-colors">
                              <div className="min-w-0">
                                <span className="text-[10px] text-gray-400 block font-sans">
                                  Số tài khoản thụ hưởng (MB Bank - Ngân hàng Quân Đội):
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-blue-700 font-mono text-sm font-bold tracking-wider">
                                    0343632524
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                    CROWN DENTAL
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyBankField('0343632524', 'STK', 'Đã sao chép Số tài khoản MB Bank: 0343632524')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                              >
                                {copiedBankField === 'STK' ? (
                                  <>
                                    <CheckCheck size={12} className="text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Chép STK</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Row 2: Cú pháp nội dung CK */}
                            <div className="bg-white border border-gray-200 rounded p-2.5 flex items-center justify-between gap-2 hover:border-purple-300 transition-colors">
                              <div className="min-w-0">
                                <span className="text-[10px] text-gray-400 block font-sans">
                                  Cú pháp nội dung chuyển khoản (bắt buộc để đối soát khớp HĐ):
                                </span>
                                <div className="text-purple-700 font-mono text-xs font-bold tracking-tight truncate mt-0.5">
                                  {syntax}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyBankField(syntax, 'SYNTAX', `Đã sao chép cú pháp: ${syntax}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                              >
                                {copiedBankField === 'SYNTAX' ? (
                                  <>
                                    <CheckCheck size={12} className="text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Chép cú pháp</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Row 3: Số tiền nợ cần thanh toán */}
                            <div className="bg-white border border-gray-200 rounded p-2.5 flex items-center justify-between gap-2 hover:border-rose-300 transition-colors">
                              <div className="min-w-0">
                                <span className="text-[10px] text-gray-400 block font-sans">
                                  Số tiền công nợ cần thanh toán:
                                </span>
                                <div className="text-rose-600 font-mono text-sm font-bold mt-0.5">
                                  {remAmtFormatted}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyBankField(remAmt, 'AMOUNT', `Đã sao chép số tiền: ${remAmtFormatted}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                              >
                                {copiedBankField === 'AMOUNT' ? (
                                  <>
                                    <CheckCheck size={12} className="text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Chép số tiền</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Right Column: Mã VietQR thu tiền tiện lợi */}
                          <div className="lg:col-span-4 bg-white border border-gray-200 rounded p-3 flex flex-col items-center justify-between text-center shadow-2xs">
                            <div className="w-full flex items-center justify-between border-b border-gray-100 pb-1.5 mb-1.5">
                              <span className="text-[10px] font-bold text-[#132c68] uppercase tracking-wider flex items-center gap-1">
                                <QrCode size={11} />
                                Mã VietQR Napas
                              </span>
                              <a
                                href={qrUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 font-medium"
                                title="Mở mã QR trong tab mới để xem kích thước lớn"
                              >
                                Phóng to
                                <ExternalLink size={10} />
                              </a>
                            </div>

                            <div
                              className="p-1 bg-white rounded border border-gray-100 shadow-2xs my-auto group relative cursor-pointer"
                              onClick={() => window.open(qrUrl, '_blank')}
                              title="Nhấp để mở mã QR kích thước lớn"
                            >
                              <img
                                src={qrUrl}
                                alt="Mã VietQR MB Bank"
                                className="w-28 h-28 object-contain rounded transition-transform group-hover:scale-105"
                              />
                            </div>

                            <div className="mt-1.5 space-y-0.5">
                              <span className="text-[10px] text-gray-500 block leading-tight">
                                Quét mã chuyển khoản tự động
                              </span>
                              <span className="text-[9px] text-gray-400 block font-mono">
                                MB Bank • 0343632524
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-gray-500">
                Thao tác liên kết chăm sóc khách hàng trực tiếp
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ctx = quickInvoiceModal.contextCareItem;
                    const inv = quickInvoiceModal.invoice;
                    setQuickInvoiceModal((prev) => ({ ...prev, isOpen: false }));
                    handleOpenDirectEmail({ ...ctx, ...inv, careType: 'PAYMENT' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded shadow-2xs transition-colors cursor-pointer"
                >
                  <Mail size={13} className="text-gray-500" />
                  Gửi Email thông báo
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ctx = quickInvoiceModal.contextCareItem;
                    const inv = quickInvoiceModal.invoice;
                    setQuickInvoiceModal((prev) => ({ ...prev, isOpen: false }));
                    handleOpenCreateCare({ ...ctx, ...inv }, 'PAYMENT');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Ghi nhận chăm sóc (+)
                </button>

                <button
                  type="button"
                  onClick={() => setQuickInvoiceModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded shadow-2xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CHI TIẾT CHĂM SÓC KHÁCH HÀNG (i) ===================== */}
      <CustomerCareDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        patientId={selectedDetailPatientId}
        appointmentId={selectedDetailAppointmentId}
        invoiceId={selectedDetailInvoiceId}
        initialPatientData={selectedDetailItem}
        currentStaffName={currentStaffName}
        dentistOptions={filterOptions.dentists || []}
        onDataChanged={() => {
          loadTabData();
          loadStats();
        }}
      />
    </div>
  );
}

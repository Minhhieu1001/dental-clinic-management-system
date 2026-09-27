import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronDown,
  Phone,
  Calendar,
  Stethoscope,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  Package,
  Sparkles,
  Calculator,
  Printer,
  FileText,
  Activity,
  Tag,
  Search,
  CalendarCheck,
  Edit3,
  Clock4,
  Check,
  RefreshCw,
  X,
  RotateCcw,
  FolderOpen,
  User,
  Maximize2,
  Users,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

// API Services
import { getPatients, getPatientsByPhone, getPatientByPatientCode } from '../../services/patient.service';
import { getMedicalRecordsByPatientCode, getMedicalRecordsByPatientId } from '../../services/medicalRecord.service';
import { getExaminationResultsByMedicalRecordId } from '../../services/examinationResult.service';
import { getServices, getDentists } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  createTreatmentPlan,
  getTreatmentPlansByPatientId,
  getTreatmentPlanByExaminationResultId,
  updateTreatmentPlan,
} from '../../services/treatmentPlan.service';
import {
  ICD10_DIAGNOSES,
  DEFAULT_SERVICE_CATALOG,
  PRESET_PACKAGES,
  STATUS_PHASE_CONFIG,
} from './clinicalExaminationHelpers';
import { AddServiceModal } from '../treatment/action/AddServiceModal';
import { TreatmentVisitModal } from '../treatment/action/TreatmentVisitModal';
import PatientSearchBar from '../../components/ui/search/PatientSearchBar';

const getInitials = (name) => {
  if (!name) return 'BN';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
import { CreatePlanModal } from './action/CreatePlanModal';
import { PhaseModal } from './action/PhaseModal';
import { PhaseDetailModal } from './action/PhaseDetailModal';
import MultiplePatientsModal from '../../components/common/MultiplePatientsModal';
import {
  NoPatientAlert,
  NoExaminationAlert,
  NoDiagnosisAlert,
  NoPlanForSessionAlert,
} from './components/TreatmentStateAlerts';

export default function TreatmentPlans() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. THÔNG TIN BỆNH NHÂN (Patient Entity)
  const stateData = location.state || {};
  const [patient, setPatient] = useState(() => {
    if (stateData.patient && (stateData.patient.fullName || stateData.patient.id)) {
      return {
        id: stateData.patient.id || '',
        patientCode: stateData.patient.patientCode || 'PA-CHUA-CO-MA',
        fullName: stateData.patient.fullName || 'Bệnh nhân',
        gender: stateData.patient.gender || 'FEMALE',
        dateOfBirth: stateData.patient.dateOfBirth || '',
        phone: stateData.patient.phone || stateData.patient.phoneNumber || '',
        allergies: stateData.patient.allergies || '',
        systemicDisease: stateData.patient.systemicDisease || '',
      };
    }
    return null;
  });

  const hasPatient = Boolean(patient && (patient.fullName || patient.patientCode));

  // State tìm kiếm bệnh nhân theo số điện thoại & Selectbox
  const [phoneSearchQuery, setPhoneSearchQuery] = useState(
    () => stateData.phone || stateData.patient?.phone || stateData.patient?.phoneNumber || ''
  );
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatientOptions, setLoadingPatientOptions] = useState(false);
  const [multiplePatientsModalOpen, setMultiplePatientsModalOpen] = useState(false);
  const [foundPatientsList, setFoundPatientsList] = useState([]);

  // State danh sách kế hoạch điều trị của bệnh nhân được chọn
  const [patientTreatmentPlans, setPatientTreatmentPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('NEW');

  // State các đợt điều trị / đợt khám của bệnh nhân
  const [treatmentSessions, setTreatmentSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('ALL');
  const currentSession = treatmentSessions.find((s) => String(s.id) === String(selectedSessionId));

  // Trạng thái đợt khám hiện tại đã có kế hoạch điều trị hay chưa & Modal tạo kế hoạch
  const [hasPlanForActiveSession, setHasPlanForActiveSession] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);

  // Formatters
  const formatPrice = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Helper tính tuổi từ ngày sinh
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} tuổi` : '';
  };

  // 2. KẾT QUẢ CHẨN ĐOÁN NHA SĨ THEO RĂNG (Doctor Diagnoses)
  const [diagnosesList, setDiagnosesList] = useState(() => {
    if (stateData.diagnosisList && stateData.diagnosisList.length > 0) {
      return stateData.diagnosisList;
    }
    if (stateData.diagnosis || stateData.selectedTooth) {
      const toothNo = stateData.selectedTooth || 46;
      const diagCode = stateData.diagnosis || 'K02.1';
      const foundIcd = ICD10_DIAGNOSES.find((d) => d.code === diagCode);
      return [
        {
          id: 'diag-1',
          toothPosition: typeof toothNo === 'number' ? `Răng ${toothNo}` : String(toothNo),
          primaryDiagnosis: diagCode,
          label: foundIcd?.label || `Sâu ngà răng (${diagCode})`,
          severity: 'Trung bình',
          indication: foundIcd?.indication || 'Trám răng Composite quang trùng hợp / Điều trị tủy nếu sát tủy',
          notes: stateData.diagnosisNotes || 'Sâu ngà mặt nhai và mặt gần, chưa thủng tủy. Bệnh nhân đau buốt khi ăn nhai.',
        },
      ];
    }
    return [];
  });

  // 3. THÔNG TIN BẢNG `Treatment Plans` (Master Entity)
  const { user } = useAuth();
  const [dentistsCatalog, setDentistsCatalog] = useState([]);
  const [planId, setPlanId] = useState(() => `PLAN-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`);
  const [planName, setPlanName] = useState(''); // Tên kế hoạch điều trị ban đầu ĐỂ TRỐNG theo đúng yêu cầu
  const [dentistName, setDentistName] = useState(() => stateData.treatingDoctor || '');
  const [planDesc, setPlanDesc] = useState(() => stateData.diagnosisNotes || '');
  const [planStatus, setPlanStatus] = useState('IN_PROGRESS'); // PENDING | IN_PROGRESS | COMPLETED
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [discountPercent, setDiscountPercent] = useState(0);

  // Tự động lấy tên bác sĩ theo tài khoản đăng nhập hiện tại
  const loggedInDoctorName = useMemo(() => {
    if (!user) return '';
    if (dentistsCatalog.length > 0) {
      const match = dentistsCatalog.find(
        (d) =>
          (d.userId && user.id && d.userId === user.id) ||
          (d.id && user.id && d.id === user.id) ||
          (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
          (d.name && user.username && d.name.toLowerCase().includes(user.username.toLowerCase()))
      );
      if (match?.name || match?.fullName) {
        let n = match.name || match.fullName;
        if (!/^(BS\.|ThS\.|TS\.|Dr\.)/i.test(n)) n = 'BS. ' + n;
        return n;
      }
    }
    if (user.fullName || user.name) {
      let n = user.fullName || user.name;
      if (!/^(BS\.|ThS\.|TS\.|Dr\.)/i.test(n)) n = 'BS. ' + n;
      return n;
    }
    if (user.username) {
      let uname = user.username;
      if (!/^(BS\.|ThS\.|TS\.|Dr\.)/i.test(uname)) uname = 'BS. ' + uname;
      return uname;
    }
    return '';
  }, [user, dentistsCatalog]);

  // Lấy ID bác sĩ theo tài khoản đăng nhập hiện tại
  const loggedInDentistId = useMemo(() => {
    if (!user) return null;
    if (dentistsCatalog.length > 0) {
      const match = dentistsCatalog.find(
        (d) =>
          (d.userId && user.id && String(d.userId) === String(user.id)) ||
          (d.id && user.id && String(d.id) === String(user.id)) ||
          (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase())
      );
      if (match?.id) return match.id;
    }
    return user.dentistId || user.id || null;
  }, [user, dentistsCatalog]);

  useEffect(() => {
    if (loggedInDoctorName && (!dentistName || dentistName === 'BS. Nguyễn Văn Tâm')) {
      setDentistName(loggedInDoctorName);
    }
  }, [loggedInDoctorName, dentistName]);

  // 4. CÁC GIAI ĐOẠN ĐIỀU TRỊ (`Treatment Phases`)
  // Ban đầu ĐỂ TRỐNG (0 giai đoạn) để người dùng tự tạo giai đoạn hoặc áp dụng gói gợi ý
  const [phases, setPhases] = useState([]);

  // Trạng thái thu gọn / mở rộng nội dung từng buổi điều trị lâm sàng
  const [expandedVisitIds, setExpandedVisitIds] = useState({});

  const toggleVisitExpand = useCallback((visitId) => {
    setExpandedVisitIds((prev) => ({
      ...prev,
      [visitId]: !prev[visitId],
    }));
  }, []);

  // 5. DANH MỤC DỊCH VỤ NHA KHOA (Service Entity)
  const [servicesCatalog, setServicesCatalog] = useState(DEFAULT_SERVICE_CATALOG);

  // Modals state
  // Modal Thêm Giai Đoạn (`TreatmentPhase`)
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseModalMode, setPhaseModalMode] = useState('ADD'); // 'ADD' | 'EDIT'
  const [currentPhaseData, setCurrentPhaseData] = useState(null);

  // Modal Chỉ Định Dịch Vụ Nha Khoa (`treatment_services`)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [targetPhaseIdForService, setTargetPhaseIdForService] = useState(null);

  // Modal Thêm / Sửa Buổi Điều Trị (`TreatmentVisits`)
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitModalMode, setVisitModalMode] = useState('ADD'); // 'ADD' | 'EDIT'
  const [targetPhaseIdForVisit, setTargetPhaseIdForVisit] = useState(null);
  const [currentVisitData, setCurrentVisitData] = useState(null);

  // Modal Chi Tiết Giai Đoạn Toàn Màn Hình Chuẩn ERP
  const [showPhaseDetailModal, setShowPhaseDetailModal] = useState(false);
  const [selectedDetailPhase, setSelectedDetailPhase] = useState(null);

  const handleOpenPhaseDetail = useCallback((phaseToView) => {
    setSelectedDetailPhase(phaseToView);
    setShowPhaseDetailModal(true);
  }, []);

  // Scroll Spy & Trạng thái tiến trình giai đoạn theo chiều dọc
  const [activePhaseId, setActivePhaseId] = useState(null);

  const phasesCompletedCount = useMemo(() => {
    return phases.filter((p) => p.status === 'COMPLETED').length;
  }, [phases]);

  const phasesProgressPercent = useMemo(() => {
    if (!phases || phases.length === 0) return 0;
    return Math.round((phasesCompletedCount / phases.length) * 100);
  }, [phases, phasesCompletedCount]);

  // Observer theo dõi cuộn để tự động highlight giai đoạn tương ứng (Scroll Spy)
  useEffect(() => {
    if (!phases || phases.length === 0) return;
    if (!activePhaseId && phases[0]) {
      setActivePhaseId(String(phases[0].phase_id));
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pId = entry.target.getAttribute('data-phase-id');
            if (pId) setActivePhaseId(String(pId));
          }
        });
      },
      {
        rootMargin: '-15% 0px -60% 0px',
        threshold: 0.1,
      }
    );

    phases.forEach((p) => {
      const el = document.getElementById(`phase-card-${p.phase_id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [phases, activePhaseId]);

  const scrollToPhase = useCallback((phaseId) => {
    setActivePhaseId(String(phaseId));
    const el = document.getElementById(`phase-card-${phaseId}`);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);


  // Hàm chuyển đổi và nạp một kế hoạch điều trị cụ thể vào giao diện
  const handleSelectPlan = useCallback((planIdToSelect, list = null) => {
    const currentList = list || patientTreatmentPlans;
    if (planIdToSelect === 'NEW') {
      setSelectedPlanId('NEW');
      setPlanId(`PLAN-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`);
      setPlanName('');
      setPlanDesc('');
      setPhases([]);
      setPlanStatus('IN_PROGRESS');
      setStartDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setEndDate(d.toISOString().split('T')[0]);
      toast.success('Đang ở chế độ tạo kế hoạch điều trị mới');
      return;
    }

    const foundPlan = currentList.find((p) => String(p.id) === String(planIdToSelect));
    if (!foundPlan) return;

    setSelectedPlanId(foundPlan.id);
    setPlanId(foundPlan.id);
    setPlanName(foundPlan.planName || '');
    setPlanDesc(foundPlan.description || '');
    if (foundPlan.dentistName) {
      setDentistName(foundPlan.dentistName);
    }
    setPlanStatus(foundPlan.status || 'IN_PROGRESS');
    if (foundPlan.startDate) {
      setStartDate(foundPlan.startDate.split('T')[0]);
    }
    if (foundPlan.endDate) {
      setEndDate(foundPlan.endDate.split('T')[0]);
    }

    // Chuyển đổi các phase từ API sang format của TreatmentPlans UI
    const mappedPhases = (foundPlan.phases || []).map((ph, idx) => ({
      phase_id: ph.id || `ph-${Date.now()}-${idx}`,
      phase_order: Number(ph.phaseOrder) || idx + 1,
      phase_name: ph.phaseName,
      treatmentType: ph.treatmentType || 'Tổng quát',
      estimated_duration: ph.estimatedDuration || '1 tuần',
      status: ph.status || 'PENDING',
      description: ph.description || '',
      treatment_services: (ph.treatmentServices || []).map((s, sIdx) => ({
        treatmentServicesId: s.id || `ts-${Date.now()}-${idx}-${sIdx}`,
        service_id: s.serviceId || `srv-${sIdx}`,
        service_name: s.serviceName,
        toothNumber: s.toothNumber || '',
        quantity: Number(s.quantity) || 1,
        price: Number(s.price) || 0,
      })),
      treatment_visits: (ph.treatmentVisits || []).map((v, vIdx) => ({
        visitId: v.visitId || v.id || `vis-${Date.now()}-${idx}-${vIdx}`,
        visitName: v.visitName,
        visitOrder: Number(v.visitOrder) || vIdx + 1,
        start_date: v.startDate ? v.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
        status: v.status || 'PENDING',
        clinical_notes: v.clinicalNotes || '',
        assigned_dentist: v.assignedDentist || '',
      })),
    }));

    setPhases(mappedPhases);
    toast.success(`Đã nạp kế hoạch: "${foundPlan.planName}"`);
  }, [patientTreatmentPlans]);

  // Tải danh sách kế hoạch điều trị của bệnh nhân từ backend
  const fetchPlansForPatient = useCallback(async (patientId) => {
    if (!patientId || patientId === 'pat-1') return [];
    setLoadingPlans(true);
    try {
      const plans = await getTreatmentPlansByPatientId(patientId);
      const planList = Array.isArray(plans) ? plans : plans ? [plans] : [];
      setPatientTreatmentPlans(planList);
      return planList;
    } catch (err) {
      console.warn('Lỗi khi tải kế hoạch điều trị của bệnh nhân:', err);
      setPatientTreatmentPlans([]);
      return [];
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  // Chọn đợt điều trị / đợt khám để lấy đúng chẩn đoán và kế hoạch của đợt đó
  const handleSelectTreatmentSession = useCallback(async (sessionId, customSessions = null, customPlans = null) => {
    const sList = customSessions || treatmentSessions;
    const pList = customPlans || patientTreatmentPlans;

    setSelectedSessionId(sessionId);

    if (sessionId === 'ALL' || !sessionId) {
      // 1. Hiển thị tất cả chẩn đoán của bệnh nhân
      const allDiags = sList.flatMap((s) => s.diagnoses || []);
      setDiagnosesList(allDiags);

      // 2. Nạp kế hoạch mới nhất nếu có
      if (pList.length > 0) {
        handleSelectPlan(pList[0].id, pList);
        setHasPlanForActiveSession(true);
      } else {
        handleSelectPlan('NEW', pList);
        setHasPlanForActiveSession(false);
      }
      toast.success('Đang hiển thị tổng hợp tất cả các đợt khám');
      return;
    }

    const session = sList.find((s) => String(s.id) === String(sessionId));
    if (!session) return;

    // 1. Chỉ lấy chẩn đoán của đợt này
    const sessionDiags = session.diagnoses || [];
    setDiagnosesList(sessionDiags);

    // 2. Lấy kế hoạch điều trị của đợt này
    let matchedPlan = null;

    // Ưu tiên 1: Khớp theo examinationResultId trong pList
    if (pList && pList.length > 0) {
      matchedPlan = pList.find(
        (pl) => pl.examinationResultId && String(pl.examinationResultId) === String(session.id)
      );
    }

    // Ưu tiên 2: Gọi API backend lấy kế hoạch theo examinationResultId nếu trong pList chưa có
    if (!matchedPlan && session.id && session.id !== 'rec-1') {
      try {
        const fetchedPlan = await getTreatmentPlanByExaminationResultId(session.id);
        if (fetchedPlan && fetchedPlan.id) {
          matchedPlan = fetchedPlan;
          setPatientTreatmentPlans((prev) => {
            const exists = prev.some((p) => String(p.id) === String(fetchedPlan.id));
            return exists ? prev : [fetchedPlan, ...prev];
          });
        }
      } catch (err) {
        console.warn('Không tìm thấy kế hoạch điều trị theo examinationResultId:', err);
      }
    }

    if (matchedPlan) {
      handleSelectPlan(matchedPlan.id, pList);
      setHasPlanForActiveSession(true);
      toast.success(`Đã lấy ${sessionDiags.length} chẩn đoán & kế hoạch "${matchedPlan.planName}" của ${session.label}!`);
    } else {
      // Đợt khám này chưa có kế hoạch điều trị -> Giữ trạng thái trống để nha sĩ tự tạo mới
      handleSelectPlan('NEW', pList);
      setHasPlanForActiveSession(false);
    }
  }, [treatmentSessions, patientTreatmentPlans, handleSelectPlan]);

  // ================= HÀM LƯU TRỰC TIẾP KẾ HOẠCH ĐIỀU TRỊ XUỐNG CSDL =================
  const persistPlanChanges = async (customPhases = null, customPlanMeta = null) => {
    let targetPlanName = (customPlanMeta?.planName ?? planName)?.trim();
    if (!targetPlanName) {
      targetPlanName = `Kế hoạch điều trị - ${currentSession?.label || 'Đợt khám'}`;
      setPlanName(targetPlanName);
    }

    const targetPhases = customPhases !== null ? customPhases : phases;
    const targetStartDate = customPlanMeta?.startDate ?? startDate;
    const targetEndDate = customPlanMeta?.endDate ?? endDate;
    const targetDesc = customPlanMeta?.description ?? planDesc;
    const targetDentistName = customPlanMeta?.dentistName ?? dentistName;
    const targetPlanStatus = customPlanMeta?.status ?? planStatus;

    // Tính tổng tiền dịch vụ
    let computedTotalCost = 0;
    targetPhases.forEach((p) => {
      (p.treatment_services || []).forEach((s) => {
        computedTotalCost += (Number(s.price) || 0) * (Number(s.quantity) || 1);
      });
    });

    const payload = {
      patientId: patient?.id && patient.id !== 'pat-1' ? patient.id : null,
      examinationResultId:
        currentSession?.id && currentSession.id !== 'ALL' && !String(currentSession.id).startsWith('rec-')
          ? currentSession.id
          : null,
      dentistName: targetDentistName,
      dentistId: loggedInDentistId || null,
      planName: targetPlanName,
      description: targetDesc,
      estimatedCost: computedTotalCost,
      status: targetPlanStatus,
      startDate: targetStartDate,
      endDate: targetEndDate,
      phases: targetPhases.map((phase, pIdx) => ({
        phaseName: phase.phase_name,
        phaseOrder: String(phase.phase_order || pIdx + 1),
        treatmentType: phase.treatmentType || 'Tổng quát',
        description: phase.description || '',
        status: phase.status || 'PENDING',
        estimatedDuration: phase.estimated_duration || '1 tuần',
        treatmentServices: (phase.treatment_services || []).map((s) => ({
          serviceId: s.service_id && !String(s.service_id).startsWith('srv-') ? s.service_id : null,
          toothNumber: s.toothNumber || '',
          quantity: Number(s.quantity) || 1,
          price: Number(s.price) || 0,
          totalAmount: (Number(s.price) || 0) * (Number(s.quantity) || 1),
        })),
        treatmentVisits: (phase.treatment_visits || []).map((v, vIdx) => ({
          visitName: v.visitName,
          visitOrder: Number(v.visitOrder) || vIdx + 1,
          startDate: v.start_date,
          status: v.status || 'PENDING',
          clinicalNotes: v.clinical_notes || '',
          assignedDentist: v.assigned_dentist || targetDentistName,
        })),
      })),
    };

    const isUpdating = selectedPlanId && selectedPlanId !== 'NEW' && String(selectedPlanId).length > 10;
    const actionText = isUpdating ? 'Cập nhật' : 'Lưu';
    const toastId = toast.loading(`Đang ${actionText.toLowerCase()} kế hoạch điều trị vào hệ thống...`);

    try {
      let savedPlan;
      if (isUpdating) {
        savedPlan = await updateTreatmentPlan(selectedPlanId, payload);
      } else {
        savedPlan = await createTreatmentPlan(payload);
        if (savedPlan?.id) {
          setSelectedPlanId(savedPlan.id);
          setPlanId(savedPlan.id);
        }
      }
      setHasPlanForActiveSession(true);
      toast.success(`Đã ${actionText.toLowerCase()} kế hoạch "${targetPlanName}" thành công!`, {
        id: toastId,
        icon: '✅',
        duration: 2500,
      });
      if (patient?.id) {
        fetchPlansForPatient(patient.id);
      }
      return true;
    } catch (err) {
      console.error(`API backend treatment-plans error:`, err);
      toast.error(`Lỗi khi ${actionText.toLowerCase()} kế hoạch: ${err?.response?.data?.message || err.message}`, {
        id: toastId,
        duration: 4000,
      });
      return false;
    }
  };

  // Xử lý tạo kế hoạch điều trị mới từ Modal Lập Kế Hoạch & TỰ ĐỘNG LƯU TRỰC TIẾP
  const handleCreatePlanFromModal = async (newPlanData) => {
    setPlanId(`PLAN-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`);
    setPlanName(newPlanData.planName);
    if (newPlanData.dentistName) setDentistName(newPlanData.dentistName);
    if (newPlanData.startDate) setStartDate(newPlanData.startDate);
    if (newPlanData.endDate) setEndDate(newPlanData.endDate);
    setPlanDesc(newPlanData.description || '');
    setPlanStatus('IN_PROGRESS');
    setPhases(newPlanData.phases || []);
    setSelectedPlanId('NEW');
    setHasPlanForActiveSession(true);

    // Lưu trực tiếp xuống CSDL ngay lập tức!
    await persistPlanChanges(newPlanData.phases || [], newPlanData);
  };

  // Tải danh sách kết quả chẩn đoán từ hồ sơ bệnh án & đợt khám của bệnh nhân
  const fetchDiagnosesForPatient = useCallback(async (targetPatient, plansList = null) => {
    if (!targetPatient) {
      setDiagnosesList([]);
      setTreatmentSessions([]);
      return;
    }

    try {
      // 1. Tải hồ sơ bệnh án theo mã bệnh nhân hoặc ID
      let records = [];
      if (targetPatient.patientCode) {
        records = await getMedicalRecordsByPatientCode(targetPatient.patientCode).catch(() => []);
      }
      if ((!records || records.length === 0) && targetPatient.id && targetPatient.id !== 'pat-1') {
        records = await getMedicalRecordsByPatientId(targetPatient.id).catch(() => []);
      }

      const allRecords = Array.isArray(records) ? records : records?.data || records?.result || [];

      // 2. Lấy toàn bộ đợt khám (ExaminationResult) của các hồ sơ bệnh án
      let examResults = [];
      if (allRecords.length > 0) {
        const allExamsPromises = allRecords.map((r) =>
          getExaminationResultsByMedicalRecordId(r.id).catch(() => [])
        );
        const allExamsArrays = await Promise.all(allExamsPromises);
        examResults = allExamsArrays.flat().filter(Boolean);
      }

      const severityMap = {
        MILD: 'Nhẹ',
        MODERATE: 'Trung bình',
        SEVERE: 'Nặng',
      };

      // Xây dựng danh sách các đợt điều trị / đợt khám (Sessions)
      let sessions = [];
      if (examResults.length > 0) {
        // Sắp xếp ngày khám mới nhất lên đầu
        examResults.sort((a, b) => new Date(b.examinationDate || 0) - new Date(a.examinationDate || 0));

        const totalExams = examResults.length;
        sessions = examResults.map((exam, index) => {
          const dateObj = exam.examinationDate ? new Date(exam.examinationDate) : new Date();
          const dateDisplay = dateObj.toLocaleDateString('vi-VN');
          const isCurrent = index === 0;
          const orderNum = totalExams - index;
          const label = isCurrent ? `Đợt ${orderNum} (Mới nhất)` : `Đợt ${orderNum}`;

          const rawList =
            exam.diagnoses && exam.diagnoses.length > 0
              ? exam.diagnoses
              : exam.diagnosis
                ? [exam.diagnosis]
                : [];

          const examDiags = rawList.map((d, idx) => {
            const icdObj = ICD10_DIAGNOSES.find(
              (item) => item.code === d.primaryDiagnosis || item.label?.includes(d.primaryDiagnosis)
            );
            const toothPos = d.toothPosition
              ? typeof d.toothPosition === 'number'
                ? `Răng ${d.toothPosition}`
                : String(d.toothPosition)
              : 'Toàn hàm';

            return {
              id: d.id ? String(d.id) : `diag-${exam.id}-${idx}`,
              sessionId: String(exam.id),
              toothPosition: toothPos,
              primaryDiagnosis: d.primaryDiagnosis,
              label: icdObj ? icdObj.label : (d.primaryDiagnosis || 'Chẩn đoán lâm sàng'),
              severity: severityMap[d.level] || 'Trung bình',
              indication: icdObj ? icdObj.indication : 'Điều trị theo chỉ định bác sĩ',
              notes: d.diagnosticNotes || d.notes || exam.chiefComplaint || '',
            };
          });

          return {
            id: String(exam.id),
            examinationResultId: String(exam.id),
            medicalRecordId: exam.medicalRecordId,
            label,
            date: dateDisplay,
            recordDate: exam.examinationDate,
            chiefComplaint: exam.chiefComplaint || 'Thăm khám răng hàm mặt',
            diagnoses: examDiags,
          };
        });
      } else if (allRecords.length > 0) {
        sessions = allRecords.map((r, rIdx) => ({
          id: String(r.id),
          examinationResultId: String(r.id),
          label: `Hồ sơ ${allRecords.length - rIdx}`,
          date: r.recordDate ? new Date(r.recordDate).toLocaleDateString('vi-VN') : '',
          recordDate: r.recordDate,
          chiefComplaint: r.symptoms || 'Khám răng hàm mặt',
          diagnoses: r.diagnosis && r.diagnosis !== 'Thăm khám răng miệng' ? [{
            id: `rec-diag-${r.id || rIdx}`,
            sessionId: String(r.id),
            toothPosition: 'Toàn hàm',
            primaryDiagnosis: r.diagnosis,
            label: r.diagnosis,
            severity: 'Trung bình',
            indication: r.treatmentNotes || 'Điều trị theo chỉ định bác sĩ',
            notes: r.symptoms || '',
          }] : [],
        }));
      }

      setTreatmentSessions(sessions);

      // Tự động chọn đợt khám: nếu có passed examinationResultId từ navigation hoặc đợt mới nhất
      const passedExamId = stateData.examinationResultId;
      if (passedExamId && sessions.some((s) => String(s.id) === String(passedExamId))) {
        handleSelectTreatmentSession(String(passedExamId), sessions, plansList);
      } else if (sessions.length > 0) {
        handleSelectTreatmentSession(sessions[0].id, sessions, plansList);
      } else {
        setDiagnosesList([]);
        setSelectedSessionId('ALL');
      }
    } catch (err) {
      console.warn('Lỗi khi tải kết quả chẩn đoán của bệnh nhân:', err);
      setDiagnosesList([]);
      setTreatmentSessions([]);
    }
  }, [handleSelectTreatmentSession, stateData.examinationResultId]);

  // Chọn bệnh nhân từ selectbox hoặc kết quả tìm kiếm
  const handleSelectPatient = useCallback(async (selectedPatient) => {
    if (!selectedPatient) return;
    setMultiplePatientsModalOpen(false);

    let currentPatient = {
      id: selectedPatient.id || '',
      patientCode: selectedPatient.patientCode || 'PA-CHUA-CO-MA',
      fullName: selectedPatient.fullName || selectedPatient.patientName || 'Bệnh nhân',
      gender: selectedPatient.gender || 'FEMALE',
      dateOfBirth: selectedPatient.dateOfBirth || '',
      phone: selectedPatient.phone || selectedPatient.phoneNumber || '',
      allergies: selectedPatient.allergies || '',
      systemicDisease: selectedPatient.systemicDisease || '',
    };

    if (currentPatient.patientCode && (!currentPatient.fullName || currentPatient.fullName === 'Bệnh nhân')) {
      try {
        const fetched = await getPatientByPatientCode(currentPatient.patientCode);
        if (fetched) {
          currentPatient = {
            ...currentPatient,
            ...fetched,
            phone: fetched.phone || fetched.phoneNumber || currentPatient.phone,
          };
        }
      } catch { }
    }

    setPatient(currentPatient);
    setPhoneSearchQuery(currentPatient.phone || '');

    let plans = [];
    if (currentPatient.id) {
      plans = await fetchPlansForPatient(currentPatient.id);
    }
    await fetchDiagnosesForPatient(currentPatient, plans);
    toast.success(`Đã chọn bệnh nhân: ${currentPatient.fullName}`);
  }, [fetchPlansForPatient, fetchDiagnosesForPatient]);

  // Tìm kiếm bệnh nhân theo số điện thoại
  const handleSearchPatientByPhone = async (e) => {
    if (e) e.preventDefault();
    const query = (phoneSearchQuery || '').trim();
    if (!query) {
      toast.error('Vui lòng nhập số điện thoại cần tìm');
      return;
    }

    setSearchingPhone(true);
    try {
      let results = [];
      try {
        const apiRes = await getPatientsByPhone(query);
        results = Array.isArray(apiRes) ? apiRes : apiRes ? [apiRes] : [];
      } catch (err) {
        console.warn('API phone search fallback', err);
      }

      // Fallback tìm trong danh sách patientOptions nếu API trực tiếp không thấy
      if (results.length === 0 && patientOptions.length > 0) {
        const qDigits = query.replace(/\D/g, '');
        results = patientOptions.filter((p) => {
          const pPhone = (p.phone || p.phoneNumber || '').replace(/\D/g, '');
          return pPhone && qDigits && pPhone.includes(qDigits);
        });
      }

      if (results.length === 0) {
        toast.error(`Không tìm thấy hồ sơ bệnh nhân nào với SĐT "${query}"`);
      } else if (results.length === 1) {
        await handleSelectPatient(results[0]);
      } else {
        setFoundPatientsList(results);
        setMultiplePatientsModalOpen(true);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm bệnh nhân theo SĐT:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm bệnh nhân');
    } finally {
      setSearchingPhone(false);
    }
  };

  // Đóng hồ sơ bệnh nhân để tìm kiếm người khác
  const handleClearPatient = () => {
    setPatient(null);
    setPatientTreatmentPlans([]);
    setSelectedPlanId('NEW');
    setPlanName('');
    setPlanDesc('');
    setPhases([]);
    setDiagnosesList([]);
    setTreatmentSessions([]);
    setSelectedSessionId('ALL');
    setPhoneSearchQuery('');
    setFoundPatientsList([]);
    setMultiplePatientsModalOpen(false);
    toast.success('Đã đóng hồ sơ để tìm kiếm bệnh nhân khác');
  };

  // Tải danh sách bệnh nhân và dịch vụ từ backend
  useEffect(() => {
    setLoadingPatientOptions(true);
    getPatients()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || data?.result || [];
        if (Array.isArray(list) && list.length > 0) {
          setPatientOptions(list);
        }
      })
      .catch(() => { })
      .finally(() => setLoadingPatientOptions(false));

    // Nếu đã có thông tin bệnh nhân từ trước (ví dụ chuyển từ Khám bệnh sang)
    if (patient?.id && patient.id !== 'pat-1') {
      fetchPlansForPatient(patient.id).then((plans) => {
        fetchDiagnosesForPatient(patient, plans);
      });
    } else if (stateData.patient) {
      fetchDiagnosesForPatient(stateData.patient);
    }

    getDentists()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDentistsCatalog(data);
        }
      })
      .catch(() => { });

    getServices()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s) => ({
            service_id: s.id || `srv-${s.sortOrder}`,
            service_name: s.serviceName,
            category: s.category || 'KHAM_DIEU_TRI',
            unit: s.unit || 'Răng',
            price: Number(s.price) || 0,
            description: s.description || '',
          }));
          setServicesCatalog(mapped);
        }
      })
      .catch(() => { });
  }, []);

  // TÍNH TOÁN REALTIME `estimated_cost` TỪ `treatment_services` CỦA TẤT CẢ GIAI ĐOẠN
  const grossTotal = useMemo(() => {
    let total = 0;
    phases.forEach((ph) => {
      (ph.treatment_services || []).forEach((s) => {
        total += (Number(s.price) || 0) * (Number(s.quantity) || 1);
      });
    });
    return total;
  }, [phases]);

  const discountAmount = useMemo(() => {
    return Math.round((grossTotal * (discountPercent || 0)) / 100);
  }, [grossTotal, discountPercent]);

  const estimatedCost = useMemo(() => {
    return grossTotal - discountAmount;
  }, [grossTotal, discountAmount]);

  // Áp dụng Gói dịch vụ mẫu (Preset Package)
  const handleApplyPackage = (pkg) => {
    const newPhases = pkg.phases.map((p, idx) => ({
      phase_id: `ph-${Date.now()}-${idx}`,
      phase_order: idx + 1,
      phase_name: p.phase_name,
      treatmentType: p.treatmentType || 'Tổng quát',
      estimated_duration: p.estimated_duration || '1 tuần',
      status: p.status || 'PENDING',
      description: p.description || '',
      treatment_services: (p.treatment_services || []).map((s, sIdx) => ({
        treatmentServicesId: `ts-${Date.now()}-${idx}-${sIdx}`,
        service_id: s.service_id,
        service_name: s.service_name,
        toothNumber: s.toothNumber || 'Răng 46',
        quantity: s.quantity || 1,
        price: s.price || 0,
      })),
      treatment_visits: (p.treatment_visits || []).map((v, vIdx) => ({
        visitId: `vis-${Date.now()}-${idx}-${vIdx}`,
        visitName: v.visitName,
        visitOrder: v.visitOrder || vIdx + 1,
        start_date: v.start_date || new Date().toISOString().split('T')[0],
        status: v.status || 'PENDING',
        clinical_notes: v.clinical_notes || '',
      })),
    }));

    setPlanName(`Kế hoạch: ${pkg.package_name}`);
    setPlanDesc(pkg.description);
    setPhases(newPhases);
    toast.success(`Đã áp dụng "${pkg.package_name}"! Tự động khởi tạo giai đoạn, dịch vụ và buổi điều trị.`, {
      icon: '✨',
      duration: 3500,
    });
  };

  // ================= QUẢN LÝ GIAI ĐOẠN (Treatment Phase) =================
  const handleOpenAddPhase = () => {
    setPhaseModalMode('ADD');
    setCurrentPhaseData({
      phase_order: phases.length + 1,
      phase_name: `Giai đoạn ${phases.length + 1}: `,
      treatmentType: 'Nội nha & Nha chu',
      estimated_duration: '1-2 tuần',
      status: 'PENDING',
      description: '',
    });
    setShowPhaseModal(true);
  };

  const handleOpenEditPhase = (phase) => {
    setPhaseModalMode('EDIT');
    setCurrentPhaseData(phase);
    setShowPhaseModal(true);
  };

  const handleSavePhaseForm = async (phaseFormData) => {
    let updatedPhases = [];
    if (phaseModalMode === 'ADD') {
      const nextOrder = phases.length + 1;
      const newPhaseObj = {
        phase_id: `ph-${Date.now()}`,
        phase_order: nextOrder,
        phase_name: phaseFormData.phase_name,
        treatmentType: phaseFormData.treatmentType,
        estimated_duration: phaseFormData.estimated_duration,
        status: phaseFormData.status,
        description: phaseFormData.description || 'Giai đoạn điều trị can thiệp theo phác đồ bác sĩ.',
        treatment_services: [],
        treatment_visits: [],
      };
      const newList = [...phases, newPhaseObj];
      // Tự động đếm và gán thứ tự chuẩn 1..N liên tục
      updatedPhases = newList.map((ph, idx) => ({
        ...ph,
        phase_order: idx + 1,
      }));
    } else {
      updatedPhases = phases.map((ph) =>
        ph.phase_id === phaseFormData.phase_id
          ? {
            ...ph,
            phase_name: phaseFormData.phase_name,
            treatmentType: phaseFormData.treatmentType,
            estimated_duration: phaseFormData.estimated_duration,
            status: phaseFormData.status,
            description: phaseFormData.description,
          }
          : ph
      );
    }

    setPhases(updatedPhases);
    setShowPhaseModal(false);

    // Lưu trực tiếp vào CSDL
    await persistPlanChanges(updatedPhases);
  };

  const handleTogglePhaseStatus = async (phaseId, newStatus) => {
    const updatedPhases = phases.map((ph) =>
      ph.phase_id === phaseId ? { ...ph, status: newStatus } : ph
    );
    setPhases(updatedPhases);
    toast.success(`Đã chuyển trạng thái giai đoạn sang "${STATUS_PHASE_CONFIG[newStatus]?.label}"!`);
    await persistPlanChanges(updatedPhases);
  };

  const handleRemovePhase = async (phaseId) => {
    const remainingPhases = phases.filter((ph) => ph.phase_id !== phaseId);
    // Tự động đếm lại và giảm thứ tự phase_order 1..N liên tục
    const reindexedPhases = remainingPhases.map((ph, idx) => ({
      ...ph,
      phase_order: idx + 1,
    }));
    setPhases(reindexedPhases);
    toast.success('Đã xóa giai đoạn điều trị!');
    await persistPlanChanges(reindexedPhases);
  };

  // ================= QUẢN LÝ DỊCH VỤ ĐIỀU TRỊ (treatment_services) =================
  const handleOpenAddService = (phaseId) => {
    setTargetPhaseIdForService(phaseId);
    setShowAddServiceModal(true);
  };

  const handleAddServiceToPhase = async (phaseId, serviceItems) => {
    const itemsToAdd = Array.isArray(serviceItems) ? serviceItems : [serviceItems];
    const updatedPhases = phases.map((ph) => {
      if (ph.phase_id === phaseId) {
        return {
          ...ph,
          treatment_services: [...(ph.treatment_services || []), ...itemsToAdd],
        };
      }
      return ph;
    });
    setPhases(updatedPhases);
    await persistPlanChanges(updatedPhases);
  };

  const handleQuantityChange = async (phaseId, serviceId, newQty) => {
    const qtyNum = Math.max(1, Number(newQty) || 1);
    const updatedPhases = phases.map((ph) => {
      if (ph.phase_id === phaseId) {
        return {
          ...ph,
          treatment_services: ph.treatment_services.map((s) =>
            s.treatmentServicesId === serviceId ? { ...s, quantity: qtyNum } : s
          ),
        };
      }
      return ph;
    });
    setPhases(updatedPhases);
    await persistPlanChanges(updatedPhases);
  };

  const handleToothNumberChange = async (phaseId, serviceId, newTooth) => {
    const updatedPhases = phases.map((ph) => {
      if (ph.phase_id === phaseId) {
        return {
          ...ph,
          treatment_services: ph.treatment_services.map((s) =>
            s.treatmentServicesId === serviceId ? { ...s, toothNumber: newTooth } : s
          ),
        };
      }
      return ph;
    });
    setPhases(updatedPhases);
    await persistPlanChanges(updatedPhases);
  };

  const handleRemoveService = async (phaseId, serviceId) => {
    const updatedPhases = phases.map((ph) => {
      if (ph.phase_id === phaseId) {
        return {
          ...ph,
          treatment_services: ph.treatment_services.filter(
            (s) => s.treatmentServicesId !== serviceId
          ),
        };
      }
      return ph;
    });
    setPhases(updatedPhases);
    toast.success('Đã xóa dịch vụ khỏi giai đoạn!');
    await persistPlanChanges(updatedPhases);
  };

  // ================= QUẢN LÝ BUỔI ĐIỀU TRỊ (TreatmentVisits - Chỉ ghi chép việc làm) =================
  const handleOpenAddVisit = (phase) => {
    setVisitModalMode('ADD');
    setTargetPhaseIdForVisit(phase.phase_id);
    const nextOrder = (phase.treatment_visits?.length || 0) + 1;
    const currentDoctor = loggedInDoctorName || dentistName || '';
    setCurrentVisitData({
      visitOrder: nextOrder,
      visitName: `Buổi ${nextOrder}: `,
      start_date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      clinical_notes: '',
      assigned_dentist: currentDoctor,
    });
    setShowVisitModal(true);
  };

  const handleOpenEditVisit = (phaseId, visit) => {
    setVisitModalMode('EDIT');
    setTargetPhaseIdForVisit(phaseId);
    setCurrentVisitData(visit);
    setShowVisitModal(true);
  };

  const handleSaveVisit = async (phaseId, visitObj, mode) => {
    let updatedPhases = [];
    if (mode === 'ADD') {
      updatedPhases = phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          const currentVisitsList = ph.treatment_visits || [];
          const nextOrder = currentVisitsList.length + 1;
          const newVisitWithOrder = {
            ...visitObj,
            visitOrder: nextOrder,
          };
          const newList = [...currentVisitsList, newVisitWithOrder];
          // Tự động đếm và gán thứ tự chuẩn 1..N
          const reindexedList = newList.map((v, idx) => ({
            ...v,
            visitOrder: idx + 1,
          }));
          return {
            ...ph,
            treatment_visits: reindexedList,
          };
        }
        return ph;
      });
    } else {
      updatedPhases = phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            treatment_visits: ph.treatment_visits.map((v) =>
              v.visitId === visitObj.visitId ? visitObj : v
            ),
          };
        }
        return ph;
      });
    }
    setPhases(updatedPhases);
    setShowVisitModal(false);
    await persistPlanChanges(updatedPhases);
  };

  const handleToggleVisitStatus = async (phaseId, visitId, newStatus) => {
    const updatedPhases = phases.map((ph) => {
      if (ph.phase_id === phaseId) {
        return {
          ...ph,
          treatment_visits: ph.treatment_visits.map((v) =>
            v.visitId === visitId ? { ...v, status: newStatus } : v
          ),
        };
      }
      return ph;
    });
    setPhases(updatedPhases);
    toast.success(`Đã chuyển trạng thái buổi sang "${STATUS_PHASE_CONFIG[newStatus]?.label}"!`);
    await persistPlanChanges(updatedPhases);
  };

  const handleRemoveVisit = async (phaseId, visitId) => {
    const updatedPhases = phases.map((ph) => {
      if (ph.phase_id === phaseId) {
        const remainingVisits = (ph.treatment_visits || []).filter((v) => v.visitId !== visitId);
        // Tự động đếm lại và giảm thứ tự visitOrder theo số buổi còn lại
        const reindexedVisits = remainingVisits.map((v, idx) => ({
          ...v,
          visitOrder: idx + 1,
        }));
        return {
          ...ph,
          treatment_visits: reindexedVisits,
        };
      }
      return ph;
    });
    setPhases(updatedPhases);
    toast.success('Đã xóa buổi điều trị!');
    await persistPlanChanges(updatedPhases);
  };

  // LƯU KẾ HOẠCH ĐIỀU TRỊ THỦ CÔNG (NÚT LƯU TRÊN THANH HEADER)
  const handleSavePlan = async () => {
    await persistPlanChanges();
  };

  return (
    <div className="mx-auto max-w-[1600px] px-2 sm:px-4 space-y-4 py-3 text-slate-800">
      {/* ================= 1. HEADER TOOLBAR ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Quay lại Khám bệnh"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="text-teal-700" size={22} />
                Lập Kế Hoạch & Các Giai Đoạn Điều Trị
              </h1>

            </div>

          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={15} className="text-slate-600" />
            <span>In phác đồ</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleSavePlan}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <Save size={15} />
            <span>Lưu kế hoạch điều trị</span>
          </motion.button>
        </div>
      </div>

      {/* ================= 1. BẢNG ĐIỀU HÀNH TỔNG THỂ PHÁC ĐỒ & KẾ HOẠCH ĐIỀU TRỊ (UNIFIED MASTER ERP CARD) ================= */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* TẦNG 1: TOOLBAR TÌM KIẾM & CHỌN BỆNH NHÂN THEO SỐ ĐIỆN THOẠI */}
        <PatientSearchBar
          patientOptions={patientOptions}
          loadingPatientOptions={loadingPatientOptions}
          selectedPatient={patient}
          onSelectPatient={handleSelectPatient}
          onClearPatient={handleClearPatient}
          phoneSearchQuery={phoneSearchQuery}
          setPhoneSearchQuery={setPhoneSearchQuery}
          onSearchPhone={handleSearchPatientByPhone}
          searchingPhone={searchingPhone}
          hasPatient={hasPatient}
          selectLabel="Chọn nhanh bệnh nhân theo Số điện thoại:"
          inputLabel="Hoặc nhập số điện thoại cần tìm:"
        />

        {/* NỘI DUNG MASTER: TÙY THEO TÌNH TRẠNG BỆNH NHÂN */}
        {!hasPatient ? (
          <div className="p-5">
            <NoPatientAlert />
          </div>
        ) : treatmentSessions.length === 0 ? (
          <div className="divide-y divide-slate-100">
            {/* Thông tin BN */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-2xs border-2 border-teal-200">
                    {getInitials(patient.fullName)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 truncate">{patient.fullName}</h2>
                    <span className="rounded bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2 py-0.5">
                      {patient.patientCode}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium">
                    {patient.gender === 'FEMALE' ? '♀ Nữ' : '♂ Nam'}
                    {patient.dateOfBirth ? ` · ${formatDateDisplay(patient.dateOfBirth)}` : ''}
                    {patient.phone ? ` · SĐT: ${patient.phone}` : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-slate-50/50">
              <NoExaminationAlert patient={patient} />
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* TẦNG 2: THÔNG TIN BỆNH NHÂN & ĐỢT KHÁM */}
            <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Bệnh nhân Entity */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-2xs border-2 border-teal-200">
                    {getInitials(patient.fullName)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="space-y-0.5 text-xs min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 truncate">{patient.fullName}</h2>
                    <span className="rounded bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-extrabold px-2 py-0.5">
                      {patient.patientCode}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {patient.gender === 'FEMALE' ? '♀ Nữ' : '♂ Nam'}
                      {patient.dateOfBirth ? ` · ${formatDateDisplay(patient.dateOfBirth)}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 flex-wrap text-[11px]">
                    <span className="flex items-center gap-1 font-medium">
                      <Phone size={11} className="text-slate-400" />
                      <span>{patient.phone || 'Chưa có SĐT'}</span>
                    </span>
                    {patient.allergies ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 font-bold">
                        <AlertCircle size={11} className="text-rose-600" />
                        Dị ứng: {patient.allergies}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">Không dị ứng thuốc</span>
                    )}
                    {patient.systemicDisease && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 font-bold">
                        <Activity size={11} className="text-amber-600" />
                        Bệnh nền: {patient.systemicDisease}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bộ chọn Đợt khám (Treatment Session Selector) */}
              <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                  <CalendarCheck size={14} className="text-teal-700" />
                  <span>Đợt khám:</span>
                </span>
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSelectTreatmentSession(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-teal-600 outline-none cursor-pointer"
                >
                  <option value="ALL">-- Tất cả các đợt ({treatmentSessions.length} đợt) --</option>
                  {treatmentSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} — {s.date || 'Chưa rõ ngày'} ({s.diagnoses?.length || 0} chẩn đoán)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TẦNG 2.5: KẾT QUẢ CHẨN ĐOÁN LÂM SÀNG CỦA ĐỢT KHÁM */}
            <div className="px-4 py-3 bg-slate-50/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100 text-teal-800">
                    <Stethoscope size={13} />
                  </div>
                  <span className="font-extrabold text-teal-900 text-xs uppercase tracking-wide">
                    Chẩn đoán lâm sàng theo răng ({diagnosesList.length}):
                  </span>
                </div>

                <span className="rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-extrabold text-[11px] px-2.5 py-0.5 shrink-0">
                  {currentSession ? currentSession.label : `Tất cả đợt`} · {diagnosesList.length} chẩn đoán xác định
                </span>
              </div>

              {/* Danh sách thẻ chẩn đoán */}
              {diagnosesList.length === 0 ? (
                <div className="text-center py-3 text-slate-400 italic text-xs bg-white rounded-lg border border-dashed border-slate-200">
                  {currentSession
                    ? `Đợt khám này (${currentSession.label}) chưa có kết quả chẩn đoán nào được ghi nhận.`
                    : 'Chưa có kết quả chẩn đoán nào được ghi nhận từ đợt khám.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {diagnosesList.map((diag, index) => (
                    <div
                      key={diag.id || index}
                      className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50/50 p-2 flex items-center gap-2 shadow-2xs hover:border-teal-400 transition-all min-w-0"
                    >
                      <span className="rounded bg-amber-500 text-white font-extrabold text-[10.5px] px-2 py-0.5 shadow-2xs shrink-0 tracking-wide">
                        {diag.toothPosition || 'R--'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span
                          className="font-bold text-slate-900 text-xs block truncate leading-snug"
                          title={diag.label || diag.primaryDiagnosis}
                        >
                          {diag.label || diag.primaryDiagnosis}
                        </span>
                        {diag.secondaryDiagnosis && (
                          <span
                            className="text-[10px] text-slate-500 block truncate mt-0.5 font-normal"
                            title={diag.secondaryDiagnosis}
                          >
                            {diag.secondaryDiagnosis}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TẦNG 3: THÔNG TIN PHÁC ĐỒ HOẶC CẢNH BÁO */}
            {diagnosesList.length === 0 ? (
              <div className="p-4 bg-white">
                <NoDiagnosisAlert patient={patient} session={currentSession} />
              </div>
            ) : !hasPlanForActiveSession ? (
              <div className="p-4 bg-white">
                <NoPlanForSessionAlert
                  session={currentSession}
                  diagnosesCount={diagnosesList.length}
                  onOpenCreatePlan={() => setShowCreatePlanModal(true)}
                />
              </div>
            ) : (
              /* TẦNG 3: THÔNG TIN THỰC THỂ KẾ HOẠCH ĐIỀU TRỊ */
              <div className="p-4 space-y-3 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-2xs">
                      <FileText size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Thông Tin Phác Đồ & Kế Hoạch Điều Trị
                      </h3>
                    </div>
                  </div>

                  {/* Bộ nút trạng thái kế hoạch (Không dùng select box) */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                      {[
                        { value: 'PENDING', label: 'Chờ duyệt', active: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' },
                        { value: 'IN_PROGRESS', label: 'Đang thực hiện', active: 'bg-teal-700 text-white border-teal-700 font-bold' },
                        { value: 'COMPLETED', label: 'Đã hoàn tất', active: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' },
                      ].map((st) => (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setPlanStatus(st.value)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer ${planStatus === st.value
                            ? `${st.active} shadow-2xs`
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white'
                            }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form thông tin chi tiết */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
                  {/* Tên kế hoạch */}
                  <div className="lg:col-span-5 space-y-1">
                    <label className="block font-bold text-slate-700">
                      Tên kế hoạch điều trị <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="VD: Điều trị nội nha & Phục hình răng sứ toàn hàm..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-900 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Bác sĩ phụ trách */}
                  <div className="lg:col-span-3 space-y-1">
                    <label className="block font-bold text-slate-700 flex items-center gap-1">
                      <User size={12} className="text-teal-700" />
                      <span>Bác sĩ phụ trách</span>
                    </label>
                    <input
                      type="text"
                      value={dentistName}
                      onChange={(e) => setDentistName(e.target.value)}
                      placeholder="Họ tên bác sĩ phụ trách"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-800 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Ngày bắt đầu */}
                  <div className="lg:col-span-2 space-y-1">
                    <label className="block font-bold text-slate-700 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-500" />
                      <span>Bắt đầu</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-semibold text-slate-800 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Dự kiến kết thúc */}
                  <div className="lg:col-span-2 space-y-1">
                    <label className="block font-bold text-slate-700 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-500" />
                      <span>Dự kiến kết thúc</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 font-semibold text-slate-800 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Ghi chú mô tả mục tiêu */}
                  <div className="lg:col-span-12 space-y-1 pt-1">
                    <label className="block font-semibold text-slate-600">
                      Mục tiêu lâm sàng & Hướng tiếp cận phác đồ:
                    </label>
                    <input
                      type="text"
                      value={planDesc}
                      onChange={(e) => setPlanDesc(e.target.value)}
                      placeholder="Mục tiêu điều trị, yêu cầu chức năng ăn nhai, thẩm mỹ và lưu ý đặc biệt..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= 2. CÁC GIAI ĐOẠN ĐIỀU TRỊ (CHỈ HIỂN THỊ KHI CÓ KẾ HOẠCH HỢP LỆ) ================= */}
      {hasPatient && treatmentSessions.length > 0 && diagnosesList.length > 0 && hasPlanForActiveSession && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-2xs">
                <Layers size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Các Giai Đoạn Điều Trị
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">
                Tổng số: <strong className="text-teal-800">{phases.length} giai đoạn</strong>
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleOpenAddPhase}
                className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-50 cursor-pointer shadow-2xs"
              >
                <Plus size={14} />
                <span>+ Thêm giai đoạn mới</span>
              </motion.button>
            </div>
          </div>

          {/* BỐ CỤC 2 CỘT: TRÁI LÀ VERTICAL STEPPER SCROLL-SPY, PHẢI LÀ CHI TIẾT GIAI ĐOẠN */}
          {phases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-teal-300 bg-white p-8 text-center space-y-3 shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 mx-auto">
                <Layers size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Kế hoạch điều trị mới chưa có giai đoạn nào!</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Bạn có thể bấm <strong>"+ Thêm giai đoạn mới"</strong> để tự thiết lập giai đoạn và chỉ định dịch vụ, hoặc chọn một <strong>Gói phác đồ gợi ý</strong> ở trên theo kết quả khám lâm sàng.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleOpenAddPhase}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Thêm giai đoạn đầu tiên</span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-start gap-5">
              {/* ================= CỘT TRÁI: TIẾN TRÌNH ĐIỀU TRỊ (VERTICAL STEPPER & SCROLL SPY) ================= */}
              <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-4 space-y-3.5">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  {/* Header Tiến độ */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-2xs">
                        <Activity size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Tiến Trình Phác Đồ
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {phasesCompletedCount}/{phases.length} giai đoạn hoàn tất
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      {phasesProgressPercent}%
                    </span>
                  </div>

                  {/* Progress bar ngang tổng thể */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-linear-to-r from-teal-600 to-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${phasesProgressPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-400 italic">
                      Nhấp vào giai đoạn để cuộn nhanh đến vị trí điều trị
                    </p>
                  </div>

                  {/* Trục Stepper theo chiều dọc (Vertical Timeline) */}
                  <div className="pt-2 space-y-1">
                    {phases.map((phase, idx) => {
                      const isCompleted = phase.status === 'COMPLETED';
                      const isInProgress = phase.status === 'IN_PROGRESS';
                      const isActive = activePhaseId === String(phase.phase_id);
                      const isLast = idx === phases.length - 1;

                      return (
                        <div key={phase.phase_id} className="relative flex items-start gap-2.5 group">
                          {/* Cột trục dọc và Node */}
                          <div className="flex flex-col items-center">
                            {/* Node biểu tượng */}
                            <button
                              type="button"
                              onClick={() => scrollToPhase(phase.phase_id)}
                              className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-[11px] shrink-0 cursor-pointer transition-all ${isCompleted
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : isInProgress
                                  ? 'bg-teal-700 text-white ring-4 ring-teal-100 shadow-xs animate-pulse'
                                  : 'bg-white border-2 border-slate-300 text-slate-500 group-hover:border-teal-400'
                                } ${isActive ? 'scale-110 shadow-md ring-2 ring-teal-500' : ''}`}
                              title={`Nhấp để cuộn tới: ${phase.phase_name}`}
                            >
                              {isCompleted ? <Check size={13} /> : phase.phase_order}
                            </button>

                            {/* Trục dọc nối xuống phase kế tiếp: Nếu hoàn thành thì chạy đầy màu xanh! */}
                            {!isLast && (
                              <div className="relative w-1 my-1 min-h-[38px] bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`absolute inset-x-0 top-0 transition-all duration-500 ${isCompleted
                                    ? 'h-full bg-emerald-500'
                                    : isInProgress
                                      ? 'h-1/2 bg-linear-to-b from-teal-600 to-transparent'
                                      : 'h-0'
                                    }`}
                                />
                              </div>
                            )}
                          </div>

                          {/* Thẻ thông tin bước giai đoạn */}
                          <div
                            onClick={() => scrollToPhase(phase.phase_id)}
                            className={`flex-1 p-2 rounded-lg cursor-pointer transition-all text-xs mb-1.5 ${isActive
                              ? 'bg-teal-50/90 border border-teal-300 shadow-2xs'
                              : 'hover:bg-slate-50 border border-transparent'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-bold line-clamp-1 ${isActive ? 'text-teal-900' : 'text-slate-800'}`}>
                                {phase.phase_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isInProgress
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                {isCompleted ? '✓ Hoàn thành' : isInProgress ? '⚡ Đang làm' : '⏳ Chờ'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {phase.treatment_services?.length || 0} DV · {phase.treatment_visits?.length || 0} buổi
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ================= CỘT PHẢI: CHI TIẾT CÁC GIAI ĐOẠN & TỔNG HỢP TÀI CHÍNH ================= */}
              <div className="flex-1 min-w-0 space-y-5 w-full">
                <AnimatePresence mode="popLayout">
                  {phases.map((phase) => {
                    const phaseServices = phase.treatment_services || [];
                    const phaseVisits = phase.treatment_visits || [];

                    // Tổng tiền dịch vụ của giai đoạn
                    const phaseServicesTotal = phaseServices.reduce(
                      (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 1),
                      0
                    );

                    const statusCfg = STATUS_PHASE_CONFIG[phase.status] || STATUS_PHASE_CONFIG.PENDING;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25 }}
                        key={phase.phase_id}
                        id={`phase-card-${phase.phase_id}`}
                        data-phase-id={phase.phase_id}
                        onDoubleClick={() => handleOpenPhaseDetail(phase)}
                        className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4 hover:border-teal-300 transition-all cursor-pointer select-none"
                        title="Nhấp đúp chuột vào thẻ để mở không gian điều trị lâm sàng toàn màn hình"
                      >
                        {/* HEADER GIAI ĐOẠN (`TreatmentPhase`) - 2 TẦNG CHUẨN ERP, KHÔNG BỊ CHEN CHÚC */}
                        <div className="pb-3.5 border-b border-slate-200/90 space-y-2.5">
                          {/* HÀNG 1: SỐ THỨ TỰ + TÊN GIAI ĐOẠN (TRÁI) & CỤM NÚT HÀNH ĐỘNG (PHẢI) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl font-black text-sm shadow-xs shrink-0 transition-transform ${phase.status === 'COMPLETED'
                                  ? 'bg-emerald-600 text-white'
                                  : phase.status === 'IN_PROGRESS'
                                    ? 'bg-teal-700 text-white ring-4 ring-teal-100'
                                    : 'bg-slate-700 text-white'
                                  }`}
                              >
                                {phase.status === 'COMPLETED' ? <Check size={16} /> : phase.phase_order}
                              </div>

                              <div className="min-w-0">
                                <h4
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPhaseDetail(phase);
                                  }}
                                  className="text-base font-bold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors truncate"
                                  title="Nhấp đúp chuột để mở không gian điều trị lâm sàng toàn màn hình"
                                >
                                  {phase.phase_name}
                                </h4>
                              </div>
                            </div>

                            {/* Cụm nút hành động bên phải - Thoáng đãng, không bị dồn ép */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              {/* Nút Vào điều trị CTA */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPhaseDetail(phase);
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                title="Mở không gian điều trị lâm sàng toàn màn hình: cập nhật trạng thái, tạo buổi khám và ghi kết quả"
                              >
                                <Stethoscope size={13} />
                                <span>Vào điều trị</span>
                              </motion.button>

                              {/* Nút Thêm dịch vụ */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAddService(phase.phase_id);
                                }}
                                className="flex items-center gap-1 rounded-lg border border-teal-200 bg-white hover:bg-teal-50 text-teal-800 px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                title="Chỉ định dịch vụ nha khoa vào giai đoạn"
                              >
                                <Plus size={13} />
                                <span>+ Thêm dịch vụ</span>
                              </motion.button>

                              {/* Nút Sửa */}
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditPhase(phase);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Chỉnh sửa giai đoạn"
                              >
                                <Edit3 size={15} />
                              </motion.button>

                              {/* Nút Xóa */}
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePhase(phase.phase_id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Xóa giai đoạn"
                              >
                                <Trash2 size={15} />
                              </motion.button>
                            </div>
                          </div>

                          {/* HÀNG 2: SUB-BAR THUỘC TÍNH LÂM SÀNG CỦA GIAI ĐOẠN */}
                          <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                            {/* Treatment Type badge */}
                            <span className="rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-bold px-2.5 py-0.5 shadow-2xs">
                              {phase.treatmentType || 'Tổng quát'}
                            </span>

                            {/* Estimated Duration */}
                            {phase.estimated_duration && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 shadow-2xs">
                                <Clock4 size={12} className="text-slate-500" />
                                {phase.estimated_duration}
                              </span>
                            )}

                            {/* Status Phase Badge */}
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold border shadow-2xs ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                              <span>{statusCfg.label}</span>
                            </span>

                            {/* Thống kê số lượng */}
                            <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                            <span className="text-xs font-medium text-slate-500">
                              {phaseServices.length} dịch vụ · {phaseVisits.length} buổi điều trị
                            </span>
                          </div>
                        </div>

                        {/* PHẦN 1: BẢNG DỊCH VỤ NHA KHOA CHỈ ĐỊNH (`treatment_services`) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Tag size={13} className="text-teal-600" />
                              <span>1. Danh mục dịch vụ nha khoa chỉ định:</span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                ({phaseServices.length} dịch vụ)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddService(phase.phase_id);
                              }}
                              className="text-teal-700 hover:text-teal-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Thêm dịch vụ</span>
                            </button>
                          </div>
                          {phaseServices.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs text-slate-400">
                              Chưa có dịch vụ nào được chỉ định trong giai đoạn này.
                            </div>
                          ) : (
                            <div className="rounded-lg border border-slate-200 overflow-hidden text-xs shadow-2xs bg-white">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                                    <th className="p-2.5 text-center w-10">STT</th>
                                    <th className="p-2.5 text-center w-32">Vị trí răng</th>
                                    <th className="p-2.5 min-w-[220px]">Dịch vụ nha khoa</th>
                                    <th className="p-2.5 text-center w-28">Số lượng</th>
                                    <th className="p-2.5 text-right w-32">Đơn giá</th>
                                    <th className="p-2.5 text-right w-36">Thành tiền</th>
                                    <th className="p-2.5 text-center w-14">Xóa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {phaseServices.map((srv, sIndex) => {
                                    const itemTotal = (Number(srv.price) || 0) * (Number(srv.quantity) || 1);
                                    return (
                                      <tr key={srv.treatmentServicesId || sIndex} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-2.5 text-center font-bold text-slate-400">{sIndex + 1}</td>
                                        <td className="p-2.5 text-center">
                                          <input
                                            type="text"
                                            value={srv.toothNumber || ''}
                                            onChange={(e) =>
                                              handleToothNumberChange(phase.phase_id, srv.treatmentServicesId, e.target.value)
                                            }
                                            className="w-28 text-center rounded border border-amber-200 bg-amber-50 px-1.5 py-1 font-extrabold text-amber-900 text-xs outline-none focus:border-amber-400"
                                          />
                                        </td>
                                        <td className="p-2.5 font-bold text-slate-900">{srv.service_name || srv.serviceName}</td>
                                        <td className="p-2.5 text-center">
                                          <div className="inline-flex items-center border border-slate-300 rounded overflow-hidden bg-white shadow-2xs">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuantityChange(
                                                  phase.phase_id,
                                                  srv.treatmentServicesId,
                                                  (srv.quantity || 1) - 1
                                                );
                                              }}
                                              className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-bold cursor-pointer"
                                            >
                                              -
                                            </button>
                                            <input
                                              type="number"
                                              min={1}
                                              value={srv.quantity || 1}
                                              onChange={(e) =>
                                                handleQuantityChange(phase.phase_id, srv.treatmentServicesId, e.target.value)
                                              }
                                              className="w-10 text-center font-extrabold text-slate-800 text-xs outline-none py-0.5"
                                            />
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuantityChange(
                                                  phase.phase_id,
                                                  srv.treatmentServicesId,
                                                  (srv.quantity || 1) + 1
                                                );
                                              }}
                                              className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-bold cursor-pointer"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </td>
                                        <td className="p-2.5 text-right font-medium text-slate-600">
                                          {Number(srv.price || 0).toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="p-2.5 text-right font-extrabold text-teal-800 text-xs">
                                          {itemTotal.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="p-2.5 text-center">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveService(phase.phase_id, srv.treatmentServicesId);
                                            }}
                                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                            title="Xóa dịch vụ"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-50/80 font-bold border-t border-slate-200 text-[11px]">
                                    <td colSpan={5} className="p-2.5 text-right text-slate-600">
                                      Tổng chi phí dịch vụ Giai đoạn {phase.phase_order}:
                                    </td>
                                    <td className="p-2.5 text-right text-teal-900 font-extrabold text-xs">
                                      {phaseServicesTotal.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td />
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* PHẦN 2: CÁC BUỔI ĐIỀU TRỊ (`TreatmentVisits`) */}
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                              <CalendarCheck size={14} className="text-indigo-600" />
                              <span>2. Lộ trình các buổi điều trị lâm sàng:</span>
                            </div>
                          </div>
                          {phaseVisits.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 p-3.5 text-center text-xs text-indigo-600">
                              Chưa có buổi điều trị nào được lên lịch cho giai đoạn này.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <AnimatePresence mode="popLayout">
                                {phaseVisits.map((visit) => {
                                  const vStatusCfg = STATUS_PHASE_CONFIG[visit.status] || STATUS_PHASE_CONFIG.PENDING;
                                  const isExpanded = !!expandedVisitIds[visit.visitId];
                                  return (
                                    <motion.div
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.96 }}
                                      transition={{ duration: 0.2 }}
                                      key={visit.visitId}
                                      className="rounded-xl border border-slate-200 bg-linear-to-r from-slate-50/80 to-indigo-50/20 p-3.5 shadow-2xs space-y-2.5 hover:border-indigo-300 transition-all"
                                    >
                                      <div
                                        onClick={() => toggleVisitExpand(visit.visitId)}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 cursor-pointer select-none"
                                        title="Nhấp để xem hoặc thu gọn nội dung chi tiết buổi điều trị"
                                      >
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-white font-extrabold text-[11px] shadow-2xs shrink-0">
                                            {visit.visitOrder}
                                          </span>
                                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{visit.visitName}</h5>
                                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                                            <Calendar size={12} className="text-slate-400" />
                                            <span>Ngày: {visit.start_date || 'Chưa đặt'}</span>
                                          </span>
                                          <span
                                            className={`rounded-full px-3 py-0.5 text-xs font-bold border shadow-2xs ${vStatusCfg.bg} ${vStatusCfg.text} ${vStatusCfg.border}`}
                                          >
                                            {vStatusCfg.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 flex-wrap">
                                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                                            <User size={12} className="text-indigo-600 shrink-0" />
                                            <span>
                                              Bác sĩ: <strong className="text-slate-800 font-semibold">{visit.assigned_dentist || loggedInDoctorName || dentistName || 'Chưa phân công'}</strong>
                                            </span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleVisitExpand(visit.visitId);
                                            }}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-2xs"
                                          >
                                            <span>{isExpanded ? 'Thu gọn' : 'Xem nội dung'}</span>
                                            <ChevronDown
                                              size={13}
                                              className={`transition-transform duration-200 text-indigo-600 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                          </button>
                                        </div>
                                      </div>

                                      <AnimatePresence initial={false}>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="bg-white rounded-lg border border-slate-200 p-2.5 text-xs space-y-1 shadow-2xs mt-1">
                                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-800 uppercase tracking-wide">
                                                <Stethoscope size={13} className="text-teal-600" />
                                                <span>Nội dung thực hiện trong buổi điều trị:</span>
                                              </div>
                                              <p className="text-slate-700 leading-relaxed pl-5 whitespace-pre-wrap font-normal">
                                                {visit.clinical_notes || (
                                                  <span className="text-slate-400 italic">
                                                    Chưa ghi nhận nội dung thao tác. Nhấp "Vào điều trị" ở đầu giai đoạn để bổ sung ghi chú và cập nhật kết quả.
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* ================= 6. TỔNG HỢP TÀI CHÍNH (`estimated_cost : Double`) ================= */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calculator size={18} className="text-teal-700" />
                        Tổng Hợp Chi Phí Dự Kiến Toàn Kế Hoạch
                      </h4>
                      <p className="text-xs text-slate-500">
                        Chi phí tổng hợp realtime từ tất cả các dịch vụ nha khoa chỉ định trong từng giai đoạn điều trị.
                      </p>
                    </div>

                    <div className="flex flex-nowrap items-center gap-3 sm:gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 overflow-x-auto">
                      <div className="shrink-0 whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Ưu đãi / Giảm giá (%)</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(Math.max(0, Number(e.target.value) || 0))}
                            className="w-12 rounded-md border border-slate-300 px-1.5 py-0.5 text-center font-bold text-xs outline-none focus:border-teal-600"
                          />
                          <span className="text-xs font-bold text-slate-600">%</span>
                          <span className="text-xs font-semibold text-rose-600 ml-1">
                            (-{discountAmount.toLocaleString('vi-VN')} đ)
                          </span>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-slate-200 shrink-0" />

                      <div className="shrink-0 whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Tổng tiền dịch vụ gốc</span>
                        <span className="text-sm font-bold text-slate-700">
                          {grossTotal.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="h-8 w-px bg-slate-200 shrink-0" />

                      <div className="shrink-0 whitespace-nowrap">
                        <span className="text-[10px] text-teal-700 font-bold uppercase block">
                          Tổng chi phí dự kiến
                        </span>
                        <span className="text-lg font-extrabold text-teal-800">
                          {estimatedCost.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: LẬP KẾ HOẠCH ĐIỀU TRỊ (SEPARATE COMPONENT) ================= */}
      <CreatePlanModal
        isOpen={showCreatePlanModal}
        onClose={() => setShowCreatePlanModal(false)}
        session={currentSession}
        patient={patient}
        dentistName={dentistName}
        suggestedPackages={PRESET_PACKAGES}
        onSubmit={handleCreatePlanFromModal}
      />

      {/* ================= MODAL 1: THÊM / SỬA GIAI ĐOẠN ĐIỀU TRỊ (SEPARATE COMPONENT) ================= */}
      <PhaseModal
        isOpen={showPhaseModal}
        onClose={() => setShowPhaseModal(false)}
        mode={phaseModalMode}
        initialData={currentPhaseData}
        onSavePhase={handleSavePhaseForm}
      />

      {/* ================= MODAL: KHÔNG GIAN ĐIỀU TRỊ LÂM SÀNG TOÀN MÀN HÌNH CHUẨN ERP (SEPARATE COMPONENT) ================= */}
      <PhaseDetailModal
        isOpen={showPhaseDetailModal}
        onClose={() => setShowPhaseDetailModal(false)}
        phase={selectedDetailPhase}
        allPhases={phases}
        patient={patient}
        planInfo={{
          planId,
          planName,
          dentistName,
          startDate,
          endDate,
          planStatus,
          planDesc,
          estimatedCost,
          grossTotal,
          discountPercent,
        }}
        loggedInDoctorName={loggedInDoctorName || dentistName}
        onUpdatePhaseStatus={handleTogglePhaseStatus}
        onSaveVisit={handleSaveVisit}
        onToggleVisitStatus={handleToggleVisitStatus}
        onRemoveVisit={handleRemoveVisit}
      />

      {/* ================= MODAL 2: CHỈ ĐỊNH DỊCH VỤ VÀO GIAI ĐOẠN (`treatment_services`) ================= */}
      <AddServiceModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        targetPhaseId={targetPhaseIdForService}
        servicesCatalog={servicesCatalog}
        diagnosesList={diagnosesList}
        onAddService={handleAddServiceToPhase}
      />

      {/* ================= MODAL 3: THÊM / SỬA BUỔI ĐIỀU TRỊ (`TreatmentVisits` - RỘNG RÃI, THOÁNG ĐÃNG) ================= */}
      <TreatmentVisitModal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        mode={visitModalMode}
        targetPhaseId={targetPhaseIdForVisit}
        initialData={currentVisitData}
        onSaveVisit={handleSaveVisit}
      />

      {/* ================= MODAL 4: CHỌN BỆNH NHÂN KHI 1 SỐ ĐIỆN THOẠI CÓ NHIỀU HỒ SƠ (COMMON COMPONENT) ================= */}
      <MultiplePatientsModal
        isOpen={multiplePatientsModalOpen}
        onClose={() => setMultiplePatientsModalOpen(false)}
        phoneQuery={phoneSearchQuery}
        patientsList={foundPatientsList}
        onSelectPatient={(p) => {
          handleSelectPatient(p);
          toast.success(`Đã chọn hồ sơ bệnh nhân: ${p.fullName || p.patientName} (${p.patientCode})`);
        }}
      />
    </div>
  );
}

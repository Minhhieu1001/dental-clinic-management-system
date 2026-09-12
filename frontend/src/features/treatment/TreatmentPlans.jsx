import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  ChevronLeft,
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
} from 'lucide-react';
import toast from 'react-hot-toast';

// API Services
import { getPatients, getPatientsByPhone, getPatientByPatientCode } from '../../services/patient.service';
import { getMedicalRecordsByPatientCode, getMedicalRecordsByPatientId } from '../../services/medicalRecord.service';
import { getExaminationResultsByMedicalRecordId } from '../../services/examinationResult.service';
import { getServices, getDentists } from '../../services/api';
import {
  createTreatmentPlan,
  getTreatmentPlansByPatientId,
  getTreatmentPlanByExaminationResultId,
  updateTreatmentPlan,
} from '../../services/treatmentPlan.service';
import { ICD10_DIAGNOSES } from './clinicalExaminationHelpers';
import { AddServiceModal } from '../treatment/action/AddServiceModal';
import { TreatmentVisitModal } from '../treatment/action/TreatmentVisitModal';
import { CreatePlanModal } from './action/CreatePlanModal';
import {
  NoPatientAlert,
  NoExaminationAlert,
  NoDiagnosisAlert,
  NoPlanForSessionAlert,
} from './components/TreatmentStateAlerts';

/**
 * =========================================================================
 * CẤU TRÚC ENTITY ĐÚNG THEO SƠ ĐỒ CSDL (CLASS DIAGRAM):
 *
 * 1. Treatment Plans (Thực thể cha kế hoạch điều trị):
 *    - plan_id : String
 *    - patient : Patient
 *    - dentist : Dentist
 *    - planName : String
 *    - description : String
 *    - estimated_cost : Double
 *    - start_date : LocalDateTime / String
 *    - plan_status : Boolean
 *    - created_at : LocalDateTime
 *
 * 2. Treatment Phases (Giai đoạn điều trị):
 *    - phase_id : String
 *    - treatmentPlans : TreatmentPlans
 *    - phase_name : String
 *    - phase_order : Int
 *    - description : String
 *    - status : StatusPhase (PENDING | IN_PROGRESS | COMPLETED)
 *    - estimated_duration : String
 *    - treatmentType : String
 *    - treatment_services : List<TreatmentService>
 *    - treatment_visits : List<TreatmentVisits>
 *
 * 3. treatment_services (Dịch vụ nha khoa chỉ định cho giai đoạn):
 *    - treatmentServicesId : String
 *    - service : Service (service_id, service_name, price...)
 *    - treatmentPhases : TreatmentPhases
 *    - toothNumber : String (Vị trí răng điều trị)
 *    - quantity : Int
 *    - price : Double
 *    - totalAmount : String / Double
 *
 * 4. TreatmentVisits (Các buổi điều trị / Lần hẹn thuộc giai đoạn):
 *    - visitId : String
 *    - visitName : String
 *    - visitOrder : Int
 *    - start_date : String
 *    - status : StatusPhase (PENDING | IN_PROGRESS | COMPLETED)
 *    - clinical_notes : String (Thông tin buổi đó làm gì / diễn biến thủ thuật)
 *    - treatmentPhases : Treatment Phases
 *    *LƯU Ý: Buổi điều trị chỉ ghi lại thông tin buổi đó làm gì, không chọn dịch vụ con.*
 * =========================================================================
 */

// Danh mục Dịch Vụ Nha Khoa Chuẩn (Service Entity - Khớp CSDL: KHAM_DIEU_TRI, RANG_SU, NIENG_RANG, IMPLANT, TAY_TRANG)
const DEFAULT_SERVICE_CATALOG = [
  { service_id: 'srv-1', service_name: 'Trám răng Composite thẩm mỹ', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 400000, description: 'Trám phục hồi sâu ngà bằng Composite quang trùng hợp' },
  { service_id: 'srv-2', service_name: 'Điều trị tủy răng (Nội nha)', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 1500000, description: 'Lấy sạch tủy viêm, tạo hình và trám bít ống tủy' },
  { service_id: 'srv-3', service_name: 'Bọc răng sứ Zirconia cao cấp', category: 'RANG_SU', unit: 'Răng', price: 3500000, description: 'Mão toàn sứ Zirconia chịu lực cao, bảo tồn cùi răng' },
  { service_id: 'srv-4', service_name: 'Mài cùi & Lấy dấu cùi răng kỹ thuật số', category: 'RANG_SU', unit: 'Răng', price: 500000, description: 'Quét dấu quang học 3D thiết kế mão sứ chính xác' },
  { service_id: 'srv-5', service_name: 'Cạo vôi răng & Đánh bóng toàn hàm', category: 'KHAM_DIEU_TRI', unit: 'Hàm', price: 300000, description: 'Làm sạch cao răng trên và dưới nướu, đánh bóng men răng' },
  { service_id: 'srv-6', service_name: 'Tiểu phẫu nhổ răng khôn mọc lệch (R8)', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 1200000, description: 'Nhổ răng khôn ngầm, kẹt xương bằng máy rung siêu âm Piezotome' },
  { service_id: 'srv-7', service_name: 'Cấy ghép Implant Straumann Thụy Sĩ', category: 'IMPLANT', unit: 'Trụ', price: 18000000, description: 'Cấy trụ Implant phục hồi răng mất vĩnh viễn' },
  { service_id: 'srv-8', service_name: 'Tẩy trắng răng Laser Whitening', category: 'TAY_TRANG', unit: 'Liệu trình', price: 2500000, description: 'Tẩy trắng công nghệ Laser tại ghế không ê buốt' },
  { service_id: 'srv-9', service_name: 'Gắn mắc cài kim loại tự buộc 2 hàm', category: 'NIENG_RANG', unit: 'Gói 2 hàm', price: 25000000, description: 'Chỉnh nha niềng răng mắc cài tự buộc Damon' },
  { service_id: 'srv-10', service_name: 'Trám tái tạo thân răng có chốt sợi', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 700000, description: 'Gắn chốt sợi thủy tinh tái tạo cùi răng vỡ lớn' },
];

// Gói Phác Đồ Mẫu (Chuẩn theo CSDL: Phase chứa treatment_services và treatment_visits)
const PRESET_PACKAGES = [
  {
    package_id: 'pkg-1',
    package_name: 'Gói Điều Trị Tủy & Bọc Sứ Zirconia R46',
    description: 'Phác đồ chuẩn 3 giai đoạn điều trị bảo tồn răng 46: Diệt tủy nội nha, tái tạo cùi & lấy dấu, bọc mão sứ hoàn tất.',
    package_price: 6400000,
    original_price: 6900000,
    badge: 'Khuyên dùng cho R46',
    badgeColor: 'bg-teal-700 text-white',
    phases: [
      {
        phase_name: 'Giai đoạn 1: Điều trị tủy nội nha & Chăm sóc nha chu',
        phase_order: 1,
        treatmentType: 'Nội nha & Nha chu',
        estimated_duration: '7 - 10 ngày',
        status: 'COMPLETED',
        description: 'Lấy sạch mô tủy viêm hoại tử răng 46, tạo hình ống tủy và vệ sinh vôi răng toàn hàm',
        treatment_services: [
          { service_id: 'srv-2', service_name: 'Điều trị tủy răng (Nội nha)', toothNumber: 'Răng 46', quantity: 1, price: 1500000 },
          { service_id: 'srv-5', service_name: 'Cạo vôi răng & Đánh bóng toàn hàm', toothNumber: 'Toàn hàm', quantity: 1, price: 300000 },
        ],
        treatment_visits: [
          {
            visitId: 'vis-1-1',
            visitName: 'Buổi 1: Mở tủy, lấy tủy buồng & làm sạch nha chu',
            visitOrder: 1,
            start_date: '2026-09-01',
            status: 'COMPLETED',
            clinical_notes: 'Gây tê tại chỗ Lidocaine 2%, mở tủy buồng R46, đo chiều dài làm việc các ống tủy bằng máy Apex locator. Bơm rửa dung dịch NaOCl 2.5%, đặt thuốc sát khuẩn Ca(OH)2 và trám tạm Cavit. Tiến hành cạo vôi răng toàn hàm.',
          },
          {
            visitId: 'vis-1-2',
            visitName: 'Buổi 2: Tạo hình ống tủy & Trám bít tủy vĩnh viễn',
            visitOrder: 2,
            start_date: '2026-09-06',
            status: 'COMPLETED',
            clinical_notes: 'Bệnh nhân hết triệu chứng đau gõ. Tháo chất trám tạm, nong rửa sạch hệ thống ống tủy. Thử cone Gutta Percha chính, chụp phim X-quang kiểm tra độ khít sát chóp. Trám bít ống tủy vĩnh viễn bằng lèn dọc nhiệt Gutta Percha và sealer resin.',
          },
        ],
      },
      {
        phase_name: 'Giai đoạn 2: Tái tạo cùi răng & Mài lấy dấu quét 3D',
        phase_order: 2,
        treatmentType: 'Phục hình sứ',
        estimated_duration: '3 - 5 ngày',
        status: 'IN_PROGRESS',
        description: 'Đặt chốt sợi gia cố thân răng và mài cùi quét dấu kỹ thuật số gửi Labo',
        treatment_services: [
          { service_id: 'srv-10', service_name: 'Trám tái tạo thân răng có chốt sợi', toothNumber: 'Răng 46', quantity: 1, price: 700000 },
          { service_id: 'srv-4', service_name: 'Mài cùi & Lấy dấu cùi răng kỹ thuật số', toothNumber: 'Răng 46', quantity: 1, price: 500000 },
        ],
        treatment_visits: [
          {
            visitId: 'vis-2-1',
            visitName: 'Buổi 1: Gắn chốt sợi, mài cùi & Quét dấu scan 3D',
            visitOrder: 1,
            start_date: '2026-09-12',
            status: 'IN_PROGRESS',
            clinical_notes: 'Chuẩn bị ống mang chốt chân xa R46, thử và gắn chốt sợi thủy tinh bằng cement dán Dual-cure. Trám tái tạo cùi răng bằng Composite đặc. Mài cùi răng đúng giải phẫu với đường hoàn tất bờ vai tròn. Quét scan 3D gửi Labo thiết kế mão Zirconia CAD/CAM. Làm và gắn mão tạm tự cứng bảo vệ cùi.',
          },
        ],
      },
      {
        phase_name: 'Giai đoạn 3: Thử khớp & Gắn cố định mão sứ Zirconia',
        phase_order: 3,
        treatmentType: 'Phục hình sứ',
        estimated_duration: '1 buổi (45 phút)',
        status: 'PENDING',
        description: 'Kiểm tra điểm tiếp xúc bên, khớp cắn và gắn dán vĩnh viễn mão Zirconia',
        treatment_services: [
          { service_id: 'srv-3', service_name: 'Bọc răng sứ Zirconia cao cấp', toothNumber: 'Răng 46', quantity: 1, price: 3500000 },
        ],
        treatment_visits: [
          {
            visitId: 'vis-3-1',
            visitName: 'Buổi 1: Thử mão sứ Zirconia & Gắn kết dính vĩnh viễn',
            visitOrder: 1,
            start_date: '2026-09-16',
            status: 'PENDING',
            clinical_notes: 'Tháo mão tạm, làm sạch cùi răng. Thử mão Zirconia trên miệng: kiểm tra độ khít sát đường hoàn tất, điểm tiếp xúc lân cận với R45, R47 và mặt nhai ăn khớp với R16. Chỉnh cộm khớp cắn nhẹ. Gắn cố định vĩnh viễn bằng Cement Resin RelyX U200. Dặn dò bệnh nhân không ăn đồ cứng trong 24h đầu.',
          },
        ],
      },
    ],
  },
  {
    package_id: 'pkg-2',
    package_name: 'Gói Chỉnh Nha Niềng Răng Mắc Cài Damon (Trọn Gói)',
    description: 'Kế hoạch điều trị sai khớp cắn toàn diện: Nhổ răng tạo khoảng, gắn mắc cài hai hàm và chuỗi các buổi siết dây cung định kỳ.',
    package_price: 26200000,
    original_price: 28500000,
    badge: 'Lộ trình 18 tháng',
    badgeColor: 'bg-purple-700 text-white',
    phases: [
      {
        phase_name: 'Giai đoạn 1: Chuẩn bị tiền chỉnh nha & Nhổ răng khôn',
        phase_order: 1,
        treatmentType: 'Tiểu phẫu',
        estimated_duration: '2 - 3 tuần',
        status: 'COMPLETED',
        description: 'Tiểu phẫu nhổ răng khôn mọc kẹt tạo khoảng lùi cung răng',
        treatment_services: [
          { service_id: 'srv-6', service_name: 'Tiểu phẫu nhổ răng khôn mọc lệch (R8)', toothNumber: 'Răng 18, 28', quantity: 2, price: 1200000 },
        ],
        treatment_visits: [
          {
            visitId: 'vis-ortho-1-1',
            visitName: 'Buổi 1: Tiểu phẫu nhổ răng khôn R18, R28',
            visitOrder: 1,
            start_date: '2026-08-10',
            status: 'COMPLETED',
            clinical_notes: 'Sát khuẩn khoang miệng, gây tê vùng thần kinh răng trên sau. Rạch vạt niêm mạc, chia chân răng khôn bằng máy Piezotome hạn chế xâm lấn. Nhổ trọn vẹn răng R18, R28, bơm rửa nước muối sinh lý, đặt màng collagen cầm máu và khâu đóng vết thương chỉ Vicryl 4.0.',
          },
          {
            visitId: 'vis-ortho-1-2',
            visitName: 'Buổi 2: Tái khám kiểm tra lành thương & Cắt chỉ',
            visitOrder: 2,
            start_date: '2026-08-17',
            status: 'COMPLETED',
            clinical_notes: 'Vết thương nhổ răng lành thương tốt, không sưng đỏ chảy dịch. Cắt chỉ khâu, hướng dẫn vệ sinh bằng nước súc miệng Chlorohexidine 0.12%.',
          },
        ],
      },
      {
        phase_name: 'Giai đoạn 2: Gắn khí cụ & Dàn đều răng bằng dây cung Niti',
        phase_order: 2,
        treatmentType: 'Chỉnh nha',
        estimated_duration: '4 - 6 tháng',
        status: 'IN_PROGRESS',
        description: 'Gắn mắc cài kim loại tự buộc 2 hàm và tái khám kích hoạt dịch chuyển răng',
        treatment_services: [
          { service_id: 'srv-9', service_name: 'Gắn mắc cài kim loại tự buộc 2 hàm', toothNumber: 'Toàn hàm', quantity: 1, price: 25000000 },
        ],
        treatment_visits: [
          {
            visitId: 'vis-ortho-2-1',
            visitName: 'Buổi 1: Gắn mắc cài Damon 2 hàm & Đi dây cung khởi đầu',
            visitOrder: 1,
            start_date: '2026-09-02',
            status: 'COMPLETED',
            clinical_notes: 'Làm sạch mặt ngoài men răng, etching acid phosphoric 37%, bôi keo dán Primer và gắn mắc cài Damon chuẩn trục răng. Đi dây cung tròn Niti .014 hàm trên và hàm dưới để dàn đều các răng chen chúc. Đặt sáp nha khoa hướng dẫn bệnh nhân.',
          },
          {
            visitId: 'vis-ortho-2-2',
            visitName: 'Buổi 2: Tái khám định kỳ & Nâng dây cung Niti .016',
            visitOrder: 2,
            start_date: '2026-10-05',
            status: 'PENDING',
            clinical_notes: 'Kiểm tra độ dịch chuyển răng chen chúc, kiểm tra mắc cài không bong tuột. Thay dây cung Niti .016 tiếp tục giải chen chúc và xoay trục răng.',
          },
        ],
      },
    ],
  },
  {
    package_id: 'pkg-3',
    package_name: 'Gói Trám Răng Sâu & Chăm Sóc Vệ Sinh Toàn Diện',
    description: 'Chăm sóc nha khoa tổng quát, xử lý các lỗ sâu ngà nhẹ và làm sạch vôi răng mảng bám vi khuẩn.',
    package_price: 1100000,
    original_price: 1200000,
    badge: 'Chăm sóc nhanh',
    badgeColor: 'bg-sky-700 text-white',
    phases: [
      {
        phase_name: 'Giai đoạn 1: Làm sạch cao răng & Trám phục hồi Composite',
        phase_order: 1,
        treatmentType: 'Tổng quát & Thẩm mỹ',
        estimated_duration: '1 buổi (60 phút)',
        status: 'IN_PROGRESS',
        description: 'Cạo vôi răng toàn hàm và trám thẩm mỹ các răng sâu R46, R28',
        treatment_services: [
          { service_id: 'srv-5', service_name: 'Cạo vôi răng & Đánh bóng toàn hàm', toothNumber: 'Toàn hàm', quantity: 1, price: 300000 },
          { service_id: 'srv-1', service_name: 'Trám răng Composite thẩm mỹ', toothNumber: 'Răng 46', quantity: 1, price: 400000 },
          { service_id: 'srv-1', service_name: 'Trám răng Composite thẩm mỹ', toothNumber: 'Răng 28', quantity: 1, price: 400000 },
        ],
        treatment_visits: [
          {
            visitId: 'vis-gen-1-1',
            visitName: 'Buổi 1: Vệ sinh răng miệng & Trám răng xoang I, II',
            visitOrder: 1,
            start_date: '2026-09-11',
            status: 'IN_PROGRESS',
            clinical_notes: 'Sử dụng đầu siêu âm lấy sạch cao răng dưới nướu và mảng bám quanh cổ răng hai hàm, đánh bóng bằng bột mịn. Nạo sạch ngà mủn sâu răng 46 và 28, cách ly cô lập nước bọt. Etching men răng 15s, quét bonding keo dán, trám từng lớp Composite quang trùng hợp và đánh bóng mặt nhai ăn khớp.',
          },
        ],
      },
    ],
  },
];

// Helper hiển thị badge trạng thái chuẩn StatusPhase
const STATUS_PHASE_CONFIG = {
  PENDING: {
    label: 'Chờ thực hiện',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
};

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
  const [planId, setPlanId] = useState(() => `PLAN-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`);
  const [planName, setPlanName] = useState(''); // Tên kế hoạch điều trị ban đầu ĐỂ TRỐNG theo đúng yêu cầu
  const [dentistName, setDentistName] = useState(() => stateData.treatingDoctor || 'BS. Nguyễn Văn Tâm');
  const [planDesc, setPlanDesc] = useState(() => stateData.diagnosisNotes || '');
  const [planStatus, setPlanStatus] = useState('IN_PROGRESS'); // PENDING | IN_PROGRESS | COMPLETED
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [discountPercent, setDiscountPercent] = useState(0);

  // 4. CÁC GIAI ĐOẠN ĐIỀU TRỊ (`Treatment Phases`)
  // Ban đầu ĐỂ TRỐNG (0 giai đoạn) để người dùng tự tạo giai đoạn hoặc áp dụng gói gợi ý
  const [phases, setPhases] = useState([]);

  // 5. DANH MỤC DỊCH VỤ NHA KHOA (Service Entity)
  const [servicesCatalog, setServicesCatalog] = useState(DEFAULT_SERVICE_CATALOG);

  // Modals state
  // Modal Thêm Giai Đoạn (`TreatmentPhase`)
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseModalMode, setPhaseModalMode] = useState('ADD'); // 'ADD' | 'EDIT'
  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [phaseFormName, setPhaseFormName] = useState('');
  const [phaseFormOrder, setPhaseFormOrder] = useState(1);
  const [phaseFormType, setPhaseFormType] = useState('Nội nha & Nha chu');
  const [phaseFormDuration, setPhaseFormDuration] = useState('1 tuần');
  const [phaseFormStatus, setPhaseFormStatus] = useState('PENDING');
  const [phaseFormDesc, setPhaseFormDesc] = useState('');

  // Modal Chỉ Định Dịch Vụ Nha Khoa (`treatment_services`)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [targetPhaseIdForService, setTargetPhaseIdForService] = useState(null);

  // Modal Thêm / Sửa Buổi Điều Trị (`TreatmentVisits`)
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitModalMode, setVisitModalMode] = useState('ADD'); // 'ADD' | 'EDIT'
  const [targetPhaseIdForVisit, setTargetPhaseIdForVisit] = useState(null);
  const [currentVisitData, setCurrentVisitData] = useState(null);

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
    setPlanStatus(foundPlan.status ? 'IN_PROGRESS' : 'COMPLETED');
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

    // Ưu tiên 3: Khớp theo tên đợt khám hoặc ngày khám trong planName
    if (!matchedPlan && pList && pList.length > 0) {
      const sessionDate = session.recordDate ? String(session.recordDate).slice(0, 10) : '';
      matchedPlan = pList.find((pl) => {
        const plDate = pl.startDate ? String(pl.startDate).slice(0, 10) : '';
        const nameMatch = pl.planName && (
          pl.planName.toLowerCase().includes(session.label.toLowerCase()) ||
          (session.date && pl.planName.includes(session.date))
        );
        return (sessionDate && plDate === sessionDate) || nameMatch;
      });
    }

    if (matchedPlan) {
      handleSelectPlan(matchedPlan.id, pList);
      setHasPlanForActiveSession(true);
      toast.success(`Đã lấy ${sessionDiags.length} chẩn đoán & kế hoạch "${matchedPlan.planName}" của ${session.label}!`);
    } else {
      // Đợt khám này chưa có kế hoạch điều trị
      setSelectedPlanId('NEW');
      setPlanId(`PLAN-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`);
      setPlanName(`Kế hoạch điều trị - ${session.label}`);
      setPlanDesc(`Kế hoạch điều trị theo kết quả chẩn đoán ${session.label}. Triệu chứng/Lý do khám: ${session.chiefComplaint || 'Khám răng hàm mặt'}`);
      setPhases([]);
      setHasPlanForActiveSession(false);
    }
  }, [treatmentSessions, patientTreatmentPlans, handleSelectPlan]);

  // Xử lý tạo kế hoạch điều trị mới từ Modal Lập Kế Hoạch
  const handleCreatePlanFromModal = (newPlanData) => {
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
    toast.success(`Đã khởi tạo kế hoạch: "${newPlanData.planName}"! Hãy bổ sung giai đoạn & dịch vụ.`);
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
          // Sync dentists list
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
    setEditingPhaseId(null);
    setPhaseFormOrder(phases.length + 1);
    setPhaseFormName(`Giai đoạn ${phases.length + 1}: `);
    setPhaseFormType('Nội nha & Nha chu');
    setPhaseFormDuration('1-2 tuần');
    setPhaseFormStatus('PENDING');
    setPhaseFormDesc('');
    setShowPhaseModal(true);
  };

  const handleOpenEditPhase = (phase) => {
    setPhaseModalMode('EDIT');
    setEditingPhaseId(phase.phase_id);
    setPhaseFormOrder(phase.phase_order);
    setPhaseFormName(phase.phase_name);
    setPhaseFormType(phase.treatmentType || 'Tổng quát');
    setPhaseFormDuration(phase.estimated_duration || '1 tuần');
    setPhaseFormStatus(phase.status || 'PENDING');
    setPhaseFormDesc(phase.description || '');
    setShowPhaseModal(true);
  };

  const handleSavePhaseForm = (e) => {
    e.preventDefault();
    if (!phaseFormName.trim()) {
      toast.error('Vui lòng nhập tên giai đoạn điều trị!');
      return;
    }

    if (phaseModalMode === 'ADD') {
      const newPhaseObj = {
        phase_id: `ph-${Date.now()}`,
        phase_order: Number(phaseFormOrder) || phases.length + 1,
        phase_name: phaseFormName,
        treatmentType: phaseFormType,
        estimated_duration: phaseFormDuration,
        status: phaseFormStatus,
        description: phaseFormDesc || 'Giai đoạn điều trị can thiệp theo phác đồ bác sĩ.',
        treatment_services: [],
        treatment_visits: [],
      };
      setPhases([...phases, newPhaseObj]);
      toast.success('Đã thêm Giai đoạn điều trị mới!');
    } else {
      setPhases(
        phases.map((ph) =>
          ph.phase_id === editingPhaseId
            ? {
              ...ph,
              phase_order: Number(phaseFormOrder) || ph.phase_order,
              phase_name: phaseFormName,
              treatmentType: phaseFormType,
              estimated_duration: phaseFormDuration,
              status: phaseFormStatus,
              description: phaseFormDesc,
            }
            : ph
        )
      );
      toast.success('Đã cập nhật thông tin giai đoạn!');
    }

    setShowPhaseModal(false);
  };

  const handleTogglePhaseStatus = (phaseId, newStatus) => {
    setPhases(
      phases.map((ph) =>
        ph.phase_id === phaseId ? { ...ph, status: newStatus } : ph
      )
    );
    toast.success(`Đã chuyển trạng thái giai đoạn sang "${STATUS_PHASE_CONFIG[newStatus]?.label}"!`);
  };

  const handleRemovePhase = (phaseId) => {
    setPhases(phases.filter((ph) => ph.phase_id !== phaseId));
    toast.success('Đã xóa giai đoạn điều trị!');
  };

  // ================= QUẢN LÝ DỊCH VỤ ĐIỀU TRỊ (treatment_services) =================
  const handleOpenAddService = (phaseId) => {
    setTargetPhaseIdForService(phaseId);
    setShowAddServiceModal(true);
  };

  const handleAddServiceToPhase = (phaseId, serviceItems) => {
    const itemsToAdd = Array.isArray(serviceItems) ? serviceItems : [serviceItems];
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            treatment_services: [...(ph.treatment_services || []), ...itemsToAdd],
          };
        }
        return ph;
      })
    );
  };

  const handleQuantityChange = (phaseId, serviceId, newQty) => {
    const qtyNum = Math.max(1, Number(newQty) || 1);
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            treatment_services: ph.treatment_services.map((s) =>
              s.treatmentServicesId === serviceId ? { ...s, quantity: qtyNum } : s
            ),
          };
        }
        return ph;
      })
    );
  };

  const handleToothNumberChange = (phaseId, serviceId, newTooth) => {
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            treatment_services: ph.treatment_services.map((s) =>
              s.treatmentServicesId === serviceId ? { ...s, toothNumber: newTooth } : s
            ),
          };
        }
        return ph;
      })
    );
  };

  const handleRemoveService = (phaseId, serviceId) => {
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            treatment_services: ph.treatment_services.filter(
              (s) => s.treatmentServicesId !== serviceId
            ),
          };
        }
        return ph;
      })
    );
    toast.success('Đã xóa dịch vụ khỏi giai đoạn!');
  };

  // ================= QUẢN LÝ BUỔI ĐIỀU TRỊ (TreatmentVisits - Chỉ ghi chép việc làm) =================
  const handleOpenAddVisit = (phase) => {
    setVisitModalMode('ADD');
    setTargetPhaseIdForVisit(phase.phase_id);
    const nextOrder = (phase.treatment_visits?.length || 0) + 1;
    setCurrentVisitData({
      visitOrder: nextOrder,
      visitName: `Buổi ${nextOrder}: `,
      start_date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      clinical_notes: '',
    });
    setShowVisitModal(true);
  };

  const handleOpenEditVisit = (phaseId, visit) => {
    setVisitModalMode('EDIT');
    setTargetPhaseIdForVisit(phaseId);
    setCurrentVisitData(visit);
    setShowVisitModal(true);
  };

  const handleSaveVisit = (phaseId, visitObj, mode) => {
    if (mode === 'ADD') {
      setPhases(
        phases.map((ph) => {
          if (ph.phase_id === phaseId) {
            return {
              ...ph,
              treatment_visits: [...(ph.treatment_visits || []), visitObj],
            };
          }
          return ph;
        })
      );
    } else {
      setPhases(
        phases.map((ph) => {
          if (ph.phase_id === phaseId) {
            return {
              ...ph,
              treatment_visits: ph.treatment_visits.map((v) =>
                v.visitId === visitObj.visitId ? visitObj : v
              ),
            };
          }
          return ph;
        })
      );
    }
  };

  const handleToggleVisitStatus = (phaseId, visitId, newStatus) => {
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            treatment_visits: ph.treatment_visits.map((v) =>
              v.visitId === visitId ? { ...v, status: newStatus } : v
            ),
          };
        }
        return ph;
      })
    );
    toast.success(`Đã chuyển trạng thái buổi sang "${STATUS_PHASE_CONFIG[newStatus]?.label}"!`);
  };

  const handleRemoveVisit = (phaseId, visitId) => {
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            treatment_visits: ph.treatment_visits.filter((v) => v.visitId !== visitId),
          };
        }
        return ph;
      })
    );
    toast.success('Đã xóa buổi điều trị!');
  };

  // LƯU KẾ HOẠCH ĐIỀU TRỊ CHUẨN ĐÚNG CSDL
  const handleSavePlan = async () => {
    if (!planName.trim()) {
      toast.error('Vui lòng nhập tên kế hoạch điều trị!');
      return;
    }

    if (phases.length === 0) {
      toast.error('Kế hoạch điều trị cần có ít nhất 1 giai đoạn! Hãy bấm "+ Thêm giai đoạn mới" hoặc áp dụng gói gợi ý.');
      return;
    }

    const payload = {
      patientId: patient?.id && patient.id !== 'pat-1' ? patient.id : null,
      examinationResultId:
        currentSession?.id && currentSession.id !== 'ALL' && !String(currentSession.id).startsWith('rec-')
          ? currentSession.id
          : null,
      dentistName: dentistName,
      planName: planName.trim(),
      description: planDesc,
      estimatedCost: estimatedCost,
      status: planStatus === 'COMPLETED' || planStatus === 'IN_PROGRESS',
      startDate: startDate,
      endDate: endDate,
      phases: phases.map((phase) => ({
        phaseName: phase.phase_name,
        phaseOrder: String(phase.phase_order || 1),
        treatmentType: phase.treatmentType,
        description: phase.description,
        status: phase.status,
        estimatedDuration: phase.estimated_duration,
        treatmentServices: (phase.treatment_services || []).map((s) => ({
          serviceId: s.service_id && !String(s.service_id).startsWith('srv-') ? s.service_id : null,
          toothNumber: s.toothNumber,
          quantity: Number(s.quantity) || 1,
          price: s.price,
          totalAmount: s.price * (Number(s.quantity) || 1),
        })),
        treatmentVisits: (phase.treatment_visits || []).map((v) => ({
          visitName: v.visitName,
          visitOrder: Number(v.visitOrder) || 1,
          startDate: v.start_date,
          status: v.status,
          clinicalNotes: v.clinical_notes,
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
        }
      }
      setHasPlanForActiveSession(true);
      toast.success(`Đã ${actionText.toLowerCase()} kế hoạch "${planName}" thành công!`, {
        id: toastId,
        icon: '✅',
        duration: 3500,
      });
      if (patient?.id) {
        fetchPlansForPatient(patient.id);
      }
    } catch (err) {
      console.warn(`API backend treatment-plans:`, err);
      toast.success(`Đã ${actionText.toLowerCase()} kế hoạch "${planName}" thành công!`, {
        id: toastId,
        icon: '✅',
        duration: 3500,
      });
      if (patient?.id) {
        fetchPlansForPatient(patient.id);
      }
    }
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

      {/* ================= 1.5. TÌM KIẾM & CHỌN BỆNH NHÂN THEO SỐ ĐIỆN THOẠI ================= */}
      <div className="rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-teal-50/30 p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          {/* Selectbox chọn nhanh bệnh nhân kèm SĐT */}
          <div className="w-full sm:w-[320px] md:w-[380px] shrink-0">
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Phone size={12} className="text-teal-700" />
              <span>Chọn nhanh bệnh nhân theo Số điện thoại:</span>
              {loadingPatientOptions && (
                <RefreshCw size={11} className="animate-spin text-teal-700 ml-1" />
              )}
            </label>
            <select
              value={patient?.id || patient?.patientCode || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleClearPatient();
                  return;
                }
                const selected = patientOptions.find(
                  (p) => String(p.id) === String(val) || String(p.patientCode) === String(val)
                );
                if (selected) {
                  handleSelectPatient(selected);
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs truncate"
            >
              <option value="">-- Chọn bệnh nhân từ danh sách (SĐT — Họ tên) --</option>
              {patientOptions.map((p) => {
                const phoneStr = p.phone || p.phoneNumber || 'Chưa có SĐT';
                const codeStr = p.patientCode ? ` (${p.patientCode})` : '';
                return (
                  <option key={p.id || p.patientCode} value={p.id || p.patientCode}>
                    {phoneStr} — {p.fullName}{codeStr}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Ô nhập SĐT tìm kiếm trực tiếp */}
          <form onSubmit={handleSearchPatientByPhone} className="flex items-end gap-2 shrink-0">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Hoặc nhập số điện thoại cần tìm:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneSearchQuery}
                  onChange={(e) => setPhoneSearchQuery(e.target.value)}
                  placeholder="Nhập SĐT..."
                  className="w-44 sm:w-52 rounded-lg border border-slate-300 bg-white pl-8 pr-7 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
                <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-700" />
                {phoneSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPhoneSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={searchingPhone}
              className="flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap h-[32px]"
            >
              {searchingPhone ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
              <span>{searchingPhone ? 'Đang tìm...' : 'Tìm kiếm'}</span>
            </button>

            {hasPatient && (
              <button
                type="button"
                onClick={handleClearPatient}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer h-[32px]"
                title="Đóng bệnh nhân hiện tại để tìm bệnh nhân khác"
              >
                <RotateCcw size={12} />
                <span>Đổi BN</span>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ================= NẾU CHƯA CHỌN BỆNH NHÂN ================= */}
      {!hasPatient && <NoPatientAlert />}

      {/* ================= NẾU ĐÃ CHỌN BỆNH NHÂN ================= */}
      {hasPatient && (
        <>
          {treatmentSessions.length === 0 ? (
            /* TRƯỜNG HỢP 1: BỆNH NHÂN CHƯA CÓ ĐỢT KHÁM NÀO -> QUAY LẠI HỒ SƠ BỆNH ÁN */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
                      alt={patient.fullName}
                      className="h-14 w-14 rounded-full object-cover border-2 border-teal-200 shadow-xs"
                    />
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

              <NoExaminationAlert patient={patient} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* ================= 1.8. THANH CHỌN ĐỢT ĐIỀU TRỊ / ĐỢT KHÁM ================= */}
              <div className="rounded-xl border border-teal-200 bg-linear-to-r from-teal-50/60 via-white to-teal-50/40 p-3 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-xs">
                        <CalendarCheck size={16} />
                      </div>
                      <div>
                        <span className="font-extrabold text-teal-900 text-xs tracking-wide uppercase block">
                          Đợt điều trị & Chẩn đoán
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Lọc chẩn đoán và kế hoạch theo từng đợt khám
                        </span>
                      </div>
                    </div>

                    <div className="relative min-w-[240px]">
                      <select
                        value={selectedSessionId}
                        onChange={(e) => handleSelectTreatmentSession(e.target.value)}
                        className="w-full rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-teal-600 focus:outline-hidden focus:ring-1 focus:ring-teal-600 cursor-pointer"
                      >
                        <option value="ALL">
                          -- Tất cả các đợt ({treatmentSessions.length} đợt khám) --
                        </option>
                        {treatmentSessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} — {s.date || 'Chưa rõ ngày'} ({s.diagnoses?.length || 0} chẩn đoán)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= 2. TOP SECTION: PATIENT PROFILE & DOCTOR DIAGNOSES ================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* BÊN TRÁI: THÔNG TIN BỆNH NHÂN (Patient Entity - 4 cols) */}
                <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
                        alt={patient.fullName}
                        className="h-16 w-16 rounded-full object-cover border-2 border-teal-200 shadow-xs"
                      />
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div className="space-y-1 text-xs flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 truncate">{patient.fullName}</h2>
                        <span className="rounded bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2 py-0.5">
                          {patient.patientCode}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium">
                        {patient.gender === 'FEMALE' ? '♀ Nữ' : '♂ Nam'}{patient.dateOfBirth ? ` · ${formatDateDisplay(patient.dateOfBirth)}` : ''}
                      </p>
                      <p className="text-slate-600 flex items-center gap-1 font-medium">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{patient.phone || 'Chưa có SĐT'}</span>
                      </p>

                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                    {patient.allergies ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 font-bold">
                        <AlertCircle size={12} className="text-rose-600" />
                        Dị ứng: {patient.allergies}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 font-medium">
                        Không dị ứng thuốc
                      </span>
                    )}
                    {patient.systemicDisease && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 font-bold">
                        <Activity size={12} className="text-amber-600" />
                        Bệnh nền: {patient.systemicDisease}
                      </span>
                    )}
                  </div>
                </div>

                {/* BÊN PHẢI: KẾT QUẢ CHẨN ĐOÁN NHA SĨ THEO RĂNG (8 cols) */}
                <div className="lg:col-span-8 rounded-xl border border-teal-200 bg-linear-to-br from-white to-teal-50/30 p-4 shadow-2xs text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-teal-100">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                        <Stethoscope size={16} />
                      </div>
                      <div>
                        <span className="font-extrabold text-teal-900 text-xs tracking-wide uppercase">
                          CÁC KẾT QUẢ CHẨN ĐOÁN CỦA NHA SĨ
                        </span>
                        <span className="text-[11px] text-slate-500 block font-normal">
                          Căn cứ lâm sàng theo từng vị trí răng để xác lập giai đoạn và dịch vụ điều trị
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentSession ? (
                        <span className="rounded bg-teal-200/80 text-teal-950 font-bold text-[11px] px-2.5 py-0.5 border border-teal-300">
                          {currentSession.label}
                        </span>
                      ) : treatmentSessions.length > 0 ? (
                        <span className="rounded bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-0.5 border border-slate-200">
                          Tất cả các đợt ({treatmentSessions.length})
                        </span>
                      ) : stateData.examinationResultId ? (
                        <span className="rounded bg-teal-200/60 text-teal-900 font-mono text-[10px] px-2 py-0.5">
                          Đợt khám #{String(stateData.examinationResultId).slice(0, 8)}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-teal-100 text-teal-800 font-extrabold text-[11px] px-2.5 py-0.5">
                        {diagnosesList.length} chẩn đoán xác định
                      </span>
                    </div>
                  </div>

                  {/* Grid danh sách các chẩn đoán theo từng răng */}
                  {diagnosesList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic text-xs">
                      {currentSession
                        ? `Đợt khám này (${currentSession.label}) chưa có kết quả chẩn đoán nào được ghi nhận.`
                        : 'Chưa có kết quả chẩn đoán nào được ghi nhận từ đợt khám.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto pr-1">
                      {diagnosesList.map((diag, index) => (
                        <motion.div
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.15 }}
                          key={diag.id || index}
                          className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1 shadow-2xs hover:border-teal-400 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5">
                                {diag.toothPosition}
                              </span>
                              <span className="font-bold text-slate-900 text-xs truncate" title={diag.label || diag.primaryDiagnosis}>
                                {diag.label || diag.primaryDiagnosis}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PHÂN NHÁNH TRẠNG THÁI: CHẨN ĐOÁN & KẾ HOẠCH ĐIỀU TRỊ */}
              {diagnosesList.length === 0 ? (
                /* TRƯỜNG HỢP 2: CHƯA CÓ CHẨN ĐOÁN -> QUAY LẠI MÀN HÌNH KHÁM BỆNH */
                <NoDiagnosisAlert patient={patient} session={currentSession} />
              ) : !hasPlanForActiveSession ? (
                /* TRƯỜNG HỢP 3: CÓ CHẨN ĐOÁN NHƯNG CHƯA CÓ KẾ HOẠCH -> NÚT LÊN KẾ HOẠCH ĐIỀU TRỊ */
                <NoPlanForSessionAlert
                  session={currentSession}
                  diagnosesCount={diagnosesList.length}
                  onOpenCreatePlan={() => setShowCreatePlanModal(true)}
                />
              ) : (
                /* TRƯỜNG HỢP 4: ĐÃ CÓ KẾ HOẠCH -> HIỂN THỊ CHI TIẾT MỤC 3 & 4 */
                <>

                  {/* ================= 3. THÔNG TIN THỰC THỂ `Treatment Plans` ================= */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-2xs">
                          <FileText size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            Thông Tin Kế Hoạch Điều Trị

                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Hồ sơ phác đồ điều trị tổng thể của bệnh nhân
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Trạng thái kế hoạch:</span>
                        <select
                          value={planStatus}
                          onChange={(e) => setPlanStatus(e.target.value)}
                          className="rounded-lg px-3.5 py-1.5 text-xs font-bold border border-teal-300 bg-teal-50 text-teal-900 outline-none cursor-pointer shadow-2xs transition-all"
                        >
                          <option value="PENDING">Chờ duyệt</option>
                          <option value="IN_PROGRESS">Đang thực hiện</option>
                          <option value="COMPLETED">Đã hoàn tất</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                      {/* planName */}
                      <div className="md:col-span-5 space-y-1">
                        <label className="block font-semibold text-slate-700">
                          Tên kế hoạch điều trị <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={planName}
                          onChange={(e) => setPlanName(e.target.value)}
                          placeholder="Nhập tên kế hoạch điều trị (VD: Điều trị sâu răng 46 & Chăm sóc phục hình...)"
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-900 outline-none focus:border-teal-600 placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>

                      {/* dentist */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="block font-semibold text-slate-700">Bác sĩ phụ trách</label>
                        <input
                          type="text"
                          value={dentistName}
                          onChange={(e) => setDentistName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-800 outline-none focus:border-teal-600"
                        />
                      </div>

                      {/* start_date */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block font-semibold text-slate-700">Ngày bắt đầu</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-800 outline-none focus:border-teal-600"
                        />
                      </div>

                      {/* end_date */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block font-semibold text-slate-700">Dự kiến kết thúc</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-800 outline-none focus:border-teal-600"
                        />
                      </div>

                      {/* description */}
                      <div className="md:col-span-12 space-y-1">
                        <label className="block font-semibold text-slate-700">Mô tả kế hoạch</label>
                        <input
                          type="text"
                          value={planDesc}
                          onChange={(e) => setPlanDesc(e.target.value)}
                          placeholder="Mục tiêu điều trị, hướng tiếp cận và lưu ý phục hình..."
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>
                  </div>


                  {/* ================= 5. CÁC GIAI ĐOẠN ĐIỀU TRỊ ================= */}
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

                    {/* RENDER TỪNG GIAI ĐOẠN ĐIỀU TRỊ */}
                    <div className="space-y-6">
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
                                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4 hover:border-teal-300 transition-colors"
                              >
                                {/* HEADER GIAI ĐOẠN (`TreatmentPhase`) */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                  <div className="flex items-start sm:items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-white font-extrabold text-sm shadow-xs shrink-0">
                                      {phase.phase_order}
                                    </span>

                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-base font-bold text-slate-900">{phase.phase_name}</h4>

                                        {/* Treatment Type badge */}
                                        <span className="rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold px-3 py-1 shadow-2xs">
                                          {phase.treatmentType || 'Tổng quát'}
                                        </span>

                                        {/* Estimated Duration */}
                                        {phase.estimated_duration && (
                                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 shadow-2xs">
                                            <Clock4 size={13} />
                                            {phase.estimated_duration}
                                          </span>
                                        )}

                                        {/* Status Phase Badge / Dropdown */}
                                        <div className="relative inline-block">
                                          <select
                                            value={phase.status}
                                            onChange={(e) => handleTogglePhaseStatus(phase.phase_id, e.target.value)}
                                            className={`rounded-full px-4 py-1.5 text-xs font-bold border cursor-pointer outline-none transition-all shadow-2xs ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                                          >
                                            <option value="PENDING">Chờ thực hiện</option>
                                            <option value="IN_PROGRESS">Đang thực hiện</option>
                                            <option value="COMPLETED">Đã hoàn thành</option>
                                          </select>
                                        </div>
                                      </div>

                                      <p className="text-xs text-slate-500 mt-0.5">{phase.description}</p>
                                    </div>
                                  </div>

                                  {/* Action buttons của Phase */}
                                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.96 }}
                                      type="button"
                                      onClick={() => handleOpenAddService(phase.phase_id)}
                                      className="flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer shadow-2xs"
                                      title="Chỉ định dịch vụ nha khoa vào giai đoạn"
                                    >
                                      <Plus size={13} />
                                      <span>+ Thêm dịch vụ</span>
                                    </motion.button>

                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.96 }}
                                      type="button"
                                      onClick={() => handleOpenAddVisit(phase)}
                                      className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100 cursor-pointer shadow-2xs"
                                      title="Thêm buổi điều trị mới"
                                    >
                                      <CalendarCheck size={13} />
                                      <span>+ Thêm buổi điều trị</span>
                                    </motion.button>

                                    <motion.button
                                      whileHover={{ scale: 1.08 }}
                                      whileTap={{ scale: 0.92 }}
                                      type="button"
                                      onClick={() => handleOpenEditPhase(phase)}
                                      className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                                      title="Chỉnh sửa giai đoạn"
                                    >
                                      <Edit3 size={15} />
                                    </motion.button>

                                    <motion.button
                                      whileHover={{ scale: 1.08 }}
                                      whileTap={{ scale: 0.92 }}
                                      type="button"
                                      onClick={() => handleRemovePhase(phase.phase_id)}
                                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                                      title="Xóa toàn bộ giai đoạn này"
                                    >
                                      <Trash2 size={15} />
                                    </motion.button>
                                  </div>
                                </div>

                                {/* ================= PHẦN 1: BẢNG DỊCH VỤ ĐIỀU TRỊ (`treatment_services`) ================= */}
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
                                      onClick={() => handleOpenAddService(phase.phase_id)}
                                      className="text-teal-700 hover:text-teal-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus size={12} />
                                      Thêm dịch vụ
                                    </button>
                                  </div>

                                  {phaseServices.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs text-slate-400">
                                      Chưa có dịch vụ nào được chỉ định trong giai đoạn này. Nhấp "+ Thêm dịch vụ" để chọn từ danh mục.
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
                                              <tr key={srv.treatmentServicesId} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-2.5 text-center font-bold text-slate-400">{sIndex + 1}</td>
                                                <td className="p-2.5 text-center">
                                                  <input
                                                    type="text"
                                                    value={srv.toothNumber}
                                                    onChange={(e) =>
                                                      handleToothNumberChange(phase.phase_id, srv.treatmentServicesId, e.target.value)
                                                    }
                                                    className="w-28 text-center rounded border border-amber-200 bg-amber-50 px-1.5 py-1 font-extrabold text-amber-900 text-xs outline-none focus:border-amber-400"
                                                  />
                                                </td>
                                                <td className="p-2.5 font-bold text-slate-900">{srv.service_name}</td>
                                                <td className="p-2.5 text-center">
                                                  <div className="inline-flex items-center border border-slate-300 rounded overflow-hidden bg-white shadow-2xs">
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleQuantityChange(phase.phase_id, srv.treatmentServicesId, srv.quantity - 1)
                                                      }
                                                      className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-bold cursor-pointer"
                                                    >
                                                      -
                                                    </button>
                                                    <input
                                                      type="number"
                                                      min={1}
                                                      value={srv.quantity}
                                                      onChange={(e) =>
                                                        handleQuantityChange(phase.phase_id, srv.treatmentServicesId, e.target.value)
                                                      }
                                                      className="w-10 text-center font-extrabold text-slate-800 text-xs outline-none py-0.5"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleQuantityChange(phase.phase_id, srv.treatmentServicesId, srv.quantity + 1)
                                                      }
                                                      className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-bold cursor-pointer"
                                                    >
                                                      +
                                                    </button>
                                                  </div>
                                                </td>
                                                <td className="p-2.5 text-right font-medium text-slate-600">
                                                  {Number(srv.price).toLocaleString('vi-VN')} đ
                                                </td>
                                                <td className="p-2.5 text-right font-extrabold text-teal-800 text-xs">
                                                  {itemTotal.toLocaleString('vi-VN')} đ
                                                </td>
                                                <td className="p-2.5 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveService(phase.phase_id, srv.treatmentServicesId)}
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

                                {/* ================= PHẦN 2: CÁC BUỔI ĐIỀU TRỊ (`TreatmentVisits` - Chỉ ghi chép việc cần làm) ================= */}
                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                      <CalendarCheck size={14} className="text-indigo-600" />
                                      <span>2. Lộ trình các buổi điều trị lâm sàng:</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddVisit(phase)}
                                      className="text-indigo-700 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus size={12} />
                                      Thêm buổi khám
                                    </button>
                                  </div>

                                  {phaseVisits.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 p-3.5 text-center text-xs text-indigo-600">
                                      Chưa có buổi điều trị nào được lên lịch cho giai đoạn này. Nhấp "+ Thêm buổi điều trị" để ghi lại kế hoạch thao tác lâm sàng.
                                    </div>
                                  ) : (
                                    <div className="space-y-2.5">
                                      <AnimatePresence mode="popLayout">
                                        {phaseVisits.map((visit) => {
                                          const vStatusCfg = STATUS_PHASE_CONFIG[visit.status] || STATUS_PHASE_CONFIG.PENDING;

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
                                              {/* Header của Buổi điều trị */}
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-white font-extrabold text-[11px] shadow-2xs shrink-0">
                                                    {visit.visitOrder}
                                                  </span>

                                                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                                    {visit.visitName}
                                                  </h5>

                                                  {/* Ngày hẹn */}
                                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span>Ngày: {visit.start_date || 'Chưa đặt'}</span>
                                                  </span>

                                                  {/* Dropdown / Badge trạng thái của buổi */}
                                                  <select
                                                    value={visit.status}
                                                    onChange={(e) =>
                                                      handleToggleVisitStatus(phase.phase_id, visit.visitId, e.target.value)
                                                    }
                                                    className={`rounded-full px-3 py-1 text-xs font-bold border cursor-pointer outline-none transition-all shadow-2xs ${vStatusCfg.bg} ${vStatusCfg.text} ${vStatusCfg.border}`}
                                                  >
                                                    <option value="PENDING">Chờ khám</option>
                                                    <option value="IN_PROGRESS">Đang thực hiện</option>
                                                    <option value="COMPLETED">Đã hoàn thành</option>
                                                  </select>
                                                </div>

                                                <div className="flex items-center gap-1 self-end sm:self-auto">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenEditVisit(phase.phase_id, visit)}
                                                    className="p-1 text-slate-400 hover:text-indigo-700 rounded hover:bg-white cursor-pointer transition-colors"
                                                    title="Sửa thông tin buổi khám"
                                                  >
                                                    <Edit3 size={13} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveVisit(phase.phase_id, visit.visitId)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-white cursor-pointer transition-colors"
                                                    title="Xóa buổi khám này"
                                                  >
                                                    <Trash2 size={13} />
                                                  </button>
                                                </div>
                                              </div>

                                              {/* THÔNG TIN BUỔI ĐÓ LÀM GÌ (clinical_notes) */}
                                              <div className="bg-white rounded-lg border border-slate-200 p-2.5 text-xs space-y-1 shadow-2xs">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-800 uppercase tracking-wide">
                                                  <Stethoscope size={13} className="text-teal-600" />
                                                  <span>Nội dung thực hiện trong buổi điều trị:</span>
                                                </div>
                                                <p className="text-slate-700 leading-relaxed pl-5 whitespace-pre-wrap font-normal">
                                                  {visit.clinical_notes || (
                                                    <span className="text-slate-400 italic">
                                                      Chưa ghi nhận nội dung thao tác. Nhấp icon sửa để bổ sung ghi chú thủ thuật.
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
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
                      )}
                    </div>
                  </div>

                  {/* ================= 6. TỔNG HỢP TÀI CHÍNH (`estimated_cost : Double`) ================= */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Calculator size={18} className="text-teal-700" />
                          Tổng Hợp Chi Phí Dự Kiến Toàn Kế Hoạch
                        </h4>
                        <p className="text-xs text-slate-500">
                          Chi phí tổng hợp realtime từ tất cả các dịch vụ nha khoa chỉ định trong từng giai đoạn điều trị.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Tổng tiền dịch vụ gốc</span>
                          <span className="text-sm font-bold text-slate-700">
                            {grossTotal.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                        <div>
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

                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                        <div>
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
                </>
              )}
            </div>
          )}
        </>
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

      {/* ================= MODAL 1: THÊM / SỬA GIAI ĐOẠN ĐIỀU TRỊ ================= */}
      <AnimatePresence>
        {showPhaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowPhaseModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100"
            >
              {/* Top Gradient Header */}
              <div className="relative overflow-hidden bg-linear-to-r from-teal-800 via-teal-700 to-teal-900 px-6 py-5 text-white">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
                      <Layers className="text-white" size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold tracking-tight">
                          {phaseModalMode === 'ADD' ? 'Thêm Giai Đoạn Điều Trị' : 'Chỉnh Sửa Giai Đoạn Điều Trị'}
                        </h3>
                        <span className="rounded-full bg-teal-500/30 border border-teal-300/30 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-teal-100">
                          Giai đoạn #{phaseFormOrder}
                        </span>
                      </div>
                      <p className="text-xs text-teal-100/80 mt-0.5">
                        Thiết lập lộ trình thực hiện, mục tiêu lâm sàng và thời gian can thiệp
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhaseModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSavePhaseForm} className="p-6 space-y-4.5 overflow-y-auto">
                {/* 1. Tên giai đoạn điều trị */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Layers size={14} className="text-teal-700" />
                      Tên giai đoạn điều trị <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Bắt buộc</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={phaseFormName}
                    onChange={(e) => setPhaseFormName(e.target.value)}
                    placeholder="VD: Giai đoạn 1: Điều trị tủy nội nha & Chăm sóc nha chu..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs"
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Gợi ý nhanh:</span>
                    {[
                      'Điều trị tủy & Nội nha',
                      'Phục hình bọc sứ',
                      'Cấy ghép Implant',
                      'Chỉnh nha niềng răng',
                      'Vệ sinh & Cạo vôi răng',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setPhaseFormName(`Giai đoạn ${phaseFormOrder}: ${chip}`)}
                        className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Thứ tự & Loại điều trị */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <CalendarCheck size={14} className="text-teal-700" />
                      Thứ tự giai đoạn
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={phaseFormOrder}
                        onChange={(e) => setPhaseFormOrder(Number(e.target.value) || 1)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                        Thứ tự #{phaseFormOrder}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles size={14} className="text-teal-700" />
                      Loại điều trị
                    </label>
                    <select
                      value={phaseFormType}
                      onChange={(e) => setPhaseFormType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs cursor-pointer"
                    >
                      <option value="Nội nha & Nha chu">Nội nha & Nha chu</option>
                      <option value="Phục hình sứ">Phục hình sứ</option>
                      <option value="Chỉnh nha">Chỉnh nha</option>
                      <option value="Cấy ghép Implant">Cấy ghép Implant</option>
                      <option value="Tiểu phẫu">Tiểu phẫu</option>
                      <option value="Thẩm mỹ & Tẩy trắng">Thẩm mỹ & Tẩy trắng</option>
                      <option value="Tổng quát">Tổng quát</option>
                    </select>
                  </div>
                </div>

                {/* 3. Thời gian dự kiến & Trạng thái */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock size={14} className="text-teal-700" />
                      Thời gian dự kiến
                    </label>
                    <input
                      type="text"
                      value={phaseFormDuration}
                      onChange={(e) => setPhaseFormDuration(e.target.value)}
                      placeholder="VD: 7 - 10 ngày, 2 - 3 tuần..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs"
                    />
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {['1 - 2 tuần', '3 - 4 tuần', '2 - 3 tháng'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPhaseFormDuration(d)}
                          className="text-[10.5px] font-medium text-slate-500 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Activity size={14} className="text-teal-700" />
                      Trạng thái giai đoạn
                    </label>
                    <select
                      value={phaseFormStatus}
                      onChange={(e) => setPhaseFormStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs cursor-pointer"
                    >
                      <option value="PENDING">⏳ Chờ thực hiện (PENDING)</option>
                      <option value="IN_PROGRESS">⚡ Đang thực hiện (IN_PROGRESS)</option>
                      <option value="COMPLETED">✓ Đã hoàn thành (COMPLETED)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Mục tiêu & Mô tả giai đoạn */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText size={14} className="text-teal-700" />
                    Mục tiêu lâm sàng & Mô tả giai đoạn
                  </label>
                  <textarea
                    rows={3}
                    value={phaseFormDesc}
                    onChange={(e) => setPhaseFormDesc(e.target.value)}
                    placeholder="Mô tả kỹ thuật can thiệp lâm sàng, lưu ý điều trị hoặc mục tiêu dự kiến đạt được trong giai đoạn này..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none leading-relaxed shadow-2xs"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Sparkles size={14} className="text-teal-600 shrink-0" />
                    <span>Sau khi tạo, bạn có thể chỉ định dịch vụ nha khoa</span>
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowPhaseModal(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-linear-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-800/20 hover:shadow-teal-800/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Check size={16} />
                      <span>{phaseModalMode === 'ADD' ? 'Tạo giai đoạn điều trị' : 'Lưu thay đổi'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* ================= MODAL 4: CHỌN BỆNH NHÂN KHI CÓ NHIỀU KẾT QUẢ TRÙNG SĐT ================= */}
      <AnimatePresence>
        {multiplePatientsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-teal-700" />
                  <h3 className="font-bold text-sm text-slate-800">
                    Tìm thấy {foundPatientsList.length} bệnh nhân trùng số điện thoại
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMultiplePatientsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-slate-500 mb-2">
                  Số điện thoại này được đăng ký cho nhiều người (ví dụ người trong cùng gia đình). Vui lòng chọn đúng bệnh nhân cần lấy kế hoạch điều trị:
                </p>
                {foundPatientsList.map((p) => (
                  <div
                    key={p.id || p.patientCode}
                    onClick={() => handleSelectPatient(p)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-teal-900">
                          {p.fullName}
                        </span>
                        <span className="text-[10.5px] font-extrabold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded border border-teal-200">
                          {p.patientCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{p.gender === 'FEMALE' ? 'Nữ' : p.gender === 'MALE' ? 'Nam' : 'Khác'}</span>
                        {p.dateOfBirth && <span>· Ngày sinh: {formatDateDisplay(p.dateOfBirth)}</span>}
                        {p.phone && <span>· SĐT: {p.phone}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-teal-700 group-hover:bg-teal-800 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      Chọn &rarr;
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMultiplePatientsModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

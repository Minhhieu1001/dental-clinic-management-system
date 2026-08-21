import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ChevronLeft,
  User,
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
  DollarSign,
  Package,
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
  Percent,
  Calculator,
} from 'lucide-react';
import toast from 'react-hot-toast';

// 1. Available Dental Services Catalog (Mapped to Service Entity)
const DENTAL_SERVICES_CATALOG = [
  { service_id: 'srv-1', service_name: 'Trám răng Composite thẩm mỹ', category: 'Trám răng', price: 400000 },
  { service_id: 'srv-2', service_name: 'Điều trị tủy răng (Nội nha)', category: 'Nội nha', price: 1500000 },
  { service_id: 'srv-3', service_name: 'Bọc răng sứ Zirconia cao cấp', category: 'Phục hình sứ', price: 3500000 },
  { service_id: 'srv-4', service_name: 'Mài cùi & Lấy dấu cùi răng kỹ thuật số', category: 'Phục hình sứ', price: 500000 },
  { service_id: 'srv-5', service_name: 'Cạo vôi răng & Đánh bóng toàn hàm', category: 'Vệ sinh', price: 300000 },
  { service_id: 'srv-6', service_name: 'Nhổ răng khôn mọc lệch (R8)', category: 'Tiểu phẫu', price: 1200000 },
  { service_id: 'srv-7', service_name: 'Cấy ghép Implant Straumann Thụy Sĩ', category: 'Implant', price: 18000000 },
  { service_id: 'srv-8', service_name: 'Tẩy trắng răng Laser Whitening', category: 'Thẩm mỹ', price: 2500000 },
];

// 2. Preset Treatment Packages (Gói Dịch Vụ Có Sẵn)
const PRESET_PACKAGES = [
  {
    package_id: 'pkg-1',
    package_name: 'Gói Điều Trị Tủy & Phục Hình Răng Sứ R46 (Tiết kiệm 10%)',
    description: 'Chỉ định cho bệnh nhân sâu ngà sát tủy R46. Gồm 3 giai đoạn triệt để: Điều trị tủy, trám cùi & bọc sứ Zirconia.',
    package_price: 5400000,
    original_price: 5900000,
    badge: 'Khuyên dùng cho R46',
    badgeColor: 'bg-teal-700 text-white',
    phases: [
      {
        phase_name: 'Giai đoạn 1: Điều trị tủy & Vệ sinh nha chu',
        description: 'Lấy sạch tủy viêm, đặt thuốc triệt tủy và cạo vôi răng toàn hàm.',
        services: [
          { service_id: 'srv-2', service_name: 'Điều trị tủy răng (Nội nha)', quantity: 1, price: 1500000 },
          { service_id: 'srv-5', service_name: 'Cạo vôi răng & Đánh bóng toàn hàm', quantity: 1, price: 300000 },
        ],
      },
      {
        phase_name: 'Giai đoạn 2: Trám tái tạo cùi & Mài lấy dấu',
        description: 'Trám tái tạo thân răng và mài cùi răng R46 để lấy dấu gửi Labo.',
        services: [
          { service_id: 'srv-1', service_name: 'Trám răng Composite thẩm mỹ', quantity: 1, price: 400000 },
          { service_id: 'srv-4', service_name: 'Mài cùi & Lấy dấu cùi răng kỹ thuật số', quantity: 1, price: 500000 },
        ],
      },
      {
        phase_name: 'Giai đoạn 3: Thử & Gắn cố định mão sứ Zirconia',
        description: 'Thử khớp cắn mão sứ Zirconia R46 và dán cố định bảo vệ răng.',
        services: [
          { service_id: 'srv-3', service_name: 'Bọc răng sứ Zirconia cao cấp', quantity: 1, price: 3200000 },
        ],
      },
    ],
  },
  {
    package_id: 'pkg-2',
    package_name: 'Gói Trám Răng Thẩm Mỹ & Vệ Sinh Toàn Hàm',
    description: 'Gói nha khẩu tổng quát điều trị các lỗ sâu men/ngà nhẹ và làm sạch vôi răng.',
    package_price: 1000000,
    original_price: 1100000,
    badge: 'Chăm sóc nhanh',
    badgeColor: 'bg-sky-700 text-white',
    phases: [
      {
        phase_name: 'Giai đoạn 1: Cạo vôi & Trám răng sâu',
        description: 'Vệ sinh cao răng và trám Composite màu răng tự nhiên.',
        services: [
          { service_id: 'srv-5', service_name: 'Cạo vôi răng & Đánh bóng toàn hàm', quantity: 1, price: 300000 },
          { service_id: 'srv-1', service_name: 'Trám răng Composite thẩm mỹ', quantity: 2, price: 400000 },
        ],
      },
    ],
  },
  {
    package_id: 'pkg-3',
    package_name: 'Gói Cấy Ghép Implant Straumann Thụy Sĩ Trọn Gói',
    description: 'Phục hồi răng mất trọn gói bao gồm Trụ Implant Straumann, Abutment & Mão sứ.',
    package_price: 19500000,
    original_price: 21500000,
    badge: 'Trọn gói cao cấp',
    badgeColor: 'bg-amber-600 text-white',
    phases: [
      {
        phase_name: 'Giai đoạn 1: Tiểu phẫu đặt trụ Implant',
        description: 'Cấy ghép trụ Implant Straumann Thụy Sĩ vào xương hàm.',
        services: [
          { service_id: 'srv-7', service_name: 'Cấy ghép Implant Straumann Thụy Sĩ', quantity: 1, price: 16000000 },
        ],
      },
      {
        phase_name: 'Giai đoạn 2: Lấy dấu & Phục hình mão sứ trên Implant',
        description: 'Gắn Abutment titan và thử mão sứ Zirconia bắt vít.',
        services: [
          { service_id: 'srv-3', service_name: 'Bọc răng sứ Zirconia cao cấp', quantity: 1, price: 3500000 },
        ],
      },
    ],
  },
  {
    package_id: 'pkg-4',
    package_name: 'Gói Niềng Răng Chỉnh Nha Thẩm Mỹ Mắc Cài 18 Tháng (Trọn gói)',
    description: 'Kế hoạch duy nhất cho toàn bộ lộ trình niềng răng 1.5 năm. Gồm 4 giai đoạn gắn mắc cài, siết răng định kỳ hàng tháng và tháo duy trì.',
    package_price: 28000000,
    original_price: 32000000,
    badge: 'Lộ trình 18 tháng (1 Kế hoạch)',
    badgeColor: 'bg-purple-700 text-white',
    phases: [
      {
        phase_name: 'Giai đoạn 1: Lập phác đồ, Nhổ răng cối nhỏ & Gắn mắc cài 2 hàm (Tháng 1)',
        description: 'Lấy dấu răng 3D, chụp phim Cephalo/Panorex và gắn khí cụ mắc cài kim loại.',
        services: [
          { service_id: 'srv-6', service_name: 'Nhổ răng cối nhỏ tạo khoảng niềng', quantity: 2, price: 1000000 },
          { service_id: 'srv-9', service_name: 'Gắn mắc cài kim loại 2 hàm', quantity: 1, price: 20000000 },
        ],
      },
      {
        phase_name: 'Giai đoạn 2: Tái khám siết mắc cài & Thay dây cung định kỳ hàng tháng (Tháng 2 - Tháng 15)',
        description: 'Tái khám định kỳ mỗi 3-4 tuần để siết dây cung Niti, thay thun chuỗi đóng khoảng.',
        services: [
          { service_id: 'srv-10', service_name: 'Chi phí tái khám siết mắc cài & thay thun (Trọn gói 18 tháng)', quantity: 1, price: 5000000 },
        ],
      },
      {
        phase_name: 'Giai đoạn 3: Tinh chỉnh khớp cắn & Tháo mắc cài (Tháng 16 - Tháng 17)',
        description: 'Kiểm tra khớp cắn lồng khớp chuẩn, tháo hệ thống mắc cài và đánh bóng bề mặt men răng.',
        services: [
          { service_id: 'srv-11', service_name: 'Tháo mắc cài & Đánh bóng men răng', quantity: 1, price: 1000000 },
        ],
      },
      {
        phase_name: 'Giai đoạn 4: Đeo khay duy trì Retainer sau niềng (Tháng 18+)',
        description: 'Làm khay duy trì trong suốt Retainer chống xô lệch răng sau niềng.',
        services: [
          { service_id: 'srv-12', service_name: 'Khay duy trì Retainer trong suốt 2 hàm', quantity: 1, price: 1000000 },
        ],
      },
    ],
  },
];

export default function TreatmentPlans() {
  const location = useLocation();
  const navigate = useNavigate();

  // Passed Diagnosis & Patient Data from Exam Step
  const stateData = location.state || {};
  const patient = stateData.patient || {
    patientCode: 'PA-881460',
    fullName: 'Trần Thị Mai',
    gender: 'FEMALE',
    dateOfBirth: '1990-05-12',
    phone: '0901 234 567',
    allergies: 'Dị ứng nhẹ Lidocaine',
    systemicDisease: 'Huyết áp cao',
  };

  const diagnosisCode = stateData.diagnosis || 'K02.1';
  const toothNo = stateData.selectedTooth || 46;
  const diagnosisNotes = stateData.diagnosisNotes || 'Sâu ngà mặt nhai và mặt gần, chưa ảnh hưởng tủy. Bệnh nhân đau khi ăn nhai.';

  // Plan Details State
  const [planName, setPlanName] = useState(`Kế hoạch điều trị Răng ${toothNo} - ${patient.fullName}`);
  const [planDesc, setPlanDesc] = useState(`Điều trị chuyên khoa theo chẩn đoán ICD-10 (${diagnosisCode}) cho bệnh nhân ${patient.fullName}`);
  const [discountPercent, setDiscountPercent] = useState(5); // 5% discount

  // Active Treatment Phases State (Default initialized with Package 1)
  const [phases, setPhases] = useState(() =>
    PRESET_PACKAGES[0].phases.map((p, idx) => ({
      phase_id: `ph-${idx + 1}`,
      phase_name: p.phase_name,
      phase_order: idx + 1,
      description: p.description,
      status: idx === 0 ? 'COMPLETED' : idx === 1 ? 'IN_PROGRESS' : 'PENDING',
      services: p.services.map((s, sIdx) => ({
        treatment_services_id: `ts-${idx + 1}-${sIdx + 1}`,
        service_id: s.service_id,
        service_name: s.service_name,
        quantity: s.quantity,
        price: s.price,
      })),
    }))
  );

  // Modals state
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDesc, setNewPhaseDesc] = useState('');

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [targetPhaseId, setTargetPhaseId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(DENTAL_SERVICES_CATALOG[0].service_id);
  const [serviceQty, setServiceQty] = useState(1);

  // AUTOMATED REALTIME COST CALCULATIONS
  const grossTotal = useMemo(() => {
    let total = 0;
    phases.forEach((ph) => {
      ph.services.forEach((s) => {
        total += (s.price || 0) * (s.quantity || 1);
      });
    });
    return total;
  }, [phases]);

  const discountAmount = useMemo(() => {
    return Math.round((grossTotal * discountPercent) / 100);
  }, [grossTotal, discountPercent]);

  const netTotal = useMemo(() => {
    return grossTotal - discountAmount;
  }, [grossTotal, discountAmount]);

  // Apply Preset Package Handler
  const handleApplyPackage = (pkg) => {
    const newPhases = pkg.phases.map((p, idx) => ({
      phase_id: `ph-${Date.now()}-${idx}`,
      phase_name: p.phase_name,
      phase_order: idx + 1,
      description: p.description,
      status: idx === 0 ? 'IN_PROGRESS' : 'PENDING',
      services: p.services.map((s, sIdx) => ({
        treatment_services_id: `ts-${Date.now()}-${idx}-${sIdx}`,
        service_id: s.service_id,
        service_name: s.service_name,
        quantity: s.quantity,
        price: s.price,
      })),
    }));

    setPlanName(pkg.package_name);
    setPlanDesc(pkg.description);
    setPhases(newPhases);
    toast.success(`Đã áp dụng ${pkg.package_name}! Tự động tạo các giai đoạn & tính tiền thành công!`, {
      icon: '✨',
      duration: 3000,
    });
  };

  // Add Custom Phase
  const handleAddPhase = (e) => {
    e.preventDefault();
    if (!newPhaseName.trim()) {
      toast.error('Vui lòng nhập tên giai đoạn!');
      return;
    }

    const newPhaseObj = {
      phase_id: `ph-${Date.now()}`,
      phase_name: newPhaseName,
      phase_order: phases.length + 1,
      description: newPhaseDesc || 'Giai đoạn điều trị theo chỉ định của bác sĩ.',
      status: 'PENDING',
      services: [],
    };

    setPhases([...phases, newPhaseObj]);
    setNewPhaseName('');
    setNewPhaseDesc('');
    setShowAddPhaseModal(false);
    toast.success('Đã thêm Giai đoạn điều trị mới!');
  };

  // Add Service to Phase
  const handleAddServiceToPhase = (e) => {
    e.preventDefault();
    const servObj = DENTAL_SERVICES_CATALOG.find((s) => s.service_id === selectedServiceId);
    if (!servObj || !targetPhaseId) return;

    const newServiceItem = {
      treatment_services_id: `ts-${Date.now()}`,
      service_id: servObj.service_id,
      service_name: servObj.service_name,
      quantity: Number(serviceQty),
      price: servObj.price,
    };

    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === targetPhaseId) {
          return {
            ...ph,
            services: [...ph.services, newServiceItem],
          };
        }
        return ph;
      })
    );

    setShowAddServiceModal(false);
    toast.success(`Đã thêm dịch vụ "${servObj.service_name}"! Tự động cập nhật thành tiền.`);
  };

  // Update Service Quantity (Realtime auto recalculation)
  const handleQuantityChange = (phaseId, serviceId, newQty) => {
    const qtyNum = Math.max(1, Number(newQty) || 1);
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            services: ph.services.map((s) =>
              s.treatment_services_id === serviceId ? { ...s, quantity: qtyNum } : s
            ),
          };
        }
        return ph;
      })
    );
  };

  // Remove Service
  const handleRemoveService = (phaseId, serviceId) => {
    setPhases(
      phases.map((ph) => {
        if (ph.phase_id === phaseId) {
          return {
            ...ph,
            services: ph.services.filter((s) => s.treatment_services_id !== serviceId),
          };
        }
        return ph;
      })
    );
    toast.success('Đã xóa dịch vụ khỏi giai đoạn điều trị!');
  };

  // Update Phase Status
  const handleUpdatePhaseStatus = (phaseId, newStatus) => {
    setPhases(
      phases.map((ph) => (ph.phase_id === phaseId ? { ...ph, status: newStatus } : ph))
    );
    toast.success('Đã cập nhật tiến độ giai đoạn!');
  };

  return (
    <div className="mx-auto max-w-[1550px] px-2 sm:px-4 space-y-5 py-2 text-slate-800">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Quay lại Khám bệnh"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <FileSpreadsheet className="text-teal-700" size={24} />
              Quản Lý Kế Hoạch Điều Trị (`TreatmentPlans`)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tạo tiến trình điều trị (TreatmentPhases), chọn gói dịch vụ có sẵn & tự động tính toán tổng chi phí dự kiến.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddPhaseModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={15} className="text-teal-700" />
            <span>+ Thêm giai đoạn mới</span>
          </button>

          <button
            type="button"
            onClick={() => {
              toast.success(`Đã lưu Kế hoạch điều trị "${planName}" thành công!`, {
                icon: '✅',
                duration: 3000,
              });
            }}
            className="flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <Save size={15} />
            <span>Lưu & Phê duyệt kế hoạch</span>
          </button>
        </div>
      </div>

      {/* 2. Top Section: Patient Info & Doctor Diagnosis Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Patient Profile Banner (4 cols) */}
        <div className="lg:col-span-4 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
            alt={patient.fullName}
            className="h-16 w-16 rounded-full object-cover border-2 border-teal-100 shadow-xs shrink-0"
          />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 leading-tight">{patient.fullName}</h2>
              <span className="rounded bg-teal-100 text-teal-800 text-[10px] font-extrabold px-1.5 py-0.5">
                {patient.patientCode}
              </span>
            </div>
            <p className="text-slate-500 font-medium">♀ Nữ · 35 tuổi (12/05/1990)</p>
            <p className="text-slate-600 flex items-center gap-1">
              <Phone size={12} className="text-slate-400" />
              <span>{patient.phone}</span>
            </p>
          </div>
        </div>

        {/* Doctor Diagnosis Banner (8 cols) */}
        <div className="lg:col-span-8 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-extrabold text-teal-800 text-xs flex items-center gap-1.5">
              <Stethoscope size={15} />
              KẾT QUẢ CHẨN ĐOÁN CỦA NHA SĨ
            </span>
            <span className="rounded bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2 py-0.5">
              Vị trí: Răng {toothNo}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Chẩn đoán chính (ICD-10)</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                Sâu ngà ({diagnosisCode}) — Chưa ảnh hưởng tủy
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Ghi chú & Triệu chứng</span>
              <p className="text-slate-700 font-medium mt-0.5">{diagnosisNotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Preset Packages Recommendation (Chọn các Gói Dịch Vụ Có Sẵn) */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={18} />
            Chọn Gói Dịch Vụ Điều Trị Có Sẵn (Preset Packages)
          </h3>
          <span className="text-xs text-slate-500">
            Gợi ý các gói trọn gói tối ưu chi phí cho bệnh nhân
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_PACKAGES.map((pkg) => (
            <div
              key={pkg.package_id}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 hover:border-teal-500 hover:bg-teal-50/20 transition-all space-y-2.5 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded font-extrabold text-[10px] px-2 py-0.5 ${pkg.badgeColor}`}>
                    {pkg.badge}
                  </span>
                  <span className="text-slate-400 line-through text-[11px] font-semibold">
                    {pkg.original_price.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-xs leading-snug">{pkg.package_name}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">{pkg.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Giá trọn gói</span>
                  <span className="text-sm font-extrabold text-teal-800">
                    {pkg.package_price.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPackage(pkg)}
                  className="flex items-center gap-1 rounded bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  <Package size={13} />
                  <span>Áp dụng gói</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Main Treatment Phases & Services Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-teal-700" size={18} />
            Tiến Trình Các Giai Đoạn Điều Trị (`TreatmentPhases`)
          </h3>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span>Tổng số: <strong className="text-teal-800">{phases.length} giai đoạn</strong></span>
          </div>
        </div>

        {/* Render Treatment Phases List */}
        <div className="space-y-4">
          {phases.map((phase, idx) => {
            const isCompleted = phase.status === 'COMPLETED';
            const isInProgress = phase.status === 'IN_PROGRESS';

            // Calculate Phase Subtotal Realtime
            const phaseSubtotal = phase.services.reduce(
              (sum, s) => sum + (s.price || 0) * (s.quantity || 1),
              0
            );

            return (
              <div
                key={phase.phase_id}
                className={`rounded-lg border bg-white p-4 sm:p-5 shadow-2xs transition-all space-y-3 ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isInProgress
                    ? 'border-teal-300 ring-2 ring-teal-600/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Phase Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full font-extrabold text-xs shadow-xs ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isInProgress
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {phase.phase_order}
                    </span>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{phase.phase_name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{phase.description}</p>
                    </div>
                  </div>

                  {/* Status Toggle & Action Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={phase.status}
                      onChange={(e) => handleUpdatePhaseStatus(phase.phase_id, e.target.value)}
                      className={`rounded px-2.5 py-1 text-xs font-bold border outline-none cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isInProgress
                          ? 'bg-teal-50 text-teal-800 border-teal-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <option value="PENDING">Chờ thực hiện (PENDING)</option>
                      <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                      <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetPhaseId(phase.phase_id);
                        setShowAddServiceModal(true);
                      }}
                      className="flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Thêm dịch vụ</span>
                    </button>
                  </div>
                </div>

                {/* Treatment Services Table in Phase */}
                <div className="rounded border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <th className="p-2.5">Dịch vụ nha khoa chỉ định (`TreatmentService`)</th>
                        <th className="p-2.5 text-center w-28">Số lượng</th>
                        <th className="p-2.5 text-right w-32">Đơn giá</th>
                        <th className="p-2.5 text-right w-36">Thành tiền (Tự động)</th>
                        <th className="p-2.5 text-center w-16">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {phase.services.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                            Chưa có dịch vụ nha khoa nào trong giai đoạn này. Nhấp "+ Thêm dịch vụ" để chọn.
                          </td>
                        </tr>
                      ) : (
                        phase.services.map((srv) => {
                          const itemSubtotal = (srv.price || 0) * (srv.quantity || 1);

                          return (
                            <tr key={srv.treatment_services_id} className="hover:bg-slate-50/80">
                              <td className="p-2.5 font-bold text-slate-800">{srv.service_name}</td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={srv.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(phase.phase_id, srv.treatment_services_id, e.target.value)
                                  }
                                  className="w-16 rounded border border-slate-300 px-2 py-1 text-center font-extrabold text-slate-800 outline-none focus:border-teal-600"
                                />
                              </td>
                              <td className="p-2.5 text-right font-medium text-slate-600">
                                {srv.price.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-2.5 text-right font-extrabold text-teal-800">
                                {itemSubtotal.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveService(phase.phase_id, srv.treatment_services_id)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                  title="Xóa dịch vụ"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {phase.services.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-50/80 font-bold border-t border-slate-200 text-xs">
                          <td colSpan={3} className="p-2.5 text-right text-slate-600">
                            Tổng tiền Giai đoạn {phase.phase_order}:
                          </td>
                          <td className="p-2.5 text-right text-teal-900 font-extrabold text-sm">
                            {phaseSubtotal.toLocaleString('vi-VN')} đ
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Bottom Financial Summary Bar (Tự Động Tính Tổng Chi Phí) */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={18} className="text-teal-700" />
              Tổng Hợp Chi Phí Dự Kiến Kế Hoạch Điều Trị
            </h4>
            <p className="text-xs text-slate-500">
              Chi phí tự động cập nhật realtime theo số lượng dịch vụ và mức ưu đãi áp dụng.
            </p>
          </div>

          {/* Realtime Automated Calculations */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tổng tiền gốc</span>
              <span className="text-sm font-bold text-slate-700">
                {grossTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="h-7 w-px bg-slate-200" />

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Ưu đãi / Giảm giá (%)</span>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Number(e.target.value) || 0))}
                  className="w-12 rounded border border-slate-300 px-1.5 py-0.5 text-center font-bold text-xs outline-none"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
                <span className="text-xs font-semibold text-rose-600 ml-1">
                  (-{discountAmount.toLocaleString('vi-VN')} đ)
                </span>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-200" />

            <div>
              <span className="text-[10px] text-teal-700 font-bold uppercase block">Tổng tiền dự kiến</span>
              <span className="text-lg font-extrabold text-teal-800">
                {netTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW PHASE */}
      {showAddPhaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Thêm Giai Đoạn Điều Trị Mới (`TreatmentPhase`)
            </h3>

            <form onSubmit={handleAddPhase} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên giai đoạn</label>
                <input
                  type="text"
                  required
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="VD: Giai đoạn 4: Tháo niềng & Kiểm tra..."
                  className="w-full rounded border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả giai đoạn</label>
                <textarea
                  rows={3}
                  value={newPhaseDesc}
                  onChange={(e) => setNewPhaseDesc(e.target.value)}
                  placeholder="Chi tiết công việc cần thực hiện..."
                  className="w-full rounded border border-slate-300 p-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddPhaseModal(false)}
                  className="rounded border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded bg-teal-700 px-4 py-2 font-bold text-white shadow hover:bg-teal-800 cursor-pointer"
                >
                  Thêm giai đoạn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD SERVICE TO PHASE */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Chỉ Định Dịch Vụ Nha Khoa (`TreatmentService`)
            </h3>

            <form onSubmit={handleAddServiceToPhase} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn dịch vụ nha khoa</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  {DENTAL_SERVICES_CATALOG.map((s) => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.service_name} — {s.price.toLocaleString('vi-VN')} đ
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số lượng</label>
                <input
                  type="number"
                  min={1}
                  value={serviceQty}
                  onChange={(e) => setServiceQty(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="rounded border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded bg-teal-700 px-4 py-2 font-bold text-white shadow hover:bg-teal-800 cursor-pointer"
                >
                  Chỉ định dịch vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

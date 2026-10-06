import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  User,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Phone,
  Receipt,
  Stethoscope,
  Layers,
  MapPin,
} from 'lucide-react';
import { Dialog, DialogContent, Slide } from '@mui/material';
import toast from 'react-hot-toast';
import PatientSearchBar from '../../../../components/ui/search/PatientSearchBar';
import { getPatients, getPatientsByPhone, getPatientByPatientCode, getRawInvoiceDataByPatientCode } from '../../../../services/patient.service';
import { getTreatmentPlansByPatientId } from '../../../../services/treatmentPlan.service';
import { getAllInvoiceDateDesc } from '../../../../services/invoice.service';
import MultiplePatientsModal from '../../../../components/common/MultiplePatientsModal';
import { convertTreatmentPlanToInvoice } from '../../../../utils/invoiceMapper';

// Slide transition mượt chuẩn MUI Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} timeout={300} />;
});

export default function CreateInvoiceModal({ open, onClose, onCreateInvoice }) {
  // State 1: Danh sách bệnh nhân & Search bar props
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [unbilledTreatmentPlans, setUnbilledTreatmentPlans] = useState([]);

  // State hỗ trợ Modal khi 1 SĐT có nhiều hồ sơ bệnh nhân
  const [multiplePatientsModalOpen, setMultiplePatientsModalOpen] = useState(false);
  const [foundPatientsList, setFoundPatientsList] = useState([]);

  // State 2: Đợt điều trị / Kế hoạch điều trị
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Reset rỗng toàn bộ dữ liệu của Modal
  const resetModalState = () => {
    setSelectedPatient(null);
    setPhoneSearchQuery('');
    setTreatmentPlans([]);
    setSelectedPlanId('');
    setSelectedPlan(null);
    setFoundPatientsList([]);
    setMultiplePatientsModalOpen(false);
  };

  // Đóng Modal và reset dữ liệu (Chỉ đóng khi click nút X hoặc Hủy)
  const handleCloseModal = () => {
    resetModalState();
    onClose();
  };

  // Reset dữ liệu rỗng khi mở lẫn khi đóng Modal & Load danh sách bệnh nhân ban đầu cho dropdown
  useEffect(() => {
    resetModalState();

    if (!open) return;

    const fetchInitialPatients = async () => {
      setLoadingPatients(true);
      try {
        const apiPatients = await getPatients();
        const list = Array.isArray(apiPatients) ? apiPatients : [];
        setPatientOptions(list);
      } catch (err) {
        console.warn('Lỗi lấy danh sách bệnh nhân API:', err);
        setPatientOptions([]);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchInitialPatients();
  }, [open]);

  // Hàm chuyển đổi dữ liệu từ API raw-invoice-data vào danh sách Kế hoạch điều trị của Modal
  const parseInvoiceApiResponse = (apiResult) => {
    if (!apiResult) return { patientInfo: null, plans: [] };

    const rootData = apiResult.data || apiResult.result || apiResult;
    const patientInfo = rootData.patientInfo || null;
    const rawPlans = Array.isArray(rootData.unbilledTreatmentPlans)
      ? rootData.unbilledTreatmentPlans
      : Array.isArray(rootData.treatmentPlans)
        ? rootData.treatmentPlans
        : Array.isArray(rootData)
          ? rootData
          : [];

    const mappedPlans = rawPlans.map((plan) => {
      const planId = plan.treatmentPlanId || plan.id || '';
      const planName = plan.planName || '';
      const status = plan.status || '';
      const startDate = plan.startDate || plan.examinationDate || plan.createdAt || '';
      const doctorName = plan.doctorName || '';
      const creatorName = plan.creatorName || doctorName || '';
      const estimatedCost = Number(plan.estimatedCost) || 0;
      const phaseCount = Array.isArray(plan.phases) ? plan.phases.length : 0;

      // Chẩn đoán: chỉ lấy primaryDiagnosis từ danh sách diagnoses, không nối chuỗi khác
      let diagnosisText = '';
      if (Array.isArray(plan.diagnoses)) {
        diagnosisText = plan.diagnoses
          .map((d) => d.primaryDiagnosis)
          .filter(Boolean)
          .join(', ');
      }

      // Chuẩn hóa mảng dịch vụ từ invoiceServices hoặc từ các phases
      const rawServices = Array.isArray(plan.invoiceServices)
        ? plan.invoiceServices
        : Array.isArray(plan.phases)
          ? plan.phases.flatMap((p) => p.services || [])
          : [];

      const services = rawServices.map((s, idx) => {
        const uPrice = Number(s.unitPrice || s.price) || 0;
        const qty = Number(s.quantity) || 1;
        const tot = Number(s.totalAmount) || (uPrice * qty);

        return {
          stt: idx + 1,
          serviceId: s.serviceId || null,
          name: s.serviceName || '',
          toothNumber: s.toothNumber || '',
          price: uPrice,
          quantity: qty,
          total: tot,
        };
      });

      return {
        id: String(planId),
        planName,
        status,
        startDate,
        doctorName,
        creatorName,
        diagnosisText,
        phaseCount,
        estimatedCost,
        services,
        phases: plan.phases || [],
        diagnoses: plan.diagnoses || [],
      };
    });

    return { patientInfo, plans: mappedPlans };
  };

  // Load Kế hoạch điều trị CHƯA LẬP HÓA ĐƠN khi Chọn Bệnh nhân từ API
  useEffect(() => {
    if (!selectedPatient) {
      setTreatmentPlans([]);
      setSelectedPlanId('');
      setSelectedPlan(null);
      return;
    }

    const loadPatientPlans = async () => {
      setLoadingPlans(true);
      try {
        const pCode = selectedPatient.patientCode || selectedPatient.id;
        let apiRes = null;
        try {
          apiRes = await getRawInvoiceDataByPatientCode(pCode);
          setPatientInfo(apiRes.patientInfo);
          setUnbilledTreatmentPlans(apiRes.unbilledTreatmentPlans);
        } catch (e) {
          console.warn('Lỗi gọi API raw invoice data:', e);
        }

        const { patientInfo, plans: mappedPlans } = parseInvoiceApiResponse(apiRes);

        // Cập nhật thông tin Bệnh nhân đầy đủ từ API (địa chỉ, ngày sinh, giới tính...)
        if (patientInfo) {
          const pPhone = patientInfo.phone || '';
          if (pPhone) setPhoneSearchQuery(pPhone);
          setSelectedPatient((prev) => ({
            ...prev,
            ...patientInfo,
            fullName: patientInfo.fullName || prev?.fullName || prev?.patientName || prev?.name || '',
            patientCode: patientInfo.patientCode || prev?.patientCode || '',
            phone: patientInfo.phone || prev?.phone || prev?.phoneNumber || '',
            address: patientInfo.address || prev?.address || prev?.residenceAddress || '',
            gender: patientInfo.gender || prev?.gender || '',
            dateOfBirth: patientInfo.dateOfBirth || prev?.dateOfBirth || '',
          }));
        } else if (pCode) {
          // Bổ sung gọi API lấy thông tin bệnh nhân đầy đủ nếu chưa có
          try {
            const fullPatient = await getPatientByPatientCode(pCode);
            if (fullPatient) {
              const pPhone = fullPatient.phone || fullPatient.phoneNumber || '';
              if (pPhone) setPhoneSearchQuery(pPhone);
              setSelectedPatient((prev) => ({
                ...prev,
                ...fullPatient,
                fullName: fullPatient.fullName || fullPatient.patientName || fullPatient.name || prev?.fullName || '',
                patientCode: fullPatient.patientCode || prev?.patientCode || '',
                phone: fullPatient.phone || fullPatient.phoneNumber || prev?.phone || '',
                address: fullPatient.address || fullPatient.user?.address || fullPatient.residenceAddress || prev?.address || '',
                gender: fullPatient.gender || prev?.gender || '',
                dateOfBirth: fullPatient.dateOfBirth || prev?.dateOfBirth || '',
              }));
            }
          } catch (e) {
            console.warn('Lỗi lấy thông tin bệnh nhân đầy đủ:', e);
          }
        }

        let planList = mappedPlans;

        // Fallback gọi API kế hoạch điều trị cũ nếu API chưa trả về danh sách đợt
        if (planList.length === 0) {
          try {
            const fallbackPlans = await getTreatmentPlansByPatientId(pCode);
            if (Array.isArray(fallbackPlans) && fallbackPlans.length > 0) {
              planList = fallbackPlans.map((plan) => ({
                ...plan,
                doctorName: plan.dentistName || plan.doctor || plan.assignedDentist || '',
                diagnosisText: plan.description || plan.diagnosis || plan.chiefComplaint || '',
                creatorName: plan.createdByName || plan.creator || '',
                phaseCount: Array.isArray(plan.phases) ? plan.phases.length : (plan.numberOfPhases || 0),
                estimatedCost: plan.estimatedCost || 0,
              }));
            }
          } catch (e) {
            console.warn('Fallback API kế hoạch điều trị lỗi:', e);
          }
        }

        // Lấy danh sách hóa đơn đã lập để lọc ra những đợt chưa được lập hóa đơn
        let invoicedPlanIds = new Set();
        try {
          const invRes = await getAllInvoiceDateDesc({ search: pCode });
          const invoices = invRes?.invoices || [];
          invoices.forEach((inv) => {
            if (inv.treatmentPlanId) {
              invoicedPlanIds.add(String(inv.treatmentPlanId));
            }
          });
        } catch (e) {
          console.warn('Không thể lọc danh sách hóa đơn:', e);
        }

        // Lọc các đợt chưa lập hóa đơn
        const unbilledPlans = planList.filter((plan) => {
          const isPaidStatus = plan.status === 'PAID' || plan.status === 'COMPLETED' || plan.status === 'Đã hoàn thành' || plan.status === 'Đã thanh toán';
          const isInvoiced = invoicedPlanIds.has(String(plan.id));
          return !isPaidStatus && !isInvoiced;
        });

        // Sắp xếp ưu tiên đợt mới nhất
        const sortedPlans = [...unbilledPlans].sort((a, b) => {
          const dateA = new Date(a.startDate || 0);
          const dateB = new Date(b.startDate || 0);
          return dateB - dateA;
        });

        // Map thông tin chi tiết từng đợt điều trị
        const plansWithDetails = sortedPlans.map((plan, index) => {
          const dateRaw = plan.startDate;
          let dateFormatted = '';
          if (dateRaw) {
            try {
              const d = new Date(dateRaw);
              if (!isNaN(d.getTime())) {
                dateFormatted = d.toLocaleDateString('vi-VN');
              } else {
                dateFormatted = String(dateRaw).split('T')[0];
              }
            } catch {
              dateFormatted = String(dateRaw).split('T')[0];
            }
          }

          return {
            ...plan,
            dateFormatted,
            isLatest: index === 0,
          };
        });

        setTreatmentPlans(plansWithDetails);

        // Tự động chọn đợt điều trị mới nhất mặc định
        if (plansWithDetails.length > 0) {
          const latest = plansWithDetails[0];
          setSelectedPlanId(latest.id);
          setSelectedPlan(latest);
        } else {
          setSelectedPlanId('');
          setSelectedPlan(null);
        }
      } catch (err) {
        console.error('Lỗi nạp kế hoạch điều trị:', err);
        setTreatmentPlans([]);
        setSelectedPlanId('');
        setSelectedPlan(null);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPatientPlans();
  }, [selectedPatient?.id, selectedPatient?.patientCode]);

  // Xử lý chọn Bệnh nhân (từ Search bar hoặc MultiplePatientsModal)
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setMultiplePatientsModalOpen(false);
    const phone = patient?.phone || patient?.phoneNumber || '';
    if (phone) {
      setPhoneSearchQuery(phone);
    }
  };

  // Xử lý hủy chọn Bệnh nhân
  const handleClearPatient = () => {
    resetModalState();
  };

  // Xử lý Tìm kiếm SĐT từ Search Bar
  const handleSearchPhone = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!phoneSearchQuery || !phoneSearchQuery.trim()) return;

    const query = phoneSearchQuery.trim();
    setSearchingPhone(true);
    try {
      let results = [];
      try {
        const apiRes = await getPatientsByPhone(query);
        results = Array.isArray(apiRes) ? apiRes : apiRes ? [apiRes] : [];
      } catch (err) {
        console.warn('Lỗi tìm kiếm SĐT API:', err);
      }

      // Fallback tìm kiếm trong patientOptions nếu API trực tiếp rỗng
      if (results.length === 0 && patientOptions.length > 0) {
        const qDigits = query.replace(/\D/g, '');
        results = patientOptions.filter((p) => {
          const pPhone = (p.phone || p.phoneNumber || '').replace(/\D/g, '');
          return pPhone && qDigits && pPhone.includes(qDigits);
        });
      }

      if (results.length === 0) {
        toast.error(`Không tìm thấy bệnh nhân nào với SĐT "${query}"!`);
      } else if (results.length === 1) {
        setSelectedPatient(results[0]);
        toast.success(`Đã chọn bệnh nhân: ${results[0].fullName || results[0].patientName || results[0].name}`);
      } else {
        // Có nhiều hơn 1 bệnh nhân trùng SĐT
        setFoundPatientsList(results);
        setMultiplePatientsModalOpen(true);
      }
    } catch (err) {
      console.warn('Lỗi xử lý tìm kiếm SĐT:', err);
      toast.error('Không thể tìm kiếm số điện thoại lúc này.');
    } finally {
      setSearchingPhone(false);
    }
  };

  // Chọn đợt điều trị
  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan.id);
    setSelectedPlan(plan);
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';


  // Nộp Submit: Tạo Hóa đơn nháp và chuyển qua giao diện Chi tiết hóa đơn để xem & lưu
  const handleSubmit = () => {
    if (!selectedPatient) {
      toast.error('Vui lòng chọn bệnh nhân trước khi tạo hóa đơn!');
      return;
    }

    if (!selectedPlan) {
      toast.error('Vui lòng chọn kế hoạch điều trị trước khi tạo hóa đơn!');
      return;
    }

    // Tìm 1 Kế hoạch điều trị được chọn từ mảng unbilledTreatmentPlans dựa theo selectedPlanId / selectedPlan
    const targetPlanId = String(selectedPlanId);
    const chosenPlan = Array.isArray(unbilledTreatmentPlans)
      ? unbilledTreatmentPlans.find((p) => String(p.treatmentPlanId) === String(selectedPlanId))
      : selectedPlan;
    const currentPatient = patientInfo || selectedPatient;
    const draftInvoice = convertTreatmentPlanToInvoice(currentPatient, chosenPlan);

    if (!draftInvoice) {
      toast.error('Không thể tạo bản nháp hóa đơn!');
      return;
    }

    onCreateInvoice(draftInvoice);
    handleCloseModal();
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        handleCloseModal();
      }}
      disableEscapeKeyDown
      TransitionComponent={Transition}
      keepMounted
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          height: '660px',
          minHeight: '660px',
          maxHeight: '92vh',
        },
        sx: {
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
          border: '1px solid #e2e8f0',
          maxWidth: '820px',
          width: '100%',
          height: '660px !important',
          minHeight: '660px !important',
          maxHeight: '92vh !important',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header nhẹ nhàng mượt chuẩn Nha Khoa */}
      <div className="bg-white text-slate-900 px-5 py-3 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
            <Receipt size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-2">
              Tạo Hóa Đơn Thanh Toán Mới
            </h3>
          </div>
        </div>
        <button
          onClick={handleCloseModal}
          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <DialogContent sx={{ padding: '14px 18px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(660px - 57px)' }} className="space-y-2 flex-1">
        {/* PHẦN 1: BỘ TÌM KIẾM BỆNH NHÂN (Tái sử dụng PatientSearchBar) */}
        <div className="bg-white rounded-md p-2.5 border border-slate-200 shadow-2xs shrink-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User size={13} className="text-teal-700" />
            <span>1. Chọn / Tra cứu bệnh nhân cần thanh toán</span>
          </h4>

          <PatientSearchBar
            patientOptions={patientOptions}
            loadingPatientOptions={loadingPatients}
            selectedPatient={selectedPatient}
            selectedPatientId={selectedPatient?.id}
            onSelectPatient={handleSelectPatient}
            onClearPatient={handleClearPatient}
            phoneSearchQuery={phoneSearchQuery}
            setPhoneSearchQuery={setPhoneSearchQuery}
            onSearchPhone={handleSearchPhone}
            searchingPhone={searchingPhone}
            hasPatient={Boolean(selectedPatient)}
            className="p-0 bg-transparent border-0"
            selectLabel="Danh sách bệnh nhân phòng khám:"
            inputLabel="Hoặc tìm nhanh theo SĐT:"
            selectPlaceholder="Chọn bệnh nhân"
          />

          {/* Hồ sơ tóm tắt Bệnh nhân sau khi chọn - Bo góc sm chuẩn ERP */}
          {selectedPatient && (
            <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {(selectedPatient.fullName || selectedPatient.name || 'BN').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {selectedPatient.fullName || selectedPatient.patientName || selectedPatient.name}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                      {selectedPatient.patientCode || selectedPatient.id || 'Mã BN'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone size={11} className="text-slate-400" />
                      {selectedPatient.phone || selectedPatient.phoneNumber || 'Chưa có SĐT'}
                    </span>
                    {selectedPatient.gender && (
                      <span>• Giới tính: {selectedPatient.gender === 'FEMALE' ? 'Nữ' : 'Nam'}</span>
                    )}
                  </div>
                  {/* Địa chỉ ở dưới thông tin */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">
                      {selectedPatient.address || selectedPatient.user?.address || selectedPatient.residenceAddress || 'Chưa cập nhật địa chỉ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PHẦN 2: DANH SÁCH CÁC ĐỢT ĐIỀU TRỊ */}
        <div className="bg-white rounded-md p-2.5 border border-slate-200 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-1.5 shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Stethoscope size={13} className="text-teal-700" />
              <span>2. Chọn đợt điều trị </span>
            </h4>
          </div>

          {!selectedPatient ? (
            <div className="flex-1 min-h-[200px] h-full w-full text-center text-xs text-slate-400 font-medium bg-slate-50/60 rounded-md border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 p-4">
              <Stethoscope size={28} className="text-slate-300" />
              <span>Vui lòng chọn hoặc tra cứu bệnh nhân ở trên để hiển thị danh sách đợt điều trị</span>
            </div>
          ) : loadingPlans ? (
            <div className="flex-1 text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw size={15} className="animate-spin text-teal-600" />
              Đang tải kế hoạch điều trị...
            </div>
          ) : treatmentPlans.length > 0 ? (
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
              {treatmentPlans.map((plan) => {
                const isSelected = String(plan.id) === String(selectedPlanId);

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`px-2.5 py-2 rounded-md border transition-all cursor-pointer relative w-full ${isSelected
                      ? 'bg-teal-50/60 border-teal-600 ring-1 ring-teal-500/30'
                      : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2.5 w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {plan.planName}
                          </span>
                        </div>

                        {/* Mục 2: Ngày lập, Bác sĩ khám, Chẩn đoán của đợt đó */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-slate-400 shrink-0" />
                            <span className="font-medium">Ngày lập:</span> {plan.dateFormatted}
                          </span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <User size={11} className="text-teal-600 shrink-0" />
                            <span className="font-medium">Bác sĩ khám:</span> {plan.doctorName}
                          </span>
                        </div>

                        <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-1">
                          <Stethoscope size={11} className="text-teal-700 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            <strong className="font-semibold text-slate-700">Chẩn đoán:</strong> {plan.diagnosisText}
                          </span>
                        </div>
                      </div>

                      {/* Phía bên phải: Badge Đợt mới nhất & Trạng thái đợt điều trị */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {plan.isLatest && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-2xs">
                              <Sparkles size={10} />
                              Đợt mới nhất
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>Bệnh nhân này hiện không có đợt điều trị nào chưa lập hóa đơn.</span>
              </div>
            </div>
          )}
        </div>

        {/* MỤC 3: TÓM TẮT ĐỢT ĐIỀU TRỊ ĐANG CHỌN (Tên KHĐT, Người lập, Số giai đoạn, Chi phí dự kiến) */}
        <div className="bg-teal-50/80 text-slate-800 p-2.5 rounded-md border border-teal-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex-1 min-w-[260px]">
            <span className="text-[10px] uppercase tracking-wider text-teal-800 font-bold flex items-center gap-1">
              <Layers size={12} className="text-teal-700" />
              3. TÓM TẮT KẾ HOẠCH ĐIỀU TRỊ ĐANG CHỌN:
            </span>
            <h5 className="text-xs font-bold text-slate-900 mt-0.5">
              Tên kế hoạch: <span className="text-teal-900">{selectedPlan ? selectedPlan.planName : ''}</span>
            </h5>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-600 mt-0.5">
              <span><strong>Người lập:</strong> {selectedPlan?.creatorName}</span>
              <span>•</span>
              <span><strong>Giai đoạn:</strong> {selectedPlan ? `${selectedPlan.phaseCount} giai đoạn` : ''}</span>
            </div>
          </div>
          <div className="text-right bg-white px-3.5 py-1.5 rounded-lg border border-teal-200 shadow-2xs shrink-0">
            <span className="text-[9px] text-slate-500 font-bold uppercase block">CHI PHÍ DỰ KIẾN:</span>
            <strong className="text-sm font-black text-teal-800">
              {formatVND(selectedPlan?.estimatedCost || 0)}
            </strong>
          </div>
        </div>

        {/* FOOTER ACTIONS - Chuẩn nút ERP */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedPatient}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
          >
            <CheckCircle2 size={15} />
            <span>Xác nhận & Tạo hóa đơn</span>
          </button>
        </div>
      </DialogContent>

      {/* Modal chọn 1 trong nhiều hồ sơ bệnh nhân trùng SĐT (tái sử dụng từ Khám bệnh) */}
      <MultiplePatientsModal
        isOpen={multiplePatientsModalOpen}
        onClose={() => setMultiplePatientsModalOpen(false)}
        phoneQuery={phoneSearchQuery}
        patientsList={foundPatientsList}
        onSelectPatient={handleSelectPatient}
      />
    </Dialog>
  );
}

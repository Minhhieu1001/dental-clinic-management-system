import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getPatientByPatientCode,
  getPatientsByPhone,
  getPatients,
} from '../../services/patient.service';
import {
  getMedicalRecordsByPatientCode,
  getMedicalRecordById,
  createMedicalRecord,
} from '../../services/medicalRecord.service';
import {
  createExaminationResult,
  updateExaminationResult,
  getExaminationResultsByMedicalRecordId,
  getExaminationResultById,
} from '../../services/examinationResult.service';
import { useAuth } from '../../hooks/useAuth';
import { getDentistsList } from '../../services/dentist.service';
import {
  createToothRecord,
  batchSaveToothRecords,
  getToothRecordsByExaminationResultId,
  deleteToothRecord,
} from '../../services/toothRecord.service';
import { getPrimaryDiagnoses, getToothStatuses } from '../../services/systemDictionary.service';
import {
  analyzeXrayImage,
  getXrayAnalysisHistory,
  saveXrayDoctorReview,
} from '../../services/xrayAi.service';
import {
  mapCariesDepthToLevel,
  mapLocationToBackendEnum,
  mapBackendEnumToLocation,
  mapSeverityToLevelEnum,
} from './clinicalExaminationHelpers';

// Helper chuyển đổi danh sách chẩn đoán từ Backend DTO sang format hiển thị trên UI Frontend
const mapBackendDiagnosesToFrontend = (examResult) => {
  if (!examResult) return [];
  const rawList =
    examResult.diagnoses && examResult.diagnoses.length > 0
      ? examResult.diagnoses
      : examResult.diagnosis
        ? [examResult.diagnosis]
        : [];

  const severityMap = {
    MILD: 'Nhẹ',
    MODERATE: 'Trung bình',
    SEVERE: 'Nặng',
  };

  return rawList.map((d, index) => {
    // Lấy trực tiếp nhãn chẩn đoán chính từ CSDL, không map từ key tĩnh
    const label = d.label || d.primaryDiagnosis || 'Chẩn đoán nha khoa';
    const indication = d.indication || d.diagnosticNotes || '';
    const severity = severityMap[d.level] || 'Trung bình';
    const sources = d.sourceOfInformation
      ? d.sourceOfInformation.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Khám lâm sàng'];

    let scope = 'MULTI_TEETH';
    if (d.toothPosition === 'Toàn hàm') {
      scope = 'FULL_MOUTH';
    } else if (d.toothPosition?.includes('Hàm trên')) {
      scope = 'UPPER_JAW';
    } else if (d.toothPosition?.includes('Hàm dưới')) {
      scope = 'LOWER_JAW';
    }

    return {
      id: d.id ? String(d.id) : `diag-${d.toothPosition || 'pos'}-${index}-${Date.now()}`,
      scope: scope,
      toothPosition: d.toothPosition || 'Toàn hàm',
      primaryDiagnosis: d.primaryDiagnosis || label,
      label: label,
      severity: severity,
      level: d.level,
      indication: indication,
      notes: d.diagnosticNotes || '',
      sources: sources,
      createdAt: d.createdAt
        ? new Date(d.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
  });
};

const ClinicalExamContext = createContext(null);

export function ClinicalExamProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Tab Navigation State: 'clinical' | 'ai' | 'diagnosis'
  const [activeTab, setActiveTab] = useState('clinical');

  // 2. Patient & Record State (Mặc định null nếu không truyền từ màn hình khác)
  const initialPatient = location.state?.patient || (location.state?.patientCode ? { patientCode: location.state.patientCode } : null);
  const [patient, setPatient] = useState(initialPatient);

  const [medicalRecord, setMedicalRecord] = useState(
    location.state?.medicalRecord || null
  );

  const [examReason, setExamReason] = useState(
    location.state?.reason ||
    location.state?.symptoms ||
    location.state?.medicalRecord?.symptoms ||
    location.state?.patient?.symptoms ||
    ''
  );

  const [loadingPatient, setLoadingPatient] = useState(false);

  // 2.2. Tìm kiếm bệnh nhân theo số điện thoại & Selectbox
  const [phoneSearchQuery, setPhoneSearchQuery] = useState(
    location.state?.phone || location.state?.patient?.phone || ''
  );
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatientOptions, setLoadingPatientOptions] = useState(false);
  const [foundPatientsList, setFoundPatientsList] = useState([]);
  const [multiplePatientsModalOpen, setMultiplePatientsModalOpen] = useState(false);

  // 2.5. Treatment Sessions State (Quản lý các đợt điều trị / lần khám)
  const [treatmentSessions, setTreatmentSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isHistoricalSession, setIsHistoricalSession] = useState(false);

  // 3. ExaminationResult State (Kết quả khám lâm sàng)
  const [examinationResultId, setExaminationResultId] = useState(null);
  const [examinationResult, setExaminationResult] = useState(null);

  // 4. Tooth Map & Clinical Examination State
  const [activeMarkingTool, setActiveMarkingTool] = useState(null); // null: Chế độ chọn & xem chi tiết
  const [teethMap, setTeethMap] = useState({});
  const [toothConditions, setToothConditions] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(46);
  const [toothFilter, setToothFilter] = useState('PERMANENT');

  // Chế độ chọn 1 răng (false - mặc định) hoặc chọn nhiều răng (true)
  const [isMultiToothMode, setIsMultiToothMode] = useState(false);
  const [multiSelectedTeeth, setMultiSelectedTeeth] = useState([46]);

  // Form khám chi tiết từng răng đang chọn
  const [cariesStatus, setCariesStatus] = useState('NO');
  const [cariesLocation, setCariesLocation] = useState('Bình thường');
  const [cariesDepth, setCariesDepth] = useState('NORMAL');
  const [painLevel, setPainLevel] = useState('NONE');
  const [mobility, setMobility] = useState('Bình thường');
  const [gingivaStatus, setGingivaStatus] = useState('Bình thường');

  // Danh sách các răng đã khám lấy theo examinationResultId từ CSDL
  const [examinedTeeth, setExaminedTeeth] = useState([]);
  const [isSavingTooth, setIsSavingTooth] = useState(false);
  const [isLoadingTeeth, setIsLoadingTeeth] = useState(false);

  // 5. X-ray & AI Analysis State
  const [xrayTab, setXrayTab] = useState('XRAY');
  const [aiOverlayEnabled, setAiOverlayEnabled] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [xrayAnalysis, setXrayAnalysis] = useState(null); // Kết quả AI đọc phim đang xem
  const [xrayHistory, setXrayHistory] = useState([]); // Lịch sử phim đã phân tích của đợt khám
  const [isLoadingXrayHistory, setIsLoadingXrayHistory] = useState(false);
  const [isXrayModalOpen, setIsXrayModalOpen] = useState(false);
  // Dữ liệu điền sẵn cho modal chẩn đoán (Bước 3) khi bác sĩ chuyển phát hiện AI đã chấp nhận
  const [pendingDiagnosisPrefill, setPendingDiagnosisPrefill] = useState(null);

  // 6. Doctor Diagnosis State
  const [diagnosisScope, setDiagnosisScope] = useState('MULTI_TEETH'); // 'FULL_MOUTH' | 'UPPER_JAW' | 'LOWER_JAW' | 'MULTI_TEETH'
  const [selectedTeethList, setSelectedTeethList] = useState([]);
  const [mainDiagnosis, setMainDiagnosis] = useState('K02.1'); // Sâu ngà (K02.1)
  const [primaryDiagnoses, setPrimaryDiagnoses] = useState([]);
  const [subDiagnosis, setSubDiagnosis] = useState('');
  const [severity, setSeverity] = useState('Trung bình');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');

  const [sources, setSources] = useState({
    clinicalExam: true,
    xray: true,
    photos: true,
    aiSuggestion: true,
  });

  const { user } = useAuth();
  const [resolvedDoctorId, setResolvedDoctorId] = useState(user?.dentistId || user?.id || null);
  const [treatingDoctor, setTreatingDoctor] = useState(user?.fullName || user?.name || 'BS. Nguyễn Trần Phúc Đại');

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      getDentistsList()
        .then((res) => {
          if (!isMounted) return;
          const list = Array.isArray(res) ? res : res?.data || [];
          const currentDentist = list.find(
            (d) =>
              String(d.userId) === String(user.id) ||
              String(d.user?.id) === String(user.id) ||
              String(d.id) === String(user.id)
          );
          if (currentDentist) {
            setResolvedDoctorId(currentDentist.id);
            if (currentDentist.name || currentDentist.fullName) {
              setTreatingDoctor(currentDentist.name || currentDentist.fullName);
            }
          } else {
            setResolvedDoctorId(user.id);
            if (user.fullName || user.username) {
              setTreatingDoctor(user.fullName || user.username);
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            setResolvedDoctorId(user.id);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const currentDoctorId = resolvedDoctorId || user?.dentistId || user?.id || null;

  // Quản lý mở/đóng Modal xác nhận khởi tạo đợt điều trị mới
  const [createSessionModalOpen, setCreateSessionModalOpen] = useState(false);
  const openCreateSessionModal = () => setCreateSessionModalOpen(true);
  const closeCreateSessionModal = () => setCreateSessionModalOpen(false);

  // Quản lý mở/đóng Modal xác nhận lưu chẩn đoán & khóa đợt khám (hoặc cảnh báo chưa có chẩn đoán)
  const [confirmSaveModalOpen, setConfirmSaveModalOpen] = useState(false);
  const openConfirmSaveModal = () => setConfirmSaveModalOpen(true);
  const closeConfirmSaveModal = () => setConfirmSaveModalOpen(false);

  const [isSavingDiagnosis, setIsSavingDiagnosis] = useState(false);

  // Danh sách các kết luận chẩn đoán đã xác nhận trong đợt khám này
  const [diagnosisList, setDiagnosisList] = useState([]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getToothStatuses(), getPrimaryDiagnoses()])
      .then(([toothStatusResponse, diagnosisResponse]) => {
        if (!isMounted) return;

        const toothStatusItems = Array.isArray(toothStatusResponse?.data)
          ? toothStatusResponse.data
          : [];
        const diagnosisItems = Array.isArray(diagnosisResponse?.data)
          ? diagnosisResponse.data
          : [];

        if (toothStatusItems.length > 0) {
          setToothConditions(toothStatusItems.map((item) => {
            const isNormal = item.label === 'Bình thường' || item.toothCode === 'NORMAL';
            return {
              key: item.label,
              label: item.label,
              code: item.toothCode,
              fill: isNormal ? '#F8FAFC' : item.color,
              stroke: isNormal ? '#94A3B8' : item.color,
              text: '#FFFFFF',
              badgeClass: 'bg-slate-100 text-slate-700',
            };
          }));
        }

        if (diagnosisItems.length > 0) {
          setPrimaryDiagnoses(diagnosisItems
            .filter((item) => item.status !== false)
            .map((item) => {
              const name = item.primaryDiagnosisName || '';
              const code = name.match(/^[A-Z][0-9]{2}(?:\.[0-9]+)?/)?.[0] || name;
              return {
                id: item.id,
                code,
                label: name,
                category: 'Chẩn đoán nha khoa',
                indication: '',
                defaultScope: 'MULTI_TEETH',
              };
            }));
        }
      })
      .catch((error) => {
        console.warn('Không thể tải danh mục chẩn đoán và tình trạng răng:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ================= Tải danh sách răng theo ID kết quả khám =================
  const fetchToothRecords = useCallback(async (examResultId) => {
    if (!examResultId) {
      setExaminedTeeth([]);
      setTeethMap({});
      return;
    }
    try {
      setIsLoadingTeeth(true);
      const records = await getToothRecordsByExaminationResultId(examResultId);

      // Transform dữ liệu trả về từ Backend sang format hiển thị trên UI
      // Lấy TRỰC TIẾP giá trị nhãn trạng thái từ label / toothStatus của ToothRecord, không cần map qua maCode
      const transformed = (records || []).map((r) => {
        const statusLabel = r.toothStatus || '';
        return {
          id: r.id,
          examinationResultId: r.examinationResultId || examResultId,
          toothNumber: Number(r.toothNumber),
          toothStatus: statusLabel,
          toothStatusLabel: statusLabel,
          severity: r.severity || null,
          cariesStatus: r.hasCaries ? 'YES' : 'NO',
          cariesLocation: mapBackendEnumToLocation(r.cariesLocation),
          cariesDepth: r.cariesDepth || r.severity || 'NORMAL',
          mobility: r.shake || 'Bình thường',
          gingivaStatus: r.gingivalCondition || 'Bình thường',
          painLevel: r.painType || 'NONE',
          updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
      });

      setExaminedTeeth(transformed);

      // ĐỒNG BỘ TÔ MÀU TRÊN SƠ ĐỒ 32 RĂNG ODONTOGRAM:
      const newTeethMap = {};
      transformed.forEach((item) => {
        newTeethMap[item.toothNumber] = item.toothStatus;
      });
      setTeethMap(newTeethMap);
    } catch (err) {
      console.warn('Lỗi khi tải danh sách ghi nhận răng:', err);
      setExaminedTeeth([]);
      setTeethMap({});
    } finally {
      setIsLoadingTeeth(false);
    }
  }, []);

  // ================= Tải danh sách bệnh nhân cho selectbox =================
  const loadPatientOptions = useCallback(async () => {
    try {
      setLoadingPatientOptions(true);
      const res = await getPatients().catch(() => []);
      const raw = Array.isArray(res) ? res : res?.data || res?.result || [];
      if (Array.isArray(raw)) {
        setPatientOptions(raw);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách bệnh nhân cho selectbox:', err);
    } finally {
      setLoadingPatientOptions(false);
    }
  }, []);

  useEffect(() => {
    loadPatientOptions();
  }, [loadPatientOptions]);

  // ================= Load thông tin bệnh nhân, hồ sơ bệnh án và kết quả khám =================
  const loadPatientDataAndSessions = useCallback(
    async (targetPatient, targetMrId = null, targetExamId = null) => {
      if (!targetPatient) return;
      setLoadingPatient(true);
      try {
        // 1. Nạp và bổ sung thông tin bệnh nhân nếu cần
        let currentPatient = { ...targetPatient };
        if (
          currentPatient.patientCode &&
          (!currentPatient.gender || !currentPatient.fullName || currentPatient.fullName === 'Bệnh nhân')
        ) {
          const fetchedPatient = await getPatientByPatientCode(currentPatient.patientCode).catch(() => null);
          if (fetchedPatient) {
            currentPatient = {
              ...currentPatient,
              ...fetchedPatient,
              phone: fetchedPatient.phone || fetchedPatient.phoneNumber || currentPatient.phone,
            };
          }
        }
        setPatient(currentPatient);
        if (currentPatient.phone || currentPatient.phoneNumber) {
          setPhoneSearchQuery(currentPatient.phone || currentPatient.phoneNumber);
        }

        // 2. Tải danh sách hồ sơ bệnh án của bệnh nhân
        let records = [];
        if (currentPatient.patientCode) {
          records = await getMedicalRecordsByPatientCode(currentPatient.patientCode).catch(() => []);
        }

        let fetchedRecord = null;
        if (targetMrId) {
          fetchedRecord = await getMedicalRecordById(targetMrId).catch(() => null);
        } else if (records.length > 0) {
          fetchedRecord = records[0];
        }

        // Nếu bệnh nhân chưa có MedicalRecord nào, tự tạo 1 MedicalRecord mặc định
        if (!fetchedRecord && (currentPatient.id || currentPatient.patientCode)) {
          try {
            fetchedRecord = await createMedicalRecord({
              patientId: currentPatient.id,
              patientCode: currentPatient.patientCode,
              recordDate: new Date().toISOString(),
              symptoms: currentPatient.symptoms || '',
              diagnosis: 'Thăm khám răng miệng',
              treatmentNotes: 'Khởi tạo hồ sơ khám bệnh',
            });
          } catch (e) {
            console.warn('Không thể tự tạo hồ sơ bệnh án mới:', e);
          }
        }

        const activeMrId = fetchedRecord?.id || targetMrId || (records.length > 0 ? records[0].id : null);
        if (fetchedRecord) {
          setMedicalRecord(fetchedRecord);
        }

        // 3. TẢI TOÀN BỘ DANH SÁCH ĐỢT KHÁM (ExaminationResult) CỦA BỆNH NHÂN NÀY TỪ CSDL
        let examResults = [];
        if (records.length > 0) {
          const allExamsPromises = records.map((r) =>
            getExaminationResultsByMedicalRecordId(r.id).catch(() => [])
          );
          const allExamsArrays = await Promise.all(allExamsPromises);
          examResults = allExamsArrays.flat();
        } else if (activeMrId) {
          examResults = await getExaminationResultsByMedicalRecordId(activeMrId).catch(() => []);
        }

        // Lọc trùng theo id
        const uniqueExamsMap = new Map();
        examResults.forEach((ex) => {
          if (ex?.id && !uniqueExamsMap.has(String(ex.id))) {
            uniqueExamsMap.set(String(ex.id), ex);
          }
        });
        examResults = Array.from(uniqueExamsMap.values());

        // Sắp xếp ngày khám mới nhất lên đầu
        examResults.sort((a, b) => new Date(b.examinationDate || 0) - new Date(a.examinationDate || 0));

        // Nếu có passedExamId mà chưa có trong danh sách, thử xác thực từ CSDL
        if (targetExamId && !uniqueExamsMap.has(String(targetExamId))) {
          try {
            const fetchedExam = await getExaminationResultById(targetExamId);
            if (fetchedExam?.id) {
              uniqueExamsMap.set(String(fetchedExam.id), fetchedExam);
              examResults.unshift(fetchedExam);
            }
          } catch (e) {
            // Không phải ID kết quả khám thực tế (ví dụ là medicalRecordId), không tạo kết quả giả
            console.info('targetExamId không phải là ExaminationResult:', targetExamId);
          }
        }

        // 4. Biến đổi danh sách ExaminationResult thật từ CSDL thành danh sách đợt điều trị
        const totalExams = examResults.length;
        const realSessions = examResults.map((exam, index) => {
          const dateObj = exam.examinationDate ? new Date(exam.examinationDate) : new Date();
          const dateDisplay = dateObj.toLocaleDateString('vi-VN');
          const isCurrent = index === 0;
          // QUAN TRỌNG: Chỉ khóa khi exam.disabled === false. Loại bỏ hoàn toàn logic ép xem theo !isCurrent.
          const isLocked = exam.disabled === false || exam.disabled === 'false';
          const diagText = exam.diagnosis?.primaryDiagnosis || exam.chiefComplaint || 'Thăm khám răng hàm mặt';
          const orderNum = totalExams - index;

          return {
            id: String(exam.id),
            label: `Đợt ${orderNum}`,
            date: dateDisplay,
            recordDate: exam.examinationDate,
            diagnosis: diagText,
            symptoms: exam.chiefComplaint || 'Khám răng hàm mặt',
            dentistName: treatingDoctor,
            isCurrent: isCurrent,
            isLocked: isLocked,
            disabled: exam.disabled,
            isRealDb: true,
            medicalRecord: fetchedRecord,
            examinationResultId: String(exam.id),
            examinationResult: exam,
          };
        });

        // NẾU BỆNH NHÂN CHƯA CÓ BẤT KỲ ĐỢT KHÁM NÀO:
        // Tuyệt đối không tự sinh đợt giả; để danh sách rỗng để hiển thị màn hình Empty State
        if (realSessions.length === 0) {
          setTreatmentSessions([]);
          setSelectedSessionId(null);
          setIsHistoricalSession(false);
          setExaminationResultId(null);
          setExaminationResult(null);
          setDiagnosisList([]);
          setDiagnosisNotes('');
          setTeethMap({});
          setExaminedTeeth([]);
          setExamReason('');
        } else {
          setTreatmentSessions(realSessions);

          // 5. Chọn đợt khám đang mở: ưu tiên targetExamId hoặc đợt đầu tiên (mới nhất)
          let activeSession = realSessions[0];
          if (targetExamId) {
            const found = realSessions.find(
              (s) => String(s.examinationResultId) === String(targetExamId) || String(s.id) === String(targetExamId)
            );
            if (found) activeSession = found;
          }

          setSelectedSessionId(String(activeSession.id));
          const isSessionLocked =
            activeSession.disabled === false ||
            activeSession.disabled === 'false' ||
            activeSession.examinationResult?.disabled === false ||
            activeSession.examinationResult?.disabled === 'false';
          setIsHistoricalSession(isSessionLocked);
          setExaminationResultId(activeSession.examinationResultId ? String(activeSession.examinationResultId) : null);

          if (activeSession.examinationResult) {
            setExaminationResult(activeSession.examinationResult);
            if (activeSession.examinationResult.chiefComplaint) {
              setExamReason(activeSession.examinationResult.chiefComplaint);
            } else if (activeSession.symptoms) {
              setExamReason(activeSession.symptoms);
            } else {
              setExamReason('');
            }
            if (activeSession.examinationResult.dentistName) {
              setTreatingDoctor(activeSession.examinationResult.dentistName);
            }
            if (activeSession.examinationResult.diagnosis) {
              const diag = activeSession.examinationResult.diagnosis;
              if (diag.primaryDiagnosis) setMainDiagnosis(diag.primaryDiagnosis);
              setDiagnosisNotes(diag.diagnosticNotes || '');
            } else {
              setDiagnosisNotes('');
            }
            const mappedDiagnoses = mapBackendDiagnosesToFrontend(activeSession.examinationResult);
            setDiagnosisList(mappedDiagnoses);
          } else {
            setDiagnosisList([]);
            setDiagnosisNotes('');
          }

          // Tải danh sách răng theo ID kết quả khám của đợt này
          if (activeSession.examinationResultId) {
            await fetchToothRecords(activeSession.examinationResultId);
          } else {
            setTeethMap({});
            setExaminedTeeth([]);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải dữ liệu khám bệnh:', err);
      } finally {
        setLoadingPatient(false);
      }
    },
    [fetchToothRecords]
  );

  const initialLoadDoneRef = useRef(false);
  const prevLocationKeyRef = useRef(location.key);

  useEffect(() => {
    if (prevLocationKeyRef.current !== location.key) {
      prevLocationKeyRef.current = location.key;
      initialLoadDoneRef.current = false;
    }
  }, [location.key]);

  // Tải dữ liệu ban đầu nếu được truyền qua location.state
  useEffect(() => {
    if (initialLoadDoneRef.current) return;

    const passedPatient = location.state?.patient;
    const pCode = location.state?.patientCode || passedPatient?.patientCode;
    const mrId = location.state?.medicalRecordId || location.state?.medicalRecord?.id;
    const passedExamId = location.state?.examinationResultId;

    if (passedPatient || pCode || mrId || passedExamId) {
      initialLoadDoneRef.current = true;
      const targetP = passedPatient || (pCode ? { patientCode: pCode } : null);
      if (targetP) {
        loadPatientDataAndSessions(targetP, mrId, passedExamId);
      }
    }
  }, [location.state, loadPatientDataAndSessions]);

  // ================= Tìm kiếm bệnh nhân theo số điện thoại =================
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

      // Fallback tìm trong danh sách patientOptions nếu API trực tiếp rỗng
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
        await loadPatientDataAndSessions(results[0]);
        toast.success(`Đã nạp hồ sơ bệnh nhân: ${results[0].fullName || results[0].patientName}`);
      } else {
        // Có nhiều bệnh nhân trùng số điện thoại (ví dụ gia đình)
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

  // ================= Chọn bệnh nhân từ Selectbox hoặc Modal =================
  const handleSelectPatient = async (selectedPatient) => {
    if (!selectedPatient) return;
    setMultiplePatientsModalOpen(false);
    await loadPatientDataAndSessions(selectedPatient);
    toast.success(`Đã chọn bệnh nhân: ${selectedPatient.fullName}`);
  };

  // ================= Đóng hồ sơ / Xóa thông tin để tìm kiếm người khác =================
  const handleClearPatient = () => {
    setPatient(null);
    setMedicalRecord(null);
    setTreatmentSessions([]);
    setSelectedSessionId(null);
    setExaminationResultId(null);
    setExaminationResult(null);
    setExaminedTeeth([]);
    setTeethMap({});
    setDiagnosisList([]);
    setDiagnosisNotes('');
    setExamReason('');
    setPhoneSearchQuery('');
    setFoundPatientsList([]);
    setMultiplePatientsModalOpen(false);
    toast.success('Đã đóng hồ sơ để tìm kiếm bệnh nhân khác');
  };

  // ================= Chọn đợt điều trị để xem / map lại thông tin =================
  const handleSelectTreatmentSession = async (sessionId) => {
    const sessionStr = String(sessionId);
    setSelectedSessionId(sessionStr);
    const session = treatmentSessions.find(
      (s) => String(s.id) === sessionStr || String(s.examinationResultId) === sessionStr
    );
    if (!session) return;

    const isHistorical =
      session.disabled === false ||
      session.disabled === 'false' ||
      session.examinationResult?.disabled === false ||
      session.examinationResult?.disabled === 'false';
    setIsHistoricalSession(isHistorical);

    // Khi chuyển sang đợt lịch sử, tắt công cụ tô màu nếu đang bật
    if (isHistorical) {
      setActiveMarkingTool(null);
    }

    if (session.medicalRecord) {
      setMedicalRecord(session.medicalRecord);
    }
    if (session.symptoms) {
      setExamReason(session.symptoms);
    }

    // Reset răng và chẩn đoán trước khi load đợt mới để tránh dữ liệu đợt cũ bị lưu lại
    setTeethMap({});
    setExaminedTeeth([]);

    if (session.examinationResultId) {
      setExaminationResultId(String(session.examinationResultId));
      if (session.examinationResult) {
        setExaminationResult(session.examinationResult);
        if (session.examinationResult.chiefComplaint) {
          setExamReason(session.examinationResult.chiefComplaint);
        }
        if (session.examinationResult.diagnosis) {
          const diag = session.examinationResult.diagnosis;
          if (diag.primaryDiagnosis) setMainDiagnosis(diag.primaryDiagnosis);
          setDiagnosisNotes(diag.diagnosticNotes || '');
        } else {
          setDiagnosisNotes('');
        }
        const mappedDiagnoses = mapBackendDiagnosesToFrontend(session.examinationResult);
        setDiagnosisList(mappedDiagnoses);
      } else {
        setDiagnosisList([]);
        setDiagnosisNotes('');
      }
      await fetchToothRecords(session.examinationResultId);
    } else {
      setExaminationResultId(null);
      setDiagnosisList([]);
      setDiagnosisNotes('');
    }

    toast.success(`Đã chuyển sang: ${session.label} (${session.date})`);
  };

  // ================= Khởi tạo đợt điều trị mới của hồ sơ bệnh án này =================
  const handleCreateNewTreatmentSession = async (formData = null) => {
    // Nếu chưa có formData (bấm nút ngoài UI), mở Modal Form xác nhận để nha sĩ kiểm tra
    if (!formData) {
      setCreateSessionModalOpen(true);
      return;
    }

    try {
      if (!formData.branchId) throw new Error('Vui lòng tải cơ sở khám của bác sĩ trước khi tạo đợt điều trị.');
      toast.loading('Đang khởi tạo đợt điều trị mới...', { id: 'create-session' });

      let currentMrId = medicalRecord?.id || location.state?.medicalRecordId || location.state?.medicalRecord?.id;

      // Nếu chưa có medicalRecord trong CSDL, tạo mới trước
      if (!currentMrId) {
        if (patient?.id || patient?.patientCode) {
          const payload = {
            patientId: patient.id,
            patientCode: patient.patientCode,
            branchId: formData.branchId,
            recordDate: formData.examinationDate
              ? new Date(formData.examinationDate).toISOString()
              : new Date().toISOString(),
            symptoms: formData.chiefComplaint || examReason || 'Khám theo dõi điều trị đợt tiếp theo',
            diagnosis: 'Theo dõi tiến trình răng miệng',
            treatmentNotes: formData.notes || 'Khởi tạo đợt điều trị mới',
          };
          const newMr = await createMedicalRecord(payload).catch(() => null);
          if (newMr?.id) {
            currentMrId = newMr.id;
            setMedicalRecord(newMr);
          }
        }
      }

      if (!currentMrId) {
        throw new Error('Không tìm thấy Hồ sơ bệnh án để tạo đợt khám mới');
      }

      const assignedDoctor = formData.doctorName?.trim() || treatingDoctor || 'BS. Nha khoa Crown';

      // Luôn kết hợp ngày được chọn với giờ:phút:giây hiện tại (theo giờ địa phương, không dùng UTC để tránh lệch giờ)
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      let examDateTimeIso;
      if (formData.examinationDate) {
        const parts = formData.examinationDate.split('-').map(Number);
        if (parts.length === 3) {
          examDateTimeIso = `${parts[0]}-${pad(parts[1])}-${pad(parts[2])}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        } else {
          examDateTimeIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        }
      } else {
        examDateTimeIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      }

      // Tạo ExaminationResult mới trong CSDL (mới tạo: disabled = true, tức mở để khám)
      const examRes = await createExaminationResult({
        medicalRecordId: currentMrId,
        dentistId: currentDoctorId,
        branchId: formData.branchId,
        chiefComplaint: formData.chiefComplaint?.trim() || 'Khám theo dõi điều trị đợt tiếp theo',
        examinationDate: examDateTimeIso,
        disabled: true,
      });

      if (!examRes || !examRes.id) {
        throw new Error('Máy chủ không phản hồi ID kết quả khám mới');
      }

      if (assignedDoctor) {
        setTreatingDoctor(assignedDoctor);
      }

      // Tải lại toàn bộ danh sách đợt khám thật từ CSDL và chọn đợt mới vừa tạo
      await loadPatientDataAndSessions(patient, currentMrId, String(examRes.id));

      // Thiết lập trạng thái phiên khám mới hoàn toàn sạch sẽ
      setSelectedSessionId(String(examRes.id));
      setIsHistoricalSession(false);
      setActiveMarkingTool(null);
      setExaminationResultId(String(examRes.id));
      setExaminationResult(examRes);
      setExamReason(formData.chiefComplaint || examRes.chiefComplaint || '');
      setTeethMap({});
      setExaminedTeeth([]);
      setDiagnosisList([]);
      setDiagnosisNotes(formData.notes || '');
      setActiveTab('clinical');

      // Cập nhật history state ngầm
      try {
        window.history.replaceState(
          {
            ...window.history.state,
            usr: {
              patient,
              examinationResultId: String(examRes.id),
              medicalRecordId: currentMrId,
            },
          },
          ''
        );
      } catch { }

      toast.success('Đã khởi tạo đợt điều trị mới thành công!', { id: 'create-session' });
    } catch (err) {
      console.error('Lỗi khởi tạo đợt điều trị mới:', err);
      toast.error('Không thể tạo đợt điều trị mới: ' + (err.response?.data?.message || err.message), {
        id: 'create-session',
      });
      throw err;
    }
  };

  // Helper nạp chi tiết răng vào form khám lâm sàng
  const loadToothDetailsToForm = (record) => {
    if (record) {
      setCariesStatus(record.cariesStatus || 'NO');
      setMobility(record.mobility || 'Bình thường');
      setCariesLocation(record.cariesLocation || 'Bình thường');
      setGingivaStatus(record.gingivaStatus || 'Bình thường');
      setCariesDepth(record.cariesDepth || 'NORMAL');
      setPainLevel(record.painLevel || 'NONE');
    } else {
      setCariesStatus('NO');
      setMobility('Bình thường');
      setCariesLocation('Bình thường');
      setGingivaStatus('Bình thường');
      setCariesDepth('NORMAL');
      setPainLevel('NONE');
    }
  };

  // ================= Xử lý khi chọn 1 răng trên sơ đồ =================
  const handleToothClick = (toothNo) => {
    const toothNumber = Number(toothNo);

    // Khi ở chế độ xem lịch sử, chỉ chọn răng để xem chi tiết chứ KHÔNG cho thao tác tô màu sơ đồ răng
    if (isHistoricalSession) {
      setSelectedTooth(toothNumber);
      setMultiSelectedTeeth([toothNumber]);
      const existing = examinedTeeth.find((t) => Number(t.toothNumber) === toothNumber);
      loadToothDetailsToForm(existing);
      return;
    }

    if (!isMultiToothMode) {
      // -------------------------------------------------------------
      // 1. CHẾ ĐỘ CHỌN 1 RĂNG (MẶC ĐỊNH):
      // Khi chọn trạng thái sau đó chọn răng thì răng đó chuyển màu trạng thái đó.
      // Khi chuyển sang răng khác thì răng được chọn chuyển màu, còn răng trước đó quay ngược lại bình thường
      // -------------------------------------------------------------
      const prevTooth = selectedTooth;
      setSelectedTooth(toothNumber);
      setMultiSelectedTeeth([toothNumber]);

      setTeethMap((prevMap) => {
        const nextMap = { ...prevMap };

        // Phục hồi răng trước đó về trạng thái trong DB (hoặc xóa/NORMAL nếu chưa lưu)
        if (prevTooth && prevTooth !== toothNumber) {
          const prevSaved = examinedTeeth.find((t) => Number(t.toothNumber) === prevTooth);
          if (prevSaved) {
            nextMap[prevTooth] = prevSaved.toothStatus;
          } else {
            delete nextMap[prevTooth];
          }
        }

        // Gán trạng thái đang chọn cho răng mới (nếu có activeMarkingTool)
        if (activeMarkingTool) {
          nextMap[toothNumber] = activeMarkingTool;
        }

        return nextMap;
      });

      if (activeMarkingTool) {
        const toolObj = toothConditions.find((c) => c.key === activeMarkingTool);
        toast.success(`Đã đánh dấu Răng ${toothNumber}: ${toolObj?.label || activeMarkingTool}`, {
          duration: 1200,
        });
      }

      // Nạp thông tin chi tiết vào form
      const existing = examinedTeeth.find((t) => Number(t.toothNumber) === toothNumber);
      loadToothDetailsToForm(existing);
    } else {
      // -------------------------------------------------------------
      // 2. CHẾ ĐỘ CHỌN NHIỀU RĂNG:
      // Cho phép chọn nhiều răng, mỗi răng được chọn sẽ lưu/gán trạng thái đó.
      // Click lại vào răng đã chọn sẽ bỏ chọn răng đó.
      // -------------------------------------------------------------
      setSelectedTooth(toothNumber);

      const isAlreadyInList = multiSelectedTeeth.includes(toothNumber);

      if (isAlreadyInList) {
        // Bỏ chọn răng khỏi danh sách chọn nhiều răng
        const nextList = multiSelectedTeeth.filter((t) => t !== toothNumber);
        setMultiSelectedTeeth(nextList);

        // Khôi phục răng này về trạng thái đã lưu trong DB (hoặc xóa/NORMAL nếu chưa lưu)
        setTeethMap((prevMap) => {
          const nextMap = { ...prevMap };
          const saved = examinedTeeth.find((t) => Number(t.toothNumber) === toothNumber);
          if (saved) {
            nextMap[toothNumber] = saved.toothStatus;
          } else {
            delete nextMap[toothNumber];
          }
          return nextMap;
        });

        toast.info(`Đã bỏ chọn Răng ${toothNumber}`, { duration: 1000 });
      } else {
        // Thêm răng này vào danh sách chọn nhiều răng
        const nextList = [...multiSelectedTeeth, toothNumber].sort((a, b) => a - b);
        setMultiSelectedTeeth(nextList);

        // Gán trạng thái đang chọn (ưu tiên activeMarkingTool hoặc trạng thái hiện tại)
        const condToApply = activeMarkingTool || teethMap[selectedTooth] || 'Sâu răng';
        setTeethMap((prevMap) => ({
          ...prevMap,
          [toothNumber]: condToApply,
        }));

        const toolObj = toothConditions.find((c) => c.key === condToApply);
        toast.success(`Đã chọn thêm Răng ${toothNumber} (${toolObj?.label || condToApply})`, {
          duration: 1200,
        });
      }

      // Nạp chi tiết form từ răng được click
      const existing = examinedTeeth.find((t) => Number(t.toothNumber) === toothNumber);
      if (existing) {
        loadToothDetailsToForm(existing);
      }
    }
  };

  // Chuyển đổi giữa chế độ chọn 1 răng và chọn nhiều răng
  const handleToggleMultiToothMode = (enabled) => {
    setIsMultiToothMode(enabled);
    if (!enabled) {
      // Chuyển về chọn 1 răng:
      // Giữ lại selectedTooth, và phục hồi các răng chưa lưu khác về trạng thái DB
      setMultiSelectedTeeth([selectedTooth]);
      setTeethMap((prevMap) => {
        const nextMap = {};
        examinedTeeth.forEach((item) => {
          nextMap[item.toothNumber] = item.toothStatus;
        });
        if (selectedTooth && prevMap[selectedTooth]) {
          nextMap[selectedTooth] = prevMap[selectedTooth];
        }
        return nextMap;
      });
      toast.info('Chế độ: Chọn 1 răng', { duration: 1200 });
    } else {
      // Chuyển sang chọn nhiều răng:
      const initialList = selectedTooth ? [selectedTooth] : [];
      setMultiSelectedTeeth(initialList);
      toast.info('Chế độ: Chọn nhiều răng (Áp dụng cùng 1 tình trạng)', { duration: 1500 });
    }
  };

  // Đổi tình trạng răng (Áp dụng cho 1 răng hoặc tất cả các răng đang chọn)
  const handleChangeToothCondition = (condKey) => {
    if (isHistoricalSession) return;
    setActiveMarkingTool(condKey);

    if (isMultiToothMode && multiSelectedTeeth.length > 0) {
      setTeethMap((prev) => {
        const next = { ...prev };
        multiSelectedTeeth.forEach((t) => {
          next[t] = condKey;
        });
        return next;
      });
      const condObj = toothConditions.find((c) => c.key === condKey);
      toast.success(`Đã cập nhật ${multiSelectedTeeth.length} răng sang: ${condObj?.label || condKey}`, {
        duration: 1200,
      });
    } else {
      setTeethMap((prev) => ({
        ...prev,
        [selectedTooth]: condKey,
      }));
      const condObj = toothConditions.find((c) => c.key === condKey);
      toast.success(`Đã đổi tình trạng Răng ${selectedTooth}: ${condObj?.label || condKey}`, {
        duration: 1200,
      });
    }
  };

  // ================= LƯU THÔNG TIN RĂNG VÀO CSDL DỰA TRÊN ĐỢT KHÁM HIỆN TẠI =================
  const handleSaveToothRecord = async () => {
    try {
      if (isHistoricalSession) {
        toast.error(
          'Bạn đang xem lịch sử đợt khám trước (chế độ chỉ xem). Vui lòng chọn đợt hiện tại hoặc bấm "+ Tạo đợt điều trị mới" để lưu thông tin khám!',
          { duration: 4000 }
        );
        return;
      }

      // Xác định danh sách răng cần lưu
      const targetTeeth = isMultiToothMode && multiSelectedTeeth.length > 0
        ? multiSelectedTeeth
        : [selectedTooth];

      if (targetTeeth.length === 0) {
        toast.error('Vui lòng chọn ít nhất một răng để lưu!');
        return;
      }

      setIsSavingTooth(true);

      let currentExamResultId = examinationResultId;
      if (!currentExamResultId || currentExamResultId.startsWith('session-empty-')) {
        let currentMrId = medicalRecord?.id || location.state?.medicalRecordId || location.state?.medicalRecord?.id;
        if (!currentMrId && patient?.patientCode) {
          const records = await getMedicalRecordsByPatientCode(patient.patientCode).catch(() => []);
          if (records.length > 0) currentMrId = records[0].id;
        }
        if (!currentMrId && (patient?.id || patient?.patientCode)) {
          const newMr = await createMedicalRecord({
            patientId: patient.id,
            patientCode: patient.patientCode,
            recordDate: new Date().toISOString(),
            symptoms: examReason || 'Khám răng hàm mặt định kỳ',
            diagnosis: 'Thăm khám răng miệng',
            treatmentNotes: 'Khởi tạo hồ sơ khám bệnh',
          }).catch(() => null);
          if (newMr?.id) {
            currentMrId = newMr.id;
            setMedicalRecord(newMr);
          }
        }
        if (!currentMrId) {
          toast.error('Chưa có hồ sơ bệnh án để lưu thông tin khám!');
          setIsSavingTooth(false);
          return;
        }
        const createdExam = await createExaminationResult({
          medicalRecordId: currentMrId,
          dentistId: currentDoctorId,
          chiefComplaint: examReason || 'Khám răng hàm mặt định kỳ',
          examinationDate: new Date().toISOString(),
        });
        currentExamResultId = String(createdExam.id);
        setExaminationResultId(currentExamResultId);
        setExaminationResult(createdExam);
        setTreatmentSessions((prev) =>
          prev.map((s, idx) =>
            idx === 0
              ? {
                ...s,
                id: currentExamResultId,
                examinationResultId: currentExamResultId,
                isRealDb: true,
                examinationResult: createdExam,
              }
              : s
          )
        );
      }

      // Bước 2: Chuẩn bị dữ liệu cho tất cả các răng được chọn
      const requests = targetTeeth.map((toothNo) => {
        const currentConditionKey = teethMap[toothNo] || activeMarkingTool || 'Bình thường';
        const currentCondition = toothConditions.find(
          (condition) => condition.key === currentConditionKey
        );
        return {
          examinationResultId: currentExamResultId,
          toothNumber: String(toothNo),
          toothStatus: currentCondition?.label || currentConditionKey || 'Bình thường',
          severity: mapCariesDepthToLevel(cariesDepth),
          hasCaries: cariesStatus === 'YES',
          cariesLocation: mapLocationToBackendEnum(cariesLocation),
          painType: painLevel,
          cariesDepth: cariesDepth,
          gingivalCondition: gingivaStatus,
          shake: mobility,
        };
      });

      // Lưu xuống CSDL: ưu tiên gọi batchSaveToothRecords, fallback sang Promise.all(createToothRecord)
      try {
        await batchSaveToothRecords(currentExamResultId, requests);
      } catch (batchErr) {
        console.warn('batchSaveToothRecords fallback to individual requests:', batchErr);
        await Promise.all(requests.map((req) => createToothRecord(req)));
      }

      if (targetTeeth.length > 1) {
        toast.success(
          `Đã lưu thành công ${targetTeeth.length} răng (${targetTeeth.map((t) => `R${t}`).join(', ')}) vào CSDL!`,
          { icon: '🦷', duration: 3000 }
        );
      } else {
        toast.success(`Đã lưu thông tin Răng ${targetTeeth[0]} vào CSDL!`, {
          icon: '🦷',
          duration: 2500,
        });
      }

      // Bước 3: Lấy danh sách răng theo examinationResultId từ CSDL để cập nhật bảng danh sách bên dưới
      await fetchToothRecords(currentExamResultId);

      // Đưa sơ đồ răng về trạng thái "Chọn & Xem răng" sau khi lưu
      setActiveMarkingTool(null);
      setIsMultiToothMode(false);
      setMultiSelectedTeeth([]);

    } catch (error) {
      console.error('Lỗi khi lưu thông tin răng:', error);
      const errMsg = error.response?.data?.message || 'Không thể lưu thông tin răng vào CSDL';
      toast.error(errMsg);
    } finally {
      setIsSavingTooth(false);
    }
  };

  // Chọn 1 dòng trong bảng răng đã khám để xem và sửa
  const handleEditToothRecord = (record) => {
    setSelectedTooth(record.toothNumber);
    setCariesStatus(record.cariesStatus || 'NO');
    setMobility(record.mobility || 'Bình thường');
    setCariesLocation(record.cariesLocation || 'Bình thường');
    setGingivaStatus(record.gingivaStatus || 'Bình thường');
    setCariesDepth(record.cariesDepth || 'NORMAL');
    setPainLevel(record.painLevel || 'NONE');

    toast.success(`Đang xem/chỉnh sửa Răng ${record.toothNumber}`);
  };

  // Xóa ghi nhận răng khỏi CSDL
  const handleDeleteToothRecord = async (toothNo) => {
    try {
      const recordToDelete = examinedTeeth.find((t) => t.toothNumber === toothNo);
      if (recordToDelete?.id) {
        await deleteToothRecord(recordToDelete.id);
        toast.success(`Đã xóa Răng ${toothNo} khỏi CSDL!`);
      }

      if (examinationResultId) {
        await fetchToothRecords(examinationResultId);
      } else {
        setExaminedTeeth((prev) => prev.filter((item) => item.toothNumber !== toothNo));
      }
    } catch (err) {
      console.error('Lỗi khi xóa răng:', err);
      toast.error('Không thể xóa ghi nhận răng khỏi CSDL');
    }
  };

  const handleResetTeethMap = () => {
    if (isHistoricalSession) return;
    setTeethMap({});
    setSelectedTooth(46);
    setMultiSelectedTeeth([46]);
    setCariesStatus('NO');
    setMobility('Bình thường');
    setCariesLocation('Bình thường');
    setGingivaStatus('Bình thường');
    setCariesDepth('NORMAL');
    setPainLevel('NONE');
    toast.info('Đã đặt lại sơ đồ răng về trạng thái Bình thường!');
  };

  // ================= QUẢN LÝ CHẨN ĐOÁN (LƯU THEO RĂNG / NHIỀU RĂNG / TOÀN HÀM) =================
  const handleAddDiagnosisItem = (item) => {
    const newItem = {
      id: `diag-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      ...item,
    };
    setDiagnosisList((prev) => [newItem, ...prev]);
    toast.success(`Đã thêm kết luận: ${newItem.label || newItem.primaryDiagnosis} (${newItem.toothPosition}) vào danh sách!`, {
      icon: '📋',
      duration: 3000,
    });
    return newItem;
  };

  const handleRemoveDiagnosisItem = async (id) => {
    if (isHistoricalSession) {
      toast.error('Không thể xóa chẩn đoán trong đợt khám lịch sử!');
      return;
    }
    const updated = diagnosisList.filter((d) => d.id !== id);
    setDiagnosisList(updated);

    if (examinationResultId) {
      try {
        const allDiagnosesPayload = updated.map((item) => ({
          id: item.id && !String(item.id).startsWith('diag-') ? item.id : null,
          toothPosition: item.toothPosition || 'Toàn hàm',
          primaryDiagnosis: item.primaryDiagnosis || item.code,
          level: mapSeverityToLevelEnum(item.severity),
          sourceOfInformation: item.sources ? item.sources.join(', ') : '',
          diagnosticNotes: item.notes || '',
        }));

        const res = await updateExaminationResult(examinationResultId, {
          chiefComplaint: examReason,
          diagnoses: allDiagnosesPayload,
        });

        // Cập nhật lại session trong bộ nhớ
        setTreatmentSessions((prevSessions) =>
          prevSessions.map((s) => {
            if (s.examinationResultId === examinationResultId || s.id === examinationResultId) {
              return {
                ...s,
                examinationResult: {
                  ...s.examinationResult,
                  diagnoses: res?.diagnoses || allDiagnosesPayload,
                },
              };
            }
            return s;
          })
        );

        toast.success('Đã xóa chẩn đoán khỏi đợt khám và CSDL!');
      } catch (err) {
        console.error('Lỗi khi xóa chẩn đoán khỏi CSDL:', err);
        toast.error('Không thể xóa chẩn đoán khỏi CSDL');
      }
    }
  };

  // Lưu hoặc cập nhật chẩn đoán từ Modal (hỗ trợ cả mode ADD và EDIT)
  const handleSaveDiagnosisFromModal = async (item, mode = 'ADD') => {
    if (isHistoricalSession) {
      toast.error('Không thể thao tác chẩn đoán trong đợt khám lịch sử!');
      return false;
    }

    let updatedList;
    if (mode === 'EDIT' && item.id) {
      updatedList = diagnosisList.map((d) => (d.id === item.id ? { ...d, ...item } : d));
    } else {
      const newItem = {
        ...item,
        id: item.id || `diag-${Date.now()}`,
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      const existingIdx = diagnosisList.findIndex(
        (d) => d.toothPosition === newItem.toothPosition && d.primaryDiagnosis === newItem.primaryDiagnosis
      );
      if (existingIdx >= 0) {
        updatedList = diagnosisList.map((d, i) => (i === existingIdx ? { ...d, ...newItem, id: d.id } : d));
      } else {
        updatedList = [...diagnosisList, newItem];
      }
    }

    setDiagnosisList(updatedList);

    if (examinationResultId) {
      try {
        const allDiagnosesPayload = updatedList.map((d) => ({
          id: d.id && !String(d.id).startsWith('diag-') ? d.id : null,
          toothPosition: d.toothPosition || 'Toàn hàm',
          primaryDiagnosis: d.primaryDiagnosis || d.code,
          level: mapSeverityToLevelEnum(d.severity),
          sourceOfInformation: Array.isArray(d.sources) ? d.sources.join(', ') : (d.sources || ''),
          diagnosticNotes: d.notes || d.diagnosticNotes || '',
        }));

        const res = await updateExaminationResult(examinationResultId, {
          chiefComplaint: examReason,
          diagnoses: allDiagnosesPayload,
        });

        setTreatmentSessions((prevSessions) =>
          prevSessions.map((s) => {
            if (s.examinationResultId === examinationResultId || s.id === examinationResultId) {
              return {
                ...s,
                examinationResult: {
                  ...s.examinationResult,
                  diagnoses: res?.diagnoses || allDiagnosesPayload,
                },
              };
            }
            return s;
          })
        );

        toast.success(mode === 'EDIT' ? 'Đã cập nhật chẩn đoán thành công!' : 'Đã thêm chẩn đoán vào đợt khám thành công!');
        return true;
      } catch (err) {
        console.error('Lỗi khi lưu chẩn đoán vào CSDL:', err);
        toast.error('Không thể lưu chẩn đoán vào CSDL');
        return false;
      }
    } else {
      toast.success(mode === 'EDIT' ? 'Đã cập nhật chẩn đoán thành công!' : 'Đã thêm chẩn đoán thành công!');
      return true;
    }
  };

  const handleUpdateDiagnosisItem = (item) => handleSaveDiagnosisFromModal(item, 'EDIT');

  // Reset toàn bộ form chẩn đoán về trạng thái ban đầu
  const resetDiagnosisForm = () => {
    setDiagnosisScope('MULTI_TEETH');
    setSelectedTeethList([]);
    setMainDiagnosis(primaryDiagnoses[0]?.label || '');
    setSeverity('Trung bình');
    setDiagnosisNotes('');
    setSources({
      clinicalExam: true,
      xray: true,
      photos: false,
      aiSuggestion: false,
    });
  };

  // Chọn 1 dòng chẩn đoán từ bảng tóm tắt: không tự động map lên form
  const handleSelectDiagnosisRow = () => {
    // Không map tự động
  };

  // Bấm nút "Lưu chẩn đoán" trên giao diện: Kích hoạt kiểm tra và mở modal tương ứng
  const handleConfirmDiagnosis = () => {
    if (isHistoricalSession) {
      toast.info('Đợt khám này đã được lưu và khóa kết quả trước đó!');
      return;
    }
    if (!examinationResultId) {
      toast.error('Chưa có thông tin đợt khám (ExaminationResultId) để lưu chẩn đoán!');
      return;
    }
    // Mở modal: nếu diagnosisList rỗng -> hiện cảnh báo không thể lưu; nếu có -> hiện xác nhận lưu & khóa
    setConfirmSaveModalOpen(true);
  };

  // Bác sĩ xác nhận lưu chẩn đoán trong Modal: Gọi API lưu CSDL Backend & khóa đợt khám vĩnh viễn
  const executeSaveDiagnosisAndLock = async () => {
    try {
      if (isHistoricalSession) {
        toast.info('Đợt khám này đã được lưu và khóa kết quả trước đó!');
        return;
      }
      if (!examinationResultId) {
        toast.error('Chưa có thông tin đợt khám (ExaminationResultId) để lưu chẩn đoán!');
        return;
      }
      if (!diagnosisList || diagnosisList.length === 0) {
        toast.error('Chưa có kết luận chẩn đoán nào, không thể lưu đợt khám!');
        return;
      }

      setIsSavingDiagnosis(true);

      // Regex kiểm tra UUID hợp lệ chuẩn 36 ký tự
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // 1. Chuyển đổi danh sách chẩn đoán sang payload cho Backend
      const allDiagnosesPayload = diagnosisList.map((item) => {
        const validId = item.id && uuidRegex.test(String(item.id)) ? String(item.id) : null;
        let srcStr = 'Khám lâm sàng';
        if (Array.isArray(item.sources)) {
          srcStr = item.sources.join(', ');
        } else if (typeof item.sources === 'string' && item.sources.trim()) {
          srcStr = item.sources;
        }

        return {
          id: validId,
          toothPosition: item.toothPosition || 'Toàn hàm',
          primaryDiagnosis: item.primaryDiagnosis || item.label || item.code || 'Chẩn đoán xác định',
          level: mapSeverityToLevelEnum(item.severity || item.level || severity),
          sourceOfInformation: srcStr,
          diagnosticNotes: item.notes || item.diagnosticNotes || diagnosisNotes || '',
        };
      });

      const singlePayload = allDiagnosesPayload[0] || {
        toothPosition: 'Toàn hàm',
        primaryDiagnosis: mainDiagnosis || primaryDiagnoses[0]?.label || 'Chẩn đoán xác định',
        level: mapSeverityToLevelEnum(severity),
        sourceOfInformation: 'Khám lâm sàng',
        diagnosticNotes: diagnosisNotes || '',
      };

      let res;
      let activeExamId = examinationResultId;

      if (!activeExamId || activeExamId.startsWith('session-empty-')) {
        let currentMrId = medicalRecord?.id || location.state?.medicalRecordId || location.state?.medicalRecord?.id;
        if (!currentMrId && patient?.patientCode) {
          const records = await getMedicalRecordsByPatientCode(patient.patientCode).catch(() => []);
          if (records.length > 0) currentMrId = records[0].id;
        }
        if (!currentMrId && (patient?.id || patient?.patientCode)) {
          const newMr = await createMedicalRecord({
            patientId: patient.id,
            patientCode: patient.patientCode,
            recordDate: new Date().toISOString(),
            symptoms: examReason || 'Khám răng hàm mặt định kỳ',
            diagnosis: 'Thăm khám răng miệng',
            treatmentNotes: 'Khởi tạo hồ sơ khám bệnh',
          }).catch(() => null);
          if (newMr?.id) {
            currentMrId = newMr.id;
            setMedicalRecord(newMr);
          }
        }

        if (!currentMrId) {
          throw new Error('Chưa có hồ sơ bệnh án để lưu đợt khám');
        }

        const createdExam = await createExaminationResult({
          medicalRecordId: currentMrId,
          dentistId: currentDoctorId,
          chiefComplaint: examReason || 'Khám răng hàm mặt định kỳ',
          examinationDate: new Date().toISOString(),
          diagnosis: singlePayload,
          diagnoses: allDiagnosesPayload,
          disabled: false,
        });

        activeExamId = String(createdExam.id);
        setExaminationResultId(activeExamId);
        setExaminationResult(createdExam);
        res = createdExam;
      } else {
        res = await updateExaminationResult(activeExamId, {
          dentistId: currentDoctorId,
          chiefComplaint: examReason,
          diagnosis: singlePayload,
          diagnoses: allDiagnosesPayload,
          disabled: false,
        });
      }

      // Cập nhật treatmentSessions trong bộ nhớ với trạng thái đã khóa (disabled = false)
      setTreatmentSessions((prevSessions) =>
        prevSessions.map((s) => {
          if (
            s.examinationResultId === activeExamId ||
            s.id === activeExamId ||
            s.examinationResultId === examinationResultId ||
            s.id === examinationResultId
          ) {
            return {
              ...s,
              id: activeExamId,
              examinationResultId: activeExamId,
              isRealDb: true,
              isLocked: true,
              disabled: false,
              examinationResult: {
                ...s.examinationResult,
                id: activeExamId,
                chiefComplaint: examReason,
                diagnosis: singlePayload,
                diagnoses: res?.diagnoses && res.diagnoses.length > 0 ? res.diagnoses : allDiagnosesPayload,
                disabled: false,
              },
            };
          }
          return s;
        })
      );

      // Chuyển ngay lập tức sang chế độ khóa chỉ xem (không cho mở lại lưu là lưu luôn)
      setIsHistoricalSession(true);

      if (res?.diagnoses && res.diagnoses.length > 0) {
        setDiagnosisList(mapBackendDiagnosesToFrontend(res));
      }

      toast.success(
        'Đã lưu kết luận chẩn đoán & khóa đợt khám thành công! Hồ sơ này đã được chốt và không thể chỉnh sửa lại.',
        {
          icon: '🔒',
          duration: 4000,
        }
      );

      // Reset form chẩn đoán và đóng modal
      resetDiagnosisForm();
      setConfirmSaveModalOpen(false);
    } catch (err) {
      console.error('Lỗi khi lưu kết luận chẩn đoán và khóa đợt khám:', err);
      const backendMsg = err.response?.data?.message || err.message;
      toast.error(backendMsg || 'Không thể lưu chẩn đoán vào CSDL');
    } finally {
      setIsSavingDiagnosis(false);
    }
  };

  const handleCreateTreatmentPlan = () => {
    toast.success('Đã xác nhận chẩn đoán! Đang chuyển sang Lên Kế Hoạch Điều Trị...', {
      icon: '🩺',
      duration: 2500,
    });

    let positionText = 'Toàn hàm';
    if (diagnosisScope === 'SINGLE_TOOTH') {
      positionText = selectedTooth;
    } else if (diagnosisScope === 'MULTI_TEETH') {
      positionText = selectedTeethList.length > 0 ? selectedTeethList.join(', ') : 'Nhiều răng';
    } else if (diagnosisScope === 'UPPER_JAW') {
      positionText = 'Hàm trên';
    } else if (diagnosisScope === 'LOWER_JAW') {
      positionText = 'Hàm dưới';
    }

    navigate('/dentist/treatment-plans', {
      state: {
        patient,
        diagnosis: mainDiagnosis,
        selectedTooth: positionText,
        diagnosisScope,
        selectedTeethList,
        diagnosisList,
        diagnosisNotes,
        examinationResultId,
        treatingDoctor: treatingDoctor || 'BS. Nguyễn Văn Tâm',
      },
    });
  };

  const triggerAiAnalysis = () => {
    // Mở trình phân tích X-quang AI toàn màn hình (tải phim & đọc phim thật bằng AI)
    setIsXrayModalOpen(true);
  };

  // ================= X-QUANG & AI: tải lịch sử phim của đợt khám =================
  const loadXrayHistory = useCallback(async () => {
    if (!examinationResultId && !medicalRecord?.id) {
      setXrayHistory([]);
      setXrayAnalysis(null);
      return;
    }
    try {
      setIsLoadingXrayHistory(true);
      const list = await getXrayAnalysisHistory({
        examinationResultId: examinationResultId || undefined,
        medicalRecordId: examinationResultId ? undefined : medicalRecord?.id,
      });
      setXrayHistory(list);
      setXrayAnalysis(list[0] || null);
    } catch (err) {
      console.warn('Không tải được lịch sử phân tích X-quang:', err);
      setXrayHistory([]);
      setXrayAnalysis(null);
    } finally {
      setIsLoadingXrayHistory(false);
    }
  }, [examinationResultId, medicalRecord?.id]);

  useEffect(() => {
    loadXrayHistory();
  }, [loadXrayHistory]);

  // Gửi phim X-quang cho AI đọc phim
  const analyzeXrayFile = async (file, imageType = 'AUTO') => {
    if (!file) return null;
    if (isHistoricalSession) {
      toast.error('Đợt khám đã khóa, không thể phân tích phim mới.');
      return null;
    }
    const ageYears = patient?.dateOfBirth
      ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      : '';
    setIsAiAnalyzing(true);
    toast.loading('AI đang tiền xử lý, phân loại và đọc phim (mô hình lớn + soi chi tiết từng vùng)... có thể mất 1-2 phút', { id: 'ai-scan' });
    try {
      const result = await analyzeXrayImage(file, {
        medicalRecordId: medicalRecord?.id,
        examinationResultId: examinationResultId || undefined,
        imageType,
        patientAge: Number.isFinite(ageYears) && ageYears > 0 ? ageYears : '',
        chiefComplaint: examReason || '',
      });
      setXrayAnalysis(result);
      setXrayHistory((prev) => [result, ...prev.filter((h) => h.analysisId !== result.analysisId || !result.analysisId)]);
      setAiOverlayEnabled(true);
      if (result?.isDentalRadiograph === false) {
        toast.error('Ảnh tải lên không phải phim X-quang nha khoa hợp lệ.', { id: 'ai-scan' });
      } else {
        const n = result?.findings?.length || 0;
        toast.success(n > 0 ? `AI phát hiện ${n} dấu hiệu cần đối soát trên phim.` : 'AI không ghi nhận tổn thương rõ ràng trên phim.', {
          id: 'ai-scan',
        });
      }
      if (result?.storageWarning) toast(result.storageWarning, { icon: '⚠️' });
      return result;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Phân tích X-quang thất bại';
      toast.error(msg, { id: 'ai-scan' });
      return null;
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Lưu kết quả đối soát của bác sĩ cho lần phân tích hiện tại
  const saveXrayReview = async ({ decisions, doctorNote }) => {
    if (!xrayAnalysis) return false;
    const review = { decisions, doctorNote, reviewedBy: treatingDoctor };
    if (!xrayAnalysis.analysisId) {
      setXrayAnalysis((prev) => ({ ...prev, doctorReview: { ...review, status: 'REVIEWED', reviewedAt: new Date().toISOString() } }));
      return true;
    }
    try {
      const saved = await saveXrayDoctorReview(xrayAnalysis.analysisId, review);
      const merged = { ...xrayAnalysis, ...saved, doctorReview: saved?.doctorReview || review };
      setXrayAnalysis(merged);
      setXrayHistory((prev) => prev.map((h) => (h.analysisId === merged.analysisId ? merged : h)));
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không lưu được kết quả đối soát');
      return false;
    }
  };

  const value = {
    // Tab
    activeTab,
    setActiveTab,

    // Patient & Medical Record
    patient,
    setPatient,
    medicalRecord,
    setMedicalRecord,
    examReason,
    setExamReason,
    loadingPatient,

    // Phone Search & Selectbox State
    phoneSearchQuery,
    setPhoneSearchQuery,
    searchingPhone,
    patientOptions,
    loadingPatientOptions,
    foundPatientsList,
    multiplePatientsModalOpen,
    setMultiplePatientsModalOpen,
    handleSearchPatientByPhone,
    handleSelectPatient,
    handleClearPatient,

    // Treatment Sessions (Đợt điều trị / Lần khám)
    treatmentSessions,
    selectedSessionId,
    isHistoricalSession,
    handleSelectTreatmentSession,
    handleCreateNewTreatmentSession,
    currentDoctorId,
    createSessionModalOpen,
    setCreateSessionModalOpen,
    openCreateSessionModal,
    closeCreateSessionModal,

    // ExaminationResult (Kết quả khám lâm sàng)
    examinationResultId,
    examinationResult,

    // Odontogram & Exam
    activeMarkingTool,
    setActiveMarkingTool,
    teethMap,
    setTeethMap,
    toothConditions,
    selectedTooth,
    setSelectedTooth,
    toothFilter,
    setToothFilter,
    isMultiToothMode,
    setIsMultiToothMode,
    multiSelectedTeeth,
    setMultiSelectedTeeth,
    handleToggleMultiToothMode,
    handleChangeToothCondition,
    cariesStatus,
    setCariesStatus,
    cariesLocation,
    setCariesLocation,
    cariesDepth,
    setCariesDepth,
    painLevel,
    setPainLevel,
    mobility,
    setMobility,
    gingivaStatus,
    setGingivaStatus,
    examinedTeeth,
    setExaminedTeeth,
    isSavingTooth,
    isLoadingTeeth,

    // Actions
    handleToothClick,
    handleSaveToothRecord,
    handleEditToothRecord,
    handleDeleteToothRecord,
    handleResetTeethMap,
    fetchToothRecords,

    // X-ray & AI
    xrayTab,
    setXrayTab,
    aiOverlayEnabled,
    setAiOverlayEnabled,
    selectedImageIndex,
    setSelectedImageIndex,
    isAiAnalyzing,
    triggerAiAnalysis,
    xrayAnalysis,
    setXrayAnalysis,
    xrayHistory,
    isLoadingXrayHistory,
    loadXrayHistory,
    analyzeXrayFile,
    saveXrayReview,
    isXrayModalOpen,
    setIsXrayModalOpen,
    pendingDiagnosisPrefill,
    setPendingDiagnosisPrefill,

    // Diagnosis & Scopes (Toàn hàm / 1 Răng / Nhiều răng / Cung hàm)
    diagnosisScope,
    setDiagnosisScope,
    selectedTeethList,
    setSelectedTeethList,
    diagnosisList,
    setDiagnosisList,
    isSavingDiagnosis,
    handleAddDiagnosisItem,
    handleRemoveDiagnosisItem,
    handleSaveDiagnosisFromModal,
    handleUpdateDiagnosisItem,
    mainDiagnosis,
    setMainDiagnosis,
    primaryDiagnoses,
    subDiagnosis,
    setSubDiagnosis,
    severity,
    setSeverity,
    diagnosisNotes,
    setDiagnosisNotes,
    sources,
    setSources,
    treatingDoctor,
    setTreatingDoctor,
    confirmSaveModalOpen,
    setConfirmSaveModalOpen,
    openConfirmSaveModal,
    closeConfirmSaveModal,
    handleConfirmDiagnosis,
    executeSaveDiagnosisAndLock,
    resetDiagnosisForm,
    handleSelectDiagnosisRow,
    handleCreateTreatmentPlan,
  };

  return (
    <ClinicalExamContext.Provider value={value}>
      {children}
    </ClinicalExamContext.Provider>
  );
}

export function useClinicalExam() {
  const context = useContext(ClinicalExamContext);
  if (!context) {
    throw new Error('useClinicalExam must be used within a ClinicalExamProvider');
  }
  return context;
}

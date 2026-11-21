import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Phone,
  X,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getPatientByPatientCode,
  getPatientsByPhone,
  getPatients,
  updatePatient,
} from '../../../services/patient.service';
import {
  getMedicalRecordsByPatientCode,
  getMedicalRecordsByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
} from '../../../services/medicalRecord.service';
import { getExaminationResultsByMedicalRecordId } from '../../../services/examinationResult.service';
import { getTreatmentPlansByPatientId } from '../../../services/treatmentPlan.service';
import { getDentistsList } from '../../../services/dentist.service';

import MedicalRecordHeader from './components/MedicalRecordHeader';
import PatientGeneralInfoForm from './components/PatientGeneralInfoForm';
import TreatmentHistoryTimeline from './components/TreatmentHistoryTimeline';
import MedicalRecordEmptyState from './components/MedicalRecordEmptyState';
import MultiplePatientsModal from '../../../components/common/MultiplePatientsModal';
import {
  createDefaultMedicalRecord,



} from './medicalRecordHelpers';

export default function MedicalRecords() {
  const location = useLocation();
  const navigate = useNavigate();
  const recordLoadVersion = useRef(0);
  const [loadingMedicalRecord, setLoadingMedicalRecord] = useState(false);

  // Passed patient object from previous route or fallback default
  const passedPatient = location.state?.patient;

  const [isEditing, setIsEditing] = useState(false);

  // Phone Search State
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [multiplePatientsModalOpen, setMultiplePatientsModalOpen] = useState(false);
  const [foundPatientsList, setFoundPatientsList] = useState([]);

  // Selected systemic diseases list state (Array for checklist)
  const [systemicDiseases, setSystemicDiseases] = useState([]);

  // Patient Options for quick Selectbox
  const [patientOptions, setPatientOptions] = useState([]);
  const [loadingPatientOptions, setLoadingPatientOptions] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getPatients()
      .then((res) => {
        if (!isMounted) return;
        const raw = Array.isArray(res) ? res : res?.data || res?.result || [];
        if (Array.isArray(raw)) {
          setPatientOptions(raw);
        }
      })
      .catch((err) => console.warn('Lỗi tải danh sách bệnh nhân cho selectbox:', err))
      .finally(() => {
        if (isMounted) setLoadingPatientOptions(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Store the complete MedicalRecord DTO returned by the API.
  const [medicalRecordData, setMedicalRecordData] = useState(createDefaultMedicalRecord);
  // Treatment History Records state & Loading
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Patient State matching PatientDTO.java entity properties 100%
  const [patientData, setPatientData] = useState({
    id: passedPatient?.id || passedPatient?.patientId || '',
    patientCode: passedPatient?.patientCode || location.state?.patientCode || '',
    fullName: passedPatient?.fullName || passedPatient?.patientName || location.state?.fullName || '',
    nationality: passedPatient?.nationality || 'Việt Nam',
    hometown: passedPatient?.hometown || '',
    job: passedPatient?.job || '',
    phone: passedPatient?.phone || passedPatient?.phoneNumber || location.state?.phone || '',
    cccd: passedPatient?.cccd || '',
    gender: passedPatient?.gender || 'FEMALE',
    dateOfBirth: passedPatient?.dateOfBirth ? String(passedPatient.dateOfBirth).split('T')[0] : '',
    address: passedPatient?.address || '',
    contactName: passedPatient?.contactName || '',
    contactPhone: passedPatient?.contactPhone || '',
    contactRelationship: passedPatient?.contactRelationship || '',
    allergies: passedPatient?.allergies || '',
    currentMedications: passedPatient?.currentMedications || '',
    surgicalHistory: passedPatient?.surgicalHistory || '',
    createdAt: passedPatient?.createdAt ? String(passedPatient.createdAt).split('T')[0] : '',
    email: passedPatient?.email || '',
    avatar: passedPatient?.avatar || '',
  });

  // Check if patient profile data is loaded
  const hasPatientData = Boolean(
    patientData.id ||
    (patientData.fullName && patientData.fullName.trim()) ||
    (patientData.phone && patientData.phone.trim())
  );

  // Tải toàn bộ Lịch sử điều trị THỰC TẾ của bệnh nhân từ Backend
  const fetchRealTreatmentHistory = async (patientObj) => {
    if (!patientObj || (!patientObj.id && !patientObj.patientCode)) {
      setTreatmentRecords([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const pCode = patientObj.patientCode;
      const pId = patientObj.id;

      // 1. Fetch song song MedicalRecords, TreatmentPlans và Dentists List
      const [recordsRes, plansRes, dentistsRes] = await Promise.allSettled([
        pCode ? getMedicalRecordsByPatientCode(pCode) : (pId ? getMedicalRecordsByPatientId(pId) : Promise.resolve([])),
        pId ? getTreatmentPlansByPatientId(pId) : Promise.resolve([]),
        getDentistsList().catch(() => []),
      ]);

      const mRecords = recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value) ? recordsRes.value : [];
      const tPlans = plansRes.status === 'fulfilled' && Array.isArray(plansRes.value) ? plansRes.value : [];
      const rawDentists = dentistsRes.status === 'fulfilled' && Array.isArray(dentistsRes.value?.data || dentistsRes.value)
        ? (dentistsRes.value?.data || dentistsRes.value)
        : [];

      // Bảng map tra cứu tên bác sĩ theo ID
      const dentistMap = new Map();
      rawDentists.forEach((d) => {
        const dName = d.fullName || d.name || d.user?.fullName || d.user?.username;
        if (d.id) dentistMap.set(String(d.id), dName);
        if (d.user?.id) dentistMap.set(String(d.user?.id), dName);
      });

      // Map plans theo examinationResultId và id
      const planByExamId = new Map();
      const planById = new Map();
      tPlans.forEach((plan) => {
        if (plan.id) planById.set(String(plan.id), plan);
        if (plan.examinationResultId) planByExamId.set(String(plan.examinationResultId), plan);
      });

      const usedPlanIds = new Set();
      const historyList = [];

      // Duyệt qua từng Medical Record để trích xuất ExaminationResults
      for (const mr of mRecords) {
        let exams = mr.examinationResults || [];

        // Nếu exams rỗng nhưng có mr.id, gọi thêm API lấy kết quả khám
        if (exams.length === 0 && mr.id) {
          try {
            const fetchedExams = await getExaminationResultsByMedicalRecordId(mr.id);
            if (Array.isArray(fetchedExams) && fetchedExams.length > 0) {
              exams = fetchedExams;
            }
          } catch (e) {
            // Không ngắt luồng nếu lỗi đơn lẻ
          }
        }

        if (exams.length > 0) {
          for (const exam of exams) {
            const examIdStr = String(exam.id || '');
            const matchedPlan =
              (examIdStr && planByExamId.get(examIdStr)) ||
              (exam.treatmentPlanId && planById.get(String(exam.treatmentPlanId))) ||
              null;

            if (matchedPlan?.id) {
              usedPlanIds.add(String(matchedPlan.id));
            }

            // Bác sĩ phụ trách: ưu tiên theo kết quả khám examinationResult -> kế hoạch -> các buổi hẹn -> hồ sơ bệnh án
            const examDoctorId = exam.dentistId || exam.dentist?.id;
            const dentistName =
              exam.dentistName ||
              exam.dentist?.fullName ||
              (examDoctorId && dentistMap.get(String(examDoctorId))) ||
              matchedPlan?.dentistName ||
              (matchedPlan?.dentistId && dentistMap.get(String(matchedPlan.dentistId))) ||
              matchedPlan?.phases?.[0]?.treatmentVisits?.[0]?.assignedDentist ||
              mr.dentistName ||
              (mr.dentistId && dentistMap.get(String(mr.dentistId))) ||
              'Chưa phân công';


            // 1. Thời gian bắt đầu: thời gian khởi tạo examinationResult
            const startDate = exam.examinationDate || exam.createdAt || matchedPlan?.startDate || mr.recordDate;

            // 2. Trạng thái: trạng thái của bảng treatmentPlan
            const status = matchedPlan?.status || 'PENDING';

            // 3. Lý do khám bệnh: chiefComplaint của examinationResult
            const chiefComplaint = exam.chiefComplaint || 'Khám răng hàm mặt';

            // 4. Chuẩn đoán là gì: diagnoses của examinationResult
            const diagnoses = Array.isArray(exam.diagnoses) && exam.diagnoses.length > 0
              ? exam.diagnoses
              : (exam.diagnosis ? [exam.diagnosis] : []);

            // 5. Tên kế hoạch điều trị: planName của treatmentPlan
            const planName = matchedPlan?.planName || (matchedPlan ? 'Kế hoạch điều trị' : 'Chưa lập kế hoạch điều trị');

            // 6. Tên các giai đoạn và trạng thái giai đoạn
            const phases = matchedPlan?.phases || [];

            historyList.push({
              id: exam.id || matchedPlan?.id || mr.id,
              examinationResultId: exam.id,
              branchName: exam.branchName || '',
              addressBranch: exam.addressBranch || '',
              treatmentPlanId: matchedPlan?.id,
              startDate,
              recordDate: startDate,
              status,
              chiefComplaint,
              dentistName,
              diagnoses,
              toothRecords: exam.toothRecords || [],
              planName,
              planDescription: matchedPlan?.description || '',
              estimatedCost: matchedPlan?.estimatedCost,
              phases,
              rawExam: exam,
              rawPlan: matchedPlan,
              medicalRecordId: mr.id,
            });
          }
        }
        // Nếu MedicalRecord rỗng (chưa có đợt khám examinationResult nào), không tự sinh ca khám giả
      }

      // Đưa thêm các TreatmentPlan của bệnh nhân chưa được gắn vào examinationResult nào vào timeline
      for (const plan of tPlans) {
        if (plan.id && !usedPlanIds.has(String(plan.id))) {
          const startDate = plan.startDate || plan.createdAt;
          const dentistName =
            plan.dentistName ||
            (plan.dentistId && dentistMap.get(String(plan.dentistId))) ||
            plan.phases?.[0]?.treatmentVisits?.[0]?.assignedDentist ||
            'Bác sĩ phụ trách';


          historyList.push({
            id: plan.id,
            treatmentPlanId: plan.id,
            startDate,
            recordDate: startDate,
            status: plan.status || 'PENDING',
            chiefComplaint: plan.description || 'Kế hoạch điều trị tổng thể',
            dentistName,
            diagnoses: [],
            toothRecords: [],
            planName: plan.planName || 'Kế hoạch điều trị',
            planDescription: plan.description || '',
            estimatedCost: plan.estimatedCost,
            phases: plan.phases || [],
            rawPlan: plan,
          });
        }
      }

      // Sắp xếp giảm dần theo thời gian bắt đầu (mới nhất lên đầu)
      historyList.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
      setTreatmentRecords(historyList);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử điều trị thật của bệnh nhân:', err);
      setTreatmentRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Apply chosen patient object onto form
  const applyPatientToForm = (patientObj) => {
    setPatientData({
      id: patientObj.id || '',
      patientCode: patientObj.patientCode || `PA-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: patientObj.fullName || patientObj.patientName || patientObj.user?.fullName || '',
      nationality: patientObj.nationality || 'Việt Nam',
      hometown: patientObj.hometown || '',
      job: patientObj.job || '',
      phone: patientObj.phone || patientObj.phoneNumber || patientObj.user?.phone || '',
      cccd: patientObj.cccd || '',
      gender: patientObj.gender || 'MALE',
      dateOfBirth: patientObj.dateOfBirth ? String(patientObj.dateOfBirth).split('T')[0] : '',
      address: patientObj.address || '',
      contactName: patientObj.contactName || '',
      contactPhone: patientObj.contactPhone || '',
      contactRelationship: patientObj.contactRelationship || '',
      allergies: patientObj.allergies || '',
      currentMedications: patientObj.currentMedications || '',
      surgicalHistory: patientObj.surgicalHistory || patientObj.pastSurgeries || '',
      createdAt: patientObj.createdAt ? String(patientObj.createdAt).split('T')[0] : '',
      email: patientObj.email || patientObj.user?.email || '',
      avatar: patientObj.avatar || patientObj.avatarUrl || null,
    });

    // Keep the complete DTO returned by the API, including branch and clinic fields.
    const loadVersion = ++recordLoadVersion.current;
    const pCode = patientObj.patientCode;
    setMedicalRecordData(createDefaultMedicalRecord());
    setLoadingMedicalRecord(true);
    const request = pCode
      ? getMedicalRecordsByPatientCode(pCode)
      : patientObj.id ? getMedicalRecordsByPatientId(patientObj.id) : Promise.resolve([]);
    request.then((records) => {
      if (loadVersion !== recordLoadVersion.current) return;
      setMedicalRecordData(records[0] || createDefaultMedicalRecord());
    }).catch((error) => {
      if (loadVersion === recordLoadVersion.current) {
        toast.error(error.response?.data?.message || 'Không tải được hồ sơ bệnh án.');
      }
    }).finally(() => {
      if (loadVersion === recordLoadVersion.current) setLoadingMedicalRecord(false);
    });
    // Tải dữ liệu thật lịch sử điều trị cho bệnh nhân
    fetchRealTreatmentHistory(patientObj);

    let diseases = [];
    if (Array.isArray(patientObj.systemicDisease)) {
      diseases = patientObj.systemicDisease;
    } else if (typeof patientObj.systemicDisease === 'string' && patientObj.systemicDisease.trim()) {
      diseases = patientObj.systemicDisease.split(',').map((s) => s.trim()).filter(Boolean);
    }
    setSystemicDiseases(diseases);
  };

  // Clear currently loaded patient to show empty state
  const handleClearPatient = () => {
    recordLoadVersion.current += 1;
    setLoadingMedicalRecord(false);
    setPatientData({
      id: '',
      patientCode: '',
      fullName: '',
      nationality: 'Việt Nam',
      hometown: '',
      job: '',
      phone: '',
      cccd: '',
      gender: 'MALE',
      dateOfBirth: '',
      address: '',
      allergies: '',
      currentMedications: '',
      surgicalHistory: '',
      createdAt: '',
      email: '',
      avatar: '',
    });
    setMedicalRecordData(createDefaultMedicalRecord());
    setTreatmentRecords([]);
    setPhoneSearchQuery('');
    toast.success('Đã đóng hồ sơ để tìm kiếm bệnh nhân khác');
  };

  // Handle selecting patient from the quick selectbox
  const handleSelectPatientFromSelectbox = (selectedPatient) => {
    if (!selectedPatient) {
      handleClearPatient();
      return;
    }
    applyPatientToForm(selectedPatient);
    toast.success(`Đã chọn bệnh nhân: ${selectedPatient.fullName || selectedPatient.patientName}`);
  };

  // Search Patients By Phone Number
  const handleSearchPhone = async (e) => {
    if (e) e.preventDefault();

    const query = phoneSearchQuery.trim();
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

      // Fallback: search in full patient list if direct API endpoint returns empty
      if (results.length === 0) {
        try {
          const allList = await getPatients();
          const raw = Array.isArray(allList) ? allList : allList?.data || allList?.result || [];
          if (Array.isArray(raw)) {
            results = raw.filter((p) => {
              const pPhone = (p.phone || p.phoneNumber || p.user?.phone || '').replace(/\D/g, '');
              const qPhone = query.replace(/\D/g, '');
              return pPhone && qPhone && pPhone.includes(qPhone);
            });
          }
        } catch (e) {
          console.warn('Fallback getPatients error:', e);
        }
      }

      if (results.length === 0) {
        toast.error(`Không tìm thấy hồ sơ bệnh nhân nào với SĐT "${query}"`);
      } else if (results.length === 1) {
        applyPatientToForm(results[0]);
        toast.success(`Đã tải hồ sơ bệnh nhân: ${results[0].fullName || results[0].patientName}`);
      } else {
        // Multiple records matching same phone number -> Open selection modal!
        setFoundPatientsList(results);
        setMultiplePatientsModalOpen(true);
      }
    } catch (error) {
      console.error('Error searching patient by phone:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm bệnh nhân');
    } finally {
      setSearchingPhone(false);
    }
  };

  // Re-sync and fetch real Backend Patient data by patientCode or phone
  useEffect(() => {
    const code = passedPatient?.patientCode || location.state?.patientCode;
    const phoneNum = passedPatient?.phone || passedPatient?.phoneNumber || location.state?.phone;

    const loadData = async () => {
      if (passedPatient) {
        applyPatientToForm(passedPatient);
      }
      try {
        let data = null;
        if (code && code !== 'N/A') {
          data = await getPatientByPatientCode(code).catch(() => null);
        }
        if (!data && phoneNum) {
          const list = await getPatientsByPhone(phoneNum).catch(() => []);
          data = Array.isArray(list) ? list[0] : list;
        }

        if (data) {
          applyPatientToForm(data);
        }
      } catch (err) {
        console.warn('Lỗi tải thông tin bệnh nhân từ API:', err);
      }
    };

    if (code || phoneNum) {
      loadData();
    }
  }, [location.state]);

  // Toggle disease checkbox handler
  const handleToggleDisease = (disease) => {
    if (!isEditing) return;
    setSystemicDiseases((prev) =>
      prev.includes(disease) ? prev.filter((d) => d !== disease) : [...prev, disease]
    );
  };

  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (loadingMedicalRecord) return;
    if (!medicalRecordData.id && !medicalRecordData.branchId) {
      toast.error('Chưa có hồ sơ bệnh án hoặc chi nhánh để lưu.');
      return;
    }
    setSaving(true);
    try {
      const isUUID = (str) =>
        typeof str === 'string' &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

      let targetId = isUUID(patientData.id) ? patientData.id : null;

      if (!targetId) {
        if (patientData.patientCode && patientData.patientCode !== 'N/A') {
          const fetchedObj = await getPatientByPatientCode(patientData.patientCode).catch(() => null);
          if (fetchedObj?.id && isUUID(fetchedObj.id)) {
            targetId = fetchedObj.id;
          }
        }
        if (!targetId && patientData.phone) {
          const list = await getPatientsByPhone(patientData.phone).catch(() => []);
          const fetchedObj = Array.isArray(list) ? list[0] : list;
          if (fetchedObj?.id && isUUID(fetchedObj.id)) {
            targetId = fetchedObj.id;
          }
        }
      }

      // 1. Cập nhật thông tin bệnh nhân (Patient)
      const patientPayload = {
        fullName: patientData.fullName,
        phone: patientData.phone,
        email: patientData.email || null,
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth
          ? (patientData.dateOfBirth.includes('T') ? patientData.dateOfBirth : `${patientData.dateOfBirth}T00:00:00`)
          : null,
        address: patientData.address,
        nationality: patientData.nationality,
        hometown: patientData.hometown || null,
        job: patientData.job || null,
        contactName: patientData.contactName || null,
        contactPhone: patientData.contactPhone || null,
        contactRelationship: patientData.contactRelationship || null,
        cccd: patientData.cccd || null,
        allergies: patientData.allergies || null,
        currentMedications: patientData.currentMedications || null,
        surgicalHistory: patientData.surgicalHistory || null,
        systemicDisease: systemicDiseases.length > 0 ? systemicDiseases.join(', ') : null,
      };

      let updatedPatient = null;
      if (targetId) {
        updatedPatient = await updatePatient(targetId, patientPayload);
      }

      // 2. Tìm hoặc xác định ID của MedicalRecord
      let currentMrId = isUUID(medicalRecordData.id) ? medicalRecordData.id : null;
      if (!currentMrId && patientData.patientCode) {
        const records = await getMedicalRecordsByPatientCode(patientData.patientCode).catch(() => []);
        if (Array.isArray(records) && records.length > 0 && records[0].id) {
          currentMrId = records[0].id;
        }
      }

      // 3. Cập nhật thông tin Hồ sơ bệnh án (MedicalRecord)
      const mrPayload = {
        patientId: targetId,
        patientCode: patientData.patientCode,
        branchId: medicalRecordData.branchId,
        treatmentNotes: medicalRecordData.treatmentNotes,
      };

      let updatedMr = null;
      try {
        if (currentMrId) {
          updatedMr = await updateMedicalRecord(currentMrId, mrPayload);
        } else if (targetId) {
          updatedMr = await createMedicalRecord(mrPayload);
        }
      } catch (mrErr) {
        throw mrErr;
      }

      // 4. Đồng bộ State trực tiếp từ dữ liệu DB vừa lưu (Không gọi applyPatientToForm để tránh race condition)
      if (updatedPatient) {
        setPatientData((prev) => ({
          ...prev,
          id: updatedPatient.id || prev.id,
          patientCode: updatedPatient.patientCode || prev.patientCode,
          fullName: updatedPatient.fullName || prev.fullName,
          nationality: updatedPatient.nationality || prev.nationality,
          hometown: updatedPatient.hometown || '',
          job: updatedPatient.job || '',
          phone: updatedPatient.phone || updatedPatient.phoneNumber || prev.phone,
          cccd: updatedPatient.cccd || '',
          email: updatedPatient.email !== undefined ? updatedPatient.email : prev.email,
          gender: updatedPatient.gender || prev.gender,
          dateOfBirth: updatedPatient.dateOfBirth
            ? String(updatedPatient.dateOfBirth).split('T')[0]
            : prev.dateOfBirth,
          address: updatedPatient.address || prev.address,
          allergies: updatedPatient.allergies || '',
          currentMedications: updatedPatient.currentMedications || '',
          surgicalHistory: updatedPatient.surgicalHistory || '',
          createdAt: updatedPatient.createdAt
            ? String(updatedPatient.createdAt).split('T')[0]
            : prev.createdAt,
        }));
      }

      if (updatedMr) {
        setMedicalRecordData(updatedMr);
      }

      setIsEditing(false);
      toast.success(`Đã cập nhật hồ sơ bệnh án thành công!`);
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin hồ sơ bệnh án:', err);
      toast.error('Lỗi khi lưu thông tin bệnh nhân vào cơ sở dữ liệu!');
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    const age = new Date().getFullYear() - birthYear;
    return `${age} tuổi`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const [navigatingExam, setNavigatingExam] = useState(false);

  // Chuyển qua màn hình khám bệnh (chỉ chuyển trang, không tự ý khởi tạo ExaminationResult)
  const handleNavigateTreatment = () => {
    if (!hasPatientData) {
      toast.error('Vui lòng chọn hoặc tìm kiếm bệnh nhân trước khi vào khám!');
      return;
    }

    const currentSymptoms = 'Khám răng hàm mặt định kỳ';
    const currentMrId = medicalRecordData?.id || null;

    navigate('/dentist/clinical-exam', {
      state: {
        patient: patientData,
        medicalRecord: medicalRecordData,
        patientCode: patientData.patientCode,
        medicalRecordId: currentMrId,
        medicalRecordCode:
          medicalRecordData?.medicalRecordCode ||
          (currentMrId ? `HSBA-${String(currentMrId).slice(0, 8)}` : ''),
        reason: currentSymptoms,
        symptoms: currentSymptoms,
        phone: patientData.phone,
      },
    });
  };

  return (
    <div className="w-full p-1 space-y-3">
      {/* Top Header Toolbar Component with Dental Clinic Info & Global Search */}
      <MedicalRecordHeader
        patientName={patientData.fullName}
        patientCode={patientData.patientCode}
        medicalRecordData={medicalRecordData}
        loadingMedicalRecord={loadingMedicalRecord}
        saving={saving}
        onSave={handleSaveProfile}
        onBack={() => navigate(-1)}
        onNavigateTreatment={handleNavigateTreatment}
        navigatingExam={navigatingExam}
        phoneSearchQuery={phoneSearchQuery}
        setPhoneSearchQuery={setPhoneSearchQuery}
        onSearchPhone={handleSearchPhone}
        searchingPhone={searchingPhone}
        hasPatientData={hasPatientData}
        patientOptions={patientOptions}
        loadingPatientOptions={loadingPatientOptions}
        selectedPatientId={patientData.id || patientData.patientCode}
        onSelectPatient={handleSelectPatientFromSelectbox}
        onClearPatient={handleClearPatient}
      />

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN (8 cols): THÔNG TIN CHUNG (PATIENT DTO FIELDS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            {/* Card Header section with Title and optional Clear/Change Patient button */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-extrabold text-slate-900 whitespace-nowrap tracking-tight">
                  Thông tin chung
                </h2>
                {isEditing && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-300 animate-pulse">
                    Đang chỉnh sửa
                  </span>
                )}
              </div>

              {hasPatientData && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                  title="Đóng hồ sơ bệnh án hiện tại để tìm bệnh nhân khác"
                >
                  <X size={14} />
                  <span>Đổi bệnh nhân khác</span>
                </button>
              )}
            </div>

            {/* THÔNG TIN CHUNG: RENDER FORM KHI ĐÃ CÓ DỮ LIỆU, HOẶC EMPTY STATE KHI CHƯA CÓ DỮ LIỆU */}
            {hasPatientData ? (
              <PatientGeneralInfoForm
                patientData={patientData}
                setPatientData={setPatientData}
                systemicDiseases={systemicDiseases}
                handleToggleDisease={handleToggleDisease}
                isEditing={isEditing}
                onToggleEdit={() => setIsEditing(!isEditing)}
              />
            ) : (
              <MedicalRecordEmptyState
                onFocusSearch={() => {
                  const input = document.getElementById('header-phone-search-input');
                  if (input) input.focus();
                }}
                onNavigatePatients={() => navigate('/dentist/patients')}
                onLoadSample={() => {
                  if (patientOptions.length > 0) {
                    applyPatientToForm(patientOptions[0]);
                    toast.success(`Đã mở hồ sơ bệnh nhân: ${patientOptions[0].fullName || patientOptions[0].patientName}`);
                  } else {
                    applyPatientToForm({
                      patientCode: 'PA-206880',
                      fullName: 'Phạm Minh Hiếu',
                      phone: '0378995155',
                      gender: 'MALE',
                      dateOfBirth: '2004-10-01',
                      nationality: 'Việt Nam',
                      address: '59C Nguyễn Đình Chiểu, P. Xuân Hòa, TP. HCM',
                    });
                    toast.success('Đã tải hồ sơ bệnh nhân Phạm Minh Hiếu');
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (4 cols): LỊCH SỬ ĐIỀU TRỊ (TIMELINE MEDICALRECORDS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4">
          <TreatmentHistoryTimeline
            records={treatmentRecords}
            loading={loadingHistory}
            patient={patientData}
            onRefresh={() => fetchRealTreatmentHistory(patientData)}
            onStartExam={hasPatientData ? handleNavigateTreatment : null}
            onOpenPlan={(record) => {
              navigate('/dentist/treatment-plans', {
                state: {
                  patient: patientData,
                  planId: record.treatmentPlanId,
                  examinationResultId: record.examinationResultId,
                  examinationResult: record.rawExam,
                },
              });
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CHỌN HỒ SƠ BỆNH NHÂN KHI 1 SỐ ĐIỆN THOẠI CÓ NHIỀU HỒ SƠ (COMMON COMPONENT) */}
      {/* ========================================================================= */}
      <MultiplePatientsModal
        isOpen={multiplePatientsModalOpen}
        onClose={() => setMultiplePatientsModalOpen(false)}
        phoneQuery={phoneSearchQuery}
        patientsList={foundPatientsList}
        onSelectPatient={(p) => {
          applyPatientToForm(p);
          toast.success(`Đã chọn hồ sơ bệnh nhân: ${p.fullName || p.patientName} (${p.patientCode})`);
        }}
      />
    </div>
  );
}

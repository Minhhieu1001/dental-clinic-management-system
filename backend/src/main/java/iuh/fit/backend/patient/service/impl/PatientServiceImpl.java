package iuh.fit.backend.patient.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.billing.dto.PatientInvoiceDataResponse;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.medicalrecord.repository.MedicalRecordRepository;
import iuh.fit.backend.patient.dto.PatientCreateDTO;
import iuh.fit.backend.patient.dto.PatientDTO;
import iuh.fit.backend.patient.dto.PatientStatisticsResponse;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.prescription.repository.PrescriptionRepository;
import iuh.fit.backend.treatment.repository.TreatmentPlanRepository;
import iuh.fit.backend.billing.repository.InvoiceRepository;
import iuh.fit.backend.billing.enums.PaymentStatus;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.enums.Gender;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.patient.service.PatientService;
import iuh.fit.backend.treatment.enums.StatusPhase;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DentistRepository dentistRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final BranchRepository branchRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final TreatmentPlanRepository treatmentPlanRepository;
    private final InvoiceRepository invoiceRepository;

    @Override
    @Transactional(readOnly = true)
    public PatientStatisticsResponse getPatientStatistics(UUID id) {
        if (!patientRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân ID: " + id);
        }

        // Include today and the preceding 29 calendar days in Vietnam.
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDateTime start = today.minusDays(29).atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return PatientStatisticsResponse.builder()
                .totalAppointmentsLast30Days(appointmentRepository.countByPatientAndDateRange(id, start, end))
                .totalPrescriptions(prescriptionRepository.countByExaminationResultMedicalRecordPatientId(id))
                .totalTreatmentPlans(treatmentPlanRepository.countByExaminationResultMedicalRecordPatientId(id))
                .completedTreatmentPlans(treatmentPlanRepository
                        .countByExaminationResultMedicalRecordPatientIdAndStatus(id, StatusPhase.COMPLETED))
                .inProgressTreatmentPlans(treatmentPlanRepository
                        .countByExaminationResultMedicalRecordPatientIdAndStatus(id, StatusPhase.IN_PROGRESS))
                .totalOutstandingDebt(invoiceRepository.sumOutstandingDebtByPatientId(id, PaymentStatus.CANCELLED))
                .totalInvoices(invoiceRepository.countByPatientId(id))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PatientDTO getPatientById(UUID id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân ID: " + id));
        return mapToDTO(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDTO> getPatientsByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return getAllPatients();
        }
        return patientRepository.findByPhoneNumberOrderByCreatedAtDesc(phoneNumber.trim())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PatientDTO searchPatient(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Từ khóa tìm kiếm bệnh nhân không được để trống");
        }

        String value = keyword.trim();
        Optional<Patient> patient = Optional.empty();

        try {
            patient = patientRepository.findById(UUID.fromString(value));
        } catch (IllegalArgumentException ignored) {
            // The keyword can also be a phone number, CCCD, or patient code.
        }

        if (patient.isEmpty()) {
            patient = patientRepository.findFirstByPhoneNumberOrderByCreatedAtDesc(value);
        }
        if (patient.isEmpty()) {
            patient = patientRepository.findFirstByCccdOrderByCreatedAtDesc(value);
        }
        if (patient.isEmpty()) {
            patient = patientRepository.findFirstByPatientCodeOrderByCreatedAtDesc(value);
        }

        return mapToDTO(patient.orElseThrow(() ->
                new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy bệnh nhân theo từ khóa: " + value)));
    }

    @Override
    @Transactional
    public PatientDTO createPatient(PatientCreateDTO dto) {
        if (dto.getBranchId() == null || dto.getBranchId().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Vui lòng chọn chi nhánh");
        }
        Branch branch = branchRepository.findById(dto.getBranchId().trim())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy chi nhánh: " + dto.getBranchId()));
        String patientCode = "PA-" + (System.currentTimeMillis() % 1000000);
        Patient patient = Patient.builder()
                .patientCode(patientCode)
                .phoneNumber(dto.getPhone())
                .cccd(normalize(dto.getCccd()))
                .email(dto.getEmail() != null ? dto.getEmail().trim() : null)
                .nationality(dto.getNationality())
                .hometown(normalize(dto.getHometown()))
                .job(normalize(dto.getJob()))
                .fullName(dto.getFullName() != null ? dto.getFullName().trim() : "Bệnh nhân mới")
                .gender(dto.getGender())
                .dateOfBirth(dto.getDateOfBirth())
                .address(dto.getAddress())
                .systemicDisease(dto.getSystemicDisease())
                .allergies(dto.getAllergies())
                .currentMedications(dto.getCurrentMedications())
                .surgicalHistory(dto.getSurgicalHistory())
                .createdAt(LocalDateTime.now())
                .build();

        patient = patientRepository.save(patient);
        log.info("Successfully created patient: {} ({})", patient.getFullName(), patient.getPatientCode());

        // Tự động tạo hồ sơ bệnh án (MedicalRecord) mặc định cho bệnh nhân mới
        try {
            // Xác định bác sĩ phụ trách (Dentist):
            // - Nếu là Lễ tân (EMPLOYEE) -> để trống doctorId (assignedDentist = null)
            // - Nếu là Bác sĩ (DENTIST) -> cập nhật luôn ID của bác sĩ đó
            Dentist assignedDentist = null;

            // 1. Kiểm tra doctorId truyền từ FE (nếu có)
            if (dto.getDoctorId() != null) {
                assignedDentist = dentistRepository.findById(dto.getDoctorId())
                        .orElseGet(() -> dentistRepository.findByUserId(dto.getDoctorId()).orElse(null));
            }

            // 2. Nếu FE không truyền doctorId, tự động phát hiện từ người dùng đăng nhập hiện tại
            if (assignedDentist == null) {
                try {
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                        String username = auth.getName();
                        User currentUser = userRepository.findByUsername(username)
                                .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
                        if (currentUser != null && currentUser.getRole() == Role.DENTIST) {
                            assignedDentist = dentistRepository.findByUserId(currentUser.getId()).orElse(null);
                        }
                        // Nếu là EMPLOYEE (Lễ tân) thì assignedDentist vẫn là null -> để trống doctorId
                    }
                } catch (Exception ex) {
                    log.warn("Không thể xác định thông tin người dùng đang đăng nhập: {}", ex.getMessage());
                }
            }


            MedicalRecord medicalRecord = MedicalRecord.builder()
                    .patient(patient)
                    .dentist(assignedDentist)
                    .branch(branch)
                    .treatmentNotes(dto.getNotes())
                    .recordDate(LocalDateTime.now())
                    .build();

            medicalRecordRepository.save(medicalRecord);
            log.info("Successfully created default medical record for patient");
        } catch (Exception e) {
            log.error("Failed to create default medical record for patient {}: {}", patient.getPatientCode(), e.getMessage(), e);
            throw e;
        }

        return mapToDTO(patient);
    }

    @Override
    @Transactional
    public PatientDTO updatePatient(UUID id, PatientCreateDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân ID: " + id));

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            patient.setFullName(dto.getFullName().trim());
        }
        if (dto.getGender() != null) {
            patient.setGender(dto.getGender());
        }
        if (dto.getNationality() != null) {
            patient.setNationality(dto.getNationality().trim());
        }
        if (dto.getHometown() != null) {
            patient.setHometown(normalize(dto.getHometown()));
        }
        if (dto.getJob() != null) {
            patient.setJob(normalize(dto.getJob()));
        }
        if (dto.getDateOfBirth() != null) {
            patient.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getAddress() != null) {
            patient.setAddress(dto.getAddress().trim());
        }
        patient.setSystemicDisease(dto.getSystemicDisease() != null ? dto.getSystemicDisease().trim() : null);
        patient.setAllergies(dto.getAllergies() != null ? dto.getAllergies().trim() : null);
        patient.setCurrentMedications(dto.getCurrentMedications() != null ? dto.getCurrentMedications().trim() : null);
        patient.setSurgicalHistory(dto.getSurgicalHistory() != null ? dto.getSurgicalHistory().trim() : null);

        // Link User if phone changed and user exists
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            patient.setPhoneNumber(dto.getPhone().trim());
        }
        if (dto.getCccd() != null) {
            patient.setCccd(normalize(dto.getCccd()));
        }
        if (dto.getEmail() != null) {
            patient.setEmail(dto.getEmail().trim());
        }

        patient = patientRepository.save(patient);
        log.info("Successfully updated patient ID: {}", id);
        return mapToDTO(patient);
    }

    @Override
    @Transactional
    public void deletePatient(UUID id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân ID: " + id));
        patientRepository.delete(patient);
        log.info("Successfully deleted patient ID: {}", id);
    }

    @Override
    public PatientDTO getPatientByPatientCode(String code) {
        Patient patient = patientRepository.findByPatientCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân : " + code));
        return mapToDTO(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientInvoiceDataResponse getRawInvoiceDataByPatientCode(String patientCode) {
        List<Map<String, Object>> rows = patientRepository.getRawInvoiceDataByPatientCode(patientCode);
        if (rows.isEmpty()) {
            return PatientInvoiceDataResponse.builder()
                    .unbilledTreatmentPlans(new ArrayList<>())
                    .build();
        }

        Map<String, Object> firstRow = rows.get(0);
        PatientInvoiceDataResponse.PatientSummaryDTO patientInfo =
                PatientInvoiceDataResponse.PatientSummaryDTO.builder()
                        .id(asUuid(firstRow.get("patient_id")))
                        .patientCode(asString(firstRow.get("patient_code")))
                        .fullName(asString(firstRow.get("full_name")))
                        .phone(asString(firstRow.get("phone")))
                        .cccd(asString(firstRow.get("cccd")))
                        .gender(asEnum(Gender.class, firstRow.get("gender")))
                        .dateOfBirth(asDateTime(firstRow.get("date_of_birth")))
                        .address(asString(firstRow.get("address")))
                        .hometown(asString(firstRow.get("hometown")))
                        .job(asString(firstRow.get("job")))
                        .build();

        Map<UUID, PlanAggregate> plans = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            UUID planId = asUuid(row.get("treatment_plan_id"));
            if (planId == null) {
                continue;
            }

            PlanAggregate plan = plans.computeIfAbsent(planId, ignored -> new PlanAggregate(
                    PatientInvoiceDataResponse.UnbilledTreatmentPlanDTO.builder()
                            .treatmentPlanId(planId)
                            .planName(asString(row.get("plan_name")))
                            .description(asString(row.get("plan_description")))
                            .estimatedCost(asBigDecimal(row.get("estimated_cost")))
                            .status(asEnum(StatusPhase.class, row.get("plan_status")))
                            .startDate(asDateTime(row.get("plan_start_date")))
                            .examinationResultId(asUuid(row.get("examination_result_id")))
                            .examinationDate(asDateTime(row.get("examination_date")))
                            .chiefComplaint(asString(row.get("chief_complaint")))
                            .doctorName(asString(row.get("doctor_name")))
                            .creatorName(asString(row.get("creator_name")))
                            .diagnoses(new ArrayList<>())
                            .phases(new ArrayList<>())
                            .invoiceServices(new ArrayList<>())
                            .build()));

            UUID diagnosisId = asUuid(row.get("diagnosis_id"));
            if (diagnosisId != null) {
                plan.diagnoses.putIfAbsent(diagnosisId,
                        PatientInvoiceDataResponse.DiagnosisDTO.builder()
                                .id(diagnosisId)
                                .toothPosition(asString(row.get("tooth_position")))
                                .primaryDiagnosis(asString(row.get("primary_diagnosis")))
                                .level(asString(row.get("diagnosis_level")))
                                .diagnosticNotes(asString(row.get("diagnostic_notes")))
                                .build());
            }

            UUID phaseId = asUuid(row.get("phase_id"));
            if (phaseId != null) {
                PatientInvoiceDataResponse.PhaseDTO phase = plan.phases.computeIfAbsent(phaseId, ignored ->
                        PatientInvoiceDataResponse.PhaseDTO.builder()
                                .id(phaseId)
                                .phaseName(asString(row.get("phase_name")))
                                .phaseOrder(asString(row.get("phase_order")))
                                .treatmentType(asString(row.get("treatment_type")))
                                .description(asString(row.get("phase_description")))
                                .status(asEnum(StatusPhase.class, row.get("phase_status")))
                                .services(new ArrayList<>())
                                .build());

                UUID treatmentServiceId = asUuid(row.get("treatment_service_id"));
                if (treatmentServiceId != null) {
                    PatientInvoiceDataResponse.InvoiceServiceItemDTO service =
                            PatientInvoiceDataResponse.InvoiceServiceItemDTO.builder()
                                    .treatmentServiceId(treatmentServiceId)
                                    .serviceId(asUuid(row.get("service_id")))
                                    .serviceName(asString(row.get("service_name")))
                                    .toothNumber(asString(row.get("tooth_number")))
                                    .quantity(asInteger(row.get("quantity")))
                                    .unitPrice(asBigDecimal(row.get("price")))
                                    .totalAmount(asBigDecimal(row.get("total_amount")))
                                    .build();
                    if (plan.serviceIdsByPhase.computeIfAbsent(phaseId, ignored -> new HashSet<>())
                            .add(treatmentServiceId)) {
                        phase.getServices().add(service);
                        plan.result.getInvoiceServices().add(service);
                    }
                }
            }
        }

        plans.values().forEach(plan -> {
            plan.result.setDiagnoses(new ArrayList<>(plan.diagnoses.values()));
            plan.result.setPhases(new ArrayList<>(plan.phases.values()));
        });

        return PatientInvoiceDataResponse.builder()
                .patientInfo(patientInfo)
                .unbilledTreatmentPlans(plans.values().stream().map(plan -> plan.result).toList())
                .build();
    }

    private static final class PlanAggregate {
        private final PatientInvoiceDataResponse.UnbilledTreatmentPlanDTO result;
        private final Map<UUID, PatientInvoiceDataResponse.DiagnosisDTO> diagnoses = new LinkedHashMap<>();
        private final Map<UUID, PatientInvoiceDataResponse.PhaseDTO> phases = new LinkedHashMap<>();
        private final Map<UUID, Set<UUID>> serviceIdsByPhase = new LinkedHashMap<>();

        private PlanAggregate(PatientInvoiceDataResponse.UnbilledTreatmentPlanDTO result) {
            this.result = result;
        }
    }

    private static UUID asUuid(Object value) {
        return value instanceof UUID uuid ? uuid : value == null ? null : UUID.fromString(value.toString());
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static Integer asInteger(Object value) {
        return value instanceof Number number ? number.intValue() : value == null ? null : Integer.valueOf(value.toString());
    }

    private static BigDecimal asBigDecimal(Object value) {
        return value instanceof BigDecimal decimal ? decimal : value == null ? null : new BigDecimal(value.toString());
    }

    private static LocalDateTime asDateTime(Object value) {
        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return value == null ? null : LocalDateTime.parse(value.toString());
    }

    private static <E extends Enum<E>> E asEnum(Class<E> enumType, Object value) {
        return value == null ? null : Enum.valueOf(enumType, value.toString());
    }

    private PatientDTO mapToDTO(Patient patient) {
        String phoneStr = patient.getPhoneNumber() != null ? patient.getPhoneNumber().trim() : "";

        return PatientDTO.builder()
                .id(patient.getId())
                .patientCode(patient.getPatientCode())
                .fullName(patient.getFullName())
                .phone(phoneStr)
                .cccd(patient.getCccd())
                .email(patient.getEmail())
                .nationality(patient.getNationality())
                .hometown(patient.getHometown())
                .job(patient.getJob())
                .gender(patient.getGender())
                .dateOfBirth(patient.getDateOfBirth())
                .address(patient.getAddress())
                .systemicDisease(patient.getSystemicDisease())
                .allergies(patient.getAllergies())
                .currentMedications(patient.getCurrentMedications())
                .surgicalHistory(patient.getSurgicalHistory())
                .createdAt(patient.getCreatedAt())
                .build();
    }

    private static String normalize(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }
}

package iuh.fit.backend.medicalrecord.service.impl;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.dto.DiagnosisDTO;
import iuh.fit.backend.medicalrecord.dto.ExaminationResultDTO;
import iuh.fit.backend.medicalrecord.dto.MedicalRecordDTO;
import iuh.fit.backend.medicalrecord.dto.MedicalRecordRequest;
import iuh.fit.backend.medicalrecord.dto.ToothRecordDTO;
import iuh.fit.backend.medicalrecord.entity.Diagnosis;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.medicalrecord.repository.MedicalRecordRepository;
import iuh.fit.backend.medicalrecord.service.MedicalRecordService;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.repository.DentistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DentistRepository dentistRepository;
    private final AppointmentRepository appointmentRepository;

    public MedicalRecordServiceImpl(
            MedicalRecordRepository medicalRecordRepository,
            PatientRepository patientRepository,
            DentistRepository dentistRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRepository = patientRepository;
        this.dentistRepository = dentistRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalRecordDTO> getAllMedicalRecords() {
        return medicalRecordRepository.findAllByOrderByRecordDateDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalRecordDTO> getMedicalRecords(String search, String gender, UUID dentistId, String dentistName, Integer year, Integer month) {
        List<MedicalRecord> list = medicalRecordRepository.findAllByOrderByRecordDateDesc();

        return list.stream()
                .filter(r -> {
                    Patient p = r.getPatient();
                    Dentist d = r.getDentist();

                    // Search filter: medicalRecordCode, patientCode, patientName, patientPhone, cccd
                    if (search != null && !search.trim().isEmpty()) {
                        String q = search.trim().toLowerCase();
                        boolean matchCode = r.getMedicalRecordCode() != null && r.getMedicalRecordCode().toLowerCase().contains(q);
                        boolean matchPatientCode = p != null && p.getPatientCode() != null && p.getPatientCode().toLowerCase().contains(q);
                        boolean matchName = p != null && p.getFullName() != null && p.getFullName().toLowerCase().contains(q);
                        boolean matchPhone = p != null && p.getPhoneNumber() != null && p.getPhoneNumber().toLowerCase().contains(q);
                        boolean matchCccd = p != null && p.getCccd() != null && p.getCccd().toLowerCase().contains(q);
                        if (!matchCode && !matchPatientCode && !matchName && !matchPhone && !matchCccd) {
                            return false;
                        }
                    }

                    // Gender filter
                    if (gender != null && !gender.trim().isEmpty() && !"ALL".equalsIgnoreCase(gender)) {
                        if (p == null || p.getGender() == null || !p.getGender().name().equalsIgnoreCase(gender.trim())) {
                            return false;
                        }
                    }

                    // Dentist ID filter
                    if (dentistId != null) {
                        if (d == null || !dentistId.equals(d.getId())) {
                            return false;
                        }
                    }

                    // Dentist Name filter
                    if (dentistName != null && !dentistName.trim().isEmpty() && !"ALL".equalsIgnoreCase(dentistName)) {
                        if (d == null || d.getFullName() == null || !d.getFullName().trim().equalsIgnoreCase(dentistName.trim())) {
                            return false;
                        }
                    }

                    // Year / Month filter
                    if (year != null && year > 0) {
                        LocalDateTime date = r.getRecordDate();
                        if (date == null || date.getYear() != year) {
                            return false;
                        }
                    }

                    if (month != null && month >= 1 && month <= 12) {
                        LocalDateTime date = r.getRecordDate();
                        if (date == null || date.getMonthValue() != month) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordDTO getMedicalRecordById(UUID id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh án ID: " + id));
        return mapToDTO(record);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordDTO getMedicalRecordByCode(String medicalRecordCode) {
        if (medicalRecordCode == null || medicalRecordCode.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Mã hồ sơ bệnh án không được để trống");
        }

        MedicalRecord record = medicalRecordRepository.findByMedicalRecordCode(medicalRecordCode.trim())
                .orElseThrow(() -> new AppException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy hồ sơ bệnh án có mã: " + medicalRecordCode));
        return mapToDTO(record);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalRecordDTO> getMedicalRecordsByPatientId(UUID patientId) {
        return medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patientId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalRecordDTO> getMedicalRecordsByPatientCode(String patientCode) {
        if (patientCode == null || patientCode.trim().isEmpty()) {
            return getAllMedicalRecords();
        }
        return medicalRecordRepository.findByPatientCodeOrderByRecordDateDesc(patientCode.trim())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MedicalRecordDTO createMedicalRecord(MedicalRecordRequest request) {
        // Resolve patient
        Patient patient = null;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bệnh nhân ID: " + request.getPatientId()));
        } else if (request.getPatientCode() != null && !request.getPatientCode().trim().isEmpty()) {
            patient = patientRepository.findByPatientCode(request.getPatientCode().trim())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bệnh nhân có mã: " + request.getPatientCode()));
        }

        Dentist dentist = null;
        if (request.getDentistId() != null) {
            dentist = dentistRepository.findById(request.getDentistId())
                    .orElse(null);
        }

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElse(null);
        }

        MedicalRecord record = MedicalRecord.builder()
                .patient(patient)
                .dentist(dentist)
                .appointment(appointment)
                .treatmentNotes(request.getTreatmentNotes())
                .recordDate(request.getRecordDate() != null ? request.getRecordDate() : LocalDateTime.now())
                .fileName(request.getFileName())
                .address(request.getAddress())
                .dentalClinicName(request.getDentalClinicName())
                .build();

        record = medicalRecordRepository.save(record);
        log.info("Đã tạo hồ sơ bệnh án ID: {} cho bệnh nhân: {}", record.getId(), patient != null ? patient.getFullName() : "N/A");
        return mapToDTO(record);
    }

    @Override
    @Transactional
    public MedicalRecordDTO updateMedicalRecord(UUID id, MedicalRecordRequest request) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh án ID: " + id));

        if (request.getPatientId() != null) {
            Patient patient = patientRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bệnh nhân ID: " + request.getPatientId()));
            record.setPatient(patient);
        }

        if (request.getDentistId() != null) {
            Dentist dentist = dentistRepository.findById(request.getDentistId()).orElse(null);
            record.setDentist(dentist);
        }

        if (request.getAppointmentId() != null) {
            Appointment appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
            record.setAppointment(appointment);
        }

        if (request.getTreatmentNotes() != null) {
            record.setTreatmentNotes(request.getTreatmentNotes());
        }
        if (request.getRecordDate() != null) {
            record.setRecordDate(request.getRecordDate());
        }
        if (request.getFileName() != null) {
            record.setFileName(request.getFileName());
        }
        if (request.getAddress() != null) {
            record.setAddress(request.getAddress());
        }
        if (request.getDentalClinicName() != null) {
            record.setDentalClinicName(request.getDentalClinicName());
        }

        record = medicalRecordRepository.save(record);
        log.info("Đã cập nhật hồ sơ bệnh án ID: {}", id);
        return mapToDTO(record);
    }

    @Override
    @Transactional
    public void deleteMedicalRecord(UUID id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh án ID: " + id));
        medicalRecordRepository.delete(record);
        log.info("Đã xóa hồ sơ bệnh án ID: {}", id);
    }

    private MedicalRecordDTO mapToDTO(MedicalRecord record) {
        Patient p = record.getPatient();
        Dentist d = record.getDentist();

        List<ExaminationResultDTO> examDTOs = new ArrayList<>();
        if (record.getExaminationsResults() != null) {
            examDTOs = record.getExaminationsResults().stream()
                    .map(this::mapExamToDTO)
                    .collect(Collectors.toList());
        }

        return MedicalRecordDTO.builder()
                .id(record.getId())
                .medicalRecordCode(record.getMedicalRecordCode() != null
                        ? record.getMedicalRecordCode()
                        : "HSBA-" + record.getId().toString().substring(0, 8).toUpperCase())
                .patientId(p != null ? p.getId() : null)
                .patientName(p != null ? p.getFullName() : null)
                .patientCode(p != null ? p.getPatientCode() : null)
                .patientPhone(p != null ? p.getPhoneNumber() : null)
                .patientEmail(p != null ? p.getEmail() : null)
                .patientGender(p != null && p.getGender() != null ? p.getGender().name() : null)
                .patientDob(p != null ? p.getDateOfBirth() : null)
                .patientCccd(p != null ? p.getCccd() : null)
                .patientAddress(p != null ? p.getAddress() : null)
                .systemicDisease(p != null ? p.getSystemicDisease() : null)
                .allergies(p != null ? p.getAllergies() : null)
                .currentMedications(p != null ? p.getCurrentMedications() : null)
                .surgicalHistory(p != null ? p.getSurgicalHistory() : null)
                .dentistId(d != null ? d.getId() : null)
                .dentistName(d != null ? d.getFullName() : null)
                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                .treatmentNotes(record.getTreatmentNotes())
                .recordDate(record.getRecordDate())
                .fileName(record.getFileName())
                .address(record.getAddress())
                .dentalClinicName(record.getDentalClinicName())
                .examinationResults(examDTOs)
                .build();
    }

    private ExaminationResultDTO mapExamToDTO(ExaminationResult exam) {
        List<DiagnosisDTO> diagnosisDTOList = new ArrayList<>();
        DiagnosisDTO primaryDiagnosisDTO = null;

        if (exam.getDiagnoses() != null && !exam.getDiagnoses().isEmpty()) {
            diagnosisDTOList = exam.getDiagnoses().stream()
                    .map(diag -> DiagnosisDTO.builder()
                            .id(diag.getId())
                            .examinationResultId(exam.getId())
                            .toothPosition(diag.getToothPosition())
                            .primaryDiagnosis(diag.getPrimaryDiagnosis())
                            .level(diag.getLevel())
                            .sourceOfInformation(diag.getSourceOfInformation())
                            .diagnosticNotes(diag.getDiagnosticNotes())
                            .build())
                    .toList();
            primaryDiagnosisDTO = diagnosisDTOList.get(0);
        }

        List<ToothRecordDTO> toothRecordDTOs = new ArrayList<>();
        if (exam.getToothRecords() != null) {
            toothRecordDTOs = exam.getToothRecords().stream()
                    .map(tr -> ToothRecordDTO.builder()
                            .id(tr.getId())
                            .examinationResultId(exam.getId())
                            .toothNumber(tr.getToothNumber())
                            .toothStatus(tr.getToothStatus())
                            .severity(tr.getSeverity())
                            .hasCaries(tr.getHasCaries())
                            .cariesLocation(tr.getCariesLocation())
                            .painType(tr.getPainType())
                            .cariesDepth(tr.getCariesDepth())
                            .gingivalCondition(tr.getGingivalCondition())
                            .shake(tr.getShake())
                            .build())
                    .collect(Collectors.toList());
        }

        return ExaminationResultDTO.builder()
                .id(exam.getId())
                .medicalRecordId(exam.getMedicalRecord() != null ? exam.getMedicalRecord().getId() : null)
                .dentistId(exam.getDentist() != null ? exam.getDentist().getId() : null)
                .dentistName(exam.getDentist() != null ? exam.getDentist().getFullName() : null)
                .chiefComplaint(exam.getChiefComplaint())
                .examinationDate(exam.getExaminationDate())
                .diagnosis(primaryDiagnosisDTO)
                .diagnoses(diagnosisDTOList)
                .toothRecords(toothRecordDTOs)
                .build();
    }
}

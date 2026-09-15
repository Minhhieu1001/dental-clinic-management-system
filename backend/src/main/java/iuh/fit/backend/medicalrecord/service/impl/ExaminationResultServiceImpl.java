package iuh.fit.backend.medicalrecord.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.dto.DiagnosisDTO;
import iuh.fit.backend.medicalrecord.dto.DiagnosisRequest;
import iuh.fit.backend.medicalrecord.dto.ExaminationResultDTO;
import iuh.fit.backend.medicalrecord.dto.ExaminationResultRequest;
import iuh.fit.backend.medicalrecord.dto.ToothRecordDTO;
import iuh.fit.backend.medicalrecord.dto.ToothRecordRequest;
import iuh.fit.backend.medicalrecord.entity.Diagnosis;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.medicalrecord.entity.ToothRecord;
import iuh.fit.backend.medicalrecord.repository.DiagnosisRepository;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;
import iuh.fit.backend.medicalrecord.repository.MedicalRecordRepository;
import iuh.fit.backend.medicalrecord.repository.ToothRecordRepository;
import iuh.fit.backend.medicalrecord.service.ExaminationResultService;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExaminationResultServiceImpl implements ExaminationResultService {

    private final ExaminationResultRepository examinationResultRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final ToothRecordRepository toothRecordRepository;
    private final DentistRepository dentistRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExaminationResultDTO> getAllExaminationResults() {
        return examinationResultRepository.findAllByOrderByExaminationDateDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExaminationResultDTO getExaminationResultById(UUID id) {
        ExaminationResult examResult = examinationResultRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kết quả khám ID: " + id));
        return mapToDTO(examResult);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExaminationResultDTO> getExaminationResultsByMedicalRecordId(UUID medicalRecordId) {
        return examinationResultRepository.findByMedicalRecordIdOrderByExaminationDateDesc(medicalRecordId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExaminationResultDTO createExaminationResult(ExaminationResultRequest request) {
        MedicalRecord medicalRecord = medicalRecordRepository.findById(request.getMedicalRecordId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh án ID: " + request.getMedicalRecordId()));

        Dentist dentist = null;

        // 1. Ưu tiên lấy từ request nếu FE truyền dentistId (tìm theo Dentist.id hoặc User.id)
        if (request.getDentistId() != null) {
            dentist = dentistRepository.findById(request.getDentistId())
                    .or(() -> dentistRepository.findByUserId(request.getDentistId()))
                    .orElse(null);
        }

        // 2. Nếu chưa có, tự động lấy thông tin bác sĩ từ session đăng nhập (SecurityContextHolder)
        if (dentist == null) {
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                    User currentUser = null;
                    if (auth.getPrincipal() instanceof CustomUserDetails cud) {
                        currentUser = cud.getUser();
                    } else {
                        String principal = auth.getName();
                        currentUser = userRepository.findByEmail(principal)
                                .or(() -> userRepository.findByUsername(principal))
                                .orElse(null);
                    }
                    if (currentUser != null) {
                        dentist = dentistRepository.findByUserId(currentUser.getId()).orElse(null);
                    }
                }
            } catch (Exception ex) {
                log.warn("Không thể xác định bác sĩ từ session đăng nhập: {}", ex.getMessage());
            }
        }

        // 3. Nếu vẫn chưa có, fallback về bác sĩ mặc định của hồ sơ bệnh án (nếu có)
        if (dentist == null && medicalRecord.getDentist() != null) {
            dentist = medicalRecord.getDentist();
        }

        // Tự động gán bác sĩ cho hồ sơ bệnh án nếu hồ sơ bệnh án chưa có bác sĩ
        if (medicalRecord.getDentist() == null && dentist != null) {
            medicalRecord.setDentist(dentist);
            medicalRecordRepository.save(medicalRecord);
        }

        Boolean disabled = request.getDisabled() != null ? request.getDisabled() : true;

        ExaminationResult examResult = ExaminationResult.builder()
                .medicalRecord(medicalRecord)
                .dentist(dentist)
                .chiefComplaint(request.getChiefComplaint())
                .examinationDate(request.getExaminationDate() != null ? request.getExaminationDate() : LocalDateTime.now())
                .disabled(disabled)
                .build();

        examResult = examinationResultRepository.save(examResult);

        // Process Diagnoses (1-N)
        if (request.getDiagnoses() != null && !request.getDiagnoses().isEmpty()) {
            if (examResult.getDiagnoses() == null) {
                examResult.setDiagnoses(new ArrayList<>());
            }
            for (DiagnosisRequest diagReq : request.getDiagnoses()) {
                Diagnosis d = Diagnosis.builder()
                        .examinationResult(examResult)
                        .toothPosition(diagReq.getToothPosition())
                        .primaryDiagnosis(diagReq.getPrimaryDiagnosis())
                        .level(diagReq.getLevel())
                        .sourceOfInformation(diagReq.getSourceOfInformation())
                        .diagnosticNotes(diagReq.getDiagnosticNotes())
                        .build();
                examResult.getDiagnoses().add(d);
            }
        } else if (request.getDiagnosis() != null) {
            DiagnosisRequest diagReq = request.getDiagnosis();
            if (examResult.getDiagnoses() == null) {
                examResult.setDiagnoses(new ArrayList<>());
            }
            Diagnosis diagnosis = Diagnosis.builder()
                    .examinationResult(examResult)
                    .toothPosition(diagReq.getToothPosition())
                    .primaryDiagnosis(diagReq.getPrimaryDiagnosis())
                    .level(diagReq.getLevel())
                    .sourceOfInformation(diagReq.getSourceOfInformation())
                    .diagnosticNotes(diagReq.getDiagnosticNotes())
                    .build();
            examResult.getDiagnoses().add(diagnosis);
        }

        // Process ToothRecords if present
        if (request.getToothRecords() != null && !request.getToothRecords().isEmpty()) {
            List<ToothRecord> toothRecordList = new ArrayList<>();
            for (ToothRecordRequest trReq : request.getToothRecords()) {
                ToothRecord tr = ToothRecord.builder()
                        .examinationResult(examResult)
                        .toothNumber(trReq.getToothNumber())
                        .toothStatus(trReq.getToothStatus())
                        .severity(trReq.getSeverity())
                        .hasCaries(trReq.getHasCaries())
                        .cariesLocation(trReq.getCariesLocation())
                        .painType(trReq.getPainType())
                        .cariesDepth(trReq.getCariesDepth())
                        .gingivalCondition(trReq.getGingivalCondition())
                        .build();
                toothRecordList.add(toothRecordRepository.save(tr));
            }
            examResult.setToothRecords(toothRecordList);
        }

        log.info("Đã tạo kết quả khám ID: {} cho hồ sơ bệnh án ID: {}", examResult.getId(), medicalRecord.getId());
        return mapToDTO(examResult);
    }

    @Override
    @Transactional
    public ExaminationResultDTO updateExaminationResult(UUID id, ExaminationResultRequest request) {
        ExaminationResult examResult = examinationResultRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kết quả khám ID: " + id));

        // Kiểm tra nếu đợt khám đã bị khóa trước đó (disabled == false)
        if (Boolean.FALSE.equals(examResult.getDisabled())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Đợt khám này đã được xác nhận và khóa hồ sơ. Không thể chỉnh sửa hoặc mở lại!");
        }

        // Cập nhật trạng thái disabled nếu request có gửi (ví dụ gửi disabled = false để khóa đợt khám)
        if (request.getDisabled() != null) {
            examResult.setDisabled(request.getDisabled());
        }

        if (request.getChiefComplaint() != null) {
            examResult.setChiefComplaint(request.getChiefComplaint());
        }
        if (request.getExaminationDate() != null) {
            examResult.setExaminationDate(request.getExaminationDate());
        }
        if (request.getDentistId() != null) {
            Dentist dentist = dentistRepository.findById(request.getDentistId())
                    .or(() -> dentistRepository.findByUserId(request.getDentistId()))
                    .orElse(null);
            if (dentist != null) {
                examResult.setDentist(dentist);
            }
        } else if (examResult.getDentist() == null) {
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                    String principal = auth.getName();
                    User currentUser = null;
                    if (auth.getPrincipal() instanceof CustomUserDetails cud) {
                        currentUser = cud.getUser();
                    } else {
                        currentUser = userRepository.findByEmail(principal)
                                .or(() -> userRepository.findByUsername(principal))
                                .orElse(null);
                    }
                    if (currentUser != null) {
                        Dentist sessionDentist = dentistRepository.findByUserId(currentUser.getId()).orElse(null);
                        if (sessionDentist != null) {
                            examResult.setDentist(sessionDentist);
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Không thể xác định bác sĩ từ session đăng nhập: {}", ex.getMessage());
            }
        }

        // Update diagnoses (1-N)
        if (request.getDiagnoses() != null) {
            if (examResult.getDiagnoses() == null) {
                examResult.setDiagnoses(new ArrayList<>());
            }
            List<Diagnosis> currentList = examResult.getDiagnoses();

            // Xóa các chẩn đoán cũ không còn nằm trong request
            currentList.removeIf(existing -> request.getDiagnoses().stream()
                    .noneMatch(req -> (req.getId() != null && req.getId().equals(existing.getId()))
                            || (req.getToothPosition() != null && req.getToothPosition().equalsIgnoreCase(existing.getToothPosition()))));

            for (DiagnosisRequest diagReq : request.getDiagnoses()) {
                Diagnosis existing = currentList.stream()
                        .filter(d -> (diagReq.getId() != null && diagReq.getId().equals(d.getId()))
                                || (diagReq.getToothPosition() != null && diagReq.getToothPosition().equalsIgnoreCase(d.getToothPosition())))
                        .findFirst()
                        .orElse(null);

                if (existing != null) {
                    // Cập nhật trên bản ghi đã có (giữ nguyên ID)
                    existing.setToothPosition(diagReq.getToothPosition());
                    existing.setPrimaryDiagnosis(diagReq.getPrimaryDiagnosis());
                    existing.setLevel(diagReq.getLevel());
                    existing.setSourceOfInformation(diagReq.getSourceOfInformation());
                    existing.setDiagnosticNotes(diagReq.getDiagnosticNotes());
                } else {
                    // Thêm mới
                    Diagnosis d = Diagnosis.builder()
                            .examinationResult(examResult)
                            .toothPosition(diagReq.getToothPosition())
                            .primaryDiagnosis(diagReq.getPrimaryDiagnosis())
                            .level(diagReq.getLevel())
                            .sourceOfInformation(diagReq.getSourceOfInformation())
                            .diagnosticNotes(diagReq.getDiagnosticNotes())
                            .build();
                    currentList.add(d);
                }
            }
        } else if (request.getDiagnosis() != null) {
            DiagnosisRequest diagReq = request.getDiagnosis();
            if (examResult.getDiagnoses() == null) {
                examResult.setDiagnoses(new ArrayList<>());
            }
            if (!examResult.getDiagnoses().isEmpty()) {
                Diagnosis existing = examResult.getDiagnoses().get(0);
                existing.setToothPosition(diagReq.getToothPosition());
                existing.setPrimaryDiagnosis(diagReq.getPrimaryDiagnosis());
                existing.setLevel(diagReq.getLevel());
                existing.setSourceOfInformation(diagReq.getSourceOfInformation());
                existing.setDiagnosticNotes(diagReq.getDiagnosticNotes());
            } else {
                Diagnosis d = Diagnosis.builder()
                        .examinationResult(examResult)
                        .toothPosition(diagReq.getToothPosition())
                        .primaryDiagnosis(diagReq.getPrimaryDiagnosis())
                        .level(diagReq.getLevel())
                        .sourceOfInformation(diagReq.getSourceOfInformation())
                        .diagnosticNotes(diagReq.getDiagnosticNotes())
                        .build();
                examResult.getDiagnoses().add(d);
            }
        }

        examResult = examinationResultRepository.save(examResult);
        log.info("Đã cập nhật kết quả khám ID: {}", id);
        return mapToDTO(examResult);
    }

    @Override
    @Transactional
    public void deleteExaminationResult(UUID id) {
        ExaminationResult examResult = examinationResultRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kết quả khám ID: " + id));
        if (Boolean.FALSE.equals(examResult.getDisabled())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Đợt khám này đã được xác nhận và khóa hồ sơ. Không thể xóa!");
        }
        examinationResultRepository.delete(examResult);
        log.info("Đã xóa kết quả khám ID: {}", id);
    }

    private ExaminationResultDTO mapToDTO(ExaminationResult examResult) {
        List<DiagnosisDTO> diagnosisDTOList = new ArrayList<>();
        DiagnosisDTO primaryDiagnosisDTO = null;

        if (examResult.getDiagnoses() != null && !examResult.getDiagnoses().isEmpty()) {
            diagnosisDTOList = examResult.getDiagnoses().stream()
                    .map(diag -> DiagnosisDTO.builder()
                            .id(diag.getId())
                            .examinationResultId(examResult.getId())
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
        if (examResult.getToothRecords() != null) {
            toothRecordDTOs = examResult.getToothRecords().stream()
                    .map(tr -> ToothRecordDTO.builder()
                            .id(tr.getId())
                            .examinationResultId(examResult.getId())
                            .toothNumber(tr.getToothNumber())
                            .toothStatus(tr.getToothStatus())
                            .severity(tr.getSeverity())
                            .hasCaries(tr.getHasCaries())
                            .cariesLocation(tr.getCariesLocation())
                            .painType(tr.getPainType())
                            .cariesDepth(tr.getCariesDepth())
                            .gingivalCondition(tr.getGingivalCondition())
                            .build())
                    .collect(Collectors.toList());
        }

        iuh.fit.backend.user.entity.Dentist dentist = examResult.getDentist();
        if (dentist == null && examResult.getMedicalRecord() != null) {
            dentist = examResult.getMedicalRecord().getDentist();
        }

        UUID dentistId = null;
        String dentistName = null;
        if (dentist != null) {
            dentistId = dentist.getId();
            dentistName = dentist.getFullName();
            if (dentistName == null || dentistName.isBlank()) {
                if (dentist.getUser() != null && dentist.getUser().getUsername() != null) {
                    dentistName = dentist.getUser().getUsername();
                }
            }
        }

        return ExaminationResultDTO.builder()
                .id(examResult.getId())
                .medicalRecordId(examResult.getMedicalRecord() != null ? examResult.getMedicalRecord().getId() : null)
                .dentistId(dentistId)
                .dentistName(dentistName)
                .chiefComplaint(examResult.getChiefComplaint())
                .examinationDate(examResult.getExaminationDate())
                .disabled(examResult.getDisabled() != null ? examResult.getDisabled() : true)
                .diagnosis(primaryDiagnosisDTO)
                .diagnoses(diagnosisDTOList)
                .toothRecords(toothRecordDTOs)
                .treatmentPlanId(examResult.getTreatmentPlan() != null ? examResult.getTreatmentPlan().getId() : null)
                .build();
    }
}

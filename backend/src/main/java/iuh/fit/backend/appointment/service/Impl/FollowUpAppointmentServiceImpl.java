package iuh.fit.backend.appointment.service.Impl;

import iuh.fit.backend.appointment.dto.FollowUpAppointmentDTO;
import iuh.fit.backend.appointment.dto.FollowUpAppointmentRequestDTO;
import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import iuh.fit.backend.appointment.repository.FollowUpAppointmentRepository;
import iuh.fit.backend.appointment.service.FollowUpAppointmentService;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;
import iuh.fit.backend.notification.service.NotificationService;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.repository.DentistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FollowUpAppointmentServiceImpl implements FollowUpAppointmentService {

    private final FollowUpAppointmentRepository followUpAppointmentRepository;
    private final ExaminationResultRepository examinationResultRepository;
    private final DentistRepository dentistRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");

    @Override
    @Transactional(readOnly = true)
    public List<FollowUpAppointmentDTO> getCurrentMonthFollowUpAppointmentsByPatientId(UUID patientId) {
        YearMonth month = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        return followUpAppointmentRepository.findByPatientAndDateRange(
                        patientId,
                        month.atDay(1).atStartOfDay(),
                        month.plusMonths(1).atDay(1).atStartOfDay())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowUpAppointmentDTO> getAllFollowUpAppointments(UUID patientId, UUID examinationResultId, String patientCode) {
        List<FollowUpAppointment> list;
        if (patientId != null || (patientCode != null && !patientCode.isBlank()) || examinationResultId != null) {
            list = followUpAppointmentRepository.findFollowUpAppointments(
                    patientId,
                    (patientCode != null && !patientCode.isBlank()) ? patientCode.trim() : null,
                    examinationResultId
            );
        } else {
            list = followUpAppointmentRepository.findAllByOrderByFollowUpDateDesc();
        }
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FollowUpAppointmentDTO getFollowUpAppointmentById(UUID id) {
        FollowUpAppointment followUp = followUpAppointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy lịch tái khám với ID: " + id));
        return mapToDTO(followUp);
    }

    @Override
    public FollowUpAppointmentDTO createFollowUpAppointment(FollowUpAppointmentRequestDTO request) {
        ExaminationResult examinationResult = null;
        if (request.getExaminationResultId() != null) {
            examinationResult = examinationResultRepository.findById(request.getExaminationResultId())
                    .orElse(null);
        }

        Dentist dentist = null;
        if (request.getDentistId() != null) {
            dentist = dentistRepository.findById(request.getDentistId()).orElse(null);
        } else if (examinationResult != null && examinationResult.getDentist() != null) {
            dentist = examinationResult.getDentist();
        }

        FollowUpAppointment followUp = FollowUpAppointment.builder()
                .examinationResult(examinationResult)
                .dentist(dentist)
                .followUpDate(request.getFollowUpDate())
                .reason(request.getReason())
                .note(request.getNote())
                .status(request.getStatus() != null ? request.getStatus() : true)
                .build();

        FollowUpAppointment saved = followUpAppointmentRepository.save(followUp);
        log.info("[FOLLOW-UP] Đã tạo thành công lịch tái khám ID: {} cho ngày {}", saved.getId(), saved.getFollowUpDate());

        // Dispatch Email / SMS notification if requested
        trySendNotifications(saved, request.getPatientId(), request.getPatientCode(), request.getSendEmail(), request.getSendSms());

        return mapToDTO(saved);
    }

    @Override
    public FollowUpAppointmentDTO updateFollowUpAppointment(UUID id, FollowUpAppointmentRequestDTO request) {
        FollowUpAppointment followUp = followUpAppointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy lịch tái khám với ID: " + id));

        if (request.getExaminationResultId() != null) {
            ExaminationResult examinationResult = examinationResultRepository.findById(request.getExaminationResultId())
                    .orElse(null);
            followUp.setExaminationResult(examinationResult);
        }

        if (request.getDentistId() != null) {
            Dentist dentist = dentistRepository.findById(request.getDentistId()).orElse(null);
            followUp.setDentist(dentist);
        }

        if (request.getFollowUpDate() != null) {
            followUp.setFollowUpDate(request.getFollowUpDate());
        }

        if (request.getReason() != null) {
            followUp.setReason(request.getReason());
        }

        if (request.getNote() != null) {
            followUp.setNote(request.getNote());
        }

        if (request.getStatus() != null) {
            followUp.setStatus(request.getStatus());
        }

        FollowUpAppointment updated = followUpAppointmentRepository.save(followUp);
        log.info("[FOLLOW-UP] Đã cập nhật lịch tái khám ID: {}", updated.getId());

        trySendNotifications(updated, request.getPatientId(), request.getPatientCode(), request.getSendEmail(), request.getSendSms());

        return mapToDTO(updated);
    }

    @Override
    public void deleteFollowUpAppointment(UUID id) {
        if (!followUpAppointmentRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy lịch tái khám với ID: " + id);
        }
        followUpAppointmentRepository.deleteById(id);
        log.info("[FOLLOW-UP] Đã xóa lịch tái khám ID: {}", id);
    }

    private void trySendNotifications(FollowUpAppointment followUp, UUID requestPatientId, String requestPatientCode, Boolean sendEmail, Boolean sendSms) {
        if ((sendEmail == null || !sendEmail) && (sendSms == null || !sendSms)) {
            return;
        }

        Patient patient = null;
        if (followUp.getExaminationResult() != null && followUp.getExaminationResult().getMedicalRecord() != null) {
            patient = followUp.getExaminationResult().getMedicalRecord().getPatient();
        }

        if (patient == null && requestPatientId != null) {
            patient = patientRepository.findById(requestPatientId).orElse(null);
        }

        if (patient == null && requestPatientCode != null && !requestPatientCode.isBlank()) {
            List<Patient> list = patientRepository.findAll();
            for (Patient p : list) {
                if (p.getPatientCode() != null && p.getPatientCode().equalsIgnoreCase(requestPatientCode.trim())) {
                    patient = p;
                    break;
                }
            }
        }

        if (patient == null) {
            log.warn("[FOLLOW-UP NOTIF] Không tìm thấy thông tin bệnh nhân để gửi thông báo tái khám.");
            return;
        }

        String patientName = patient.getFullName();
        String phone = patient.getPhoneNumber();
        String email = patient.getEmail();
        String doctorName = followUp.getDentist() != null ? followUp.getDentist().getFullName() : "Nha sĩ phụ trách";
        String dateStr = followUp.getFollowUpDate() != null ? followUp.getFollowUpDate().format(TIME_FORMATTER) : "";

        boolean doEmail = sendEmail == null || sendEmail;
        boolean doSms = sendSms == null || sendSms;

        try {
            notificationService.sendFollowUpAppointmentNotification(
                    email,
                    phone,
                    patientName,
                    dateStr,
                    doctorName,
                    followUp.getReason(),
                    followUp.getNote(),
                    doEmail,
                    doSms
            );
        } catch (Exception ex) {
            log.error("[FOLLOW-UP NOTIF ERROR] Lỗi khi gửi thông báo lịch tái khám: {}", ex.getMessage());
        }
    }

    private FollowUpAppointmentDTO mapToDTO(FollowUpAppointment entity) {
        if (entity == null) return null;

        ExaminationResult exam = entity.getExaminationResult();
        Dentist dentist = entity.getDentist();
        Patient patient = null;

        if (exam != null && exam.getMedicalRecord() != null) {
            patient = exam.getMedicalRecord().getPatient();
        }

        return FollowUpAppointmentDTO.builder()
                .id(entity.getId())
                .followUpDate(entity.getFollowUpDate())
                .reason(entity.getReason())
                .note(entity.getNote())
                .status(entity.getStatus())
                .createAt(entity.getCreateAt())
                .updatedAt(entity.getUpdatedAt())
                .examinationResultId(exam != null ? exam.getId() : null)
                .examinationDate(exam != null ? exam.getExaminationDate() : null)
                .chiefComplaint(exam != null ? exam.getChiefComplaint() : null)
                .medicalRecordId(exam != null && exam.getMedicalRecord() != null ? exam.getMedicalRecord().getId() : null)
                .patientId(patient != null ? patient.getId() : null)
                .patientCode(patient != null ? patient.getPatientCode() : null)
                .patientName(patient != null ? patient.getFullName() : null)
                .patientPhone(patient != null ? patient.getPhoneNumber() : null)
                .patientEmail(patient != null ? patient.getEmail() : null)
                .dentistId(dentist != null ? dentist.getId() : null)
                .dentistName(dentist != null ? dentist.getFullName() : null)
                .build();
    }
}

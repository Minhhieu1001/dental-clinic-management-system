package iuh.fit.backend.treatment.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.treatment.dto.TreatmentPlanRequest;
import iuh.fit.backend.treatment.dto.TreatmentPlanResponse;
import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.entity.*;
import iuh.fit.backend.treatment.repository.*;
import iuh.fit.backend.treatment.service.TreatmentPlanService;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iuh.fit.backend.treatment.enums.StatusPhase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TreatmentPlanServiceImpl implements TreatmentPlanService {

    private final TreatmentPlanRepository treatmentPlanRepository;
    private final DentistRepository dentistRepository;
    private final ExaminationResultRepository examinationResultRepository;
    private final AppointmentRepository appointmentRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @Override
    @Transactional
    public TreatmentPlanResponse createTreatmentPlan(TreatmentPlanRequest request) {
        validatePlanRequest(request);
        if (request.getPlanName() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên kế hoạch không được để trống");
        }
        Dentist dentist = null;
        if (request.getDentistId() != null) {
            dentist = dentistRepository.findById(request.getDentistId())
                    .or(() -> dentistRepository.findByUserId(request.getDentistId()))
                    .orElse(null);
        }

        ExaminationResult examinationResult = null;
        if (request.getExaminationResultId() != null) {
            examinationResult = examinationResultRepository.findById(request.getExaminationResultId()).orElse(null);
            if (examinationResult != null && examinationResult.getDentist() == null && dentist != null) {
                examinationResult.setDentist(dentist);
                examinationResultRepository.save(examinationResult);
            }
            // Mỗi đợt khám chỉ có một kế hoạch; API tạo không cập nhật kế hoạch cũ.
            Optional<TreatmentPlan> existingPlan = treatmentPlanRepository
                    .findByExaminationResultId(request.getExaminationResultId());
            if (existingPlan.isPresent()) {
                throw new AppException(ErrorCode.RESOURCE_IN_USE, "Đợt khám đã có kế hoạch điều trị. Hãy dùng API cập nhật.");
            }
        }

        LocalDateTime startDate = parseDateTime(request.getStartDate());
        LocalDateTime endDate = parseDateTime(request.getEndDate());

        TreatmentPlan plan = TreatmentPlan.builder()
                .examinationResult(examinationResult)
                .planName(request.getPlanName())
                .description(request.getDescription())
                .estimatedCost(request.getEstimatedCost())
                .status(request.getStatus() != null ? request.getStatus() : StatusPhase.IN_PROGRESS)
                .startDate(startDate != null ? startDate : LocalDateTime.now())
                .endDate(endDate)
                .treatmentPhases(new ArrayList<>())
                .build();

        TreatmentPlan savedPlan = treatmentPlanRepository.save(plan);

        return mapToResponse(savedPlan);
    }

    @Override
    @Transactional(readOnly = true)
    public TreatmentPlanResponse getTreatmentPlanById(UUID id) {
        TreatmentPlan plan = treatmentPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy kế hoạch điều trị với ID: " + id));
        return mapToResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TreatmentPlanResponse> getTreatmentPlansByPatientId(UUID patientId) {
        List<TreatmentPlan> plans = treatmentPlanRepository.findByPatientId(patientId);
        return plans.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TreatmentPlanResponse> getInProgressTreatmentPlansByPatientId(UUID patientId) {
        return treatmentPlanRepository
                .findByExaminationResultMedicalRecordPatientIdAndStatusOrderByStartDateDesc(
                        patientId, StatusPhase.IN_PROGRESS)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TreatmentPlanResponse getTreatmentPlanByExaminationResultId(UUID examinationResultId) {
        TreatmentPlan plan = treatmentPlanRepository.findByExaminationResultId(examinationResultId)
                .orElse(null);
        return plan != null ? mapToResponse(plan) : null;
    }

    @Override
    @Transactional
    public TreatmentPlanResponse updateTreatmentPlan(UUID id, TreatmentPlanRequest request) {
        validatePlanRequest(request);
        TreatmentPlan plan = treatmentPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy kế hoạch điều trị với ID: " + id));

        if (request.getPlanName() != null)
            plan.setPlanName(request.getPlanName());
        if (request.getDescription() != null)
            plan.setDescription(request.getDescription());
        if (request.getEstimatedCost() != null)
            plan.setEstimatedCost(request.getEstimatedCost());
        if (request.getStatus() != null)
            plan.setStatus(request.getStatus());
        if (request.getStartDate() != null)
            plan.setStartDate(parseDateTime(request.getStartDate()));
        if (request.getEndDate() != null)
            plan.setEndDate(parseDateTime(request.getEndDate()));
        if (request.getExaminationResultId() != null) {
            ExaminationResult exam = examinationResultRepository.findById(request.getExaminationResultId())
                    .orElse(null);
            if (exam != null)
                plan.setExaminationResult(exam);
        }
        if (request.getDentistId() != null) {
            Dentist dentist = dentistRepository.findById(request.getDentistId())
                    .or(() -> dentistRepository.findByUserId(request.getDentistId()))
                    .orElse(null);
            if (dentist != null && plan.getExaminationResult() != null) {
                plan.getExaminationResult().setDentist(dentist);
                examinationResultRepository.save(plan.getExaminationResult());
            }
        }

        TreatmentPlan updated = treatmentPlanRepository.save(plan);


        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public TreatmentStatusResponse updateTreatmentPlanStatus(UUID id, StatusPhase status) {
        if (status == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Trạng thái điều trị không được để trống");
        }
        TreatmentPlan entity = treatmentPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy kế hoạch điều trị với ID: " + id));
        entity.setStatus(status);
        treatmentPlanRepository.save(entity);
        return new TreatmentStatusResponse(id, entity.getStatus());
    }

    @Override
    @Transactional
    public void deleteTreatmentPlan(UUID id) {
        TreatmentPlan plan = treatmentPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kế hoạch điều trị: " + id));
        if (!plan.getTreatmentPhases().isEmpty() || !plan.getTreatmentHistorys().isEmpty() || plan.getInvoice() != null) {
            throw new AppException(ErrorCode.RESOURCE_IN_USE,
                    "Kế hoạch còn giai đoạn, lịch sử điều trị hoặc hóa đơn. Không thể xóa.");
        }
        treatmentPlanRepository.delete(plan);
        treatmentPlanRepository.flush();
    }

    @Override
    @Transactional
    public TreatmentPlanResponse autoScheduleFollowUpAppointments(UUID id) {
        TreatmentPlan plan = treatmentPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy kế hoạch điều trị ID: " + id));

        ExaminationResult exam = plan.getExaminationResult();
        Patient patient = (exam != null && exam.getMedicalRecord() != null) ? exam.getMedicalRecord().getPatient()
                : null;
        Dentist dentist = exam != null ? exam.getDentist() : null;

        if (dentist == null && exam != null && exam.getMedicalRecord() != null) {
            dentist = exam.getMedicalRecord().getDentist();
        }

        String patientName = patient != null ? patient.getFullName() : "Bệnh nhân";
        String phone = (patient != null && patient.getPhoneNumber() != null && !patient.getPhoneNumber().isBlank()) ? patient.getPhoneNumber().trim() : "0343632524";
        List<TreatmentPhase> phases = plan.getTreatmentPhases();
        if (phases == null || phases.isEmpty()) {
            return mapToResponse(plan);
        }

        int phaseIndex = 1;
        for (TreatmentPhase phase : phases) {
            LocalDateTime apptDateTime = phase.getExpectedStartDate();
            if (apptDateTime == null) {
                LocalDateTime baseStart = plan.getStartDate() != null ? plan.getStartDate() : LocalDateTime.now();
                apptDateTime = baseStart.plusDays((long) (phaseIndex - 1) * 7).withHour(9).withMinute(0);
            } else if (apptDateTime.getHour() == 0 && apptDateTime.getMinute() == 0) {
                apptDateTime = apptDateTime.withHour(9).withMinute(0);
            }

            StringBuilder serviceNames = new StringBuilder();
            if (phase.getTreatmentServices() != null && !phase.getTreatmentServices().isEmpty()) {
                for (TreatmentService ts : phase.getTreatmentServices()) {
                    if (serviceNames.length() > 0)
                        serviceNames.append(", ");
                    if (ts.getService() != null) {
                        serviceNames.append(ts.getService().getServiceName());
                        if (ts.getToothNumber() != null && !ts.getToothNumber().isBlank()) {
                            serviceNames.append(" (Răng ").append(ts.getToothNumber()).append(")");
                        }
                    }
                }
            }
            if (serviceNames.length() == 0) {
                serviceNames.append("Khám & điều trị theo phác đồ");
            }

            String reason = "Tái khám: " + phase.getPhaseName();
            String notes = "Tái khám Giai đoạn " + (phase.getPhaseOrder() != null ? phase.getPhaseOrder() : phaseIndex)
                    + " thuộc phác đồ '" + (plan.getPlanName() != null ? plan.getPlanName() : "Điều trị")
                    + "'. Chỉ định: " + serviceNames;

            // Kiểm tra trùng lịch hẹn đã có
            List<Appointment> existingAppts = appointmentRepository.findAll();
            boolean exists = existingAppts.stream().anyMatch(a -> a.getPhone() != null && a.getPhone().equals(phone)
                    && a.getReason() != null && a.getReason().contains(phase.getPhaseName())
                    && a.getStatus() != StatusAppointment.CANCELLED);

            if (!exists) {
                Appointment appt = Appointment.builder()
                        .patientName(patientName)
                        .phone(phone)
                        .dentist(dentist)
                        .appointmentDate(apptDateTime.toLocalDate().atStartOfDay())
                        .appointmentTime(apptDateTime)
                        .reason(reason)
                        .notes(notes)
                        .symptoms(phase.getDescription())
                        .treatmentNotes("Chi tiết dịch vụ: " + serviceNames)
                        .status(StatusAppointment.CONFIRMED)
                        .reminded1Day(false)
                        .reminded1Hour(false)
                        .build();

                appt = appointmentRepository.save(appt);
                log.info("Tự động tạo lịch hẹn tái khám cho giai đoạn '{}' - Bệnh nhân {} lúc {}", phase.getPhaseName(),
                        patientName, apptDateTime);

                try {
                    simpMessagingTemplate.convertAndSend("/topic/appointments", mapAppointmentToDTO(appt));
                } catch (Exception ex) {
                    log.warn("WebSocket send error: {}", ex.getMessage());
                }
            }

            phaseIndex++;
        }

        plan.setRoadmapSent(true);
        plan = treatmentPlanRepository.save(plan);
        log.info("Đã tự động xếp lịch tái khám cho phác đồ ID: {} (tính năng gửi email/SMS lộ trình đã được tắt)", plan.getId());

        return mapToResponse(plan);
    }

    private AppointmentDetailDTO mapAppointmentToDTO(Appointment apt) {
        return AppointmentDetailDTO.builder()
                .id(apt.getId())
                .patientName(apt.getPatientName() != null ? apt.getPatientName() : "N/A")
                .patientCode("N/A")
                .phone(apt.getPhone() != null ? apt.getPhone() : "")
                .dentistId(apt.getDentist() != null ? apt.getDentist().getId() : null)
                .dentistName(apt.getDentist() != null ? apt.getDentist().getFullName() : "Chưa phân công")
                .appointmentDate(apt.getAppointmentDate())
                .appointmentTime(apt.getAppointmentTime())
                .reason(apt.getReason())
                .notes(apt.getNotes())
                .status(apt.getStatus())
                .createdAt(apt.getCreatedAt())
                .build();
    }

    private void validatePlanRequest(TreatmentPlanRequest request) {
        if (request.getPhases() != null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Hãy dùng API riêng để tạo hoặc cập nhật giai đoạn và buổi điều trị.");
        }
        if (request.getPlanName() != null && request.getPlanName().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên kế hoạch không được để trống");
        }
        if (request.getEstimatedCost() != null && request.getEstimatedCost().signum() < 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chi phí không được âm");
        }
    }
    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.trim().isEmpty())
            return null;
        try {
            if (str.length() == 10) {
                return LocalDate.parse(str).atStartOfDay();
            }
            return LocalDateTime.parse(str.replace("Z", ""));
        } catch (DateTimeParseException e) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Ngày giờ không hợp lệ: " + str);
        }
    }

    private TreatmentPlanResponse mapToResponse(TreatmentPlan plan) {
        ExaminationResult exam = plan.getExaminationResult();
        Dentist dentist = exam != null ? exam.getDentist() : null;
        if (dentist == null && exam != null && exam.getMedicalRecord() != null) {
            dentist = exam.getMedicalRecord().getDentist();
        }
        Patient patient = (exam != null && exam.getMedicalRecord() != null) ? exam.getMedicalRecord().getPatient()
                : null;

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

        return TreatmentPlanResponse.builder()
                .id(plan.getId())
                .patientId(patient != null ? patient.getId() : null)
                .examinationResultId(exam != null ? exam.getId() : null)
                .patientName(patient != null ? patient.getFullName() : null)
                .patientCode(patient != null ? patient.getPatientCode() : null)
                .dentistId(dentistId)
                .dentistName(dentistName)

                .planName(plan.getPlanName())
                .description(plan.getDescription())
                .estimatedCost(plan.getEstimatedCost())
                .status(plan.getStatus())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .phases((plan.getTreatmentPhases() != null ? plan.getTreatmentPhases() : List.<TreatmentPhase>of())
                        .stream().map(ph -> TreatmentPlanResponse.PhaseResponse.builder()
                                .id(ph.getId())
                                .phaseName(ph.getPhaseName())
                                .phaseOrder(ph.getPhaseOrder())
                                .treatmentType(ph.getTreatmentType())
                                .description(ph.getDescription())
                                .status(ph.getStatus())
                                .estimatedDuration(ph.getEstimatedDuration())
                                .expectedStartDate(ph.getExpectedStartDate())
                                .expectedEndDate(ph.getExpectedEndDate())
                                .treatmentServices((ph.getTreatmentServices() != null ? ph.getTreatmentServices()
                                        : List.<TreatmentService>of()).stream()
                                        .map(ts -> TreatmentPlanResponse.ServiceItemResponse.builder()
                                                .id(ts.getId())
                                                .serviceId(ts.getService() != null ? ts.getService().getId() : null)
                                                .serviceName(ts.getServiceName())
                                                .toothNumber(ts.getToothNumber())
                                                .quantity(ts.getQuantity())
                                                .price(ts.getPrice())
                                                .totalAmount(ts.getTotalAmount())
                                                .build())
                                        .toList())
                                .treatmentVisits((ph.getTreatmentVisits() != null ? ph.getTreatmentVisits()
                                        : List.<TreatmentVisits>of()).stream()
                                        .map(tv -> TreatmentPlanResponse.VisitItemResponse.builder()
                                                .visitId(tv.getVisitId())
                                                .visitName(tv.getVisitName())
                                                .visitOrder(tv.getVisitOrder())
                                                .startDate(tv.getStartDate())
                                                .status(tv.getStatus())
                                                .clinicalNotes(tv.getClinicalNotes())
                                                .assignedDentist(tv.getAssignedDentist())
                                                .facilityName(tv.getFacilityName())
                                                .facilityAddress(tv.getFacilityAddress())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }
}

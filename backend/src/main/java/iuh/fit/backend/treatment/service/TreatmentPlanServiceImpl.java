package iuh.fit.backend.treatment.service;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.treatment.dto.TreatmentPlanRequest;
import iuh.fit.backend.treatment.dto.TreatmentPlanResponse;
import iuh.fit.backend.treatment.entity.*;
import iuh.fit.backend.treatment.repository.*;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iuh.fit.backend.treatment.enums.StatusPhase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class TreatmentPlanServiceImpl implements TreatmentPlanService {

    private final TreatmentPlanRepository treatmentPlanRepository;
    private final TreatmentPhaseRepository treatmentPhaseRepository;
    private final TreatmentServiceRepository treatmentServiceRepository;
    private final TreatmentVisitsRepository treatmentVisitsRepository;
    private final PatientRepository patientRepository;
    private final DentistRepository dentistRepository;
    private final ServiceRepository serviceRepository;
    private final ExaminationResultRepository examinationResultRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public TreatmentPlanServiceImpl(
            TreatmentPlanRepository treatmentPlanRepository,
            TreatmentPhaseRepository treatmentPhaseRepository,
            TreatmentServiceRepository treatmentServiceRepository,
            TreatmentVisitsRepository treatmentVisitsRepository,
            PatientRepository patientRepository,
            DentistRepository dentistRepository,
            ServiceRepository serviceRepository,
            ExaminationResultRepository examinationResultRepository,
            AppointmentRepository appointmentRepository,
            NotificationService notificationService,
            SimpMessagingTemplate simpMessagingTemplate) {
        this.treatmentPlanRepository = treatmentPlanRepository;
        this.treatmentPhaseRepository = treatmentPhaseRepository;
        this.treatmentServiceRepository = treatmentServiceRepository;
        this.treatmentVisitsRepository = treatmentVisitsRepository;
        this.patientRepository = patientRepository;
        this.dentistRepository = dentistRepository;
        this.serviceRepository = serviceRepository;
        this.examinationResultRepository = examinationResultRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    @Override
    @Transactional
    public TreatmentPlanResponse createTreatmentPlan(TreatmentPlanRequest request) {
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
            // Quan hệ 1-1: Nếu đợt khám này đã có kế hoạch điều trị, cập nhật kế hoạch hiện
            // có
            Optional<TreatmentPlan> existingPlan = treatmentPlanRepository
                    .findByExaminationResultId(request.getExaminationResultId());
            if (existingPlan.isPresent()) {
                return updateTreatmentPlan(existingPlan.get().getId(), request);
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

        Dentist assignedDoctor = examinationResult != null && examinationResult.getDentist() != null
                ? examinationResult.getDentist()
                : dentist;

        if (request.getPhases() != null && !request.getPhases().isEmpty()) {
            savePhases(savedPlan, request.getPhases(), assignedDoctor, request.getDentistName());
        }

        try {
            autoScheduleFollowUpAppointments(savedPlan.getId());
        } catch (Exception e) {
            log.warn("Auto scheduling follow up appointments failed on creation: {}", e.getMessage());
        }

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
    public TreatmentPlanResponse getTreatmentPlanByExaminationResultId(UUID examinationResultId) {
        TreatmentPlan plan = treatmentPlanRepository.findByExaminationResultId(examinationResultId)
                .orElse(null);
        return plan != null ? mapToResponse(plan) : null;
    }

    @Override
    @Transactional
    public TreatmentPlanResponse updateTreatmentPlan(UUID id, TreatmentPlanRequest request) {
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

        if (request.getPhases() != null) {
            // Xóa các phase cũ và các child service / visit thuộc về phase đó
            List<TreatmentPhase> currentPhases = plan.getTreatmentPhases();
            if (currentPhases != null && !currentPhases.isEmpty()) {
                for (TreatmentPhase oldPhase : new ArrayList<>(currentPhases)) {
                    if (oldPhase.getTreatmentServices() != null && !oldPhase.getTreatmentServices().isEmpty()) {
                        treatmentServiceRepository.deleteAll(oldPhase.getTreatmentServices());
                        oldPhase.getTreatmentServices().clear();
                    }
                    if (oldPhase.getTreatmentVisits() != null && !oldPhase.getTreatmentVisits().isEmpty()) {
                        treatmentVisitsRepository.deleteAll(oldPhase.getTreatmentVisits());
                        oldPhase.getTreatmentVisits().clear();
                    }
                }
                treatmentPhaseRepository.deleteAll(currentPhases);
                plan.getTreatmentPhases().clear();
                treatmentPlanRepository.saveAndFlush(plan);
            }

            Dentist assignedDoctor = plan.getExaminationResult() != null
                    && plan.getExaminationResult().getDentist() != null
                            ? plan.getExaminationResult().getDentist()
                            : (request.getDentistId() != null
                                    ? dentistRepository.findById(request.getDentistId()).orElse(null)
                                    : null);

            // Lưu danh sách phases mới kèm services và visits
            savePhases(plan, request.getPhases(), assignedDoctor, request.getDentistName());
        }

        plan.setRoadmapSent(false);
        TreatmentPlan updated = treatmentPlanRepository.save(plan);

        try {
            autoScheduleFollowUpAppointments(updated.getId());
        } catch (Exception e) {
            log.warn("Auto scheduling follow up appointments failed on update: {}", e.getMessage());
        }

        return mapToResponse(updated);
    }

    private void savePhases(TreatmentPlan plan, List<TreatmentPlanRequest.PhaseRequest> phaseRequests, Dentist dentist,
            String dentistNameFromRequest) {
        if (phaseRequests == null || phaseRequests.isEmpty()) {
            return;
        }
        for (TreatmentPlanRequest.PhaseRequest phaseReq : phaseRequests) {
            TreatmentPhase phase = TreatmentPhase.builder()
                    .treatmentPlan(plan)
                    .phaseName(phaseReq.getPhaseName())
                    .phaseOrder(phaseReq.getPhaseOrder())
                    .treatmentType(phaseReq.getTreatmentType())
                    .description(phaseReq.getDescription())
                    .status(phaseReq.getStatus() != null ? phaseReq.getStatus() : StatusPhase.PENDING)
                    .estimatedDuration(phaseReq.getEstimatedDuration())
                    .expectedStartDate(parseDateTime(phaseReq.getExpectedStartDate()))
                    .expectedEndDate(parseDateTime(phaseReq.getExpectedEndDate()))
                    .treatmentServices(new ArrayList<>())
                    .treatmentVisits(new ArrayList<>())
                    .build();

            TreatmentPhase savedPhase = treatmentPhaseRepository.save(phase);

            if (phaseReq.getTreatmentServices() != null) {
                for (TreatmentPlanRequest.ServiceItemRequest sReq : phaseReq.getTreatmentServices()) {
                    iuh.fit.backend.treatment.entity.Service service = null;
                    if (sReq.getServiceId() != null) {
                        service = serviceRepository.findById(sReq.getServiceId()).orElse(null);
                    }
                    TreatmentService ts = TreatmentService.builder()
                            .treatmentPhase(savedPhase)
                            .service(service)
                            .serviceName(service != null ? service.getServiceName() : null)
                            .toothNumber(sReq.getToothNumber())
                            .quantity(sReq.getQuantity())
                            .price(sReq.getPrice())
                            .totalAmount(sReq.getTotalAmount())
                            .build();
                    treatmentServiceRepository.save(ts);
                    savedPhase.getTreatmentServices().add(ts);
                }
            }

            if (phaseReq.getTreatmentVisits() != null) {
                for (TreatmentPlanRequest.VisitItemRequest vReq : phaseReq.getTreatmentVisits()) {
                    String visitDentist = vReq.getAssignedDentist();
                    if ((visitDentist == null || visitDentist.isBlank()) && dentistNameFromRequest != null) {
                        visitDentist = dentistNameFromRequest;
                    }
                    if ((visitDentist == null || visitDentist.isBlank()) && dentist != null) {
                        visitDentist = dentist.getFullName();
                    }
                    TreatmentVisits tv = TreatmentVisits.builder()
                            .treatmentPhase(savedPhase)
                            .visitName(vReq.getVisitName())
                            .visitOrder(vReq.getVisitOrder())
                            .startDate(vReq.getStartDate())
                            .status(vReq.getStatus() != null ? vReq.getStatus() : StatusPhase.PENDING)
                            .clinicalNotes(vReq.getClinicalNotes())
                            .assignedDentist(visitDentist)
                            .build();
                    treatmentVisitsRepository.save(tv);
                    savedPhase.getTreatmentVisits().add(tv);
                }
            }

            plan.getTreatmentPhases().add(savedPhase);
        }
    }

    @Override
    @Transactional
    public void deleteTreatmentPlan(UUID id) {
        if (!treatmentPlanRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kế hoạch điều trị với ID: " + id);
        }
        treatmentPlanRepository.deleteById(id);
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
        String phone = (patient != null && patient.getPhoneNumber() != null && !patient.getPhoneNumber().isBlank())
                ? patient.getPhoneNumber().trim()
                : "0343632524";
        String email = patient != null ? patient.getEmail() : null;

        List<TreatmentPhase> phases = plan.getTreatmentPhases();
        if (phases == null || phases.isEmpty()) {
            return mapToResponse(plan);
        }

        StringBuilder roadmapHtml = new StringBuilder();
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");

        int phaseIndex = 1;
        for (TreatmentPhase phase : phases) {
            LocalDateTime apptDateTime = phase.getExpectedStartDate();
            if (apptDateTime == null) {
                LocalDateTime baseStart = plan.getStartDate() != null ? plan.getStartDate() : LocalDateTime.now();
                apptDateTime = baseStart.plusDays((long) (phaseIndex - 1) * 7).withHour(9).withMinute(0);
            } else if (apptDateTime.getHour() == 0 && apptDateTime.getMinute() == 0) {
                apptDateTime = apptDateTime.withHour(9).withMinute(0);
            }

            String doctorName = dentist != null ? dentist.getFullName() : "BS. Nguyễn Thị Phương";

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

            String phaseTitle = phase.getPhaseName() != null ? phase.getPhaseName().trim() : "";
            if (!phaseTitle.toLowerCase().startsWith("giai đoạn")) {
                String orderStr = phase.getPhaseOrder() != null ? String.valueOf(phase.getPhaseOrder())
                        : String.valueOf(phaseIndex);
                phaseTitle = "Giai đoạn " + orderStr + ": " + phaseTitle;
            }

            String statusLabel;
            String statusBgColor;
            if (phase.getStatus() == StatusPhase.IN_PROGRESS) {
                statusLabel = "Đang thực hiện (Giai đoạn hiện tại)";
                statusBgColor = "#0f766e";
            } else if (phase.getStatus() == StatusPhase.COMPLETED) {
                statusLabel = "Đã hoàn thành";
                statusBgColor = "#16a34a";
            } else {
                statusLabel = "Chưa thực hiện";
                statusBgColor = "#64748b";
            }

            roadmapHtml
                    .append("""
                            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-left:4px solid %s; border-radius:8px; padding:14px; margin-bottom:12px;">
                                <div style="font-weight:bold; color:#0f766e; font-size:15px; margin-bottom:6px;">
                                    %s
                                </div>
                                <div style="font-size:13px; color:#334155; margin:4px 0;">
                                    <strong>Trạng thái:</strong> <span style="color:%s; font-weight:bold;">%s</span>
                                </div>
                                <div style="font-size:13px; color:#334155; margin:4px 0;">
                                    <strong>Lịch tái khám dự kiến:</strong> %s
                                </div>
                                <div style="font-size:13px; color:#334155; margin:4px 0;">
                                    <strong>Bác sĩ phụ trách:</strong> %s
                                </div>
                                <div style="font-size:12px; color:#64748b; margin-top:6px;">
                                    <strong>Chỉ định điều trị:</strong> %s
                                </div>
                            </div>
                            """
                            .formatted(
                                    statusBgColor,
                                    phaseTitle,
                                    statusBgColor,
                                    statusLabel,
                                    apptDateTime.format(timeFmt),
                                    doctorName,
                                    serviceNames.toString()));

            phaseIndex++;
        }

        try {
            notificationService.sendTreatmentRoadmapEmail(email, patientName, phone, plan.getPlanName(),
                    roadmapHtml.toString());
            log.info("Đã gửi thông báo lộ trình phác đồ điều trị cho bệnh nhân {} (SĐT: {}, Email: {})", patientName,
                    phone, email);
            plan.setRoadmapSent(true);
            plan = treatmentPlanRepository.save(plan);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email/SMS thông báo lộ trình điều trị: {}", e.getMessage());
        }

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

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.trim().isEmpty())
            return null;
        try {
            if (str.length() == 10) {
                return LocalDate.parse(str).atStartOfDay();
            }
            return LocalDateTime.parse(str.replace("Z", ""));
        } catch (DateTimeParseException e) {
            return null;
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
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }
}

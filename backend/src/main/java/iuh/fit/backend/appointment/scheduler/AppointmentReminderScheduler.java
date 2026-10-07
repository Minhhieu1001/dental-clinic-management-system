package iuh.fit.backend.appointment.scheduler;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.appointment.repository.FollowUpAppointmentRepository;
import iuh.fit.backend.notification.dto.NotificationResponseDTO;
import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.notification.enums.NotificationType;
import iuh.fit.backend.notification.repository.notificationRepository;
import iuh.fit.backend.notification.service.NotificationService;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
import iuh.fit.backend.treatment.repository.TreatmentPlanRepository;
import iuh.fit.backend.treatment.service.TreatmentPlanService;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final FollowUpAppointmentRepository followUpAppointmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final TreatmentPlanRepository treatmentPlanRepository;
    private final TreatmentPlanService treatmentPlanService;
    private final NotificationService notificationService;
    private final notificationRepository notificationRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");

    /**
     * Tiến trình chạy ngầm tự động:
     * 1. Tự động quét các phác đồ đang ở trạng thái 'ĐANG ĐIỀU TRỊ' (IN_PROGRESS) để xếp lịch tái khám & gửi Email lộ trình về cho bệnh nhân.
     * 2. Tự động nhắc lịch hẹn tái khám trước 1 ngày (24 giờ) — cho cả Appointment và FollowUpAppointment.
     * 3. Tự động nhắc lịch hẹn tái khám trước 1 giờ — cho cả Appointment và FollowUpAppointment.
     * Chạy định kỳ 5 phút một lần.
     */
    @Scheduled(initialDelay = 10000, fixedRate = 300000)
    @Transactional
    public void processAppointmentReminders() {
        LocalDateTime now = LocalDateTime.now();

        // 0. TỰ ĐỘNG GỬI LỘ TRÌNH TÁI KHÁM KHI PHÁC ĐỒ CÓ TRẠNG THÁI 'ĐANG ĐIỀU TRỊ' (IN_PROGRESS)
        try {
            List<TreatmentPlan> activePlans = treatmentPlanRepository.findPlansNeedingRoadmapNotification();
            for (TreatmentPlan plan : activePlans) {
                try {
                    treatmentPlanService.autoScheduleFollowUpAppointments(plan.getId());
                    log.info("[SCHEDULER ROADMAP] Đã tự động gửi email/SMS lộ trình phác đồ & xếp lịch tái khám cho phác đồ ID: {}", plan.getId());
                } catch (Exception ex) {
                    log.error("[SCHEDULER ROADMAP ERROR] Lỗi gửi lộ trình phác đồ ID {}: {}", plan.getId(), ex.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("[SCHEDULER ROADMAP FATAL] Lỗi khi quét danh sách phác đồ đang điều trị: {}", e.getMessage());
        }

        // ============================================================
        // A. NHẮC LỊCH CHO APPOINTMENT (Lịch hẹn khám)
        // ============================================================

        // 1. NHẮC TRƯỚC 1 NGÀY (Tất cả lịch hẹn diễn ra trong khoảng từ 18 giờ đến 30 giờ tới)
        LocalDateTime start1Day = now.plusHours(18);
        LocalDateTime end1Day = now.plusHours(30);
        List<Appointment> appts1Day = appointmentRepository.findAppointmentsNeeding1DayReminder(start1Day, end1Day);

        for (Appointment apt : appts1Day) {
            try {
                sendReminder(apt, "1DAY");
                apt.setReminded1Day(true);
                appointmentRepository.save(apt);
                log.info("[SCHEDULER 1-DAY] Đã tự động gửi email nhắc trước 1 ngày cho bệnh nhân: {} (ID: {})", apt.getPatientName(), apt.getId());
            } catch (Exception e) {
                log.error("[SCHEDULER 1-DAY ERROR] Lỗi nhắc trước 1 ngày lịch hẹn {}: {}", apt.getId(), e.getMessage());
            }
        }

        // 2. NHẮC TRƯỚC 1 GIỜ (Từ 5 phút đến 65 phút tới)
        LocalDateTime start1Hour = now.plusMinutes(5);
        LocalDateTime end1Hour = now.plusMinutes(65);
        List<Appointment> appts1Hour = appointmentRepository.findAppointmentsNeeding1HourReminder(start1Hour, end1Hour);

        for (Appointment apt : appts1Hour) {
            try {
                sendReminder(apt, "1HOUR");
                apt.setReminded1Hour(true);
                appointmentRepository.save(apt);
                log.info("[SCHEDULER 1-HOUR] Đã tự động gửi email nhắc trước 1 giờ cho bệnh nhân: {} (ID: {})", apt.getPatientName(), apt.getId());
            } catch (Exception e) {
                log.error("[SCHEDULER 1-HOUR ERROR] Lỗi nhắc trước 1 giờ lịch hẹn {}: {}", apt.getId(), e.getMessage());
            }
        }

        // ============================================================
        // B. NHẮC LỊCH CHO FOLLOW-UP APPOINTMENT (Lịch tái khám)
        // ============================================================

        // 3. NHẮC TRƯỚC 1 NGÀY (Lịch tái khám diễn ra trong khoảng từ 18 giờ đến 30 giờ tới)
        List<FollowUpAppointment> followUps1Day = followUpAppointmentRepository.findFollowUpsNeeding1DayReminder(start1Day, end1Day);

        for (FollowUpAppointment fu : followUps1Day) {
            try {
                sendFollowUpReminder(fu, "1DAY");
                fu.setReminded1Day(true);
                followUpAppointmentRepository.save(fu);
                log.info("[SCHEDULER FOLLOW-UP 1-DAY] Đã gửi nhắc trước 1 ngày cho lịch tái khám ID: {}", fu.getId());
            } catch (Exception e) {
                log.error("[SCHEDULER FOLLOW-UP 1-DAY ERROR] Lỗi nhắc trước 1 ngày lịch tái khám {}: {}", fu.getId(), e.getMessage());
            }
        }

        // 4. NHẮC TRƯỚC 1 GIỜ (Lịch tái khám diễn ra trong khoảng từ 5 phút đến 65 phút tới)
        List<FollowUpAppointment> followUps1Hour = followUpAppointmentRepository.findFollowUpsNeeding1HourReminder(start1Hour, end1Hour);

        for (FollowUpAppointment fu : followUps1Hour) {
            try {
                sendFollowUpReminder(fu, "1HOUR");
                fu.setReminded1Hour(true);
                followUpAppointmentRepository.save(fu);
                log.info("[SCHEDULER FOLLOW-UP 1-HOUR] Đã gửi nhắc trước 1 giờ cho lịch tái khám ID: {}", fu.getId());
            } catch (Exception e) {
                log.error("[SCHEDULER FOLLOW-UP 1-HOUR ERROR] Lỗi nhắc trước 1 giờ lịch tái khám {}: {}", fu.getId(), e.getMessage());
            }
        }
    }

    // ============================================================
    // NHẮC LỊCH HẸN KHÁM (Appointment) — Logic cũ giữ nguyên
    // ============================================================
    private void sendReminder(Appointment apt, String type) {
        String patientPhone = (apt.getPhone() != null && !apt.getPhone().isBlank()) ? apt.getPhone().trim() : "0343632524";
        String email = null;

        if (!patientPhone.isEmpty()) {
            List<Patient> patients = patientRepository.findByPhoneNumberOrderByCreatedAtDesc(patientPhone);
            if (!patients.isEmpty() && patients.get(0).getEmail() != null) {
                email = patients.get(0).getEmail().trim();
            }
        }

        if ((email == null || email.isEmpty()) && apt.getPatientName() != null) {
            List<Patient> allPatients = patientRepository.findAll();
            for (Patient p : allPatients) {
                if (p.getFullName() != null && p.getFullName().equalsIgnoreCase(apt.getPatientName()) && p.getEmail() != null) {
                    email = p.getEmail().trim();
                    break;
                }
            }
        }

        String doctorName = apt.getDentist() != null ? apt.getDentist().getFullName() : "Bác sĩ phụ trách";
        LocalDateTime apptTime = apt.getAppointmentTime() != null ? apt.getAppointmentTime() : (apt.getAppointmentDate() != null ? apt.getAppointmentDate() : LocalDateTime.now());
        String timeStr = apptTime.format(TIME_FORMATTER);

        // Gửi thông báo (SMS đến SĐT và Email nếu bệnh nhân có đăng ký Email)
        notificationService.sendAppointmentReminderEmail(
                email,
                patientPhone,
                apt.getPatientName() != null ? apt.getPatientName() : "Quý khách",
                timeStr,
                doctorName,
                apt.getReason() != null ? apt.getReason() : "Tái khám theo phác đồ điều trị",
                type
        );

        if (apt.getDentist() != null && apt.getDentist().getUser() != null) {
            User docUser = apt.getDentist().getUser();
            String notifTitle = "1HOUR".equalsIgnoreCase(type) ? "Nhắc lịch hẹn khám sắp diễn ra (1h)" : "Nhắc lịch hẹn khám ngày mai";
            String notifContent = "Lịch tái khám của bệnh nhân " + apt.getPatientName() + " (" + timeStr + ") sắp diễn ra.";

            Notification notif = Notification.builder()
                    .user(docUser)
                    .title(notifTitle)
                    .content(notifContent)
                    .type(NotificationType.PATIENT_CHECKIN)
                    .targetUrl("/dentist/appointments")
                    .isRead(false)
                    .build();
            notif = notificationRepository.save(notif);

            NotificationResponseDTO notifDto = NotificationResponseDTO.builder()
                    .id(notif.getId())
                    .userId(docUser.getId())
                    .title(notif.getTitle())
                    .content(notif.getContent())
                    .type(notif.getType())
                    .targetUrl(notif.getTargetUrl())
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            try {
                simpMessagingTemplate.convertAndSendToUser(docUser.getId().toString(), "/queue/notifications", notifDto);
            } catch (Exception ex) {
                log.warn("WebSocket notification error in scheduler: {}", ex.getMessage());
            }
        }
    }

    // ============================================================
    // NHẮC LỊCH TÁI KHÁM (FollowUpAppointment) — Tái sử dụng logic cũ
    // ============================================================
    private void sendFollowUpReminder(FollowUpAppointment fu, String type) {
        // 1. Tìm thông tin bệnh nhân từ ExaminationResult -> MedicalRecord -> Patient
        Patient patient = null;
        if (fu.getExaminationResult() != null && fu.getExaminationResult().getMedicalRecord() != null) {
            patient = fu.getExaminationResult().getMedicalRecord().getPatient();
        }

        if (patient == null) {
            log.warn("[SCHEDULER FOLLOW-UP] Không tìm thấy bệnh nhân cho lịch tái khám ID: {}. Bỏ qua nhắc nhở.", fu.getId());
            return;
        }

        String patientName = patient.getFullName() != null ? patient.getFullName() : "Quý khách";
        String phone = (patient.getPhoneNumber() != null && !patient.getPhoneNumber().isBlank()) ? patient.getPhoneNumber().trim() : "0343632524";
        String email = (patient.getEmail() != null && !patient.getEmail().isBlank()) ? patient.getEmail().trim() : null;

        String doctorName = fu.getDentist() != null ? fu.getDentist().getFullName() : "Bác sĩ phụ trách";
        String timeStr = fu.getFollowUpDate() != null ? fu.getFollowUpDate().format(TIME_FORMATTER) : "";

        // 2. Gửi Email + SMS nhắc lịch tái khám (tái sử dụng sendAppointmentReminderEmail)
        notificationService.sendAppointmentReminderEmail(
                email,
                phone,
                patientName,
                timeStr,
                doctorName,
                fu.getReason() != null ? fu.getReason() : "Tái khám kiểm tra định kỳ",
                type
        );

        // 3. Gửi thông báo realtime cho bác sĩ phụ trách (qua WebSocket)
        if (fu.getDentist() != null && fu.getDentist().getUser() != null) {
            User docUser = fu.getDentist().getUser();
            boolean is1Hour = "1HOUR".equalsIgnoreCase(type);
            String notifTitle = is1Hour
                    ? "Nhắc lịch tái khám sắp diễn ra (1h)"
                    : "Nhắc lịch tái khám ngày mai";
            String notifContent = "Lịch tái khám của bệnh nhân " + patientName + " (" + timeStr + ") sắp diễn ra."
                    + (fu.getReason() != null ? " Lý do: " + fu.getReason() : "");

            Notification notif = Notification.builder()
                    .user(docUser)
                    .title(notifTitle)
                    .content(notifContent)
                    .type(NotificationType.PATIENT_CHECKIN)
                    .targetUrl("/dentist/follow-up")
                    .isRead(false)
                    .build();
            notif = notificationRepository.save(notif);

            NotificationResponseDTO notifDto = NotificationResponseDTO.builder()
                    .id(notif.getId())
                    .userId(docUser.getId())
                    .title(notif.getTitle())
                    .content(notif.getContent())
                    .type(notif.getType())
                    .targetUrl(notif.getTargetUrl())
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            try {
                simpMessagingTemplate.convertAndSendToUser(docUser.getId().toString(), "/queue/notifications", notifDto);
            } catch (Exception ex) {
                log.warn("[SCHEDULER FOLLOW-UP] WebSocket notification error: {}", ex.getMessage());
            }
        }
    }
}

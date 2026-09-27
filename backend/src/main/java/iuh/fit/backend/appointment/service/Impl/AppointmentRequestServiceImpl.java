package iuh.fit.backend.appointment.service.Impl;

import iuh.fit.backend.appointment.dto.AppointmentRequestDTO;
import iuh.fit.backend.appointment.dto.AppointmentResponseDTO;
import iuh.fit.backend.appointment.entity.AppointmentRequest;
import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;
import iuh.fit.backend.appointment.repository.AppointmentRequestRepository;
import iuh.fit.backend.appointment.service.AppointmentRequestService;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import iuh.fit.backend.notification.dto.NotificationResponseDTO;
import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.notification.enums.NotificationType;
import iuh.fit.backend.notification.repository.notificationRepository;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentRequestServiceImpl implements AppointmentRequestService {
    private final AppointmentRequestRepository appointmentRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final notificationRepository notificationRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    // tạo yêu cầu đặt lịch hẹn
    @Override
    public AppointmentResponseDTO createAppointRequest(AppointmentRequestDTO requestDTO) {
        validateCreateRequest(requestDTO);

        AppointmentRequest appointmentRequest = AppointmentRequest.builder()
                .fullName(requestDTO.fullName().trim())
                .phone(requestDTO.phone().trim())
                .description(trimToNull(requestDTO.description()))
                .createAt(LocalDateTime.now())
                .statustAppointmentRequest(StatustAppointmentRequest.PENDING)
                .employee(null)
                .build();

        AppointmentRequest savedRequest = appointmentRequestRepository.save(appointmentRequest);

        // Notify all active receptionists / employees
        try {
            List<User> activeEmployees = userRepository.findByRoleAndStatus(Role.EMPLOYEE, StatusUser.ACTIVE);
            for (User empUser : activeEmployees) {
                Notification notif = Notification.builder()
                        .user(empUser)
                        .title("Lịch hẹn mới đăng ký")
                        .content("Bệnh nhân " + savedRequest.getFullName() + " (" + savedRequest.getPhone() + ") vừa đăng ký lịch hẹn trực tuyến.")
                        .type(NotificationType.PATIENT_CHECKIN)
                        .targetUrl("/employee/appointments")
                        .isRead(false)
                        .build();
                notif = notificationRepository.save(notif);

                NotificationResponseDTO notifDto = NotificationResponseDTO.builder()
                        .id(notif.getId())
                        .userId(empUser.getId())
                        .title(notif.getTitle())
                        .content(notif.getContent())
                        .type(notif.getType())
                        .targetUrl(notif.getTargetUrl())
                        .isRead(false)
                        .createdAt(notif.getCreatedAt() != null ? notif.getCreatedAt() : LocalDateTime.now())
                        .build();

                simpMessagingTemplate.convertAndSendToUser(empUser.getId().toString(), "/queue/notifications", notifDto);
                simpMessagingTemplate.convertAndSend("/topic/notifications", notifDto);
            }
        } catch (Exception e) {
            log.warn("Failed to send notification for new appointment request: {}", e.getMessage());
        }

        AppointmentResponseDTO responseDto = toResponse(savedRequest);

        // Broadcast realtime appointment request update for receptionist UI
        try {
            simpMessagingTemplate.convertAndSend("/topic/appointment-requests", responseDto);
        } catch (Exception e) {
            log.warn("Realtime WebSocket broadcast failed in createAppointRequest: {}", e.getMessage());
        }

        return responseDto;
    }

    // xử lý yêu cầu đătk lịch hẹn
    @Override
    public AppointmentResponseDTO processAppointmentRequest(UUID id) {
        AppointmentRequest appointmentRequest = appointmentRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_REQUEST_NOT_FOUND));

        Employee currentEmployee = getCurrentEmployee();

        Employee assignedEmployee = appointmentRequest.getEmployee();
        if (assignedEmployee != null && !assignedEmployee.getId().equals(currentEmployee.getId())) {
            throw new AppException(ErrorCode.APPOINTMENT_REQUEST_ALREADY_PROCESSED);
        }

        appointmentRequest.setEmployee(currentEmployee);
        appointmentRequest.setStatustAppointmentRequest(StatustAppointmentRequest.COMPLETED);

        return toResponse(appointmentRequestRepository.save(appointmentRequest));
    }

    // Cap nhat trang thai yeu cau lich hen
    @Override
    public AppointmentResponseDTO updateAppointmentRequestStatus(UUID id, StatustAppointmentRequest status) {
        if (status == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }

        AppointmentRequest appointmentRequest = appointmentRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_REQUEST_NOT_FOUND));

        Employee currentEmployee = getCurrentEmployee();

        appointmentRequest.setEmployee(currentEmployee);
        appointmentRequest.setStatustAppointmentRequest(status);

        return toResponse(appointmentRequestRepository.save(appointmentRequest));
    }

    @Override
    public List<AppointmentResponseDTO> getAppointmentRequestsToday() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);

        return appointmentRequestRepository
                .findByCreateAtGreaterThanEqualAndCreateAtLessThanOrderByCreateAtDesc(
                        startOfDay,
                        startOfNextDay
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<AppointmentResponseDTO> getPendingAppointmentRequestsToday() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);

        return appointmentRequestRepository
                .findByStatustAppointmentRequestAndCreateAtGreaterThanEqualAndCreateAtLessThanOrderByCreateAtDesc(
                        StatustAppointmentRequest.PENDING,
                        startOfDay,
                        startOfNextDay
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // đêm số yêu cầu lịch hẹn trong ngày hôm nay
    @Override
    public long countAppointmentRequestsToday() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);

        return appointmentRequestRepository.countByCreateAtGreaterThanEqualAndCreateAtLessThan(
                startOfDay,
                startOfNextDay
        );
    }

    private void validateCreateRequest(AppointmentRequestDTO requestDTO) {
        if (requestDTO == null) {
            throw new AppException(ErrorCode.APPOINTMENT_REQUEST_DATA_REQUIRED);
        }
        if (isBlank(requestDTO.fullName())) {
            throw new AppException(ErrorCode.APPOINTMENT_REQUEST_FULL_NAME_REQUIRED);
        }
        if (isBlank(requestDTO.phone())) {
            throw new AppException(ErrorCode.APPOINTMENT_REQUEST_PHONE_REQUIRED);
        }
    }

    private Employee getCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        User user = userDetails.getUser();
        return employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CURRENT_USER_NOT_EMPLOYEE));
    }

    private AppointmentResponseDTO toResponse(AppointmentRequest appointmentRequest) {
        Employee employee = appointmentRequest.getEmployee();
        return new AppointmentResponseDTO(
                appointmentRequest.getId(),
                appointmentRequest.getFullName(),
                appointmentRequest.getPhone(),
                appointmentRequest.getDescription(),
                appointmentRequest.getCreateAt(),
                appointmentRequest.getStatustAppointmentRequest(),
                employee != null ? employee.getId() : null,
                resolveEmployeeName(employee)
        );
    }

    private String resolveEmployeeName(Employee employee) {
        if (employee == null) {
            return null;
        }
        if (!isBlank(employee.getFullName())) {
            return employee.getFullName().trim();
        }

        User user = employee.getUser();
        if (user == null) {
            return null;
        }
        if (!isBlank(user.getUsername())) {
            return user.getUsername().trim();
        }
        if (!isBlank(user.getEmail())) {
            return user.getEmail().trim();
        }
        return null;
    }

    private String trimToNull(String value) {
        if (isBlank(value)) {
            return null;
        }
        return value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}

package iuh.fit.backend.appointment.service.Impl;

import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
import iuh.fit.backend.appointment.dto.AppointmentCheckinRequest;
import iuh.fit.backend.appointment.dto.AppointmentCheckinResponse;
import iuh.fit.backend.appointment.service.AppointmentConfirmation;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.AppointmentRequest;
import iuh.fit.backend.appointment.entity.Room;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.appointment.repository.AppointmentRequestRepository;
import iuh.fit.backend.appointment.repository.RoomRepository;
import iuh.fit.backend.appointment.service.AppointmentService;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.notification.dto.NotificationResponseDTO;
import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.notification.enums.NotificationType;
import iuh.fit.backend.notification.repository.notificationRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static java.util.Locale.ROOT;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final ApplicationEventPublisher eventPublisher;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestRepository appointmentRequestRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DentistRepository dentistRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final RoomRepository roomRepository;
    private final notificationRepository notificationRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @Override
    @Transactional
    public AppointmentCheckinResponse checkIn(AppointmentCheckinRequest request) {
        Appointment appointment = appointmentRepository.findForCheckin(request.appointmentCode().trim().toUpperCase(ROOT))
                .orElseThrow(() -> new AppException(ErrorCode.VALIDATION_ERROR, "Mã lịch hẹn, họ tên, SĐT hoặc chi nhánh không khớp."));
        if (!normalizeName(appointment.getPatientName()).equals(normalizeName(request.fullName()))
                || !normalizePhone(appointment.getPhone()).equals(normalizePhone(request.phone()))
                || appointment.getBranch() == null
                || !appointment.getBranch().getBranchId().equals(request.branchId().trim())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mã lịch hẹn, họ tên, SĐT hoặc chi nhánh không khớp.");
        }
        boolean changed = markArrived(appointment);
        if (changed) {
            appointmentRepository.saveAndFlush(appointment);
            notifyAppointmentStatusChanged(appointment);
            broadcastAppointmentAfterCommit(mapToDTO(appointment));
        }
        return new AppointmentCheckinResponse(appointment.getAppointmentCode(), appointment.getStatus(),
                Boolean.TRUE.equals(appointment.getIsCheck()), !changed);
    }

    private boolean markArrived(Appointment appointment) {
        if (appointment.getStatus() == StatusAppointment.CANCELLED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Lịch hẹn đã bị hủy, không thể check-in.");
        }
        if (appointment.getAppointmentDate() == null || !appointment.getAppointmentDate().toLocalDate()
                .equals(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")))) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chỉ có thể check-in trong đúng ngày hẹn khám.");
        }
        if (Boolean.TRUE.equals(appointment.getIsCheck())) return false;
        if (appointment.getStatus() != StatusAppointment.CONFIRMED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Lịch hẹn chưa được xác nhận để check-in.");
        }
        appointment.setStatus(StatusAppointment.WAITING);
        appointment.setIsCheck(true);
        return true;
    }

    private String normalizeName(String value) {
        return value == null ? "" : java.text.Normalizer.normalize(value.trim(), java.text.Normalizer.Form.NFC)
                .replaceAll("\\s+", " ").toLowerCase(ROOT);
    }

    private String normalizePhone(String value) {
        String phone = value == null ? "" : value.replaceAll("[^0-9]", "");
        return phone.startsWith("84") ? "0" + phone.substring(2) : phone;
    }

    private void broadcastAppointmentAfterCommit(AppointmentDetailDTO dto) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    simpMessagingTemplate.convertAndSend("/topic/appointments", dto);
                } catch (Exception ex) {
                    log.warn("Failed to broadcast appointment update", ex);
                }
            }
        });
    }

    private Patient resolveAppointmentPatient(UUID patientId) {
        if (patientId != null) {
            Optional<Patient> p = patientRepository.findById(patientId);
            if (p.isPresent()) return p.get();
            Optional<Patient> pByUser = patientRepository.findByUserId(patientId);
            if (pByUser.isPresent()) return pByUser.get();
        }
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                String username = auth.getName();
                User currentUser = userRepository.findByUsername(username)
                        .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
                if (currentUser != null) {
                    Optional<Patient> p = patientRepository.findByUserId(currentUser.getId());
                    if (p.isPresent()) return p.get();
                }
            }
        } catch (Exception e) {
            log.warn("Could not resolve patient from security context: {}", e.getMessage());
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAppointmentsByDay(LocalDate date) {
        String branchId = getCurrentEmployeeBranchId();
        LocalDate selectedDate = date != null ? date : LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        return appointmentRepository.findByBranchAndDateRange(
                branchId, selectedDate.atStartOfDay(), selectedDate.plusDays(1).atStartOfDay())
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> searchAppointmentsByPhone(String phone, LocalDate date) {
        String branchId = getCurrentEmployeeBranchId();
        String normalizedPhone = normalizePhone(phone);
        if (phone == null || phone.length() > 50 || !phone.matches("[+0-9\\s().-]+")
                || !normalizedPhone.matches("0[0-9]{9,10}")) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng nhập đầy đủ số điện thoại hợp lệ.");
        }
        return appointmentRepository.findByBranchAndNormalizedPhone(branchId, normalizedPhone).stream()
                .filter(appointment -> date == null || (appointment.getAppointmentDate() != null
                        && appointment.getAppointmentDate().toLocalDate().equals(date)))
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAppointmentsByWeek(LocalDate date) {
        String branchId = getCurrentEmployeeBranchId();
        LocalDate selectedDate = date != null ? date : LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate startOfWeek = selectedDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return appointmentRepository.findByBranchAndDateRange(
                branchId, startOfWeek.atStartOfDay(), startOfWeek.plusWeeks(1).atStartOfDay())
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private String getCurrentEmployeeBranchId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        Employee employee = employeeRepository.findByUserId(userDetails.getUser().getId())
                .orElseThrow(() -> new AppException(ErrorCode.CURRENT_USER_NOT_EMPLOYEE));
        if (employee.getBranch() == null || employee.getBranch().getBranchId() == null) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Nhân viên hiện tại chưa được phân công chi nhánh.");
        }
        return employee.getBranch().getBranchId();
    }

    @Override
    @Transactional
    public AppointmentDetailDTO createAppointment(AppointmentCreateDTO dto) {
        String recipientEmail = dto.getEmail() == null ? "" : dto.getEmail().trim();
        if (recipientEmail.isBlank() || recipientEmail.length() > 254
                || !recipientEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng nhập email nhận lịch hẹn hợp lệ.");
        }
        Patient patient = resolveAppointmentPatient(dto.getPatientId());
        log.info("Creating appointment for dentistId: {}, patientName: {}, phone: {}", dto.getDentistId(),
                dto.getFullName(), dto.getPhone());

        String patientName = (dto.getFullName() != null && !dto.getFullName().isBlank()) ? dto.getFullName().trim()
                : "Bệnh nhân mới";
        String phone = (dto.getPhone() != null && !dto.getPhone().isBlank()) ? dto.getPhone().trim() : "";

        if (patientName.isBlank() && phone.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng nhập tên bệnh nhân và số điện thoại.");
        }

        // 2. Resolve Dentist
        Dentist dentist = null;
        if (dto.getDentistId() != null) {
            dentist = dentistRepository.findById(dto.getDentistId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                            "Không tìm thấy Bác sĩ với ID: " + dto.getDentistId()));
        } else {
            List<Dentist> dentists = dentistRepository.findAll();
            if (!dentists.isEmpty()) {
                dentist = dentists.get(0);
            }
        }

        // 3. Resolve Room if any
        Room room = null;
        if (dto.getRoomId() != null) {
            room = roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phòng khám."));
        }

        // 4. Parse Date and Time
        LocalDateTime apptDate = LocalDateTime.now();
        LocalDateTime apptTime = LocalDateTime.now();

        if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isBlank()) {
            try {
                LocalDate parsedDate = LocalDate.parse(dto.getAppointmentDate(), DateTimeFormatter.ISO_LOCAL_DATE);
                apptDate = parsedDate.atStartOfDay();

                if (dto.getAppointmentTime() != null && !dto.getAppointmentTime().isBlank()) {
                    LocalTime parsedTime = LocalTime.parse(dto.getAppointmentTime());
                    apptTime = parsedDate.atTime(parsedTime);
                } else {
                    apptTime = parsedDate.atTime(9, 0);
                }
            } catch (Exception e) {
                log.warn("Failed to parse date/time: {}", e.getMessage());
            }
        }

        // 4.5 Resolve Employee & Creator User from SecurityContext if available
        Employee employee = null;
        User creatorUser = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                String username = auth.getName();
                creatorUser = userRepository.findByUsername(username)
                        .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
                if (creatorUser != null) {
                    if (creatorUser.getEmployee() != null) {
                        employee = creatorUser.getEmployee();
                    } else if (creatorUser.getRole() == Role.EMPLOYEE) {
                        employee = employeeRepository.findByUserId(creatorUser.getId()).orElse(null);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not resolve logged-in employee: {}", e.getMessage());
        }

        if (creatorUser == null && employee != null && employee.getUser() != null) {
            creatorUser = employee.getUser();
        }

        Branch branch = resolveBranch(dto);
        validateRoomBranch(room, branch);

        // Claim the request before creating the appointment. The flush makes the
        // optimistic-lock conflict happen before any appointment insert.
        if (dto.getRequestId() != null) {
            AppointmentRequest request = appointmentRequestRepository.findById(dto.getRequestId())
                    .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_REQUEST_NOT_FOUND));

            if (request.getStatustAppointmentRequest() != StatustAppointmentRequest.PENDING) {
                throw new AppException(ErrorCode.APPOINTMENT_REQUEST_ALREADY_PROCESSED);
            }

            if (employee != null) {
                request.setEmployee(employee);
            }
            request.setStatustAppointmentRequest(StatustAppointmentRequest.COMPLETED);
            appointmentRequestRepository.saveAndFlush(request);
        }

        String appointmentCode;
        SecureRandom random = new java.security.SecureRandom();
        int attempts = 0;
        do {
            if (++attempts > 100) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể cấp mã lịch hẹn mới. Vui lòng thử lại.");
            }
            appointmentCode = String.format(ROOT, "APT-%06d", random.nextInt(1_000_000));
        } while (appointmentRepository.existsByAppointmentCode(appointmentCode));

        // 5. Build Appointment entity with direct patientName and phone
        Appointment appointment = Appointment.builder()
                .appointmentCode(appointmentCode)
                .patient(patient)
                .patientName(patientName)
                .phone(phone)
                .email(recipientEmail)
                .dentist(dentist)
                .employee(employee)
                .branch(branch)
                .appointmentDate(apptDate)
                .appointmentTime(apptTime)
                .reason(dto.getReason() != null ? dto.getReason() : "Tư vấn & khám bệnh")
                .notes(dto.getNotes())
                .attribute(dto.getRequestId() != null ? dto.getRequestId().toString() : null)
                .room(room)
                .status(StatusAppointment.CONFIRMED)
                .build();

        appointment = appointmentRepository.save(appointment);

        eventPublisher.publishEvent(new AppointmentConfirmation(
                recipientEmail, appointment.getAppointmentCode(), appointment.getPatientName(),
                appointment.getAppointmentTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                dentist != null ? dentist.getFullName() : "",
                appointment.getReason(), branch != null ? branch.getBranchName() : "",
                branch != null ? branch.getAddress() : ""));
        AppointmentDetailDTO resultDto = mapToDTO(appointment);

        // 6.5 Notify assigned dentist and active receptionists about the newly created
        // appointment
        try {
            Set<User> recipients = new HashSet<>();

            // 1. Assigned dentist user (must be ACTIVE)
            if (appointment.getDentist() != null && appointment.getDentist().getUser() != null) {
                User docUser = appointment.getDentist().getUser();
                if (docUser.getStatus() == StatusUser.ACTIVE) {
                    recipients.add(docUser);
                }
            }

            // 2. Active receptionists/employees of that branch (must be ACTIVE)
            String createBranchId = appointment.getBranch() != null ? appointment.getBranch().getBranchId() : null;
            if (createBranchId != null && !createBranchId.isBlank()) {
                List<Employee> branchEmployees = employeeRepository.findActiveEmployeesByBranch(
                        createBranchId.trim(), StatusUser.ACTIVE, Role.EMPLOYEE);
                for (Employee emp : branchEmployees) {
                    if (emp.getUser() != null) {
                        recipients.add(emp.getUser());
                    }
                }
            } else {
                List<User> activeEmployees = userRepository.findByRoleAndStatus(Role.EMPLOYEE, StatusUser.ACTIVE);
                recipients.addAll(activeEmployees);
            }

            String doctorNameStr = appointment.getDentist() != null ? appointment.getDentist().getFullName()
                    : "chưa chỉ định";

            for (User recipient : recipients) {
                String targetUrl = (recipient.getRole() == Role.DENTIST) ? "/dentist/appointments"
                        : "/employee/appointments";
                Notification notif = Notification.builder()
                        .user(recipient)
                        .sender(creatorUser)
                        .title("Lịch hẹn mới được xếp")
                        .content("Lịch khám của bệnh nhân " + appointment.getPatientName() + " ("
                                + appointment.getPhone() + ") đã được tạo cho bác sĩ " + doctorNameStr + ".")
                        .type(NotificationType.STATUS_CHANGE)
                        .targetUrl(targetUrl)
                        .isRead(false)
                        .build();
                notif = notificationRepository.save(notif);

                NotificationResponseDTO notifDto = NotificationResponseDTO.builder()
                        .id(notif.getId())
                        .userId(recipient.getId())
                        .senderId(creatorUser != null ? creatorUser.getId() : null)
                        .senderName(creatorUser != null ? (creatorUser.getUsername() != null ? creatorUser.getUsername() : creatorUser.getEmail()) : "Hệ thống")
                        .title(notif.getTitle())
                        .content(notif.getContent())
                        .type(notif.getType())
                        .targetUrl(notif.getTargetUrl())
                        .isRead(false)
                        .createdAt(notif.getCreatedAt() != null ? notif.getCreatedAt() : LocalDateTime.now())
                        .build();

                simpMessagingTemplate.convertAndSendToUser(recipient.getId().toString(), "/queue/notifications",
                        notifDto);
                simpMessagingTemplate.convertAndSend("/topic/notifications", notifDto);
            }

            // 3. Gửi thông báo cho Bệnh nhân nếu có tài khoản
            User patientUser = null;
            if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
                patientUser = appointment.getPatient().getUser();
            } else if (dto.getPatientId() != null) {
                User userById = userRepository.findById(dto.getPatientId()).orElse(null);
                if (userById != null && userById.getRole() == Role.PATIENT) {
                    patientUser = userById;
                }
            }

            if (patientUser != null && patientUser.getStatus() == StatusUser.ACTIVE) {
                String branchStr = appointment.getBranch() != null ? appointment.getBranch().getBranchName() : "Crown Dental";
                String timeStr = appointment.getAppointmentTime() != null ? appointment.getAppointmentTime().toLocalTime().toString().substring(0, 5) : "";
                String dateStr = appointment.getAppointmentDate() != null ? appointment.getAppointmentDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                String serviceStr = appointment.getReason() != null ? appointment.getReason() : "Khám răng tổng quát";

                Notification pNotif = Notification.builder()
                        .user(patientUser)
                        .sender(creatorUser)
                        .title("Đặt lịch khám thành công")
                        .content("Bạn đã đặt lịch khám (" + serviceStr + ") vào lúc " + timeStr + " ngày " + dateStr + " tại " + branchStr + ".")
                        .type(NotificationType.STATUS_CHANGE)
                        .targetUrl("/patient/appointments")
                        .isRead(false)
                        .build();
                pNotif = notificationRepository.save(pNotif);

                NotificationResponseDTO pNotifDto = NotificationResponseDTO.builder()
                        .id(pNotif.getId())
                        .userId(patientUser.getId())
                        .senderId(creatorUser != null ? creatorUser.getId() : null)
                        .senderName(creatorUser != null ? (creatorUser.getUsername() != null ? creatorUser.getUsername() : creatorUser.getEmail()) : "Crown Dental")
                        .title(pNotif.getTitle())
                        .content(pNotif.getContent())
                        .type(pNotif.getType())
                        .targetUrl(pNotif.getTargetUrl())
                        .isRead(false)
                        .createdAt(pNotif.getCreatedAt() != null ? pNotif.getCreatedAt() : LocalDateTime.now())
                        .build();

                simpMessagingTemplate.convertAndSendToUser(patientUser.getId().toString(), "/queue/notifications", pNotifDto);
                simpMessagingTemplate.convertAndSend("/topic/notifications", pNotifDto);
            }
        } catch (Exception e) {
            log.warn("Failed to create notifications for new appointment: {}", e.getMessage());
        }

        // 7. Broadcast realtime event when new appointment is created
        try {
            simpMessagingTemplate.convertAndSend("/topic/appointments", resultDto);
        } catch (Exception e) {
            log.warn("Realtime WebSocket broadcast failed in createAppointment: {}", e.getMessage());
        }

        return resultDto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAllAppointments(UUID dentistId, String dateStr, StatusAppointment status) {
        List<Appointment> appointments;

        if (dentistId != null) {
            if (dateStr != null && !dateStr.isBlank()) {
                try {
                    LocalDate date = LocalDate.parse(dateStr);
                    LocalDateTime start = date.atStartOfDay();
                    LocalDateTime end = date.atTime(23, 59, 59);
                    appointments = appointmentRepository
                            .findByDentistIdAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(
                                    dentistId, start, end);
                } catch (Exception e) {
                    appointments = appointmentRepository
                            .findByDentistIdOrderByAppointmentDateAscAppointmentTimeAsc(dentistId);
                }
            } else {
                appointments = appointmentRepository
                        .findByDentistIdOrderByAppointmentDateAscAppointmentTimeAsc(dentistId);
            }
        } else if (dateStr != null && !dateStr.isBlank()) {
            try {
                LocalDate date = LocalDate.parse(dateStr);
                LocalDateTime start = date.atStartOfDay();
                LocalDateTime end = date.atTime(23, 59, 59);
                appointments = appointmentRepository
                        .findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(start, end);
            } catch (Exception e) {
                appointments = appointmentRepository.findAllByOrderByAppointmentDateDescAppointmentTimeDesc();
            }
        } else if (status != null) {
            appointments = appointmentRepository.findByStatusOrderByAppointmentDateAscAppointmentTimeAsc(status);
        } else {
            appointments = appointmentRepository.findAllByOrderByAppointmentDateDescAppointmentTimeDesc();
        }

        return appointments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAppointmentsByDentist(UUID dentistId) {
        Dentist targetDentist = dentistRepository.findById(dentistId).orElse(null);
        if (targetDentist == null) {
            return appointmentRepository.findByDentistIdOrderByAppointmentDateAscAppointmentTimeAsc(dentistId)
                    .stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        List<Dentist> allDentists = dentistRepository.findAllWithUser();
        List<UUID> matchingDentistIds = allDentists.stream()
                .filter(d -> {
                    if (d.getId().equals(dentistId))
                        return true;
                    if (targetDentist.getUser() != null && d.getUser() != null
                            && targetDentist.getUser().getId().equals(d.getUser().getId()))
                        return true;
                    String name1 = targetDentist.getFullName() != null
                            ? targetDentist.getFullName().trim().toLowerCase()
                            : "";
                    String name2 = d.getFullName() != null ? d.getFullName().trim().toLowerCase() : "";
                    return !name1.isEmpty() && name1.equals(name2);
                })
                .map(Dentist::getId)
                .collect(Collectors.toList());

        return appointmentRepository.findByDentistIdInOrderByAppointmentDateAscAppointmentTimeAsc(matchingDentistIds)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAppointmentsByDentistAndSlot(
            UUID dentistId, LocalDate appointmentDate, LocalTime appointmentTime) {
        LocalDateTime slotDateTime = appointmentDate.atTime(appointmentTime);

        return appointmentRepository.findActiveByDentistAndAppointmentDateAndTime(
                        dentistId,
                        appointmentDate.atStartOfDay(),
                        appointmentDate.plusDays(1).atStartOfDay(),
                        slotDateTime)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAppointmentsByDentistUser(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);

        List<Dentist> allDentists = dentistRepository.findAllWithUser();
        List<UUID> matchingDentistIds = allDentists.stream()
                .filter(d -> {
                    if (d.getUser() != null && d.getUser().getId().equals(userId))
                        return true;
                    if (d.getId().equals(userId))
                        return true;
                    if (user != null) {
                        if (d.getUser() != null && user.getEmail() != null
                                && user.getEmail().equalsIgnoreCase(d.getUser().getEmail()))
                            return true;
                        if (d.getUser() != null && user.getUsername() != null
                                && user.getUsername().equalsIgnoreCase(d.getUser().getUsername()))
                            return true;
                        String dName = d.getFullName() != null ? d.getFullName()
                                : (d.getUser() != null ? d.getUser().getUsername() : "");
                        String uName = user.getUsername() != null ? user.getUsername() : "";
                        if (!dName.isEmpty() && !uName.isEmpty()) {
                            String cleanD = dName.replaceAll("(?i)^(ThS\\.|BS\\.|TS\\.|Dr\\.)\\s*", "").trim()
                                    .toLowerCase();
                            String cleanU = uName.replaceAll("(?i)^(bs\\.|dr\\.)", "").replace(".", " ").trim()
                                    .toLowerCase();
                            if (cleanD.contains(cleanU) || cleanU.contains(cleanD))
                                return true;
                        }
                    }
                    return false;
                })
                .map(Dentist::getId)
                .collect(Collectors.toList());

        if (matchingDentistIds.isEmpty()) {
            return appointmentRepository.findByDentistUserIdOrderByAppointmentDateAscAppointmentTimeAsc(userId)
                    .stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        return appointmentRepository.findByDentistIdInOrderByAppointmentDateAscAppointmentTimeAsc(matchingDentistIds)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAppointmentsByDentistUserOnDate(UUID userId, LocalDate date) {
        return appointmentRepository.findForDentistUserOnDate(userId, date.atStartOfDay(), date.plusDays(1).atStartOfDay())
                .stream().map(this::mapToDTO).toList();
    }

    private void notifyAppointmentStatusChanged(Appointment appointment) {
        StatusAppointment status = appointment.getStatus();
        // Resolve operator who changed status from SecurityContext
        User operatorUser = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                String username = auth.getName();
                operatorUser = userRepository.findByUsername(username)
                        .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
            }
        } catch (Exception e) {
            log.debug("Could not resolve current operator: {}", e.getMessage());
        }

        if (operatorUser == null) {
            if (appointment.getDentist() != null && appointment.getDentist().getUser() != null) {
                operatorUser = appointment.getDentist().getUser();
            } else if (appointment.getEmployee() != null && appointment.getEmployee().getUser() != null) {
                operatorUser = appointment.getEmployee().getUser();
            }
        }

        // Notify active Dentist and active Employees/Admins
        try {
            Set<User> recipients = new HashSet<>();

            // 1. Chỉ thông báo cho Bác sĩ phụ trách ca khám (phải ACTIVE)
            if (appointment.getDentist() != null && appointment.getDentist().getUser() != null) {
                User docUser = appointment.getDentist().getUser();
                if (docUser.getStatus() == StatusUser.ACTIVE) {
                    recipients.add(docUser);
                }
            }

            // 2. Chỉ thông báo cho Nhân viên / Lễ tân thuộc chi nhánh của ca khám (phải ACTIVE)
            String branchId = null;
            if (appointment.getBranch() != null && appointment.getBranch().getBranchId() != null) {
                branchId = appointment.getBranch().getBranchId();
            } else if (appointment.getDentist() != null && appointment.getDentist().getBranch() != null) {
                branchId = appointment.getDentist().getBranch().getBranchId();
            } else if (appointment.getEmployee() != null && appointment.getEmployee().getBranch() != null) {
                branchId = appointment.getEmployee().getBranch().getBranchId();
            }

            if (branchId != null && !branchId.isBlank()) {
                List<Employee> branchEmployees = employeeRepository.findActiveEmployeesByBranch(
                        branchId.trim(), StatusUser.ACTIVE, Role.EMPLOYEE);
                for (Employee emp : branchEmployees) {
                    if (emp.getUser() != null) {
                        recipients.add(emp.getUser());
                    }
                }
            } else {
                // Fallback nếu lịch hẹn không gắn với chi nhánh cụ thể
                List<User> activeEmployees = userRepository.findByRoleAndStatus(Role.EMPLOYEE, StatusUser.ACTIVE);
                recipients.addAll(activeEmployees);
            }

            // 3. Admin: Không cần nhận thông báo theo yêu cầu

            String title;
            String content;
            NotificationType notifType = NotificationType.STATUS_CHANGE;

            String patientName = appointment.getPatientName() != null ? appointment.getPatientName() : "Bệnh nhân";
            String roomName = (appointment.getRoom() != null && appointment.getRoom().getRoomName() != null)
                    ? appointment.getRoom().getRoomName()
                    : "phòng khám";

            switch (status) {
                case WAITING:
                    title = "Bệnh nhân đã check-in";
                    content = "Bệnh nhân " + patientName + " đã đến quầy check-in, sẵn sàng chờ khám.";
                    notifType = NotificationType.PATIENT_CHECKIN;
                    break;
                case CALLED:
                    title = "Đã gọi bệnh nhân vào phòng";
                    content = "Bệnh nhân " + patientName + " đã được gọi vào " + roomName;
                    break;
                case IN_PROGRESS:
                    title = "Bắt đầu ca điều trị";
                    content = "Bác sĩ đã bắt đầu tiến hành điều trị cho bệnh nhân " + patientName + ".";
                    break;
                case COMPLETED:
                    title = "Hoàn tất ca khám";
                    content = "Bệnh nhân " + patientName + " đã hoàn thành ca khám.";
                    break;
                case CANCELLED:
                    title = "Ca khám đã bị hủy";
                    content = "Lịch hẹn của bệnh nhân " + patientName + " đã bị hủy.";
                    break;
                default:
                    title = "Cập nhật ca khám";
                    content = "Ca khám của bệnh nhân " + patientName + " đã chuyển sang: " + status;
                    break;
            }

            for (User recipient : recipients) {
                String targetUrl = (recipient.getRole() == Role.DENTIST) ? "/dentist/appointments"
                        : "/employee/appointments";
                Notification notif = Notification.builder()
                        .user(recipient)
                        .sender(operatorUser)
                        .title(title)
                        .content(content)
                        .type(notifType)
                        .targetUrl(targetUrl)
                        .isRead(false)
                        .build();
                notif = notificationRepository.save(notif);

                NotificationResponseDTO notifDto = NotificationResponseDTO.builder()
                        .id(notif.getId())
                        .userId(recipient.getId())
                        .senderId(operatorUser != null ? operatorUser.getId() : null)
                        .senderName(operatorUser != null ? (operatorUser.getUsername() != null ? operatorUser.getUsername() : operatorUser.getEmail()) : "Hệ thống")
                        .title(notif.getTitle())
                        .content(notif.getContent())
                        .type(notif.getType())
                        .targetUrl(notif.getTargetUrl())
                        .isRead(false)
                        .createdAt(notif.getCreatedAt() != null ? notif.getCreatedAt() : LocalDateTime.now())
                        .build();

                simpMessagingTemplate.convertAndSendToUser(recipient.getId().toString(), "/queue/notifications",
                        notifDto);
                simpMessagingTemplate.convertAndSend("/topic/notifications", notifDto);
            }
            log.info(">>> [NOTIF SUCCESS] Đã lưu & gửi thông báo đổi trạng thái '{}' cho {} người nhận.", status,
                    recipients.size());
        } catch (Exception e) {
            log.warn("Failed to create or send appointment status notifications: {}", e.getMessage(), e);
        }

    }

    @Override
    @Transactional
    public AppointmentDetailDTO updateAppointment(UUID appointmentId, AppointmentCreateDTO dto) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy lịch hẹn ID: " + appointmentId));

        if (dto.getPatientId() != null) {
            Patient patient = resolveAppointmentPatient(dto.getPatientId());
            if (appointment.getPatient() != null && !appointment.getPatient().getId().equals(patient.getId())) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể đổi bệnh nhân của lịch hẹn đã liên kết.");
            }
            if (appointment.getMedicalRecord() != null && appointment.getMedicalRecord().getPatient() != null
                    && !appointment.getMedicalRecord().getPatient().getId().equals(patient.getId())) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Bệnh nhân không khớp hồ sơ bệnh án.");
            }
            appointment.setPatient(patient);
        }
        StatusAppointment previousStatus = appointment.getStatus();
        boolean assigningRoomForCallIn = dto.getRoomId() != null
                && dto.getStatus() == StatusAppointment.CALLED;
        boolean updatingSchedule = (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isBlank())
                || (dto.getAppointmentTime() != null && !dto.getAppointmentTime().isBlank())
                || dto.getDentistId() != null
                || (dto.getRoomId() != null && !assigningRoomForCallIn)
                || (dto.getBranchId() != null && !dto.getBranchId().isBlank());
        if (updatingSchedule && previousStatus != StatusAppointment.CONFIRMED
                && previousStatus != StatusAppointment.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Lịch hẹn đã check-in hoặc đang tiến hành khám, không thể đổi lịch!");
        }

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            appointment.setPatientName(dto.getFullName().trim());
        }

        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            appointment.setPhone(dto.getPhone().trim());
        }

        if (dto.getDentistId() != null) {
            Dentist dentist = dentistRepository.findById(dto.getDentistId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                            "Không tìm thấy Bác sĩ ID: " + dto.getDentistId()));
            appointment.setDentist(dentist);
        }

        if (dto.getRoomId() != null) {
            Room room = roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phòng khám."));
            appointment.setRoom(room);
        }

        if (dto.getBranchId() != null && !dto.getBranchId().isBlank()) {
            Branch branch = branchRepository.findById(dto.getBranchId().trim())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                            "Không tìm thấy chi nhánh ID: " + dto.getBranchId()));
            appointment.setBranch(branch);
        }

        if (dto.getRoomId() != null || (dto.getBranchId() != null && !dto.getBranchId().isBlank())) {
            validateRoomBranch(appointment.getRoom(), appointment.getBranch());
        }

        boolean hasDate = dto.getAppointmentDate() != null && !dto.getAppointmentDate().isBlank();
        boolean hasTime = dto.getAppointmentTime() != null && !dto.getAppointmentTime().isBlank();
        if (hasDate || hasTime) {
            try {
                LocalDate parsedDate = hasDate ? LocalDate.parse(dto.getAppointmentDate())
                        : appointment.getAppointmentDate().toLocalDate();
                LocalTime parsedTime = hasTime ? LocalTime.parse(dto.getAppointmentTime())
                        : appointment.getAppointmentTime().toLocalTime();
                appointment.setAppointmentDate(parsedDate.atStartOfDay());
                appointment.setAppointmentTime(parsedDate.atTime(parsedTime));
            } catch (java.time.format.DateTimeParseException e) {
                throw new AppException(ErrorCode.VALIDATION_ERROR,
                        "Ngày hoặc giờ hẹn không hợp lệ. Định dạng yêu cầu: yyyy-MM-dd và HH:mm.");
            }
        }

        if (dto.getReason() != null && !dto.getReason().isBlank()) {
            appointment.setReason(dto.getReason());
        }

        if (dto.getNotes() != null) {
            appointment.setNotes(dto.getNotes());
        }

        if (dto.getStatus() == StatusAppointment.WAITING) {
            markArrived(appointment);
        } else if (dto.getStatus() != null) {
            if (Boolean.TRUE.equals(appointment.getIsCheck())
                    && (dto.getStatus() == StatusAppointment.CONFIRMED || dto.getStatus() == StatusAppointment.PENDING)) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể đưa lịch đã check-in về trạng thái chưa tiếp nhận.");
            }
            appointment.setStatus(dto.getStatus());
        }
        appointment = appointmentRepository.save(appointment);
        AppointmentDetailDTO resultDto = mapToDTO(appointment);
        if (appointment.getStatus() != previousStatus) {
            notifyAppointmentStatusChanged(appointment);
        }
        broadcastAppointmentAfterCommit(resultDto);
        return resultDto;
    }

    @Override
    @Transactional
    public AppointmentDetailDTO updateClinicalExam(UUID appointmentId, AppointmentCreateDTO dto) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy lịch hẹn ID: " + appointmentId));

        if (dto.getDiagnosis() != null)
            appointment.setDiagnosis(dto.getDiagnosis());
        if (dto.getSymptoms() != null)
            appointment.setSymptoms(dto.getSymptoms());
        if (dto.getTreatmentNotes() != null)
            appointment.setTreatmentNotes(dto.getTreatmentNotes());
        if (dto.getNotes() != null)
            appointment.setNotes(dto.getNotes());
        if (dto.getReason() != null)
            appointment.setReason(dto.getReason());

        appointment = appointmentRepository.save(appointment);
        return mapToDTO(appointment);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentDetailDTO getAppointmentById(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy lịch hẹn ID: " + id));
        return mapToDTO(appointment);
    }

    private AppointmentDetailDTO mapToDTO(Appointment apt) {
        Branch branch = apt.getBranch();
        return AppointmentDetailDTO.builder()
                .id(apt.getId())
                .appointmentCode(apt.getAppointmentCode())
                .isCheck(apt.getIsCheck())
                .email(apt.getEmail())
                .patientId(apt.getPatient() != null ? apt.getPatient().getId() : null)
                .patientName(apt.getPatientName() != null ? apt.getPatientName() : "N/A")
                .patientCode(apt.getPatient() != null ? apt.getPatient().getPatientCode() : "N/A")
                .phone(apt.getPhone() != null ? apt.getPhone() : "")
                .branchId(branch != null ? branch.getBranchId() : null)
                .branchName(branch != null ? branch.getBranchName() : null)
                .branchAddress(branch != null ? branch.getAddress() : null)
                .dentistId(apt.getDentist() != null ? apt.getDentist().getId() : null)
                .dentistName(apt.getDentist() != null ? apt.getDentist().getFullName() : "Chưa phân công")
                .employeeId(apt.getEmployee() != null ? apt.getEmployee().getId() : null)
                .employeeName(resolveEmployeeName(apt.getEmployee()))
                .appointmentDate(apt.getAppointmentDate())
                .appointmentTime(apt.getAppointmentTime())
                .reason(apt.getReason())
                .notes(apt.getNotes())
                .diagnosis(apt.getDiagnosis())
                .symptoms(apt.getSymptoms())
                .treatmentNotes(apt.getTreatmentNotes())
                .status(apt.getStatus())
                .roomId(apt.getRoom() != null ? apt.getRoom().getId() : null)
                .roomName(apt.getRoom() != null ? apt.getRoom().getRoomName() : null)
                .requestIdStr(apt.getAttribute())
                .createdAt(apt.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDetailDTO> getAppointmentsByPatient(UUID patientId) {
        if (patientId == null) {
            return Collections.emptyList();
        }
        Patient p = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUserId(patientId))
                .orElse(null);
        UUID actualPatientId = p != null ? p.getId() : patientId;

        LocalDate firstDayOfCurrentMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate firstDayOfNextMonth = firstDayOfCurrentMonth.plusMonths(1);
        LocalDateTime startOfMonth = firstDayOfCurrentMonth.atStartOfDay();
        LocalDateTime startOfNextMonth = firstDayOfNextMonth.atStartOfDay();

        List<Appointment> list = appointmentRepository.findByPatientIdAndDateRange(
                actualPatientId,
                startOfMonth,
                startOfNextMonth);
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private Branch resolveBranch(AppointmentCreateDTO dto) {
        if (dto.getBranchId() != null && !dto.getBranchId().isBlank()) {
            Optional<Branch> bOpt = branchRepository.findById(dto.getBranchId().trim());
            if (bOpt.isPresent()) return bOpt.get();
        }
        if (dto.getDentistId() != null) {
            Dentist d = dentistRepository.findById(dto.getDentistId()).orElse(null);
            if (d != null && d.getBranch() != null) return d.getBranch();
        }
        List<Branch> allBranches = branchRepository.findAll();
        if (!allBranches.isEmpty()) return allBranches.get(0);
        return null;
    }

    private String resolveEmployeeName(Employee employee) {
        if (employee == null) {
            return null;
        }
        if (employee.getFullName() != null && !employee.getFullName().trim().isEmpty()) {
            return employee.getFullName().trim();
        }

        User user = employee.getUser();
        if (user == null) {
            return null;
        }
        if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
            return user.getUsername().trim();
        }
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            return user.getEmail().trim();
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Room> getAllRooms() {
        return roomRepository.findAllByOrderByRoomNameAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Room> getRoomsByBranch(String branchId) {
        if (branchId == null || branchId.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng xác định chi nhánh của lịch hẹn.");
        }
        return roomRepository.findByBranch_BranchIdOrderByRoomNameAsc(branchId.trim());
    }

    @Override
    @Transactional
    public iuh.fit.backend.appointment.dto.RoomResponseDTO createRoom(iuh.fit.backend.appointment.dto.RoomRequestDTO dto) {
        if (dto.getRoomName() == null || dto.getRoomName().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên phòng khám không được để trống.");
        }
        if (dto.getBranchId() == null || dto.getBranchId().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chi nhánh không được để trống.");
        }

        String trimmedRoomName = dto.getRoomName().trim();
        String trimmedBranchId = dto.getBranchId().trim();

        Branch branch = branchRepository.findById(trimmedBranchId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chi nhánh với mã: " + trimmedBranchId));

        if (roomRepository.existsByRoomNameIgnoreCaseAndBranch_BranchId(trimmedRoomName, trimmedBranchId)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên phòng '" + trimmedRoomName + "' đã tồn tại ở chi nhánh này.");
        }

        Room room = Room.builder()
                .roomName(trimmedRoomName)
                .floorName(dto.getFloorName() != null ? dto.getFloorName().trim() : null)
                .branch(branch)
                .createAt(LocalDateTime.now())
                .build();

        Room saved = roomRepository.save(room);
        return mapToRoomResponseDTO(saved);
    }

    @Override
    @Transactional
    public iuh.fit.backend.appointment.dto.RoomResponseDTO updateRoom(UUID id, iuh.fit.backend.appointment.dto.RoomRequestDTO dto) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phòng khám."));

        if (dto.getRoomName() == null || dto.getRoomName().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên phòng khám không được để trống.");
        }
        if (dto.getBranchId() == null || dto.getBranchId().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chi nhánh không được để trống.");
        }

        String trimmedRoomName = dto.getRoomName().trim();
        String trimmedBranchId = dto.getBranchId().trim();

        Branch branch = branchRepository.findById(trimmedBranchId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chi nhánh với mã: " + trimmedBranchId));

        if (roomRepository.existsByRoomNameIgnoreCaseAndBranch_BranchIdAndIdNot(trimmedRoomName, trimmedBranchId, id)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên phòng '" + trimmedRoomName + "' đã tồn tại ở chi nhánh này.");
        }

        room.setRoomName(trimmedRoomName);
        room.setFloorName(dto.getFloorName() != null ? dto.getFloorName().trim() : null);
        room.setBranch(branch);

        Room saved = roomRepository.save(room);
        return mapToRoomResponseDTO(saved);
    }

    @Override
    @Transactional
    public void deleteRoom(UUID id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phòng khám."));

        if (room.getAppointments() != null && !room.getAppointments().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể xóa phòng khám đang có lịch hẹn gắn kèm.");
        }

        roomRepository.delete(room);
    }

    private iuh.fit.backend.appointment.dto.RoomResponseDTO mapToRoomResponseDTO(Room room) {
        if (room == null) return null;
        return iuh.fit.backend.appointment.dto.RoomResponseDTO.builder()
                .id(room.getId())
                .roomName(room.getRoomName())
                .floorName(room.getFloorName())
                .createAt(room.getCreateAt())
                .branchId(room.getBranchId())
                .branchName(room.getBranchName())
                .build();
    }

    private void validateRoomBranch(Room room, Branch branch) {
        if (room != null && (branch == null || room.getBranchId() == null
                || !room.getBranchId().equals(branch.getBranchId()))) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Phòng khám phải thuộc chi nhánh của lịch hẹn.");
        }
    }
}

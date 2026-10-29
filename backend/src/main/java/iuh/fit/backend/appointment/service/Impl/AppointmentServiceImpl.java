package iuh.fit.backend.appointment.service.Impl;

import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
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

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

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

    private Patient resolveAppointmentPatient(UUID patientId) {
        return patientId == null ? null : patientRepository.findById(patientId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bệnh nhân."));
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
            room = roomRepository.findById(dto.getRoomId()).orElse(null);
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

        // 4.5 Resolve Employee from SecurityContext if available
        Employee employee = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                String username = auth.getName();
                User currentUser = userRepository.findByUsername(username)
                        .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
                if (currentUser != null) {
                    if (currentUser.getEmployee() != null) {
                        employee = currentUser.getEmployee();
                    } else if (currentUser.getRole() == Role.EMPLOYEE) {
                        employee = employeeRepository.findByUserId(currentUser.getId()).orElse(null);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not resolve logged-in employee: {}", e.getMessage());
        }

        Branch branch = resolveBranch(dto);

        // 5. Build Appointment entity with direct patientName and phone
        Appointment appointment = Appointment.builder()
                .patient(patient)
                .patientName(patientName)
                .phone(phone)
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

        // 6. If linked to AppointmentRequest, update its status
        if (dto.getRequestId() != null) {
            Optional<AppointmentRequest> reqOpt = appointmentRequestRepository.findById(dto.getRequestId());
            if (reqOpt.isPresent()) {
                AppointmentRequest req = reqOpt.get();
                if (employee != null) {
                    req.setEmployee(employee);
                }
                req.setStatustAppointmentRequest(StatustAppointmentRequest.COMPLETED);
                appointmentRequestRepository.save(req);
            }
        }

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
                        .title("Lịch hẹn mới được xếp")
                        .content("Lịch khám của bệnh nhân " + appointment.getPatientName() + " ("
                                + appointment.getPhone() + ") đã được tạo cho bác sĩ " + doctorNameStr + ".")
                        .type(NotificationType.PATIENT_CHECKIN)
                        .targetUrl(targetUrl)
                        .isRead(false)
                        .build();
                notif = notificationRepository.save(notif);

                NotificationResponseDTO notifDto = NotificationResponseDTO.builder()
                        .id(notif.getId())
                        .userId(recipient.getId())
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

    private void notifyAppointmentStatusChanged(Appointment appointment) {
        StatusAppointment status = appointment.getStatus();
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
        Appointment appointment = appointmentRepository.findById(appointmentId)
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
        boolean updatingSchedule = (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isBlank())
                || (dto.getAppointmentTime() != null && !dto.getAppointmentTime().isBlank())
                || dto.getDentistId() != null || dto.getRoomId() != null;
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
            Room room = roomRepository.findById(dto.getRoomId()).orElse(null);
            appointment.setRoom(room);
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

        if (dto.getStatus() != null) {
            appointment.setStatus(dto.getStatus());
        }
        appointment = appointmentRepository.save(appointment);
        AppointmentDetailDTO resultDto = mapToDTO(appointment);
        if (appointment.getStatus() != previousStatus) {
            notifyAppointmentStatusChanged(appointment);
        }
        try {
            simpMessagingTemplate.convertAndSend("/topic/appointments", resultDto);
        } catch (Exception e) {
            log.warn("Realtime WebSocket broadcast failed in updateAppointment: {}", e.getMessage());
        }
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

    private Branch resolveBranch(AppointmentCreateDTO dto) {
        if (dto.getBranchId() == null || dto.getBranchId().isBlank()) {
            throw new AppException(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    "Không tìm thấy chi nhánh trong yêu cầu tạo lịch hẹn.");
        }

        return branchRepository.findById(dto.getBranchId().trim())
                .orElseThrow(() -> new AppException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy chi nhánh: " + dto.getBranchId()));
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
        return roomRepository.findAll();
    }
}

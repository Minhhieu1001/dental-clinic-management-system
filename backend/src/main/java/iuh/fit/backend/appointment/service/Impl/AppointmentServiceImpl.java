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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
    private final RoomRepository roomRepository;

    @Override
    @Transactional
    public AppointmentDetailDTO createAppointment(AppointmentCreateDTO dto) {
        log.info("Creating appointment for dentistId: {}, patientName: {}, phone: {}", dto.getDentistId(), dto.getFullName(), dto.getPhone());

        String patientName = (dto.getFullName() != null && !dto.getFullName().isBlank()) ? dto.getFullName().trim() : "Bệnh nhân mới";
        String phone = (dto.getPhone() != null && !dto.getPhone().isBlank()) ? dto.getPhone().trim() : "";

        if (patientName.isBlank() && phone.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng nhập tên bệnh nhân và số điện thoại.");
        }

        // 2. Resolve Dentist
        Dentist dentist = null;
        if (dto.getDentistId() != null) {
            dentist = dentistRepository.findById(dto.getDentistId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy Bác sĩ với ID: " + dto.getDentistId()));
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

        // 5. Build Appointment entity with direct patientName and phone
        Appointment appointment = Appointment.builder()
                .patientName(patientName)
                .phone(phone)
                .dentist(dentist)
                .employee(employee)
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

        return mapToDTO(appointment);
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
                    appointments = appointmentRepository.findByDentistIdAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(dentistId, start, end);
                } catch (Exception e) {
                    appointments = appointmentRepository.findByDentistIdOrderByAppointmentDateAscAppointmentTimeAsc(dentistId);
                }
            } else {
                appointments = appointmentRepository.findByDentistIdOrderByAppointmentDateAscAppointmentTimeAsc(dentistId);
            }
        } else if (dateStr != null && !dateStr.isBlank()) {
            try {
                LocalDate date = LocalDate.parse(dateStr);
                LocalDateTime start = date.atStartOfDay();
                LocalDateTime end = date.atTime(23, 59, 59);
                appointments = appointmentRepository.findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(start, end);
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
                    if (d.getId().equals(dentistId)) return true;
                    if (targetDentist.getUser() != null && d.getUser() != null && targetDentist.getUser().getId().equals(d.getUser().getId())) return true;
                    String name1 = targetDentist.getFullName() != null ? targetDentist.getFullName().trim().toLowerCase() : "";
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
                    if (d.getUser() != null && d.getUser().getId().equals(userId)) return true;
                    if (d.getId().equals(userId)) return true;
                    if (user != null) {
                        if (d.getUser() != null && user.getEmail() != null && user.getEmail().equalsIgnoreCase(d.getUser().getEmail())) return true;
                        if (d.getUser() != null && user.getUsername() != null && user.getUsername().equalsIgnoreCase(d.getUser().getUsername())) return true;
                        String dName = d.getFullName() != null ? d.getFullName() : (d.getUser() != null ? d.getUser().getUsername() : "");
                        String uName = user.getUsername() != null ? user.getUsername() : "";
                        if (!dName.isEmpty() && !uName.isEmpty()) {
                            String cleanD = dName.replaceAll("(?i)^(ThS\\.|BS\\.|TS\\.|Dr\\.)\\s*", "").trim().toLowerCase();
                            String cleanU = uName.replaceAll("(?i)^(bs\\.|dr\\.)", "").replace(".", " ").trim().toLowerCase();
                            if (cleanD.contains(cleanU) || cleanU.contains(cleanD)) return true;
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
    @Transactional
    public AppointmentDetailDTO updateAppointmentStatus(UUID appointmentId, StatusAppointment status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy lịch hẹn ID: " + appointmentId));
        appointment.setStatus(status);
        appointment = appointmentRepository.save(appointment);
        return mapToDTO(appointment);
    }

    @Override
    @Transactional
    public AppointmentDetailDTO updateAppointment(UUID appointmentId, AppointmentCreateDTO dto) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy lịch hẹn ID: " + appointmentId));

        if (appointment.getStatus() != StatusAppointment.CONFIRMED && appointment.getStatus() != StatusAppointment.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Lịch hẹn đã check-in hoặc đang tiến hành khám, không thể đổi lịch!");
        }

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            appointment.setPatientName(dto.getFullName().trim());
        }

        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            appointment.setPhone(dto.getPhone().trim());
        }

        if (dto.getDentistId() != null) {
            Dentist dentist = dentistRepository.findById(dto.getDentistId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy Bác sĩ ID: " + dto.getDentistId()));
            appointment.setDentist(dentist);
        }

        if (dto.getRoomId() != null) {
            Room room = roomRepository.findById(dto.getRoomId()).orElse(null);
            appointment.setRoom(room);
        }

        if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isBlank()) {
            try {
                LocalDate parsedDate = LocalDate.parse(dto.getAppointmentDate(), DateTimeFormatter.ISO_LOCAL_DATE);
                appointment.setAppointmentDate(parsedDate.atStartOfDay());

                if (dto.getAppointmentTime() != null && !dto.getAppointmentTime().isBlank()) {
                    LocalTime parsedTime = LocalTime.parse(dto.getAppointmentTime());
                    appointment.setAppointmentTime(parsedDate.atTime(parsedTime));
                }
            } catch (Exception e) {
                log.warn("Failed to parse date/time in updateAppointment: {}", e.getMessage());
            }
        }

        if (dto.getReason() != null && !dto.getReason().isBlank()) {
            appointment.setReason(dto.getReason());
        }

        if (dto.getNotes() != null) {
            appointment.setNotes(dto.getNotes());
        }

        appointment = appointmentRepository.save(appointment);
        return mapToDTO(appointment);
    }

    @Override
    @Transactional
    public AppointmentDetailDTO updateClinicalExam(UUID appointmentId, AppointmentCreateDTO dto) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy lịch hẹn ID: " + appointmentId));

        if (dto.getDiagnosis() != null) appointment.setDiagnosis(dto.getDiagnosis());
        if (dto.getSymptoms() != null) appointment.setSymptoms(dto.getSymptoms());
        if (dto.getTreatmentNotes() != null) appointment.setTreatmentNotes(dto.getTreatmentNotes());
        if (dto.getNotes() != null) appointment.setNotes(dto.getNotes());
        if (dto.getReason() != null) appointment.setReason(dto.getReason());

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
        return AppointmentDetailDTO.builder()
                .id(apt.getId())
                .patientId(null)
                .patientName(apt.getPatientName() != null ? apt.getPatientName() : "N/A")
                .patientCode("N/A")
                .phone(apt.getPhone() != null ? apt.getPhone() : "")
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
    public List<iuh.fit.backend.appointment.entity.Room> getAllRooms() {
        return roomRepository.findAll();
    }
}


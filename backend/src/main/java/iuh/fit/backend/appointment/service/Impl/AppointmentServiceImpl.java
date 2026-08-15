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

        // 1. Resolve Patient
        Patient patient = null;
        if (dto.getPatientId() != null) {
            patient = patientRepository.findById(dto.getPatientId()).orElse(null);
        }

        if (patient == null) {
            String phone = dto.getPhone() != null ? dto.getPhone().trim() : "";
            if (!phone.isEmpty()) {
                Optional<User> userOpt = userRepository.findByPhone(phone);
                User user;
                if (userOpt.isPresent()) {
                    user = userOpt.get();
                    patient = user.getPatient();
                } else {
                    String username = "patient_" + (phone.length() >= 4 ? phone.substring(phone.length() - 4) : phone) + "_" + (System.currentTimeMillis() % 10000);
                    user = User.builder()
                            .username(username)
                            .password("123456")
                            .phone(phone)
                            .role(Role.PATIENT)
                            .status(StatusUser.ACTIVE)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    user = userRepository.save(user);
                }


                if (patient == null) {
                    patient = Patient.builder()
                            .user(user)
                            .fullName(dto.getFullName() != null ? dto.getFullName().trim() : "Bệnh nhân mới")
                            .patientCode("PA-" + (System.currentTimeMillis() % 1000000))
                            .createdAt(LocalDateTime.now())
                            .build();
                    patient = patientRepository.save(patient);
                }
            } else {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng nhập tên bệnh nhân và số điện thoại.");
            }
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

        // 5. Build Appointment entity
        Appointment appointment = Appointment.builder()
                .patient(patient)
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
                .patientId(apt.getPatient() != null ? apt.getPatient().getId() : null)
                .patientName(apt.getPatient() != null ? apt.getPatient().getFullName() : "N/A")
                .patientCode(apt.getPatient() != null ? apt.getPatient().getPatientCode() : "N/A")
                .phone(apt.getPatient() != null && apt.getPatient().getUser() != null ? apt.getPatient().getUser().getPhone() : "")
                .dentistId(apt.getDentist() != null ? apt.getDentist().getId() : null)
                .dentistName(apt.getDentist() != null ? apt.getDentist().getFullName() : "Chưa phân công")
                .employeeId(apt.getEmployee() != null ? apt.getEmployee().getId() : null)
                .employeeName(apt.getEmployee() != null ? apt.getEmployee().getFullName() : null)
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
    public List<iuh.fit.backend.appointment.entity.Room> getAllRooms() {
        return roomRepository.findAll();
    }
}



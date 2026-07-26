package iuh.fit.backend.appointment.controller;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DentistRepository dentistRepository;

    public AppointmentController(AppointmentRepository appointmentRepository,
                                 PatientRepository patientRepository,
                                 UserRepository userRepository,
                                 DentistRepository dentistRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.dentistRepository = dentistRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createAppointment(@RequestBody AppointmentRequest request) {
        try {
            // Find or create User by phone
            String phone = request.getPhone() != null ? request.getPhone().trim() : "";
            if (phone.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại không được để trống"));
            }

            Optional<User> userOpt = userRepository.findByPhone(phone);
            User user;
            Patient patient;

            if (userOpt.isEmpty()) {
                // Create user
                String username = "patient_" + phone;
                user = User.builder()
                        .username(username)
                        .password("123456") // default password
                        .phone(phone)
                        .role(Role.PATIENT)
                        .status(StatusUser.ACTIVE)
                        .build();
                user = userRepository.save(user);

                // Create patient
                patient = Patient.builder()
                        .user(user)
                        .fullName(request.getFullName() != null ? request.getFullName().trim() : "Khách vãng lai")
                        .patientCode("PA-" + (System.currentTimeMillis() % 1000000))
                        .createdAt(LocalDateTime.now())
                        .build();
                patient = patientRepository.save(patient);
            } else {
                user = userOpt.get();
                // Find patient associated with this user
                patient = user.getPatient();
                if (patient == null) {
                    patient = Patient.builder()
                            .user(user)
                            .fullName(request.getFullName() != null ? request.getFullName().trim() : user.getUsername())
                            .patientCode("PA-" + (System.currentTimeMillis() % 1000000))
                            .createdAt(LocalDateTime.now())
                            .build();
                    patient = patientRepository.save(patient);
                }
            }

            // Find default dentist to assign if any exists
            List<Dentist> dentists = dentistRepository.findAll();
            Dentist assignedDentist = dentists.isEmpty() ? null : dentists.get(0);

            // Parse Date and Time
            LocalDateTime apptDate = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
            LocalDateTime apptTime = apptDate;

            if (request.getDate() != null && !request.getDate().isEmpty()) {
                try {
                    LocalDate parsedDate = LocalDate.parse(request.getDate(), DateTimeFormatter.ISO_LOCAL_DATE);
                    apptDate = parsedDate.atStartOfDay();
                    if (request.getTime() != null && !request.getTime().isEmpty()) {
                        LocalTime parsedTime = LocalTime.parse(request.getTime());
                        apptTime = parsedDate.atTime(parsedTime);
                    } else {
                        apptTime = parsedDate.atTime(9, 0);
                    }
                } catch (Exception e) {
                    System.err.println("Error parsing date/time: " + e.getMessage());
                }
            }

            String reason = "Đặt lịch trực tuyến: Dịch vụ " + request.getServiceName() 
                    + " tại cơ sở " + request.getBranchName();
            if (request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
                reason += ". Chi tiết: " + request.getMessage().trim();
            }

            Appointment appointment = Appointment.builder()
                    .patient(patient)
                    .dentist(assignedDentist)
                    .appointmentDate(apptDate)
                    .appointmentTime(apptTime)
                    .reason(reason)
                    .status(StatusAppointment.PENDING)
                    .notes(request.getMessage())
                    .build();

            appointmentRepository.save(appointment);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đặt lịch hẹn thành công!");
            response.put("appointmentId", appointment.getId());
            response.put("patientCode", patient.getPatientCode());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Đã xảy ra lỗi hệ thống: " + e.getMessage()
            ));
        }
    }

    @Data
    public static class AppointmentRequest {
        private String fullName;
        private String phone;
        private String serviceName;
        private String branchName;
        private String message;
        private String date;
        private String time;
    }
}

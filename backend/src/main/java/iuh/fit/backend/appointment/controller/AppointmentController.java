package iuh.fit.backend.appointment.controller;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.entity.Room;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.service.AppointmentService;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    @PostMapping("/check-in")
    @RateLimiter(name = "appointmentCheckinLimiter")
    public iuh.fit.backend.appointment.dto.AppointmentCheckinResponse checkIn(
            @jakarta.validation.Valid @RequestBody iuh.fit.backend.appointment.dto.AppointmentCheckinRequest request) {
        return appointmentService.checkIn(request);
    }

    @RateLimiter(name = "appointmentBookingLimiter")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentDetailDTO createAppointment(@RequestBody AppointmentCreateDTO dto) {
        return appointmentService.createAppointment(dto);
    }

    @GetMapping
    public List<AppointmentDetailDTO> getAllAppointments(
            @RequestParam(required = false) UUID dentistId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) StatusAppointment status) {
        return appointmentService.getAllAppointments(dentistId, date, status);
    }

    @GetMapping("/rooms")
    public List<Room> getAllRooms(@RequestParam(required = false) String branchId) {
        return branchId == null ? appointmentService.getAllRooms() : appointmentService.getRoomsByBranch(branchId);
    }

    @GetMapping("/day")
    public List<AppointmentDetailDTO> getAppointmentsByDay(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String phone) {
        if (phone != null && !phone.isBlank()) {
            return appointmentService.searchAppointmentsByPhone(phone,
                    date != null ? date : LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")));
        }
        return appointmentService.getAppointmentsByDay(date);
    }

    @GetMapping("/search")
    public List<AppointmentDetailDTO> searchAppointmentsByPhone(@RequestParam String phone,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.searchAppointmentsByPhone(phone, date);
    }

    @GetMapping("/week")
    public List<AppointmentDetailDTO> getAppointmentsByWeek(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.getAppointmentsByWeek(date);
    }

    @GetMapping("/dentist/{dentistId}")
    public List<AppointmentDetailDTO> getAppointmentsByDentist(@PathVariable UUID dentistId) {
        return appointmentService.getAppointmentsByDentist(dentistId);
    }

    @GetMapping("/dentist/{dentistId}/check")
    public List<AppointmentDetailDTO> checkDentistAppointmentSlot(
            @PathVariable UUID dentistId,
            @RequestParam("appointdate_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate appointmentDate,
            @RequestParam("appointtime") @DateTimeFormat(pattern = "HH:mm") LocalTime appointmentTime) {
        return appointmentService.getAppointmentsByDentistAndSlot(
                dentistId, appointmentDate, appointmentTime);
    }

    @GetMapping("/patient/{patientId}")
    public List<AppointmentDetailDTO> getAppointmentsByPatient(@PathVariable UUID patientId) {
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    @GetMapping("/my-appointments")
    public List<AppointmentDetailDTO> getMyAppointments(@RequestParam(required = false) UUID dentistId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
            if (user != null) {
                if (user.getRole() == Role.PATIENT) {
                    Patient p = patientRepository.findByUserId(user.getId()).orElse(null);
                    UUID pId = p != null ? p.getId() : user.getId();
                    return appointmentService.getAppointmentsByPatient(pId);
                }
                return date == null ? appointmentService.getAppointmentsByDentistUser(user.getId())
                        : appointmentService.getAppointmentsByDentistUserOnDate(user.getId(), date);
            }
        }
        if (date != null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập để xem lịch hẹn.");
        }
        if (dentistId != null) {
            return appointmentService.getAppointmentsByDentist(dentistId);
        }
        return appointmentService.getAllAppointments(null, null, null);
    }

    @GetMapping("/{id}")
    public AppointmentDetailDTO getAppointmentById(@PathVariable UUID id) {
        return appointmentService.getAppointmentById(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(@PathVariable String id, @RequestBody AppointmentCreateDTO dto) {
        try {
            UUID uuid = UUID.fromString(id);
            AppointmentDetailDTO updated = appointmentService.updateAppointment(uuid, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Mã lịch hẹn không hợp lệ: " + id);
        }
    }

    @PutMapping("/{id}/exam")
    public ResponseEntity<?> updateClinicalExam(
            @PathVariable String id,
            @RequestBody AppointmentCreateDTO dto) {
        try {
            UUID uuid = UUID.fromString(id);
            AppointmentDetailDTO updated = appointmentService.updateClinicalExam(uuid, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Mã lịch hẹn không hợp lệ: " + id);
        }
    }
}

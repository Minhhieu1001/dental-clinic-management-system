package iuh.fit.backend.appointment.controller;

import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.entity.Room;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.service.AppointmentService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

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
    public List<Room> getAllRooms() {
        return appointmentService.getAllRooms();
    }

    @GetMapping("/day")
    public List<AppointmentDetailDTO> getAppointmentsByDay(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.getAppointmentsByDay(date);
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

    @GetMapping("/my-appointments")
    public List<AppointmentDetailDTO> getMyAppointments(@RequestParam(required = false) UUID dentistId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
            if (user != null) {
                return appointmentService.getAppointmentsByDentistUser(user.getId());
            }
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

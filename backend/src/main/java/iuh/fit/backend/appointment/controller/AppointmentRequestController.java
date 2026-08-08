package iuh.fit.backend.appointment.controller;

import iuh.fit.backend.appointment.dto.AppointmentRequestDTO;
import iuh.fit.backend.appointment.dto.AppointmentResponseDTO;
import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;
import iuh.fit.backend.appointment.service.AppointmentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointmentrequest")
@RequiredArgsConstructor
public class AppointmentRequestController {

    private final AppointmentRequestService appointmentRequestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponseDTO createAppointmentRequest(@RequestBody AppointmentRequestDTO requestDTO)
    {
        return appointmentRequestService.createAppointRequest(requestDTO);
    }

    @PatchMapping("/{id}/process")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public AppointmentResponseDTO processAppointmentRequest(@PathVariable UUID id) {
        return appointmentRequestService.processAppointmentRequest(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public AppointmentResponseDTO updateAppointmentRequestStatus(@PathVariable UUID id, @RequestParam StatustAppointmentRequest status) {
        return appointmentRequestService.updateAppointmentRequestStatus(id, status);
    }

    @GetMapping("/today")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public List<AppointmentResponseDTO> getAppointmentRequestsToday() {
        return appointmentRequestService.getAppointmentRequestsToday();
    }

    @GetMapping("/today/pending")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public List<AppointmentResponseDTO> getPendingAppointmentRequestsToday() {
        return appointmentRequestService.getPendingAppointmentRequestsToday();
    }

    @GetMapping("/today/count")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public long countAppointmentRequestsToday() {
        return appointmentRequestService.countAppointmentRequestsToday();
    }

}

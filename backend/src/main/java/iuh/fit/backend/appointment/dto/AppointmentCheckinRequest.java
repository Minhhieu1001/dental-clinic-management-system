package iuh.fit.backend.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AppointmentCheckinRequest(
        @NotBlank @Size(max = 40) String appointmentCode,
        @NotBlank @Size(max = 255) String fullName,
        @NotBlank @Size(max = 50) String phone,
        @NotBlank @Size(max = 255) String branchId) {}

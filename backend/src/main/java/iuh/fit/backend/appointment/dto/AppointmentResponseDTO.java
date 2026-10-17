package iuh.fit.backend.appointment.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;

public record AppointmentResponseDTO(
        UUID id,
        String fullName,
        String phone,
        String descriptions,
        LocalDateTime createAt,
        StatustAppointmentRequest status,
        UUID employeeId,
        String employeeName,
        String branchId,
        String branchName
        ) {
}

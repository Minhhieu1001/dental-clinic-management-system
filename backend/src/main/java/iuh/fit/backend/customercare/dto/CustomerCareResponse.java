package iuh.fit.backend.customercare.dto;

import iuh.fit.backend.customercare.enums.ContactChannel;

import java.time.LocalDateTime;
import java.util.UUID;

public record CustomerCareResponse(
        UUID careTaskId,
        UUID patientId,
        String patientCode,
        String patientName,
        String phone,
        UUID employeeId,
        String employeeName,
        String careCategory,
        String careContent,
        ContactChannel contactChannel,
        String status,
        LocalDateTime createAt
) {
}

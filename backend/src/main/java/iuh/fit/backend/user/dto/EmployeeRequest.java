package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.Position;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeRequest(
        UUID userId,
        Position position,
        BigDecimal salary,
        LocalDateTime hireDate,
        Boolean status,
        String gender,
        String address,
        String branchId,
        LocalDate dateOfBirth,
        String fullName
) {
    public EmployeeRequest(
            UUID userId,
            Position position,
            BigDecimal salary,
            LocalDateTime hireDate,
            Boolean status,
            String gender,
            String address,
            String branchId,
            LocalDate dateOfBirth
    ) {
        this(userId, position, salary, hireDate, status, gender, address, branchId, dateOfBirth, null);
    }
}


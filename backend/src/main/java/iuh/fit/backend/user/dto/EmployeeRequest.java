package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.Position;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeRequest(
        UUID userId,
        Position position,
        BigDecimal salary,
        LocalDateTime hireDate,
        Boolean status
) {
}

package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.Position;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponse(
                UUID id,
                UUID userId,
                String username,
                String email,
                Position position,
                BigDecimal salary,
                LocalDateTime hireDate,
                Boolean status,
                String branchId,
                String branchName,
                String branchAddress,
                String branchImage,
                String clinicLogoUrl,
                String clinicAddress,
                String employeeCode,
                LocalDate dateOfBirth) {
}

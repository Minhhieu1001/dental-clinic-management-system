package iuh.fit.backend.prescription.dto;

import iuh.fit.backend.prescription.enums.MedicineStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineDTO {
    private UUID id;
    private String code;
    private String name;
    private String unit;
    private String manufacturer;
    private Integer stockQuantity;
    private BigDecimal price;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private String description;
    private String usageInstruction;
    private MedicineStatus status;
    private String statusLabel;
    private String stockStatus;
    private Long daysUntilExpiry;
    private Boolean isExpiringSoon;
    private Boolean isExpired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

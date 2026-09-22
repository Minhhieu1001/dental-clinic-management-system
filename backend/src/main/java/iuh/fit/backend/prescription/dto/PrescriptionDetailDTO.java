package iuh.fit.backend.prescription.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDetailDTO {
    private UUID id;
    private UUID medicineId;
    private String medicineName;
    private String medicineCode;
    private String dosage;
    private String unit;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}

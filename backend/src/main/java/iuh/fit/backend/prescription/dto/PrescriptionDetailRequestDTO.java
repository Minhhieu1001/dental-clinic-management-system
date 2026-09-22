package iuh.fit.backend.prescription.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDetailRequestDTO {
    private UUID medicineId;

    @NotBlank(message = "Tên thuốc không được để trống")
    private String medicineName;

    private String dosage;

    private String unit;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    private BigDecimal unitPrice;
}

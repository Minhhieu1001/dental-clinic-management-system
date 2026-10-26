package iuh.fit.backend.treatment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TreatmentServiceRequest {
    private UUID serviceId;

    @Size(max = 200, message = "Số răng không được vượt quá 200 ký tự")
    private String toothNumber;

    @Positive(message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @DecimalMin(value = "0", message = "Đơn giá không được âm")
    @Digits(integer = 13, fraction = 2, message = "Đơn giá tối đa 13 chữ số nguyên và 2 chữ số thập phân")
    private BigDecimal price;
}

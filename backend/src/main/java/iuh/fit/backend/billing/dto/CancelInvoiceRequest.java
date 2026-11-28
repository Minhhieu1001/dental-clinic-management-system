package iuh.fit.backend.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CancelInvoiceRequest {
    @NotBlank(message = "Vui lòng nhập lý do hủy hóa đơn")
    @Size(max = 1000, message = "Lý do hủy không được vượt quá 1000 ký tự")
    private String reason;
}

package iuh.fit.backend.billing.dto;

import iuh.fit.backend.billing.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    private String branchId;
    private BigDecimal amount;
    private BigDecimal amountReceived;
    private BigDecimal serviceAmount;
    private BigDecimal medicineAmount;
    private PaymentMethod paymentMethod;
    private UUID employeeId;
    private String note;
    private LocalDate nextPaymentDate;
}

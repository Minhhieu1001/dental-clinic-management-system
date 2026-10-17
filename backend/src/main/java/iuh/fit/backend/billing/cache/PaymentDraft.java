package iuh.fit.backend.billing.cache;

import iuh.fit.backend.billing.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDraft {
    private String branchId;
    private String transactionCode;
    private UUID invoiceId;
    private BigDecimal amount;
    private BigDecimal serviceAmount;
    private BigDecimal medicineAmount;
    private PaymentMethod paymentMethod;
    private UUID employeeId;
    private String note;
    private Instant createdAt;
    private String status; // PENDING, SUCCESS, EXPIRED
}

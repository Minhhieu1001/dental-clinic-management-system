package iuh.fit.backend.shift.dto;

import iuh.fit.backend.billing.enums.PaymentMethod;
import iuh.fit.backend.billing.enums.TransactionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftTransactionItemDTO {
    private UUID id;
    private String transactionCode;
    private String invoiceCode;
    private UUID invoiceId;
    private String patientName;
    private String patientPhone;
    private PaymentMethod paymentMethod;
    private BigDecimal totalAmount;
    private BigDecimal amountReceived;
    private BigDecimal changeAmount;
    private LocalDateTime paymentTime;
    private TransactionStatus status;
    private String employeeName;
}

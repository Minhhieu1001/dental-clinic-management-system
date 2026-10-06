package iuh.fit.backend.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionDTO {
    private UUID id;
    private UUID invoiceId;
    private String paymentTransactionsName;
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String patientPhone;
    private UUID employeeId;
    private String employeeCode;
    private BigDecimal serviceAmount;
    private BigDecimal medicineAmount;
    private BigDecimal totalAmount;
    private BigDecimal amountReceived;
    private BigDecimal changeAmount;
    private String paymentMethod;
    private String transactionCode;
    private LocalDateTime paymentTime;
    private String status;
    private String note;
    private String employeeName;
    private String prescriptionId;
}
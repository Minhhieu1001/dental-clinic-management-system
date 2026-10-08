package iuh.fit.backend.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiateQrResponse {
    private String transactionCode;
    private String qrUrl;
    private UUID invoiceId;
    private BigDecimal amount;
    private String bankName;
    private String accountNo;
    private String accountName;
}

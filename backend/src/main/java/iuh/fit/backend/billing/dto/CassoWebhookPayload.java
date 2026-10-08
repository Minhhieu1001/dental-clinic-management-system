package iuh.fit.backend.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CassoWebhookPayload {
    private int error;
    private String message;
    private List<CassoTransaction> data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CassoTransaction {
        private Long id;
        private String tid;
        private String description;
        private BigDecimal amount;
        private String when;
        private String bankSubAccId;
        private String bankAccount;
    }
}

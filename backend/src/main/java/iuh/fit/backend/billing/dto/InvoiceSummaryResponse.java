package iuh.fit.backend.billing.dto;

import java.math.BigDecimal;
public interface InvoiceSummaryResponse {
    BigDecimal getTotalRevenue();
    BigDecimal getTotalPaid();
    BigDecimal getTotalDebt();
    Long getTotalCount();
}

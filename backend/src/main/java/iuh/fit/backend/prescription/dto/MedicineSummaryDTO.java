package iuh.fit.backend.prescription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineSummaryDTO {
    private long total;
    private long active;
    private long inactive;
    private long lowStock;
    private long outOfStock;
    private long expiringSoon;
    private long expired;
    private long totalStock;
    private BigDecimal totalValuation;
}

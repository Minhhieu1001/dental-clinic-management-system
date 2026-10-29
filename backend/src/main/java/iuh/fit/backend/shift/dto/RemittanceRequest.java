package iuh.fit.backend.shift.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemittanceRequest {
    private LocalDate shiftDate;
    private UUID fromShiftClosingId;
    private BigDecimal totalOvernightCash;
    private BigDecimal remittedAmount;
    private BigDecimal retainedFloatCash;
    private UUID remittedById;
    private String receivedBy;
    private String note;
}

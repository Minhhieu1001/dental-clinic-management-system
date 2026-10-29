package iuh.fit.backend.shift.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyRemittanceResponse {
    private UUID id;
    private String remittanceCode;
    private LocalDate shiftDate;
    private UUID fromShiftClosingId;
    private String fromShiftClosingCode;
    private BigDecimal totalOvernightCash;
    private BigDecimal remittedAmount;
    private BigDecimal retainedFloatCash;
    private UUID remittedById;
    private String remittedByName;
    private String receivedBy;
    private String note;
    private LocalDateTime createdAt;
}

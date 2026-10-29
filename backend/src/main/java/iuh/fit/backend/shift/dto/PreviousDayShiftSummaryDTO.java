package iuh.fit.backend.shift.dto;

import iuh.fit.backend.shift.enums.ShiftType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviousDayShiftSummaryDTO {
    private String shiftCode;
    private ShiftType shiftType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String employeeName;
    private BigDecimal initialCash;
    private BigDecimal cashRevenue;
    private BigDecimal bankTransferRevenue;
    private BigDecimal totalSystemRevenue;
    private BigDecimal totalCashActual;
    private String handoverEmployeeName;
    private String note;
}

package iuh.fit.backend.shift.dto;

import iuh.fit.backend.shift.enums.ShiftType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftClosingRequest {
    private UUID employeeId;
    private UUID handoverEmployeeId;
    private String branchId;
    private ShiftType shiftType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private BigDecimal initialCash;
    private BigDecimal cashRevenue;
    private BigDecimal bankTransferRevenue;
    private BigDecimal cardRevenue;
    private BigDecimal eWalletRevenue;
    private BigDecimal totalSystemRevenue;

    private BigDecimal totalCashExpected;
    private BigDecimal totalCashActual;
    private BigDecimal differenceAmount;
    private String differenceReason;

    private Integer totalTransactions;
    private String note;
    private String denominationsJson;
}

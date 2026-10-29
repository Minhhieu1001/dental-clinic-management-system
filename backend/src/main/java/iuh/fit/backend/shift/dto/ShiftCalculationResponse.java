package iuh.fit.backend.shift.dto;

import iuh.fit.backend.shift.enums.ShiftType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftCalculationResponse {
    private UUID employeeId;
    private String employeeName;
    private String branchId;
    private String branchName;
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

    private Integer totalTransactions;

    private Boolean isClosed;
    private ShiftClosingResponse closedShift;

    private Boolean inheritedFromPreviousShift;
    private UUID previousShiftId;
    private String previousShiftCode;
    private ShiftType previousShiftType;
    private BigDecimal previousShiftActualCash;
    private String previousShiftEmployeeName;

    private Boolean isOvernightRemitted;
    private DailyRemittanceResponse remittanceInfo;

    @Builder.Default
    private List<PreviousDayShiftSummaryDTO> previousDayShifts = new ArrayList<>();

    @Builder.Default
    private List<ShiftTransactionItemDTO> transactions = new ArrayList<>();
}


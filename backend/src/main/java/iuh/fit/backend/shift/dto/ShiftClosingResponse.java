package iuh.fit.backend.shift.dto;

import iuh.fit.backend.shift.enums.ShiftClosingStatus;
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
public class ShiftClosingResponse {
    private UUID id;
    private String shiftCode;

    private UUID employeeId;
    private String employeeName;

    private UUID handoverEmployeeId;
    private String handoverEmployeeName;

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
    private BigDecimal totalCashActual;
    private BigDecimal differenceAmount;
    private String differenceReason;

    private BigDecimal totalBankTransferActual;
    private BigDecimal bankTransferDifference;
    private String bankTransferDifferenceReason;

    private Integer totalTransactions;
    private ShiftClosingStatus status;
    private String note;
    private String denominationsJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package iuh.fit.backend.shift.service;

import iuh.fit.backend.shift.dto.ShiftCalculationResponse;
import iuh.fit.backend.shift.dto.ShiftClosingRequest;
import iuh.fit.backend.shift.dto.ShiftClosingResponse;
import iuh.fit.backend.shift.enums.ShiftType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ShiftClosingService {

    ShiftCalculationResponse calculateShiftSettlement(
            UUID employeeId,
            ShiftType shiftType,
            LocalDateTime startTime,
            LocalDateTime endTime,
            java.math.BigDecimal initialCash
    );

    ShiftClosingResponse createShiftClosing(ShiftClosingRequest request);

    List<ShiftClosingResponse> getShiftClosings(
            UUID employeeId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    ShiftClosingResponse getShiftClosingById(UUID id);

    List<iuh.fit.backend.shift.dto.HandoverEmployeeDTO> getHandoverEmployees();

    List<iuh.fit.backend.shift.dto.HandoverEmployeeDTO> getHandoverEmployees(String branchId);
}

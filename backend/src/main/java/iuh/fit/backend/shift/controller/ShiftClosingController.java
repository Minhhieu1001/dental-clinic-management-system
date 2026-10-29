package iuh.fit.backend.shift.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.shift.dto.ShiftCalculationResponse;
import iuh.fit.backend.shift.dto.ShiftClosingRequest;
import iuh.fit.backend.shift.dto.ShiftClosingResponse;
import iuh.fit.backend.shift.enums.ShiftType;
import iuh.fit.backend.shift.service.ShiftClosingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shift-closings")
@RequiredArgsConstructor
public class ShiftClosingController {

    private final ShiftClosingService shiftClosingService;

    @GetMapping("/calculate")
    public ResponseEntity<ApiResponse<ShiftCalculationResponse>> calculateShift(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) ShiftType shiftType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) BigDecimal initialCash,
            @RequestParam(required = false, defaultValue = "false") Boolean customInitialCash
    ) {
        ShiftCalculationResponse result = shiftClosingService.calculateShiftSettlement(
                employeeId,
                shiftType,
                startTime,
                endTime,
                initialCash,
                customInitialCash
        );
        return ResponseEntity.ok(ApiResponse.success("Tính toán số liệu kết toán ca thành công", result));
    }


    @PostMapping
    public ResponseEntity<ApiResponse<ShiftClosingResponse>> createShiftClosing(
            @RequestBody ShiftClosingRequest request
    ) {
        ShiftClosingResponse result = shiftClosingService.createShiftClosing(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chốt kết ca làm việc thành công", result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShiftClosingResponse>>> getShiftClosings(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<ShiftClosingResponse> results = shiftClosingService.getShiftClosings(
                employeeId,
                startDate,
                endDate
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách các phiên kết ca thành công", results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShiftClosingResponse>> getShiftClosingById(@PathVariable UUID id) {
        ShiftClosingResponse result = shiftClosingService.getShiftClosingById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết phiên kết ca thành công", result));
    }

    @GetMapping("/employees")
    public ResponseEntity<ApiResponse<List<iuh.fit.backend.shift.dto.HandoverEmployeeDTO>>> getHandoverEmployees(
            @RequestParam(required = false) String branchId
    ) {
        List<iuh.fit.backend.shift.dto.HandoverEmployeeDTO> employees = shiftClosingService.getHandoverEmployees(branchId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhân viên bàn giao ca thành công", employees));
    }

    @PostMapping("/remit-overnight-revenue")
    public ResponseEntity<ApiResponse<iuh.fit.backend.shift.dto.DailyRemittanceResponse>> remitOvernightRevenue(
            @RequestBody iuh.fit.backend.shift.dto.RemittanceRequest request
    ) {
        iuh.fit.backend.shift.dto.DailyRemittanceResponse response = shiftClosingService.remitOvernightRevenue(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Xác nhận trích nộp doanh thu ngày hôm trước thành công", response));
    }

    @GetMapping("/previous-day-summary")
    public ResponseEntity<ApiResponse<List<iuh.fit.backend.shift.dto.PreviousDayShiftSummaryDTO>>> getPreviousDaySummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate date
    ) {
        List<iuh.fit.backend.shift.dto.PreviousDayShiftSummaryDTO> list = shiftClosingService.getPreviousDayShiftSummary(date);
        return ResponseEntity.ok(ApiResponse.success("Lấy tóm tắt doanh thu các ca ngày hôm trước thành công", list));
    }
}

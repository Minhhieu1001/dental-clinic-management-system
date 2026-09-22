package iuh.fit.backend.prescription.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.prescription.dto.MedicineDTO;
import iuh.fit.backend.prescription.dto.MedicineRequestDTO;
import iuh.fit.backend.prescription.enums.MedicineStatus;
import iuh.fit.backend.prescription.service.MedicineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import iuh.fit.backend.prescription.dto.MedicineSummaryDTO;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getAllMedicines(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MedicineStatus status,
            @RequestParam(required = false) String unit,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(required = false, defaultValue = "DEFAULT") String sortBy
    ) {
        List<MedicineDTO> medicines = medicineService.getAllMedicines(keyword, status, unit, stockStatus, sortBy);
        return ResponseEntity.ok(
                ApiResponse.<List<MedicineDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách thuốc thành công")
                        .data(medicines)
                        .build()
        );
    }

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctUnits() {
        List<String> units = medicineService.getDistinctUnits();
        return ResponseEntity.ok(
                ApiResponse.<List<String>>builder()
                        .status(200)
                        .message("Lấy danh sách đơn vị tính thành công")
                        .data(units)
                        .build()
        );
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<MedicineSummaryDTO>> getSummary() {
        MedicineSummaryDTO summary = medicineService.getSummary();
        return ResponseEntity.ok(
                ApiResponse.<MedicineSummaryDTO>builder()
                        .status(200)
                        .message("Lấy thống kê danh mục thuốc thành công")
                        .data(summary)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> getMedicineById(@PathVariable UUID id) {
        MedicineDTO medicine = medicineService.getMedicineById(id);
        return ResponseEntity.ok(
                ApiResponse.<MedicineDTO>builder()
                        .status(200)
                        .message("Lấy thông tin thuốc thành công")
                        .data(medicine)
                        .build()
        );
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<MedicineDTO>> getMedicineByCode(@PathVariable String code) {
        MedicineDTO medicine = medicineService.getMedicineByCode(code);
        return ResponseEntity.ok(
                ApiResponse.<MedicineDTO>builder()
                        .status(200)
                        .message("Lấy thông tin thuốc thành công")
                        .data(medicine)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicineDTO>> createMedicine(@Valid @RequestBody MedicineRequestDTO request) {
        MedicineDTO created = medicineService.createMedicine(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<MedicineDTO>builder()
                        .status(201)
                        .message("Thêm thuốc mới thành công")
                        .data(created)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> updateMedicine(
            @PathVariable UUID id,
            @Valid @RequestBody MedicineRequestDTO request
    ) {
        MedicineDTO updated = medicineService.updateMedicine(id, request);
        return ResponseEntity.ok(
                ApiResponse.<MedicineDTO>builder()
                        .status(200)
                        .message("Cập nhật thông tin thuốc thành công")
                        .data(updated)
                        .build()
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MedicineDTO>> updateStatus(
            @PathVariable UUID id,
            @RequestParam MedicineStatus status
    ) {
        MedicineDTO updated = medicineService.updateStatus(id, status);
        return ResponseEntity.ok(
                ApiResponse.<MedicineDTO>builder()
                        .status(200)
                        .message("Cập nhật trạng thái thuốc thành công")
                        .data(updated)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(@PathVariable UUID id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .status(200)
                        .message("Xóa thuốc khỏi danh mục thành công")
                        .build()
        );
    }

    @GetMapping("/expiring-soon")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getExpiringSoon(
            @RequestParam(defaultValue = "60") int days
    ) {
        List<MedicineDTO> medicines = medicineService.getExpiringSoon(days);
        return ResponseEntity.ok(
                ApiResponse.<List<MedicineDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách thuốc sắp hết hạn thành công")
                        .data(medicines)
                        .build()
        );
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getLowStock(
            @RequestParam(defaultValue = "30") int threshold
    ) {
        List<MedicineDTO> medicines = medicineService.getLowStock(threshold);
        return ResponseEntity.ok(
                ApiResponse.<List<MedicineDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách thuốc sắp hết tồn kho thành công")
                        .data(medicines)
                        .build()
        );
    }
}

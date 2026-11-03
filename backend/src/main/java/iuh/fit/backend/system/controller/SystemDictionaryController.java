package iuh.fit.backend.system.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.system.dto.PrimaryDiagnosisRequest;
import iuh.fit.backend.system.dto.PrimaryDiagnosisResponse;
import iuh.fit.backend.system.dto.ToothStatusRequest;
import iuh.fit.backend.system.dto.ToothStatusResponse;
import iuh.fit.backend.system.service.PrimaryDiagnosisService;
import iuh.fit.backend.system.service.ToothStatusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SystemDictionaryController {
    private final PrimaryDiagnosisService primaryDiagnosisService;
    private final ToothStatusService toothStatusService;

    @GetMapping("/primary-diagnoses")
    public ResponseEntity<ApiResponse<List<PrimaryDiagnosisResponse>>> getPrimaryDiagnoses() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chẩn đoán chính thành công",
                primaryDiagnosisService.getAll()));
    }

    @GetMapping("/primary-diagnoses/{id}")
    public ResponseEntity<ApiResponse<PrimaryDiagnosisResponse>> getPrimaryDiagnosis(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy chẩn đoán chính thành công",
                primaryDiagnosisService.getById(id)));
    }

    @PostMapping("/admin/primary-diagnoses")
    public ResponseEntity<ApiResponse<PrimaryDiagnosisResponse>> createPrimaryDiagnosis(
            @Valid @RequestBody PrimaryDiagnosisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Tạo chẩn đoán chính thành công", primaryDiagnosisService.create(request)));
    }

    @PutMapping("/admin/primary-diagnoses/{id}")
    public ResponseEntity<ApiResponse<PrimaryDiagnosisResponse>> updatePrimaryDiagnosis(
            @PathVariable UUID id, @Valid @RequestBody PrimaryDiagnosisRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chẩn đoán chính thành công",
                primaryDiagnosisService.update(id, request)));
    }

    @DeleteMapping("/admin/primary-diagnoses/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePrimaryDiagnosis(@PathVariable UUID id) {
        primaryDiagnosisService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chẩn đoán chính thành công", null));
    }

    @GetMapping("/tooth-statuses")
    public ResponseEntity<ApiResponse<List<ToothStatusResponse>>> getToothStatuses() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách trạng thái răng thành công",
                toothStatusService.getAll()));
    }

    @GetMapping("/tooth-statuses/{id}")
    public ResponseEntity<ApiResponse<ToothStatusResponse>> getToothStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái răng thành công",
                toothStatusService.getById(id)));
    }

    @PostMapping("/admin/tooth-statuses")
    public ResponseEntity<ApiResponse<ToothStatusResponse>> createToothStatus(
            @Valid @RequestBody ToothStatusRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Tạo trạng thái răng thành công", toothStatusService.create(request)));
    }

    @PutMapping("/admin/tooth-statuses/{id}")
    public ResponseEntity<ApiResponse<ToothStatusResponse>> updateToothStatus(
            @PathVariable UUID id, @Valid @RequestBody ToothStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái răng thành công",
                toothStatusService.update(id, request)));
    }

    @DeleteMapping("/admin/tooth-statuses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteToothStatus(@PathVariable UUID id) {
        toothStatusService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa trạng thái răng thành công", null));
    }
}

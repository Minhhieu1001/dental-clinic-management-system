package iuh.fit.backend.treatment.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.treatment.dto.TreatmentStatusRequest;
import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.dto.TreatmentVisitRequest;
import iuh.fit.backend.treatment.dto.TreatmentVisitResponse;
import iuh.fit.backend.treatment.service.TreatmentVisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TreatmentVisitsController {
    private final TreatmentVisitService treatmentVisitService;

    @PostMapping("/treatment-phases/{parentId}/visits")
    public ResponseEntity<ApiResponse<TreatmentVisitResponse>> createTreatmentVisit(
            @PathVariable UUID parentId, @Valid @RequestBody TreatmentVisitRequest request) {
        TreatmentVisitResponse created = treatmentVisitService.createTreatmentVisit(parentId, request);
        return ResponseEntity.status(201).body(ApiResponse.<TreatmentVisitResponse>builder()
                .status(201).message("Tạo buổi điều trị thành công").data(created).build());
    }

    @PatchMapping("/treatment-visits/{id}")
    public ResponseEntity<ApiResponse<TreatmentVisitResponse>> updateTreatmentVisit(
            @PathVariable UUID id, @Valid @RequestBody TreatmentVisitRequest request) {
        TreatmentVisitResponse updated = treatmentVisitService.updateTreatmentVisit(id, request);
        return ResponseEntity.ok(ApiResponse.<TreatmentVisitResponse>builder()
                .status(200).message("Cập nhật buổi điều trị thành công").data(updated).build());
    }

    @DeleteMapping("/treatment-visits/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTreatmentVisit(@PathVariable UUID id) {
        treatmentVisitService.deleteTreatmentVisit(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(200).message("Xóa buổi điều trị thành công").build());
    }

    @PatchMapping("/treatment-visits/{id}/status")
    public ResponseEntity<ApiResponse<TreatmentStatusResponse>> updateTreatmentVisitStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TreatmentStatusRequest request) {
        TreatmentStatusResponse updated = treatmentVisitService.updateTreatmentVisitStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.<TreatmentStatusResponse>builder()
                .status(200)
                .message("Cập nhật trạng thái buổi điều trị thành công")
                .data(updated)
                .build());
    }
}

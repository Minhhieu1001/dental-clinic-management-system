package iuh.fit.backend.treatment.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.treatment.dto.TreatmentStatusRequest;
import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.dto.TreatmentPhaseRequest;
import iuh.fit.backend.treatment.dto.TreatmentPhaseResponse;
import iuh.fit.backend.treatment.service.TreatmentPhaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TreatmentPhaseController {
    private final TreatmentPhaseService treatmentPhaseService;

    @PostMapping("/treatment-plans/{parentId}/phases")
    public ResponseEntity<ApiResponse<TreatmentPhaseResponse>> createTreatmentPhase(
            @PathVariable UUID parentId, @Valid @RequestBody TreatmentPhaseRequest request) {
        TreatmentPhaseResponse created = treatmentPhaseService.createTreatmentPhase(parentId, request);
        return ResponseEntity.status(201).body(ApiResponse.<TreatmentPhaseResponse>builder()
                .status(201).message("Tạo giai đoạn điều trị thành công").data(created).build());
    }

    @PatchMapping("/treatment-phases/{id}")
    public ResponseEntity<ApiResponse<TreatmentPhaseResponse>> updateTreatmentPhase(
            @PathVariable UUID id, @Valid @RequestBody TreatmentPhaseRequest request) {
        TreatmentPhaseResponse updated = treatmentPhaseService.updateTreatmentPhase(id, request);
        return ResponseEntity.ok(ApiResponse.<TreatmentPhaseResponse>builder()
                .status(200).message("Cập nhật giai đoạn điều trị thành công").data(updated).build());
    }

    @DeleteMapping("/treatment-phases/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTreatmentPhase(@PathVariable UUID id) {
        treatmentPhaseService.deleteTreatmentPhase(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(200).message("Xóa giai đoạn điều trị thành công").build());
    }

    @PatchMapping("/treatment-phases/{id}/status")
    public ResponseEntity<ApiResponse<TreatmentStatusResponse>> updateTreatmentPhaseStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TreatmentStatusRequest request) {
        TreatmentStatusResponse updated = treatmentPhaseService.updateTreatmentPhaseStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.<TreatmentStatusResponse>builder()
                .status(200)
                .message("Cập nhật trạng thái giai đoạn điều trị thành công")
                .data(updated)
                .build());
    }
}

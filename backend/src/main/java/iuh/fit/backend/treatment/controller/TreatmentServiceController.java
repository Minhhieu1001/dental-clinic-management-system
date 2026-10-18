package iuh.fit.backend.treatment.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.treatment.dto.TreatmentServiceRequest;
import iuh.fit.backend.treatment.dto.TreatmentServiceResponse;
import iuh.fit.backend.treatment.service.TreatmentServiceI;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TreatmentServiceController {
    private final TreatmentServiceI treatmentService;

    @PostMapping("/treatment-phases/{phaseId}/services")
    public ResponseEntity<ApiResponse<TreatmentServiceResponse>> createTreatmentService(
            @PathVariable UUID phaseId, @Valid @RequestBody TreatmentServiceRequest request) {
        TreatmentServiceResponse created = treatmentService.createTreatmentService(phaseId, request);
        return ResponseEntity.status(201).body(ApiResponse.<TreatmentServiceResponse>builder()
                .status(201).message("Thêm dịch vụ vào giai đoạn thành công").data(created).build());
    }

    @PatchMapping("/treatment-services/{id}")
    public ResponseEntity<ApiResponse<TreatmentServiceResponse>> updateTreatmentService(
            @PathVariable UUID id, @Valid @RequestBody TreatmentServiceRequest request) {
        TreatmentServiceResponse updated = treatmentService.updateTreatmentService(id, request);
        return ResponseEntity.ok(ApiResponse.<TreatmentServiceResponse>builder()
                .status(200).message("Cập nhật dịch vụ điều trị thành công").data(updated).build());
    }

    @DeleteMapping("/treatment-services/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTreatmentService(@PathVariable UUID id) {
        treatmentService.deleteTreatmentService(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(200).message("Xóa dịch vụ điều trị thành công").build());
    }
}

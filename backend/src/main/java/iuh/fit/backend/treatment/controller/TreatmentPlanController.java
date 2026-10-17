package iuh.fit.backend.treatment.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.treatment.dto.TreatmentPlanRequest;
import iuh.fit.backend.treatment.dto.TreatmentPlanResponse;
import iuh.fit.backend.treatment.service.TreatmentPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/treatment-plans")
@RequiredArgsConstructor
public class TreatmentPlanController {

    private final TreatmentPlanService treatmentPlanService;

    @PostMapping
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> createTreatmentPlan(@RequestBody TreatmentPlanRequest request) {
        TreatmentPlanResponse created = treatmentPlanService.createTreatmentPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<TreatmentPlanResponse>builder()
                        .status(201)
                        .message("Tạo kế hoạch điều trị thành công")
                        .data(created)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> getTreatmentPlanById(@PathVariable UUID id) {
        TreatmentPlanResponse plan = treatmentPlanService.getTreatmentPlanById(id);
        return ResponseEntity.ok(
                ApiResponse.<TreatmentPlanResponse>builder()
                        .status(200)
                        .message("Lấy thông tin kế hoạch điều trị thành công")
                        .data(plan)
                        .build()
        );
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<TreatmentPlanResponse>>> getTreatmentPlansByPatientId(@PathVariable UUID patientId) {
        List<TreatmentPlanResponse> plans = treatmentPlanService.getTreatmentPlansByPatientId(patientId);
        return ResponseEntity.ok(
                ApiResponse.<List<TreatmentPlanResponse>>builder()
                        .status(200)
                        .message("Lấy danh sách kế hoạch điều trị của bệnh nhân thành công")
                        .data(plans)
                        .build()
        );
    }

    @GetMapping("/examination/{examinationResultId}")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> getTreatmentPlanByExaminationResultId(@PathVariable UUID examinationResultId) {
        TreatmentPlanResponse plan = treatmentPlanService.getTreatmentPlanByExaminationResultId(examinationResultId);
        return ResponseEntity.ok(
                ApiResponse.<TreatmentPlanResponse>builder()
                        .status(200)
                        .message("Lấy thông tin kế hoạch điều trị theo đợt khám thành công")
                        .data(plan)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> updateTreatmentPlan(
            @PathVariable UUID id,
            @RequestBody TreatmentPlanRequest request) {
        TreatmentPlanResponse updated = treatmentPlanService.updateTreatmentPlan(id, request);
        return ResponseEntity.ok(
                ApiResponse.<TreatmentPlanResponse>builder()
                        .status(200)
                        .message("Cập nhật kế hoạch điều trị thành công")
                        .data(updated)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTreatmentPlan(@PathVariable UUID id) {
        treatmentPlanService.deleteTreatmentPlan(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .status(200)
                        .message("Xóa kế hoạch điều trị thành công")
                        .build()
        );
    }

    @PostMapping("/{id}/auto-schedule")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> autoScheduleFollowUpAppointments(@PathVariable UUID id) {
        TreatmentPlanResponse response = treatmentPlanService.autoScheduleFollowUpAppointments(id);
        return ResponseEntity.ok(
                ApiResponse.<TreatmentPlanResponse>builder()
                        .status(200)
                        .message("Tự động đặt lịch tái khám theo các giai đoạn thành công")
                        .data(response)
                        .build()
        );
    }
}

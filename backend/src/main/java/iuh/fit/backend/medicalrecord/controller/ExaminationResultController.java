package iuh.fit.backend.medicalrecord.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.medicalrecord.dto.ExaminationResultDTO;
import iuh.fit.backend.medicalrecord.dto.ExaminationResultRequest;
import iuh.fit.backend.medicalrecord.service.ExaminationResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/examination-results")
@RequiredArgsConstructor
public class ExaminationResultController {

    private final ExaminationResultService examinationResultService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExaminationResultDTO>>> getAll() {
        List<ExaminationResultDTO> list = examinationResultService.getAllExaminationResults();
        return ResponseEntity.ok(
                ApiResponse.<List<ExaminationResultDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách kết quả khám thành công")
                        .data(list)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExaminationResultDTO>> getById(@PathVariable UUID id) {
        ExaminationResultDTO result = examinationResultService.getExaminationResultById(id);
        return ResponseEntity.ok(
                ApiResponse.<ExaminationResultDTO>builder()
                        .status(200)
                        .message("Lấy thông tin kết quả khám thành công")
                        .data(result)
                        .build()
        );
    }

    @GetMapping("/medical-record/{medicalRecordId}")
    public ResponseEntity<ApiResponse<List<ExaminationResultDTO>>> getByMedicalRecordId(
            @PathVariable UUID medicalRecordId) {
        List<ExaminationResultDTO> list = examinationResultService.getExaminationResultsByMedicalRecordId(medicalRecordId);
        return ResponseEntity.ok(
                ApiResponse.<List<ExaminationResultDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách kết quả khám theo hồ sơ bệnh án thành công")
                        .data(list)
                        .build()
        );
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<ExaminationResultDTO>>> getByPatientId(@PathVariable UUID patientId) {
        List<ExaminationResultDTO> list = examinationResultService.getExaminationResultsByPatientId(patientId);
        return ResponseEntity.ok(ApiResponse.<List<ExaminationResultDTO>>builder()
                .status(200)
                .message("Lấy danh sách đợt khám của bệnh nhân thành công")
                .data(list)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExaminationResultDTO>> create(
            @Valid @RequestBody ExaminationResultRequest request) {
        ExaminationResultDTO created = examinationResultService.createExaminationResult(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<ExaminationResultDTO>builder()
                        .status(201)
                        .message("Tạo kết quả khám lâm sàng thành công")
                        .data(created)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExaminationResultDTO>> update(
            @PathVariable UUID id,
            @RequestBody ExaminationResultRequest request) {
        ExaminationResultDTO updated = examinationResultService.updateExaminationResult(id, request);
        return ResponseEntity.ok(
                ApiResponse.<ExaminationResultDTO>builder()
                        .status(200)
                        .message("Cập nhật kết quả khám thành công")
                        .data(updated)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        examinationResultService.deleteExaminationResult(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .status(200)
                        .message("Xóa kết quả khám thành công")
                        .build()
        );
    }
}

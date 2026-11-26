package iuh.fit.backend.ai.controller;

import iuh.fit.backend.ai.service.XrayAiAnalysisService;
import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.repository.MedicalRecordRepository;
import iuh.fit.backend.patient.service.PatientRelationshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * API AI đọc phim X-quang nha khoa (Bước 2 - Khám lâm sàng & Chẩn đoán).
 */
@RestController
@RequestMapping("/api/v1/ai/xray")
@RequiredArgsConstructor
public class XrayAnalysisController {

    private final XrayAiAnalysisService xrayAiAnalysisService;
    private final PatientRelationshipService patientRelationshipService;
    private final MedicalRecordRepository medicalRecordRepository;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyze(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "medicalRecordId", required = false) UUID medicalRecordId,
            @RequestParam("examinationResultId") UUID examinationResultId,
            @RequestParam(value = "imageType", required = false) String imageType,
            @RequestParam(value = "patientAge", required = false) String patientAge,
            @RequestParam(value = "chiefComplaint", required = false) String chiefComplaint) {

        Map<String, Object> result = xrayAiAnalysisService.analyze(
                file, medicalRecordId, examinationResultId, imageType, patientAge, chiefComplaint);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .status(200)
                .message("AI đã phân tích phim X-quang thành công")
                .data(result)
                .build());
    }

    @PutMapping("/{analysisId}/review")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveReview(
            @PathVariable UUID analysisId,
            @RequestBody Map<String, Object> review) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .status(200)
                .message("Đã lưu kết quả đối soát X-quang của bác sĩ")
                .data(xrayAiAnalysisService.saveDoctorReview(analysisId, review))
                .build());
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> history(
            @RequestParam(value = "medicalRecordId", required = false) UUID medicalRecordId,
            @RequestParam(value = "examinationResultId", required = false) UUID examinationResultId) {

        if (medicalRecordId == null && examinationResultId == null) {
            throw new IllegalArgumentException("Cần truyền medicalRecordId hoặc examinationResultId");
        }
        return ResponseEntity.ok(ApiResponse.<List<Map<String, Object>>>builder()
                .status(200)
                .message("Lấy lịch sử phân tích X-quang thành công")
                .data(xrayAiAnalysisService.history(medicalRecordId, examinationResultId))
                .build());
    }

    @GetMapping("/patient-history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> patientHistory(@RequestParam UUID medicalRecordId) {
        var record = medicalRecordRepository.findById(medicalRecordId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        UUID patientId = record.getPatient() != null ? record.getPatient().getId() : null;
        boolean linked = patientId != null && patientRelationshipService.getMyProfiles().stream()
                .anyMatch(profile -> patientId.equals(profile.patientId()));
        if (!linked) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử X-quang của hồ sơ bệnh án thành công",
                xrayAiAnalysisService.history(medicalRecordId, null)));
    }
}

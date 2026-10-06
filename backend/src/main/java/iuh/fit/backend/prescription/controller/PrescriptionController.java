package iuh.fit.backend.prescription.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.prescription.dto.PrescriptionDTO;
import iuh.fit.backend.prescription.dto.PrescriptionRequestDTO;
import iuh.fit.backend.prescription.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getAllPrescriptions(
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) UUID examinationResultId,
            @RequestParam(required = false) String patientCode
    ) {
        List<PrescriptionDTO> list = prescriptionService.getAllPrescriptions(patientId, examinationResultId, patientCode);
        return ResponseEntity.ok(
                ApiResponse.<List<PrescriptionDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách đơn thuốc thành công")
                        .data(list)
                        .build()
        );  
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> getPrescriptionById(@PathVariable UUID id) {
        PrescriptionDTO dto = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(
                ApiResponse.<PrescriptionDTO>builder()
                        .status(200)
                        .message("Lấy chi tiết đơn thuốc thành công")
                        .data(dto)
                        .build()
        );
    }

    @GetMapping("/examination-result/{examinationResultId}")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getByExaminationResultId(
            @PathVariable UUID examinationResultId
    ) {
        List<PrescriptionDTO> list = prescriptionService.getPrescriptionsByExaminationResultId(examinationResultId);
        return ResponseEntity.ok(
                ApiResponse.<List<PrescriptionDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách đơn thuốc theo đợt khám thành công")
                        .data(list)
                        .build()
        );
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getByPatientId(
            @PathVariable UUID patientId
    ) {
        List<PrescriptionDTO> list = prescriptionService.getPrescriptionsByPatientId(patientId);
        return ResponseEntity.ok(
                ApiResponse.<List<PrescriptionDTO>>builder()
                        .status(200)
                        .message("Lấy lịch sử đơn thuốc của bệnh nhân thành công")
                        .data(list)
                        .build()
        );
    }

    @GetMapping("/patient-code/{patientCode}")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getByPatientCode(
            @PathVariable String patientCode
    ) {
        List<PrescriptionDTO> list = prescriptionService.getPrescriptionsByPatientCode(patientCode);
        return ResponseEntity.ok(
                ApiResponse.<List<PrescriptionDTO>>builder()
                        .status(200)
                        .message("Lấy lịch sử đơn thuốc của bệnh nhân thành công")
                        .data(list)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PrescriptionDTO>> createPrescription(
            @Valid @RequestBody PrescriptionRequestDTO request
    ) {
        PrescriptionDTO created = prescriptionService.createPrescription(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<PrescriptionDTO>builder()
                        .status(201)
                        .message("Tạo đơn thuốc thành công")
                        .data(created)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> updatePrescription(
            @PathVariable UUID id,
            @Valid @RequestBody PrescriptionRequestDTO request
    ) {
        PrescriptionDTO updated = prescriptionService.updatePrescription(id, request);
        return ResponseEntity.ok(
                ApiResponse.<PrescriptionDTO>builder()
                        .status(200)
                        .message("Cập nhật đơn thuốc thành công")
                        .data(updated)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePrescription(@PathVariable UUID id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .status(200)
                        .message("Xóa đơn thuốc thành công")
                        .build()
        );
    }
}

package iuh.fit.backend.medicalrecord.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.medicalrecord.dto.MedicalRecordDTO;
import iuh.fit.backend.medicalrecord.dto.MedicalRecordRequest;
import iuh.fit.backend.medicalrecord.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicalRecordDTO>>> getAll() {
        List<MedicalRecordDTO> list = medicalRecordService.getAllMedicalRecords();
        return ResponseEntity.ok(
                ApiResponse.<List<MedicalRecordDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách hồ sơ bệnh án thành công")
                        .data(list)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalRecordDTO>> getById(@PathVariable UUID id) {
        MedicalRecordDTO record = medicalRecordService.getMedicalRecordById(id);
        return ResponseEntity.ok(
                ApiResponse.<MedicalRecordDTO>builder()
                        .status(200)
                        .message("Lấy thông tin hồ sơ bệnh án thành công")
                        .data(record)
                        .build()
        );
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<MedicalRecordDTO>>> getByPatientId(@PathVariable UUID patientId) {
        List<MedicalRecordDTO> list = medicalRecordService.getMedicalRecordsByPatientId(patientId);
        return ResponseEntity.ok(
                ApiResponse.<List<MedicalRecordDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách hồ sơ bệnh án theo bệnh nhân thành công")
                        .data(list)
                        .build()
        );
    }

    @GetMapping("/patient-code/{patientCode}")
    public ResponseEntity<ApiResponse<List<MedicalRecordDTO>>> getByPatientCode(@PathVariable String patientCode) {
        List<MedicalRecordDTO> list = medicalRecordService.getMedicalRecordsByPatientCode(patientCode);
        return ResponseEntity.ok(
                ApiResponse.<List<MedicalRecordDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách hồ sơ bệnh án theo mã bệnh nhân thành công")
                        .data(list)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicalRecordDTO>> create(
            @Valid @RequestBody MedicalRecordRequest request) {
        MedicalRecordDTO created = medicalRecordService.createMedicalRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<MedicalRecordDTO>builder()
                        .status(201)
                        .message("Tạo hồ sơ bệnh án thành công")
                        .data(created)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalRecordDTO>> update(
            @PathVariable UUID id,
            @RequestBody MedicalRecordRequest request) {
        MedicalRecordDTO updated = medicalRecordService.updateMedicalRecord(id, request);
        return ResponseEntity.ok(
                ApiResponse.<MedicalRecordDTO>builder()
                        .status(200)
                        .message("Cập nhật hồ sơ bệnh án thành công")
                        .data(updated)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        medicalRecordService.deleteMedicalRecord(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .status(200)
                        .message("Xóa hồ sơ bệnh án thành công")
                        .build()
        );
    }
}

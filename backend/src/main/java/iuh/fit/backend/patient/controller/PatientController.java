package iuh.fit.backend.patient.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.billing.dto.PatientInvoiceDataResponse;
import iuh.fit.backend.patient.dto.PatientCreateDTO;
import iuh.fit.backend.patient.dto.PatientDTO;
import iuh.fit.backend.patient.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PatientDTO>>> getAllPatients() {
        List<PatientDTO> patients = patientService.getAllPatients();
        return ResponseEntity.ok(
                ApiResponse.<List<PatientDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách hồ sơ bệnh nhân thành công")
                        .data(patients)
                        .build()
        );
    }

    @GetMapping("/phone/{phoneNumber}")
    public ResponseEntity<ApiResponse<List<PatientDTO>>> getPatientsByPhoneNumber(@PathVariable String phoneNumber) {
        List<PatientDTO> patients = patientService.getPatientsByPhoneNumber(phoneNumber);
        return ResponseEntity.ok(
                ApiResponse.<List<PatientDTO>>builder()
                        .status(200)
                        .message("Lấy thông tin hồ sơ bệnh nhân theo số điện thoại thành công")
                        .data(patients)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientDTO>> getPatientById(@PathVariable UUID id) {
        PatientDTO patient = patientService.getPatientById(id);
        return ResponseEntity.ok(
                ApiResponse.<PatientDTO>builder()
                        .status(200)
                        .message("Lấy thông tin hồ sơ bệnh nhân thành công")
                        .data(patient)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PatientDTO>> createPatient(@RequestBody PatientCreateDTO dto) {
        PatientDTO created = patientService.createPatient(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<PatientDTO>builder()
                        .status(201)
                        .message("Tạo hồ sơ bệnh nhân mới thành công")
                        .data(created)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientDTO>> updatePatient(
            @PathVariable UUID id,
            @RequestBody PatientCreateDTO dto) {
        PatientDTO updated = patientService.updatePatient(id, dto);
        return ResponseEntity.ok(
                ApiResponse.<PatientDTO>builder()
                        .status(200)
                        .message("Cập nhật thông tin bệnh nhân thành công")
                        .data(updated)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable UUID id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .status(200)
                        .message("Xóa hồ sơ bệnh nhân thành công")
                        .build()
        );
    }

    @GetMapping("/patientCode/{patientCode}")
    public ResponseEntity<ApiResponse<PatientDTO>> getPatientById(@PathVariable String patientCode) {
        PatientDTO patient = patientService.getPatientByPatientCode(patientCode);
        return ResponseEntity.ok(
                ApiResponse.<PatientDTO>builder()
                        .status(200)
                        .message("Lấy thông tin hồ sơ bệnh nhân thành công")
                        .data(patient)
                        .build()
        );
    }

    @GetMapping("/raw-invoice-data/{patientCode}")
    public ResponseEntity<ApiResponse<PatientInvoiceDataResponse>> getRawInvoiceDataByPatientCode(@PathVariable String patientCode) {
        PatientInvoiceDataResponse data = patientService.getRawInvoiceDataByPatientCode(patientCode);
        return ResponseEntity.ok(
                ApiResponse.<PatientInvoiceDataResponse>builder()
                        .status(200)
                        .message("Lấy toàn bộ dữ liệu thô phục vụ lập hóa đơn theo mã bệnh nhân thành công")
                        .data(data)
                        .build()
        );
    }
}

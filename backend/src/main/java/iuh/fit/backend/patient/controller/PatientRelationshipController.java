package iuh.fit.backend.patient.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.patient.dto.*;
import iuh.fit.backend.patient.service.PatientRelationshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/patient-relationships")
@RequiredArgsConstructor
public class PatientRelationshipController {
    private final PatientRelationshipService service;

    @GetMapping("/me")
    public ApiResponse<List<PatientRelationshipProfileResponse>> getMyProfiles() {
        return ApiResponse.success("Lấy danh sách hồ sơ liên kết thành công", service.getMyProfiles());
    }

    @GetMapping("/patient/{patientId}")
    public ApiResponse<List<PatientRelationshipProfileResponse>> getProfilesByPatientId(
            @PathVariable UUID patientId) {
        return ApiResponse.success(
                "Lấy danh sách quan hệ của bệnh nhân thành công",
                service.getProfilesByPatientId(patientId)
        );
    }

    @GetMapping("/linked")
    public ApiResponse<List<PatientRelationshipResponse>> getAllActiveRelationships() {
        return ApiResponse.success(
                "Lấy danh sách hồ sơ đã liên kết thành công",
                service.getAllActiveRelationships()
        );
    }


    @DeleteMapping("/{relationshipId}")
    public ApiResponse<Void> deleteRelationship(@PathVariable UUID relationshipId) {
        service.deleteRelationship(relationshipId);
        return ApiResponse.success("Đã hủy liên kết hồ sơ", null);
    }

    // Resending uses the same endpoint and revalidates all submitted details.
    @PostMapping("/request-otp")
    public ApiResponse<PatientRelationshipCodeResponse> requestCode(
            @Valid @RequestBody PatientRelationshipRequest request) {
        return ApiResponse.success("Đã gửi OTP liên kết qua email hồ sơ chính chủ", service.requestCode(request));
    }

    @PostMapping("/verify")
    public ApiResponse<PatientRelationshipResponse> verify(
            @Valid @RequestBody PatientRelationshipVerifyRequest request) {
        return ApiResponse.success("Liên kết hồ sơ thành công", service.verify(request));
    }
}

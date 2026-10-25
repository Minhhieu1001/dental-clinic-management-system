package iuh.fit.backend.auth.controller;

import iuh.fit.backend.auth.dto.PatientActivationRequest;
import iuh.fit.backend.auth.dto.PatientActivationCodeResponse;
import iuh.fit.backend.auth.dto.PatientActivationResendRequest;
import iuh.fit.backend.auth.dto.PatientActivationVerifyRequest;
import iuh.fit.backend.auth.dto.PatientActivationVerifyResponse;
import iuh.fit.backend.auth.dto.PatientActivationCompleteRequest;
import iuh.fit.backend.auth.dto.RegistrationResponse;
import iuh.fit.backend.auth.service.PatientActivationService;
import iuh.fit.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/patient/activate")
@RequiredArgsConstructor
public class PatientActivationController {
    private final PatientActivationService service;

    @PostMapping
    public ApiResponse<PatientActivationCodeResponse> requestCode(@Valid @RequestBody PatientActivationRequest request) {
        return ApiResponse.success("Đã gửi OTP kích hoạt qua email", service.requestCode(request));
    }

    @PostMapping("/resend")
    public ApiResponse<PatientActivationCodeResponse> resend(@Valid @RequestBody PatientActivationResendRequest request) {
        return ApiResponse.success("Đã gửi lại OTP kích hoạt", service.resend(request.activationId()));
    }

    @PostMapping("/verify")
    public ApiResponse<PatientActivationVerifyResponse> verify(@Valid @RequestBody PatientActivationVerifyRequest request) {
        return ApiResponse.success("Xác thực thành công. Vui lòng đặt mật khẩu", service.verify(request));
    }

    @PostMapping("/complete")
    public ApiResponse<RegistrationResponse> complete(@Valid @RequestBody PatientActivationCompleteRequest request) {
        return ApiResponse.success("Kích hoạt tài khoản thành công", service.complete(request));
    }
}

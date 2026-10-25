package iuh.fit.backend.auth.controller;

import iuh.fit.backend.auth.dto.CodeResponse;
import iuh.fit.backend.auth.dto.RegisterRequest;
import iuh.fit.backend.auth.dto.RegistrationResponse;
import iuh.fit.backend.auth.dto.ResendRequest;
import iuh.fit.backend.auth.dto.VerifyRequest;
import iuh.fit.backend.auth.service.PatientRegistrationService;
import iuh.fit.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/patient/register")
@RequiredArgsConstructor
public class PatientRegistrationController {
    private final PatientRegistrationService service;

    @PostMapping
    public ApiResponse<CodeResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Đã gửi OTP đăng ký qua email", service.register(request));
    }

    @PostMapping("/resend")
    public ApiResponse<CodeResponse> resend(@Valid @RequestBody ResendRequest request) {
        return ApiResponse.success("Đã gửi lại OTP", service.resend(request.email()));
    }

    @PostMapping("/verify")
    public ApiResponse<RegistrationResponse> verify(@Valid @RequestBody VerifyRequest request) {
        return ApiResponse.success("Đăng ký bệnh nhân thành công", service.verify(request));
    }
}

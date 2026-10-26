package iuh.fit.backend.auth.controller;

import iuh.fit.backend.auth.dto.PasswordResetDtos.*;
import iuh.fit.backend.auth.service.PasswordResetService;
import iuh.fit.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class PasswordResetController {
    private final PasswordResetService service;

    @PostMapping({"/forgot-password", "/forgot-password/resend"})
    public ApiResponse<CodeResponse> requestCode(@Valid @RequestBody EmailRequest request) {
        return ApiResponse.success("Đã gửi mã xác nhận đến email. Mã có hiệu lực 1 phút", service.requestCode(request.email()));
    }

    @PostMapping("/forgot-password/verify")
    public ApiResponse<VerifyResponse> verify(@Valid @RequestBody VerifyRequest request) {
        return ApiResponse.success("Xác nhận mã thành công", service.verify(request));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> reset(@Valid @RequestBody ResetRequest request) {
        service.resetPassword(request);
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }
}

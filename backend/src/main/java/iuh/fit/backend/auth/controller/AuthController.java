package iuh.fit.backend.auth.controller;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import iuh.fit.backend.auth.dto.AuthResponse;
import iuh.fit.backend.auth.dto.LoginRequest;
import iuh.fit.backend.auth.dto.PatientLoginRequest;
import iuh.fit.backend.auth.service.AuthService;
import iuh.fit.backend.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @RateLimiter(name = "loginLimiter")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", authResponse));
    }

    @RateLimiter(name = "loginLimiter")
    @PostMapping("/patient/login")
    public ResponseEntity<ApiResponse<AuthResponse>> patientLogin(
            @Valid @RequestBody PatientLoginRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.patientLogin(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập bệnh nhân thành công", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.refreshToken(request, response);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser() {
        AuthResponse authResponse = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(authResponse));
    }
}

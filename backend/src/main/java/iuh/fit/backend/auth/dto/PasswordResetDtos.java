package iuh.fit.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class PasswordResetDtos {
    private PasswordResetDtos() {}

    public record EmailRequest(
            @NotBlank @Email @Size(max = 255) String email) {}

    public record VerifyRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Pattern(regexp = "[0-9]{6}", message = "Mã xác nhận phải gồm 6 chữ số") String code) {}

    public record ResetRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(max = 128) String resetToken,
            @NotBlank @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự") String newPassword,
            @NotBlank String confirmPassword) {}

    public record CodeResponse(Instant expiresAt, long expiresInSeconds) {}
    public record VerifyResponse(String resetToken, Instant expiresAt) {}
}

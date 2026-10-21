package iuh.fit.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
        String currentPassword,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới")
        @Size(min = 8, max = 72, message = "Mật khẩu mới phải có từ 8 đến 72 ký tự")
        @Pattern(regexp = "(?s)(?=.*[a-zA-Z])(?=.*[0-9]).*",
                message = "Mật khẩu mới phải bao gồm chữ và số")
        String newPassword,

        @NotBlank(message = "Vui lòng xác nhận mật khẩu mới")
        String confirmPassword
) {
    @Override
    public String toString() {
        return "ChangePasswordRequest[REDACTED]";
    }
}

package iuh.fit.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record PatientLoginRequest(
        @NotBlank(message = "Mã bệnh nhân không được để trống")
        String patientCode,

        @NotBlank(message = "Số điện thoại không được để trống")
        String phone,

        @NotBlank(message = "Mật khẩu không được để trống")
        String password
) {
}

package iuh.fit.backend.auth.dto;

import iuh.fit.backend.patient.enums.Gender;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank
        @Size(max = 255)
        String fullName,

        @NotNull
        @PastOrPresent
        LocalDate dateOfBirth,

        @NotNull
        Gender gender,

        @NotBlank
        @Size(max = 1000)
        String address,

        @NotBlank
        @Size(max = 50)
        String branchId,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        @Pattern(regexp = "(?:0|\\+?84)[0-9]{9}")
        String phone,

        @NotBlank
        @Size(min = 6, max = 72)
        String password,

        @NotBlank
        String confirmPassword
) {}

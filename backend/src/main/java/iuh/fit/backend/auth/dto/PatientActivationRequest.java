package iuh.fit.backend.auth.dto;

import jakarta.validation.constraints.*;

public record PatientActivationRequest(
        @NotBlank @Size(max = 100) String patientCode,
        @NotBlank @Pattern(regexp = "(?:0|\\+?84)[0-9]{9}") String phone,
        @NotBlank @Email @Size(max = 255) String email
) {}

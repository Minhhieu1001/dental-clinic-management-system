package iuh.fit.backend.auth.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record PatientActivationCompleteRequest(
        @NotNull UUID activationId,
        @NotBlank @Size(max = 100) String activationToken,
        @NotBlank @Size(min = 6, max = 72) String password,
        @NotBlank String confirmPassword
) {}

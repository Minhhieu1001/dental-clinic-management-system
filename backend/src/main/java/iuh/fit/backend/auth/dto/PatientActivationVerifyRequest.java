package iuh.fit.backend.auth.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record PatientActivationVerifyRequest(
        @NotNull UUID activationId,
        @NotBlank @Pattern(regexp = "[0-9]{6}") String code
) {}

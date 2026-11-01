package iuh.fit.backend.patient.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record PatientRelationshipVerifyRequest(
        @NotNull UUID requestId,
        @NotBlank @Pattern(regexp = "[0-9]{6}") String code
) {}

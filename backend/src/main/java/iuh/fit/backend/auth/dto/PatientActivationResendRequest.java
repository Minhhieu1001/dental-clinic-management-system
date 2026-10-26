package iuh.fit.backend.auth.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PatientActivationResendRequest(@NotNull UUID activationId) {}

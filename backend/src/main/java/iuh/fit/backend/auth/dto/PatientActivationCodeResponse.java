package iuh.fit.backend.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientActivationCodeResponse(
        UUID activationId,
        Instant expiresAt,
        int resendAfterSeconds) {}

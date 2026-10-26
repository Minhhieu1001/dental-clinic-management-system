package iuh.fit.backend.auth.dto;

import java.time.Instant;

public record PatientActivationVerifyResponse(String fullName, String activationToken, Instant tokenExpiresAt) {}

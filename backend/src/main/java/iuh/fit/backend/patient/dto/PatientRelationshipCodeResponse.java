package iuh.fit.backend.patient.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientRelationshipCodeResponse(UUID requestId, Instant expiresAt, int resendAfterSeconds) {}

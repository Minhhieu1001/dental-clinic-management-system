package iuh.fit.backend.auth.dto;

import java.time.Instant;

public record CodeResponse(
        Instant expiresAt,
        int resendAfterSeconds
) {}

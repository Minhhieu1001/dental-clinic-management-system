package iuh.fit.backend.auth.dto;

import java.util.UUID;

public record AuthResponse(
        UUID id,
        String email,
        String username,
        String role,
        String avatarUrl
) {}

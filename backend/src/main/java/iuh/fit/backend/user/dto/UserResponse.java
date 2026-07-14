package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        String phone,
        String avatarUrl,
        Role role,
        StatusUser status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

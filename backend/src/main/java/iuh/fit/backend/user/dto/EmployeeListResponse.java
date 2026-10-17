package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.Position;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;

import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeListResponse(
        UUID id,
        UUID userId,
        String avatar,
        String name,
        String email,
        String phone,
        Role role,
        Position position,
        LocalDateTime createdAt,
        Boolean status,
        StatusUser statusUser,
        String gender,
        String address
) {
}

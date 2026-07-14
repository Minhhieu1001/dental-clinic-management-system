package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;

public record UserRequest(
        String username,
        String password,
        String email,
        String phone,
        String avatarUrl,
        Role role,
        StatusUser status
) {
}

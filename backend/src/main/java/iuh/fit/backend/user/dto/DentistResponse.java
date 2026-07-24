package iuh.fit.backend.user.dto;

import java.util.UUID;

public record DentistResponse(
        UUID id,
        UUID userId,
        String username,
        String email,
        Integer experienceYears,
        String education
) {
}

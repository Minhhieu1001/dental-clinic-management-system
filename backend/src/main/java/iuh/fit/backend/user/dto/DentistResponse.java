package iuh.fit.backend.user.dto;

import java.util.UUID;

public record DentistResponse(
        UUID id,
        UUID userId,
        String username,
        String fullName,
        String email,
        String avatarUrl,
        String licenseNumber,
        String specialization,
        Integer experienceYears,
        String qualification
) {
}

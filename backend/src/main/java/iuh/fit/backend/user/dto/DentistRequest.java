package iuh.fit.backend.user.dto;

import java.util.UUID;

public record DentistRequest(
        UUID userId,
        String licenseNumber,
        String specialization,
        Integer experienceYears,
        String qualification
) {
}

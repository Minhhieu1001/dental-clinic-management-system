package iuh.fit.backend.user.dto;

import java.util.UUID;

public record SpecializationDTO(
        UUID id,
        String name,
        String description
) {
}

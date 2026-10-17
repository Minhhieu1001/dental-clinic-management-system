package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.StatusUser;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DentistListResponse(
        UUID id,
        UUID userId,
        String avatar,
        String name,
        String email,
        String phone,
        String gender,
        String address,
        Integer experienceYears,
        LocalDate dateOfBirth,
        String qualification,
        String description,
        LocalDateTime createdAt,
        StatusUser statusUser,
        String shift,
        List<CertificateDTO> certificates
) {
}

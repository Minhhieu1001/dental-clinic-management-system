package iuh.fit.backend.user.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DentistRequest(
        UUID userId,
        UserRequest user,
        String gender,
        String address,
        String fullName,
        LocalDate dateOfBirth,
        List<CertificateCreateRequest> certificates,
        Integer experienceYears,
        String qualification,
        String description,
        String branchId
) {
}

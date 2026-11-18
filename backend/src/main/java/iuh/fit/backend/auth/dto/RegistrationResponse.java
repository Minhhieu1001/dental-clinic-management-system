package iuh.fit.backend.auth.dto;

import java.util.UUID;

public record RegistrationResponse(
        UUID userId,
        UUID patientId,
        String patientCode,
        String createdBranchId,
        String createdBranchName
) {}

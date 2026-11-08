package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.CertificateType;

import java.time.LocalDateTime;
import java.util.UUID;

public record CertificateDTO(
        UUID id,
        String certificateName,
        String certificateNumber,
        String issuedBy,
        LocalDateTime issueDate,
        LocalDateTime expiryDate,
        String certificateFileUrl,
        CertificateType certificateType,
        String scopeOfPractice,
        String identityCardNumber,
        String practicingDoctorName,
        String qualification,
        Boolean isLifetime
) {
}

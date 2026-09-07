package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.CertificateType;

import java.time.LocalDateTime;

public record CertificateCreateRequest(
        String certificateName,
        String certificateNumber,
        String issuedBy,
        LocalDateTime issueDate,
        LocalDateTime expiryDate,
        String certificateFileUrl,
        CertificateType certificateType
) {
}

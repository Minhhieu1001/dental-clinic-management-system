package iuh.fit.backend.user.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CertificateDTO(
        UUID id,
        String certificateName,
        String certificateNumber,
        String issuedBy,
        LocalDateTime issueDate,
        LocalDateTime expiryDate,
        String certificateFileUrl
) {
}

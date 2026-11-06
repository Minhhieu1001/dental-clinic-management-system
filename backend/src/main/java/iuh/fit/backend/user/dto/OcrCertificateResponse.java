package iuh.fit.backend.user.dto;

public record OcrCertificateResponse(
        boolean success,
        String engine,
        String certificateNumber,
        String practicingDoctorName,
        String issuedBy,
        String issueDate,
        String expiryDate,
        boolean isLifetime,
        String qualification,
        String scopeOfPractice,
        String identityCardNumber,
        String rawText,
        String message
) {}

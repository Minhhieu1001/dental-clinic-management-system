package iuh.fit.backend.patient.dto;

import iuh.fit.backend.patient.enums.RelationshipType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PatientRelationshipProfileResponse(
        UUID patientId,
        UUID relationshipId,
        boolean isPrimary,
        String fullName,
        String patientCode,
        LocalDate dateOfBirth,
        String phoneMasked,
        String cccdMasked,
        String sponsorPhoneMasked,
        RelationshipType relationshipType,
        LocalDateTime linkedAt,
        boolean status
) {}

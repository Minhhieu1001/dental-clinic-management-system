package iuh.fit.backend.patient.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import iuh.fit.backend.patient.enums.RelationshipType;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public record PatientRelationshipRequest(
        @NotNull @JsonAlias("patient_id") UUID patientId,
        @NotBlank @Pattern(regexp = "(?:0|\\+?84)[0-9]{9}") String patientPhone,
        @NotBlank @Size(max = 255) String relatedPatientCode,
        @NotBlank @Size(max = 255) String fullName,
        @NotNull @PastOrPresent LocalDate birthday,
        @NotBlank @Pattern(regexp = "(?:0|\\+?84)[0-9]{9}") String phoneRelatedPatient,
        @NotNull RelationshipType relationshipType
) {}

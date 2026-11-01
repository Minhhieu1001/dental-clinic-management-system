package iuh.fit.backend.patient.entity;

import iuh.fit.backend.patient.enums.RelationshipType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One current challenge per requesting account; never stores the plaintext OTP. */
@Entity
@Table(name = "patient_relationship_otps")
@Getter
@Setter
public class PatientRelationshipOtp {
    @Id
    private UUID userId;
    @Column(nullable = false, unique = true)
    private UUID requestId;
    @Column(nullable = false)
    private UUID patientId;
    @Column(nullable = false)
    private UUID relatedPatientId;
    private String patientPhone;
    private String email;
    private String relatedPatientCode;
    private String fullName;
    private LocalDate birthday;
    private String phoneRelatedPatient;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RelationshipType relationshipType;
    private String codeHash;
    private Instant expiresAt;
    private int failedAttempts;
}

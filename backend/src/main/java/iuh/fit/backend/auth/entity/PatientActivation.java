package iuh.fit.backend.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patient_activations")
@Getter
@Setter
public class PatientActivation {
    // One activation session per existing patient. Operations lock the patient row.
    @Id
    private UUID patientId;
    private String patientCode;
    private String phone;
    private String email;
    private String codeHash;
    private Instant codeExpiresAt;
    private int failedAttempts;
    private String tokenHash;
    private Instant tokenExpiresAt;
}

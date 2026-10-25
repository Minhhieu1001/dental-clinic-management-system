package iuh.fit.backend.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;
import iuh.fit.backend.patient.enums.Gender;

@Entity
@Table(name = "patient_registrations")
@Getter
@Setter
public class PatientRegistration {
    @Id
    @Column(length = 255)
    private String email;
    private String fullName;
    private LocalDate dateOfBirth;
    @Enumerated(EnumType.STRING)
    private Gender gender;
    @Column(length = 1000)
    private String address;
    private String phone;
    @Column(length = 50)
    private String branchId;
    private String passwordHash;
    private String codeHash;
    private Instant expiresAt;
    private int failedAttempts;
}

package iuh.fit.backend.patient.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patient_insurances")
public class PatientInsurance {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(length = 255)
    private String providerName;

    @Column(precision = 5, scale = 2)
    private BigDecimal coveragePercent;

    @Column(length = 255)
    private String policyNumber;

    private LocalDateTime expirationDate;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

package iuh.fit.backend.user.entity;

import iuh.fit.backend.user.enums.CertificateType;
import iuh.fit.backend.user.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "certificates")
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String certificateName;

    @Column(length = 100)
    private String certificateNumber;

    @Column(length = 255)
    private String issuedBy;

    private LocalDateTime issueDate;

    private LocalDateTime expiryDate;

    @Column(length = 500)
    private String certificateFileUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id", nullable = false)
    private Dentist dentist;

    @Enumerated(EnumType.STRING)
    private CertificateType certificateType;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
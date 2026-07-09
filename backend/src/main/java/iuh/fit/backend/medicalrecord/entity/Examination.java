package iuh.fit.backend.medicalrecord.entity;

import iuh.fit.backend.medicalrecord.enums.Level;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "examinations")
public class Examination {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @Column(length = 255)
    private String toothPosition;

    @Column(length = 255)
    private String conditionDescription;

    @Enumerated(EnumType.STRING)
    private Level severity;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

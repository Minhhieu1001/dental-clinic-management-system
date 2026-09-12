package iuh.fit.backend.medicalrecord.entity;

import iuh.fit.backend.medicalrecord.enums.Level;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "diagnoses")
public class Diagnosis {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 255)
    private String toothPosition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_result_id")
    private ExaminationResult examinationResult;

    @Column(columnDefinition = "TEXT")
    private String primaryDiagnosis;

    @Enumerated(EnumType.STRING)
    private Level level;

    @Column(columnDefinition = "TEXT")
    private String sourceOfInformation;

    @Column(columnDefinition = "TEXT")
    private String diagnosticNotes;
}

package iuh.fit.backend.medicalrecord.entity;

import iuh.fit.backend.medicalrecord.enums.CariesLocation;
import iuh.fit.backend.medicalrecord.enums.Level;
import iuh.fit.backend.medicalrecord.enums.ToothStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tooth_records")
public class Tooth_Record {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_result_id")
    private ExaminationResult examinationResult;

    @Column(length = 10)
    private String toothNumber;

    @Enumerated(EnumType.STRING)
    private ToothStatus toothStatus;

    @Enumerated(EnumType.STRING)
    private Level severity;

    private Boolean hasCaries;

    @Enumerated(EnumType.STRING)
    private CariesLocation cariesLocation;

    @Column(length = 255)
    private String painType;

    @Column(length = 255)
    private String cariesDepth;

    @Column(length = 255)
    private String gingivalCondition;
}

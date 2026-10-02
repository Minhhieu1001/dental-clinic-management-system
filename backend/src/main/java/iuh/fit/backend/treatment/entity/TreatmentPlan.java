package iuh.fit.backend.treatment.entity;

import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.entity.TreatmentHistorys;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.treatment.enums.StatusPhase;
import iuh.fit.backend.user.entity.Dentist;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "treatment_plans")
public class TreatmentPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_result_id", unique = true)
    private ExaminationResult examinationResult;

    @Column(length = 255)
    private String planName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 15, scale = 2)
    private BigDecimal estimatedCost;

    @Enumerated(EnumType.STRING)
    private StatusPhase status;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @Builder.Default
    @OneToMany(mappedBy = "treatmentPlan", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentPhase> treatmentPhases = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "treatmentPlan", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentHistorys> treatmentHistorys = new ArrayList<>();

    @OneToOne(mappedBy = "treatmentPlan", fetch = FetchType.LAZY)
    private Invoice invoice;
}

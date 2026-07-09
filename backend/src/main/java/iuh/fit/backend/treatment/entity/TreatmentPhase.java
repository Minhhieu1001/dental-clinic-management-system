package iuh.fit.backend.treatment.entity;

import iuh.fit.backend.treatment.enums.StatusPhase;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "treatment_phases")
public class TreatmentPhase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_plan_id")
    private TreatmentPlan treatmentPlan;

    @Column(length = 255)
    private String phaseName;

    @Column(length = 255)
    private String phaseOrder;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private StatusPhase status;

    @Builder.Default
    @OneToMany(mappedBy = "treatmentPhase", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentService> treatmentServices = new ArrayList<>();
}

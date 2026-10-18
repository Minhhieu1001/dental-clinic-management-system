package iuh.fit.backend.treatment.entity;

import iuh.fit.backend.treatment.enums.StatusPhase;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;


@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Setter
@Getter
@Table(name = "treatment_visits")
public class TreatmentVisits {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "visit_id")
    private UUID visitId;

    @Column(name = "visit_name", length = 255)
    private String visitName;

    @Column(name = "visit_order")
    private Integer visitOrder;

    @Column(name = "start_date")
    private String startDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusPhase status;

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    @Column(name = "assigned_dentist", length = 255)
    private String assignedDentist;

    @Column(name = "facility_name", length = 255)
    private String facilityName;

    @Column(name = "facility_address", length = 500)
    private String facilityAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_phase_id")
    private TreatmentPhase treatmentPhase;

}

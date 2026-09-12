package iuh.fit.backend.treatment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "treatment_services")
public class TreatmentService {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private Service service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_phase_id")
    private TreatmentPhase treatmentPhase;

    @Column(name = "tooth_number", length = 50)
    private String toothNumber;

    private Integer quantity;

    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;
}

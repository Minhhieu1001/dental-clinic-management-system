package iuh.fit.backend.treatment.entity;

import iuh.fit.backend.billing.entity.InvoiceDetail;
import iuh.fit.backend.promotion.entity.PromotionService;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "services")
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 255)
    private String serviceName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    @Builder.Default
    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentService> treatmentServices = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<InvoiceDetail> invoiceDetails = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<PromotionService> promotionServices = new ArrayList<>();
}

package iuh.fit.backend.prescription.entity;

import iuh.fit.backend.prescription.enums.MedicineStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
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
@Table(name = "medicines")
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 50, unique = true)
    private String code;

    @Column(length = 255)
    private String name;

    @Column(length = 255)
    private String unit;

    @Column(length = 255)
    private String manufacturer;

    private Integer stockQuantity;

    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "manufacture_date")
    private LocalDate manufactureDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "usage_instruction", columnDefinition = "TEXT")
    private String usageInstruction;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private MedicineStatus status = MedicineStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "medicine", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<PrescriptionDetail> prescriptionDetails = new ArrayList<>();
}

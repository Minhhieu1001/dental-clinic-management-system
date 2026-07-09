package iuh.fit.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

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
@Table(name = "supplies")
public class Supply {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(length = 255)
    private String suppliesName;

    @Column(length = 255)
    private String unit;

    private Integer stockQuantity;

    private Integer minStock;

    private LocalDateTime expiryDate;

    @Builder.Default
    @OneToMany(mappedBy = "supply", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<InventoryTransaction> inventoryTransactions = new ArrayList<>();
}

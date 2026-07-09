package iuh.fit.backend.user.entity;

import iuh.fit.backend.appointment.entity.Shift;
import iuh.fit.backend.user.enums.Position;
import iuh.fit.backend.inventory.entity.InventoryTransaction;
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
@Table(name = "employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private Position position;

    @Column(precision = 15, scale = 2)
    private BigDecimal salary;

    private LocalDateTime hireDate;

    private Boolean status;

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Shift> shifts = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<InventoryTransaction> inventoryTransactions = new ArrayList<>();
}

package iuh.fit.backend.shift.entity;

import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.shift.enums.ShiftClosingStatus;
import iuh.fit.backend.shift.enums.ShiftType;
import iuh.fit.backend.user.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "shift_closings")
public class ShiftClosing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "shift_code", length = 50, unique = true, nullable = false)
    private String shiftCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handover_employee_id")
    private Employee handoverEmployee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", length = 50, nullable = false)
    private ShiftType shiftType;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "initial_cash", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal initialCash = BigDecimal.ZERO;

    @Column(name = "cash_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cashRevenue = BigDecimal.ZERO;

    @Column(name = "bank_transfer_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bankTransferRevenue = BigDecimal.ZERO;

    @Column(name = "card_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cardRevenue = BigDecimal.ZERO;

    @Column(name = "e_wallet_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal eWalletRevenue = BigDecimal.ZERO;

    @Column(name = "total_system_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalSystemRevenue = BigDecimal.ZERO;

    @Column(name = "total_cash_expected", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCashExpected = BigDecimal.ZERO;

    @Column(name = "total_cash_actual", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCashActual = BigDecimal.ZERO;

    @Column(name = "difference_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal differenceAmount = BigDecimal.ZERO;

    @Column(name = "difference_reason", columnDefinition = "TEXT")
    private String differenceReason;

    @Column(name = "total_transactions")
    @Builder.Default
    private Integer totalTransactions = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private ShiftClosingStatus status = ShiftClosingStatus.CLOSED;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "denominations_json", columnDefinition = "TEXT")
    private String denominationsJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

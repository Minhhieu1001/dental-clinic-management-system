package iuh.fit.backend.user.entity;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.AppointmentRequest;
import iuh.fit.backend.appointment.entity.Shift;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.entity.PaymentTransactions;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.user.enums.Position;
import iuh.fit.backend.inventory.entity.InventoryTransaction;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
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

    private String employeeCode;

    private LocalDate dateOfBirth;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 500)
    private String fullName;

    @Enumerated(EnumType.STRING)
    private Position position;

    @Column(precision = 15, scale = 2)
    private BigDecimal salary;

    private LocalDateTime hireDate;

    private Boolean status;

    @Column(length = 50)
    private String gender;

    @Column(length = 500)
    private String address;

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Shift> shifts = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<InventoryTransaction> inventoryTransactions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<AppointmentRequest> appointmentsRequests = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Appointment> appointments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    private List<Invoice> invoices = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    private List<PaymentTransactions> paymentTransactions = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;
}

package iuh.fit.backend.billing.entity;

import iuh.fit.backend.billing.enums.PaymentMethod;
import iuh.fit.backend.billing.enums.TransactionStatus;
import iuh.fit.backend.prescription.entity.Prescription;
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
@Table(name = "payment_transactions")
public class PaymentTransactions {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "prescription_id")
//    private Prescription prescription;

    @Column(name = "payment_transactions_name", length = 255)
    private String paymentTransactionsName;

    @Column(name = "service_amount", precision = 15, scale = 2)
    private BigDecimal serviceAmount;

    @Column(name = "medicine_amount", precision = 15, scale = 2)
    private BigDecimal medicineAmount;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 50)
    private PaymentMethod paymentMethod;

    @Column(name = "transaction_code", length = 255)
    private String transactionCode;

    @Column(name = "payment_time")
    private LocalDateTime paymentTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TransactionStatus status;

    @Column(columnDefinition = "TEXT")
    private String note;

    // truong nay default la "" ve sau xu ly
    @Column(columnDefinition = "TEXT")
    private String PrescriptionId;



}

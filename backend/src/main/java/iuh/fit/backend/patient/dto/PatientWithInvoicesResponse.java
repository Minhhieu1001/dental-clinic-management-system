package iuh.fit.backend.patient.dto;

import iuh.fit.backend.billing.enums.PaymentStatus;
import iuh.fit.backend.customercare.enums.ContactChannel;
import iuh.fit.backend.patient.enums.Gender;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class PatientWithInvoicesResponse {
    private UUID id;
    private String patientCode;
    private String createdBranchId;
    private String createdBranchName;
    private String fullName;
    private String phone;
    private String email;
    private Gender gender;
    private LocalDateTime dateOfBirth;
    private String address;
    private LocalDateTime createdAt;
    private CareStrategySummary latestCare;
    private List<InvoiceSummary> invoices;

    @Getter
    @Builder
    public static class CareStrategySummary {
        private UUID careTaskId;
        private String careCategory;
        private String careContent;
        private ContactChannel contactChannel;
        private String status;
        private LocalDateTime createAt;
        private UUID employeeId;
        private String employeeName;
    }

    @Getter
    @Builder
    public static class InvoiceSummary {
        private UUID id;
        private String invoiceCode;
        private LocalDateTime invoiceDate;
        private Boolean isSave;
        private BigDecimal totalAmount;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
        private BigDecimal paidAmount;
        private BigDecimal remainingAmount;
        private LocalDate nextPaymentDate;
        private PaymentStatus paymentStatus;
    }
}

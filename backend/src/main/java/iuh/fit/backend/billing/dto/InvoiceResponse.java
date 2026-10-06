package iuh.fit.backend.billing.dto;

import iuh.fit.backend.billing.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private UUID id;
    private String invoiceCode;
    private LocalDateTime invoiceDate;
    private Boolean isSave;
    
    // Patient Info
    private UUID patientId;
    private UUID treatmentPlanId;
    private String patientName;
    private String patientPhone;
    private String patientCccd;
    private String patientCode;
    
    // Employee Info
    private UUID employeeId;
    private String employeeName;
    
    // Promotion / Voucher Info
    private UUID promotionId;
    private String couponCode;
    private String promotionTitle;

    // Amounts
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    
    private PaymentStatus paymentStatus;
    private LocalDateTime updateAt;
    
    private List<InvoiceDetailDTO> invoiceDetails;
    private List<PaymentTransactionDTO> paymentTransactions;
}

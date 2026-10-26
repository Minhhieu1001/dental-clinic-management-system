package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCareItemDTO {
    private UUID invoiceId;
    private String invoiceCode;
    private LocalDateTime invoiceDate;

    // Patient info
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private String email;
    private String customerGroup;

    // Financial columns requested by user: finalAmount, paidAmount, remainingAmount
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;

    // Payment status
    private String paymentStatus;      // PAID, PARTIALLY_PAID, UNPAID, CANCELLED
    private String paymentStatusLabel; // Đã thanh toán, Thanh toán một phần (còn nợ), Chưa thanh toán, Đã hủy

    // CRM Care status & last care info
    private String careStatus;         // Chưa chăm sóc, Hoàn thành, Cần chăm sóc lại, Hẹn thanh toán...
    private String careChannel;        // Gọi điện, Zalo / SMS, Email, Trực tiếp...
    private LocalDateTime careTime;
    private String careNotes;
    private String outcome;
    private LocalDateTime nextCareDate;
    private String assignedEmployeeName;
    private UUID lastCareId;

    // Auto suggested template for fast care action
    private String suggestedTemplate;
}

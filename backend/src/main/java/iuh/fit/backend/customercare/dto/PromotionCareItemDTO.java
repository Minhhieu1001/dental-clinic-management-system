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
public class PromotionCareItemDTO {
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private String email;
    private String customerGroup;
    private LocalDateTime lastVisitDate;
    private BigDecimal totalSpent;
    private String preferredDoctor;

    // Promotion campaign info
    private UUID promotionId;
    private String promotionTitle;
    private String couponCode;
    private String category;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private String discountType;       // "PERCENTAGE" or "FIXED_AMOUNT"
    private BigDecimal discountValue;  // Unified numeric value for UI convenience
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String promotionStatus;

    // CRM care tracking
    private String careStatus;
    private String careChannel;
    private LocalDateTime careTime;
    private LocalDateTime lastCareTime; // Alias for careTime
    private String careNotes;
    private String assignedEmployeeName;
    private String lastCareStaff;       // Alias for assignedEmployeeName
    private UUID lastCareId;

    // Suggested template
    private String suggestedTemplate;
    private String suggestedMessage;    // Alias for suggestedTemplate
}

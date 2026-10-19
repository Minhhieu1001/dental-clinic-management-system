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
public class PromotionCampaignDTO {
    private UUID id;
    private String title;
    private String couponCode;
    private String category;
    private String description;
    private String imageUrl;
    private String promotionType;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer usageLimit;
    private Integer usedCount;
    private String status;
    private String targetAudience;
    private long totalTargetPatients;
    private long sentCount;
    private long interestedCount;
    private long bookedCount;
}

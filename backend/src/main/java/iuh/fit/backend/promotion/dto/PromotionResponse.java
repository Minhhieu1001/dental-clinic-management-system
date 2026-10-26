package iuh.fit.backend.promotion.dto;

import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PromotionResponse(
        UUID id,
        String title,
        String couponCode,
        String category,
        String description,
        String imageUrl,
        PromotionType promotionType,
        BigDecimal discountPercent,
        BigDecimal discountAmount,
        BigDecimal maxDiscountAmount,
        BigDecimal minOrderAmount,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Integer usageLimit,
        Integer usedCount,
        PromotionStatus status,
        Boolean applyAllServices,
        Boolean isValid,
        Boolean isExpiringSoon,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<PromotionServiceResponse> services) {

    public record PromotionServiceResponse(UUID id, String serviceName, BigDecimal price) {
    }
}

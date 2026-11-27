package iuh.fit.backend.promotion.dto;

import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PromotionRequest(
        @NotBlank(message = "Tên chương trình ưu đãi không được để trống")
        String title,

        String couponCode,
        String category,
        String description,
        String imageUrl,
        PromotionType promotionType,

        @DecimalMin(value = "0.0", message = "Phần trăm giảm không được âm")
        @DecimalMax(value = "100.0", message = "Phần trăm giảm tối đa là 100%")
        BigDecimal discountPercent,

        @DecimalMin(value = "0.0", message = "Số tiền giảm không được âm")
        BigDecimal discountAmount,

        @DecimalMin(value = "0.0", message = "Mức giảm tối đa không được âm")
        BigDecimal maxDiscountAmount,

        @DecimalMin(value = "0.0", message = "Giá trị đơn hàng tối thiểu không được âm")
        BigDecimal minOrderAmount,

        @Min(value = 0, message = "Giới hạn số lượt dùng không được âm")
        Integer usageLimit,
        PromotionStatus status,
        Boolean applyAllServices,

        @NotNull(message = "Ngày bắt đầu không được để trống")
        LocalDateTime startDate,

        @NotNull(message = "Ngày kết thúc không được để trống")
        LocalDateTime endDate,

        List<UUID> serviceIds) {
}

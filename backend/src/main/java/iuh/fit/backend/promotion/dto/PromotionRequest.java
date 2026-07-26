package iuh.fit.backend.promotion.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PromotionRequest(
        @NotBlank String title,
        String category,
        String description,
        String imageUrl,
        @NotNull @DecimalMin("0.01") @DecimalMax("100") BigDecimal discountPercent,
        @NotNull LocalDateTime startDate,
        @NotNull LocalDateTime endDate,
        List<UUID> serviceIds) {
}

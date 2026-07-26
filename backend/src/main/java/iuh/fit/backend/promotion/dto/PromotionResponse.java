package iuh.fit.backend.promotion.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PromotionResponse(
        UUID id,
        String title,
        String category,
        String description,
        String imageUrl,
        BigDecimal discountPercent,
        LocalDateTime startDate,
        LocalDateTime endDate,
        List<PromotionServiceResponse> services) {

    public record PromotionServiceResponse(UUID id, String serviceName, BigDecimal price) {
    }
}

package iuh.fit.backend.promotion.service.impl;

import iuh.fit.backend.promotion.dto.PromotionResponse;
import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.promotion.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {
    private final PromotionRepository promotionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getAvailableVouchers() {
        return promotionRepository.findAvailablePromotions(
                        PromotionType.VOUCHER,
                        PromotionStatus.ACTIVE,
                        LocalDateTime.now()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PromotionResponse> getAvailableVoucherByCouponCode(String couponCode) {
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return Optional.empty();
        }

        return promotionRepository.findAvailableVoucherByCouponCode(
                        couponCode.trim(),
                        PromotionType.VOUCHER,
                        PromotionStatus.ACTIVE,
                        LocalDateTime.now()
                )
                .map(this::toResponse);
    }

    private PromotionResponse toResponse(Promotion promotion) {
        return new PromotionResponse(
                promotion.getId(),
                promotion.getTitle(),
                promotion.getCouponCode(),
                promotion.getCategory(),
                promotion.getDescription(),
                promotion.getImageUrl(),
                promotion.getPromotionType(),
                promotion.getDiscountPercent(),
                promotion.getDiscountAmount(),
                promotion.getMaxDiscountAmount(),
                promotion.getMinOrderAmount(),
                promotion.getStartDate(),
                promotion.getEndDate(),
                promotion.getUsageLimit(),
                promotion.getUsedCount(),
                promotion.getStatus(),
                promotion.getApplyAllServices(),
                promotion.isValid(),
                promotion.isExpiringSoon(7),
                promotion.getCreatedAt(),
                promotion.getUpdatedAt(),
                promotion.getPromotionServices().stream()
                        .map(item -> new PromotionResponse.PromotionServiceResponse(
                                item.getService().getId(),
                                item.getService().getServiceName(),
                                item.getService().getPrice()))
                        .toList());
    }
}

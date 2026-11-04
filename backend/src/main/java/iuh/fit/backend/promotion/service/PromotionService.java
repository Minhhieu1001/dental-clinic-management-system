package iuh.fit.backend.promotion.service;

import iuh.fit.backend.promotion.dto.PromotionResponse;
import iuh.fit.backend.promotion.dto.PromotionRequest;
import java.util.UUID;

import java.util.List;
import java.util.Optional;

public interface PromotionService {
    List<PromotionResponse> getPublicPromotions();
    List<PromotionResponse> getTodayPromotions();
    List<PromotionResponse> getAdminPromotions();
    PromotionResponse getPublicPromotion(UUID id);
    PromotionResponse createPromotion(PromotionRequest request);
    PromotionResponse updatePromotion(UUID id, PromotionRequest request);
    void deletePromotion(UUID id);
    PromotionResponse extendPromotion(UUID id, int days);
    List<PromotionResponse> getAvailableVouchers();

    Optional<PromotionResponse> getAvailableVoucherByCouponCode(String couponCode);
}

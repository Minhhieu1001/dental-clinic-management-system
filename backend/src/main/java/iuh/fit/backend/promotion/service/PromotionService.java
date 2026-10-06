package iuh.fit.backend.promotion.service;

import iuh.fit.backend.promotion.dto.PromotionResponse;

import java.util.List;
import java.util.Optional;

public interface PromotionService {
    List<PromotionResponse> getAvailableVouchers();

    Optional<PromotionResponse> getAvailableVoucherByCouponCode(String couponCode);
}

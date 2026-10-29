package iuh.fit.backend.promotion.controller;

import iuh.fit.backend.promotion.dto.PromotionRequest;
import iuh.fit.backend.promotion.dto.PromotionResponse;
import iuh.fit.backend.promotion.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PromotionController {
    private final PromotionService promotionQueryService;

    @GetMapping("/api/promotions")
    public List<PromotionResponse> getPublicPromotions() {
        return promotionQueryService.getPublicPromotions();
    }

    @GetMapping("/api/v1/promotions/vouchers")
    public List<PromotionResponse> getAvailableVouchers() {
        return promotionQueryService.getAvailableVouchers();
    }

    @GetMapping("/api/v1/promotions/vouchers/{couponCode}")
    public PromotionResponse getAvailableVoucherByCouponCode(@PathVariable String couponCode) {
        return promotionQueryService.getAvailableVoucherByCouponCode(couponCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy voucher hợp lệ với mã coupon: " + couponCode
                ));
    }

    @GetMapping("/api/promotions/{id}")
    public PromotionResponse getPublicPromotion(@PathVariable UUID id) {
        return promotionQueryService.getPublicPromotion(id);
    }

    @GetMapping("/api/v1/admin/promotions")
    public List<PromotionResponse> getAdminPromotions() {
        return promotionQueryService.getAdminPromotions();
    }

    @PostMapping("/api/v1/admin/promotions")
    @ResponseStatus(HttpStatus.CREATED)
    public PromotionResponse createPromotion(@Valid @RequestBody PromotionRequest request) {
        return promotionQueryService.createPromotion(request);
    }

    @PutMapping("/api/v1/admin/promotions/{id}")
    public PromotionResponse updatePromotion(@PathVariable UUID id, @Valid @RequestBody PromotionRequest request) {
        return promotionQueryService.updatePromotion(id, request);
    }

    @DeleteMapping("/api/v1/admin/promotions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePromotion(@PathVariable UUID id) {
        promotionQueryService.deletePromotion(id);
    }

    @PutMapping("/api/v1/admin/promotions/{id}/extend")
    public PromotionResponse extendPromotion(@PathVariable UUID id, @RequestParam(defaultValue = "30") int days) {
        return promotionQueryService.extendPromotion(id, days);
    }

}

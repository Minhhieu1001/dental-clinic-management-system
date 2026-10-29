package iuh.fit.backend.promotion.service.impl;

import iuh.fit.backend.promotion.dto.PromotionResponse;
import iuh.fit.backend.promotion.dto.PromotionRequest;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import java.util.HashSet;
import java.util.Comparator;
import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.promotion.service.PromotionService;
import lombok.RequiredArgsConstructor;
import iuh.fit.backend.treatment.entity.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {
    private final PromotionRepository promotionRepository;
    private final ServiceRepository serviceRepository;

    @Override
    @Transactional
    public PromotionResponse createPromotion(PromotionRequest request) {
        validateDates(request);
        var catalog = serviceRepository.findAllForPromotionUpdate();
        Promotion promotion = Promotion.builder().build();
        applyRequest(promotion, request, catalog);
        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
    public PromotionResponse updatePromotion(UUID id, PromotionRequest request) {
        validateDates(request);
        var catalog = serviceRepository.findAllForPromotionUpdate();
        Promotion promotion = findPromotion(id);
        applyRequest(promotion, request, catalog);
        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
    public void deletePromotion(UUID id) {
        var catalog = serviceRepository.findAllForPromotionUpdate();
        Promotion promotion = findPromotion(id);
        if (!promotion.getInvoices().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Khuyến mãi đã được sử dụng trong hóa đơn, không thể xóa.");
        }
        catalog.stream().filter(item -> belongsTo(item, promotion))
                .forEach(item -> item.setPromotion(null));
        promotion.getServices().clear();
        serviceRepository.flush();
        promotionRepository.delete(promotion);
    }

    @Override
    @Transactional
    public PromotionResponse extendPromotion(UUID id, int days) {
        if (days <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số ngày gia hạn phải lớn hơn 0");
        }
        Promotion promotion = findPromotion(id);
        promotion.extendEndDate(days);
        return toResponse(promotionRepository.save(promotion));
    }

    private List<Service> assignServices(
            Promotion promotion, List<UUID> serviceIds, boolean selectAll,
            List<Service> catalog) {
        var ids = new HashSet<>(serviceIds == null ? List.<UUID>of() : serviceIds);
        if (!selectAll && ids.contains(null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã dịch vụ không hợp lệ");
        }
        var selected = selectAll ? catalog
                : catalog.stream()
                        .filter(item -> ids.contains(item.getId())).toList();
        if (!selectAll && selected.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Có dịch vụ ưu đãi không tồn tại");
        }
        // Empty selection releases assignments; it must never mean all services.
        for (var item : selected) {
            if (item.getPromotion() != null && !belongsTo(item, promotion)) {
                Promotion owner = item.getPromotion();
                String code = owner.getCouponCode() != null ? owner.getCouponCode() : owner.getTitle();
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Dịch vụ '" + item.getServiceName() + "' đã được áp dụng mã khuyến mãi khác ('"
                                + code + "'). Vui lòng gỡ khỏi khuyến mãi cũ trước.");
            }
        }
        catalog.stream().filter(item -> belongsTo(item, promotion))
                .forEach(item -> item.setPromotion(null));
        promotion.getServices().clear();
        selected.forEach(item -> {
            item.setPromotion(promotion);
            promotion.getServices().add(item);
        });
        return selected;
    }

    private boolean belongsTo(Service item, Promotion promotion) {
        return item.getPromotion() != null && promotion.getId() != null
                && promotion.getId().equals(item.getPromotion().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getAvailableVouchers() {
        return promotionRepository.findAvailablePromotions(
                PromotionType.VOUCHER,
                PromotionStatus.ACTIVE,
                LocalDateTime.now())
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
                LocalDateTime.now())
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getPublicPromotions() {
        return promotionRepository.findAll().stream()
                .filter(promotion -> promotion.getEndDate() == null
                        || !promotion.getEndDate().isBefore(LocalDateTime.now()))
                .sorted(Comparator.comparing(Promotion::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getPublicPromotion(@PathVariable UUID id) {
        return toResponse(findPromotion(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getAdminPromotions() {
        return promotionRepository.findAll().stream()
                .sorted((first, second) -> {
                    if (first.getStartDate() != null && second.getStartDate() != null) {
                        return second.getStartDate().compareTo(first.getStartDate());
                    }
                    return 0;
                })
                .map(this::toResponse)
                .toList();
    }

    private Promotion findPromotion(UUID id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ưu đãi"));
    }

    private void applyRequest(Promotion promotion, PromotionRequest request, List<Service> catalog) {
        promotion.setTitle(request.title().trim());
        promotion.setCouponCode(request.couponCode() != null && !request.couponCode().isBlank()
                ? request.couponCode().trim().toUpperCase()
                : null);
        promotion.setDescription(request.description());
        promotion.setImageUrl(request.imageUrl());
        if (request.promotionType() != null) {
            promotion.setPromotionType(request.promotionType());
        }
        promotion.setDiscountPercent(request.discountPercent());
        promotion.setDiscountAmount(request.discountAmount());
        promotion.setMaxDiscountAmount(request.maxDiscountAmount());
        promotion.setMinOrderAmount(request.minOrderAmount());
        promotion.setUsageLimit(request.usageLimit());
        if (request.status() != null) {
            promotion.setStatus(request.status());
        }
        promotion.setStartDate(request.startDate());
        promotion.setEndDate(request.endDate());

        boolean applyAll = Boolean.TRUE.equals(request.applyAllServices());
        var services = assignServices(promotion, request.serviceIds(), applyAll, catalog);
        promotion.setApplyAllServices(false);

        String cat = request.category() != null ? request.category().trim() : "";
        if (cat.isEmpty() && !services.isEmpty() && services.get(0).getCategory() != null) {
            cat = mapEnumCategoryToDisplayName(services.get(0).getCategory());
        }
        promotion.setCategory(!cat.isEmpty() ? cat : (applyAll ? "Toàn bộ dịch vụ" : "Dịch vụ"));
    }

    private String mapEnumCategoryToDisplayName(iuh.fit.backend.treatment.enums.ServiceCategory serviceCat) {
        if (serviceCat == null)
            return "Dịch vụ";
        return switch (serviceCat) {
            case NIENG_RANG -> "Niềng răng";
            case RANG_SU -> "Răng sứ thẩm mỹ";
            case IMPLANT -> "Cấy ghép Implant";
            case TAY_TRANG -> "Tẩy trắng răng";
            case KHAM_DIEU_TRI -> "Khám & Điều trị";
            case NHA_KHOA_TRE_EM -> "Nha khoa trẻ em";
            default -> "Dịch vụ";
        };
    }

    private void validateDates(PromotionRequest request) {
        if (request.startDate() == null || request.endDate() == null
                || !request.endDate().isAfter(request.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc phải sau ngày bắt đầu");
        }
        boolean hasPercent = request.discountPercent() != null
                && request.discountPercent().compareTo(java.math.BigDecimal.ZERO) > 0;
        boolean hasAmount = request.discountAmount() != null
                && request.discountAmount().compareTo(java.math.BigDecimal.ZERO) > 0;
        if (!hasPercent && !hasAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ưu đãi phải có mức giảm giá theo phần trăm (%) hoặc số tiền (VNĐ)");
        }
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
                promotion.getServices().stream()
                        .map(item -> new PromotionResponse.PromotionServiceResponse(
                                item.getId(),
                                item.getServiceName(),
                                item.getPrice()))
                        .toList());
    }
}

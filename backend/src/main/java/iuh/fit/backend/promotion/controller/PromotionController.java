package iuh.fit.backend.promotion.controller;

import iuh.fit.backend.promotion.dto.PromotionRequest;
import iuh.fit.backend.promotion.dto.PromotionResponse;
import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.entity.PromotionService;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.treatment.entity.Service;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PromotionController {
    private final PromotionRepository promotionRepository;
    private final ServiceRepository serviceRepository;

    @GetMapping("/api/promotions")
    @Transactional(readOnly = true)
    public List<PromotionResponse> getPublicPromotions() {
        return promotionRepository.findAll().stream()
                .filter(promotion -> promotion.getEndDate() == null || !promotion.getEndDate().isBefore(LocalDateTime.now()))
                .sorted((first, second) -> second.getStartDate().compareTo(first.getStartDate()))
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/api/promotions/{id}")
    @Transactional(readOnly = true)
    public PromotionResponse getPublicPromotion(@PathVariable UUID id) {
        return toResponse(findPromotion(id));
    }

    @GetMapping("/api/v1/admin/promotions")
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

    @PostMapping("/api/v1/admin/promotions")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PromotionResponse createPromotion(@Valid @RequestBody PromotionRequest request) {
        validateDates(request);
        Promotion promotion = Promotion.builder().build();
        applyRequest(promotion, request);
        return toResponse(promotionRepository.save(promotion));
    }

    @PutMapping("/api/v1/admin/promotions/{id}")
    @Transactional
    public PromotionResponse updatePromotion(@PathVariable UUID id, @Valid @RequestBody PromotionRequest request) {
        validateDates(request);
        Promotion promotion = findPromotion(id);
        applyRequest(promotion, request);
        return toResponse(promotionRepository.save(promotion));
    }

    @DeleteMapping("/api/v1/admin/promotions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deletePromotion(@PathVariable UUID id) {
        promotionRepository.delete(findPromotion(id));
    }

    private Promotion findPromotion(UUID id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ưu đãi"));
    }

    private void applyRequest(Promotion promotion, PromotionRequest request) {
        promotion.setTitle(request.title().trim());
        promotion.setDescription(request.description());
        promotion.setImageUrl(request.imageUrl());
        promotion.setDiscountPercent(request.discountPercent());
        promotion.setStartDate(request.startDate());
        promotion.setEndDate(request.endDate());
        promotion.getPromotionServices().clear();

        List<Service> services = List.of();
        if (request.serviceIds() != null && !request.serviceIds().isEmpty()) {
            services = serviceRepository.findAllById(request.serviceIds());
            if (services.size() != request.serviceIds().stream().distinct().count()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Có dịch vụ ưu đãi không tồn tại");
            }
            services.forEach(service -> promotion.getPromotionServices().add(PromotionService.builder()
                    .promotion(promotion).service(service).build()));
        }

        String cat = request.category() != null ? request.category().trim() : "";
        if (cat.isEmpty() && !services.isEmpty() && services.get(0).getCategory() != null) {
            cat = mapEnumCategoryToDisplayName(services.get(0).getCategory());
        }
        promotion.setCategory(!cat.isEmpty() ? cat : "Dịch vụ");
    }

    private String mapEnumCategoryToDisplayName(iuh.fit.backend.treatment.enums.ServiceCategory serviceCat) {
        if (serviceCat == null) return "Dịch vụ";
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
        if (request.endDate().isBefore(request.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc phải sau ngày bắt đầu");
        }
    }

    private PromotionResponse toResponse(Promotion promotion) {
        return new PromotionResponse(
                promotion.getId(), promotion.getTitle(), promotion.getCategory(), promotion.getDescription(), promotion.getImageUrl(), promotion.getDiscountPercent(),
                promotion.getStartDate(), promotion.getEndDate(), promotion.getPromotionServices().stream()
                        .map(item -> new PromotionResponse.PromotionServiceResponse(item.getService().getId(),
                                item.getService().getServiceName(), item.getService().getPrice()))
                        .toList());
    }
}

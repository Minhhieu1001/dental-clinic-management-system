package iuh.fit.backend.treatment;

import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.treatment.entity.Service;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import iuh.fit.backend.treatment.service.impl.DentalServiceImpl;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DentalServicePromotionPriceTest {
    private final ServiceRepository repository = mock(ServiceRepository.class);
    private final DentalServiceImpl subject = new DentalServiceImpl(repository);

    private Service service(Promotion promotion) {
        return Service.builder().id(UUID.randomUUID()).serviceCode("DV001")
                .price(new BigDecimal("500000")).promotion(promotion).build();
    }

    private Promotion promotion() {
        return Promotion.builder().status(PromotionStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .discountPercent(new BigDecimal("20")).usageLimit(0).build();
    }

    @Test
    void listReturnsDiscountWithoutChangingStoredPrice() {
        Service item = service(promotion());
        when(repository.findAllWithPromotion()).thenReturn(List.of(item));

        var dto = subject.getAllServices(null, null, null, null).getFirst();

        assertTrue(dto.isHasPromotion());
        assertEquals(0, new BigDecimal("100000").compareTo(dto.getDiscountAmount()));
        assertEquals(0, new BigDecimal("400000").compareTo(dto.getDiscountedPrice()));
        assertEquals(new BigDecimal("500000"), item.getPrice());
        verify(repository, never()).save(any());
    }

    @Test
    void detailRespectsMaximumDiscountAndFixedAmountCannotExceedPrice() {
        Promotion promotion = promotion();
        promotion.setMaxDiscountAmount(new BigDecimal("50000"));
        Service item = service(promotion);
        when(repository.findById(item.getId())).thenReturn(Optional.of(item));
        assertEquals(0, new BigDecimal("450000").compareTo(
                subject.getServiceById(item.getId()).getDiscountedPrice()));

        promotion.setDiscountPercent(null);
        promotion.setDiscountAmount(new BigDecimal("600000"));
        assertEquals(0, BigDecimal.ZERO.compareTo(
                subject.getServiceById(item.getId()).getDiscountedPrice()));
    }

    @Test
    void unavailablePromotionsKeepOriginalPrice() {
        Promotion expired = promotion();
        expired.setEndDate(LocalDateTime.now().minusHours(1));
        Promotion future = promotion();
        future.setStartDate(LocalDateTime.now().plusHours(1));
        Promotion inactive = promotion();
        inactive.setStatus(PromotionStatus.INACTIVE);
        Promotion exhausted = promotion();
        exhausted.setUsageLimit(1);
        exhausted.setUsedCount(1);
        Promotion minimumNotMet = promotion();
        minimumNotMet.setMinOrderAmount(new BigDecimal("1000000"));

        for (Promotion promotion : List.of(expired, future, inactive, exhausted, minimumNotMet)) {
            Service item = service(promotion);
            when(repository.findById(item.getId())).thenReturn(Optional.of(item));
            var dto = subject.getServiceById(item.getId());
            assertTrue(dto.isHasPromotion());
            assertEquals(0, BigDecimal.ZERO.compareTo(dto.getDiscountAmount()));
            assertEquals(dto.getPrice(), dto.getDiscountedPrice());
        }
    }

    @Test
    void missingPromotionOrPriceIsHandled() {
        Service item = service(null);
        when(repository.findById(item.getId())).thenReturn(Optional.of(item));
        var dto = subject.getServiceById(item.getId());
        assertFalse(dto.isHasPromotion());
        assertEquals(dto.getPrice(), dto.getDiscountedPrice());

        item.setPrice(null);
        item.setPromotion(promotion());
        dto = subject.getServiceById(item.getId());
        assertNull(dto.getDiscountedPrice());
        assertEquals(0, BigDecimal.ZERO.compareTo(dto.getDiscountAmount()));
    }
}

package iuh.fit.backend.promotion;

import iuh.fit.backend.promotion.dto.PromotionRequest;
import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.promotion.service.impl.PromotionServiceImpl;
import iuh.fit.backend.treatment.entity.Service;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PromotionServiceAssignmentTest {
    private final PromotionRepository promotions = mock(PromotionRepository.class);
    private final ServiceRepository services = mock(ServiceRepository.class);
    private final PromotionServiceImpl subject = new PromotionServiceImpl(promotions, services);

    @BeforeEach
    void setUp() {
        when(promotions.save(any(Promotion.class))).thenAnswer(call -> {
            Promotion promotion = call.getArgument(0);
            if (promotion.getId() == null) promotion.setId(UUID.randomUUID());
            return promotion;
        });
    }

    private PromotionRequest request(List<UUID> ids, boolean all) {
        return new PromotionRequest("New promotion", "NEW10", null, null, null,
                PromotionType.VOUCHER, BigDecimal.TEN, null, null, null, null,
                PromotionStatus.ACTIVE, all, LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(10), ids);
    }

    private Service item(String name, Promotion owner) {
        return Service.builder().id(UUID.randomUUID()).serviceName(name)
                .price(BigDecimal.valueOf(100)).promotion(owner).build();
    }

    private Promotion existing() {
        Promotion owner = Promotion.builder().id(UUID.randomUUID()).couponCode("OLD10")
                .title("Old promotion").build();
        when(promotions.findById(owner.getId())).thenReturn(Optional.of(owner));
        return owner;
    }

    @Test
    void onePromotionCanOwnMultipleServicesAndDuplicateIdsAreDeduplicated() {
        Service first = item("First", null), second = item("Second", null);
        when(services.findAllForPromotionUpdate()).thenReturn(List.of(first, second));
        var response = subject.createPromotion(request(List.of(first.getId(), second.getId(), first.getId()), false));
        assertEquals(2, response.services().size());
        assertEquals(response.id(), first.getPromotion().getId());
        assertSame(first.getPromotion(), second.getPromotion());
    }

    @Test
    void conflictingAssignmentReturns409WithoutChangingAnyService() {
        Promotion owner = existing();
        Service free = item("Free", null), taken = item("Whitening", owner);
        when(services.findAllForPromotionUpdate()).thenReturn(List.of(free, taken));
        var error = assertThrows(ResponseStatusException.class, () ->
                subject.createPromotion(request(List.of(free.getId(), taken.getId()), false)));
        assertEquals(409, error.getStatusCode().value());
        assertTrue(error.getReason().contains("OLD10"));
        assertTrue(error.getReason().contains("Whitening"));
        assertNull(free.getPromotion());
        assertSame(owner, taken.getPromotion());
        verify(promotions, never()).save(any());
    }

    @Test
    void updatingSamePromotionRetainsSelectedServiceAndReleasesRemovedOne() {
        Promotion owner = existing();
        Service first = item("First", owner), second = item("Second", owner);
        owner.getServices().addAll(List.of(first, second));
        when(services.findAllForPromotionUpdate()).thenReturn(List.of(first, second));
        subject.updatePromotion(owner.getId(), request(List.of(first.getId()), false));
        assertSame(owner, first.getPromotion());
        assertNull(second.getPromotion());
        assertEquals(List.of(first), owner.getServices());
    }

    @Test
    void selectAllCannotBypassConflictingAssignment() {
        Service taken = item("Whitening", existing());
        when(services.findAllForPromotionUpdate()).thenReturn(List.of(taken));
        assertEquals(409, assertThrows(ResponseStatusException.class, () ->
                subject.createPromotion(request(List.of(), true))).getStatusCode().value());
    }

    @Test
    void unknownServiceIsRejected() {
        when(services.findAllForPromotionUpdate()).thenReturn(List.of());
        assertEquals(400, assertThrows(ResponseStatusException.class, () ->
                subject.createPromotion(request(List.of(UUID.randomUUID()), false))).getStatusCode().value());
    }

    @Test
    void emptyUpdateReleasesServicesInsteadOfApplyingToEntireCatalog() {
        Promotion owner = existing();
        Service item = item("First", owner);
        owner.getServices().add(item);
        when(services.findAllForPromotionUpdate()).thenReturn(List.of(item));
        var response = subject.updatePromotion(owner.getId(), request(List.of(), false));
        assertNull(item.getPromotion());
        assertTrue(response.services().isEmpty());
        assertFalse(response.applyAllServices());
    }

    @Test
    void deletingPromotionReleasesButDoesNotDeleteServices() {
        Promotion owner = existing();
        Service item = item("First", owner);
        when(services.findAllForPromotionUpdate()).thenReturn(List.of(item));
        subject.deletePromotion(owner.getId());
        assertNull(item.getPromotion());
        verify(promotions).delete(owner);
        verify(services, never()).delete(any(Service.class));
    }
}

package iuh.fit.backend.treatment.controller;

import iuh.fit.backend.treatment.enums.ServiceCategory;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceRepository serviceRepository;

    public ServiceController(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @GetMapping
    public List<ServiceResponse> getAllServices() {
        return serviceRepository.findAll().stream()
                .sorted((s1, s2) -> {
                    int order1 = s1.getSortOrder() != null ? s1.getSortOrder() : 0;
                    int order2 = s2.getSortOrder() != null ? s2.getSortOrder() : 0;
                    return Integer.compare(order1, order2);
                })
                .map(service -> new ServiceResponse(
                        service.getId(),
                        service.getServiceName(),
                        service.getDescription(),
                        service.getPrice(),
                        service.getCategory(),
                        service.getSubCategory(),
                        service.getUnit(),
                        service.getImageUrl(),
                        service.getSortOrder(),
                        service.getIsFeatured()))
                .toList();
    }

    /**
     * A public-facing view of a service. Returning the entity directly exposes
     * bidirectional JPA relationships, which causes recursive JSON serialization.
     */
    public record ServiceResponse(
            UUID id,
            String serviceName,
            String description,
            java.math.BigDecimal price,
            ServiceCategory category,
            String subCategory,
            String unit,
            String imageUrl,
            Integer sortOrder,
            Boolean isFeatured) {
    }
}


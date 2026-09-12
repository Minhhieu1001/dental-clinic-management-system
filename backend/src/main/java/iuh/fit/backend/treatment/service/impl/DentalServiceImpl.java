package iuh.fit.backend.treatment.service.impl;

import iuh.fit.backend.treatment.dto.ServiceCreateDTO;
import iuh.fit.backend.treatment.dto.ServiceDTO;
import iuh.fit.backend.treatment.entity.Service;
import iuh.fit.backend.treatment.enums.ServiceCategory;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import iuh.fit.backend.treatment.service.DentalService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class DentalServiceImpl implements DentalService {

    private final ServiceRepository serviceRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<ServiceDTO> getAllServices(String search, ServiceCategory category, Boolean isActive, Boolean isFeatured) {
        List<Service> services = serviceRepository.findAllByOrderBySortOrderAscServiceNameAsc();

        boolean updatedAny = false;
        for (Service s : services) {
            if (s.getServiceCode() == null || s.getServiceCode().trim().isEmpty()) {
                s.setServiceCode(generateServiceCode(s.getCategory()));
                serviceRepository.save(s);
                updatedAny = true;
            }
        }
        if (updatedAny) {
            services = serviceRepository.findAllByOrderBySortOrderAscServiceNameAsc();
        }

        return services.stream()
                .filter(s -> category == null || s.getCategory() == category)
                .filter(s -> {
                    if (isActive == null) return true;
                    boolean active = s.getIsActive() != null ? s.getIsActive() : true;
                    return active == isActive;
                })
                .filter(s -> {
                    if (isFeatured == null) return true;
                    boolean featured = s.getIsFeatured() != null ? s.getIsFeatured() : false;
                    return featured == isFeatured;
                })
                .filter(s -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String kw = search.trim().toLowerCase();
                    boolean matchName = s.getServiceName() != null && s.getServiceName().toLowerCase().contains(kw);
                    boolean matchCode = s.getServiceCode() != null && s.getServiceCode().toLowerCase().contains(kw);
                    boolean matchSub = s.getSubCategory() != null && s.getSubCategory().toLowerCase().contains(kw);
                    return matchName || matchCode || matchSub;
                })
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ServiceDTO getServiceById(UUID id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ với ID: " + id));
        return mapToDTO(service);
    }

    @Override
    public ServiceDTO createService(ServiceCreateDTO dto) {
        String code = dto.getServiceCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateServiceCode(dto.getCategory());
        } else {
            code = code.trim().toUpperCase();
            if (serviceRepository.existsByServiceCode(code)) {
                throw new IllegalArgumentException("Mã dịch vụ '" + code + "' đã tồn tại trong hệ thống");
            }
        }

        Service service = Service.builder()
                .serviceCode(code)
                .serviceName(dto.getServiceName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .costPrice(dto.getCostPrice())
                .estimatedDuration(dto.getEstimatedDuration() != null ? dto.getEstimatedDuration() : 30)
                .sessionsCount(dto.getSessionsCount() != null ? dto.getSessionsCount() : "1 buổi")
                .category(dto.getCategory())
                .subCategory(dto.getSubCategory())
                .unit(dto.getUnit() != null ? dto.getUnit() : "Lần")
                .warrantyPeriod(dto.getWarrantyPeriod())
                .imageUrl(dto.getImageUrl())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .isFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        Service saved = serviceRepository.save(service);
        return mapToDTO(saved);
    }

    @Override
    public ServiceDTO updateService(UUID id, ServiceCreateDTO dto) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ với ID: " + id));

        if (dto.getServiceCode() != null && !dto.getServiceCode().trim().isEmpty()) {
            String newCode = dto.getServiceCode().trim().toUpperCase();
            if (!newCode.equalsIgnoreCase(service.getServiceCode()) && serviceRepository.existsByServiceCode(newCode)) {
                throw new IllegalArgumentException("Mã dịch vụ '" + newCode + "' đã được sử dụng bởi dịch vụ khác");
            }
            service.setServiceCode(newCode);
        }

        if (dto.getServiceName() != null) service.setServiceName(dto.getServiceName());
        if (dto.getDescription() != null) service.setDescription(dto.getDescription());
        if (dto.getPrice() != null) service.setPrice(dto.getPrice());
        if (dto.getCostPrice() != null) service.setCostPrice(dto.getCostPrice());
        if (dto.getEstimatedDuration() != null) service.setEstimatedDuration(dto.getEstimatedDuration());
        if (dto.getSessionsCount() != null) service.setSessionsCount(dto.getSessionsCount());
        if (dto.getCategory() != null) service.setCategory(dto.getCategory());
        if (dto.getSubCategory() != null) service.setSubCategory(dto.getSubCategory());
        if (dto.getUnit() != null) service.setUnit(dto.getUnit());
        if (dto.getWarrantyPeriod() != null) service.setWarrantyPeriod(dto.getWarrantyPeriod());
        if (dto.getImageUrl() != null) service.setImageUrl(dto.getImageUrl());
        if (dto.getSortOrder() != null) service.setSortOrder(dto.getSortOrder());
        if (dto.getIsFeatured() != null) service.setIsFeatured(dto.getIsFeatured());
        if (dto.getIsActive() != null) service.setIsActive(dto.getIsActive());

        Service updated = serviceRepository.save(service);
        return mapToDTO(updated);
    }

    @jakarta.annotation.PostConstruct
    @Transactional
    public void cleanupDefaultSampleServices() {
        try {
            entityManager.createNativeQuery(
                "DELETE FROM promotion_services WHERE service_id IN (SELECT id FROM services WHERE service_code LIKE 'DV-%' OR category IS NULL OR service_name IN ('Composite filling', 'General examination', 'Scaling and polishing', 'Teeth whitening', 'Root canal treatment'))"
            ).executeUpdate();
        } catch (Exception ignored) {}

        try {
            entityManager.createNativeQuery(
                "DELETE FROM treatment_services WHERE service_id IN (SELECT id FROM services WHERE service_code LIKE 'DV-%' OR category IS NULL OR service_name IN ('Composite filling', 'General examination', 'Scaling and polishing', 'Teeth whitening', 'Root canal treatment'))"
            ).executeUpdate();
        } catch (Exception ignored) {}

        try {
            entityManager.createNativeQuery(
                "DELETE FROM invoice_details WHERE service_id IN (SELECT id FROM services WHERE service_code LIKE 'DV-%' OR category IS NULL OR service_name IN ('Composite filling', 'General examination', 'Scaling and polishing', 'Teeth whitening', 'Root canal treatment'))"
            ).executeUpdate();
        } catch (Exception ignored) {}

        try {
            entityManager.createNativeQuery(
                "DELETE FROM services WHERE service_code LIKE 'DV-%' OR category IS NULL OR service_name IN ('Composite filling', 'General examination', 'Scaling and polishing', 'Teeth whitening', 'Root canal treatment')"
            ).executeUpdate();
        } catch (Exception ignored) {}
    }

    @Override
    @Transactional
    public void deleteService(UUID id) {
        if (!serviceRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy dịch vụ với ID: " + id);
        }

        try { serviceRepository.deletePromotionServicesByServiceId(id); } catch (Exception ignored) {}
        try { serviceRepository.deleteTreatmentServicesByServiceId(id); } catch (Exception ignored) {}
        try { serviceRepository.deleteInvoiceDetailsByServiceId(id); } catch (Exception ignored) {}

        serviceRepository.deleteServiceByIdNative(id);
    }

    @Override
    public ServiceDTO toggleActiveStatus(UUID id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ với ID: " + id));
        service.setIsActive(service.getIsActive() == null || !service.getIsActive());
        Service saved = serviceRepository.save(service);
        return mapToDTO(saved);
    }

    @Override
    public ServiceDTO toggleFeaturedStatus(UUID id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ với ID: " + id));
        service.setIsFeatured(service.getIsFeatured() == null || !service.getIsFeatured());
        Service saved = serviceRepository.save(service);
        return mapToDTO(saved);
    }

    private ServiceDTO mapToDTO(Service service) {
        return ServiceDTO.builder()
                .id(service.getId())
                .serviceCode(service.getServiceCode())
                .serviceName(service.getServiceName())
                .description(service.getDescription())
                .price(service.getPrice())
                .costPrice(service.getCostPrice())
                .estimatedDuration(service.getEstimatedDuration() != null ? service.getEstimatedDuration() : 30)
                .sessionsCount(service.getSessionsCount() != null ? service.getSessionsCount() : "1 buổi")
                .category(service.getCategory())
                .subCategory(service.getSubCategory())
                .unit(service.getUnit() != null ? service.getUnit() : "Lần")
                .warrantyPeriod(service.getWarrantyPeriod())
                .imageUrl(service.getImageUrl())
                .sortOrder(service.getSortOrder() != null ? service.getSortOrder() : 0)
                .isFeatured(service.getIsFeatured() != null ? service.getIsFeatured() : false)
                .isActive(service.getIsActive() != null ? service.getIsActive() : true)
                .build();
    }

    private String generateServiceCode(ServiceCategory category) {
        String prefix = "DV";
        if (category != null) {
            switch (category) {
                case IMPLANT -> prefix = "IMP";
                case NIENG_RANG -> prefix = "NR";
                case RANG_SU -> prefix = "RS";
                case TAY_TRANG -> prefix = "TT";
                case KHAM_DIEU_TRI -> prefix = "KDT";
                case NHA_KHOA_TRE_EM -> prefix = "TE";
            }
        }

        List<Service> allServices = serviceRepository.findAll();
        int maxNum = 0;
        String prefixWithDash = prefix.toUpperCase() + "-";

        for (Service s : allServices) {
            String code = s.getServiceCode();
            if (code != null && code.toUpperCase().startsWith(prefixWithDash)) {
                String numStr = code.substring(prefixWithDash.length()).trim();
                try {
                    int num = Integer.parseInt(numStr);
                    if (num > maxNum) {
                        maxNum = num;
                    }
                } catch (NumberFormatException ignored) {
                }
            }
        }

        int nextNum = maxNum + 1;
        String candidate;
        do {
            candidate = String.format("%s-%03d", prefix, nextNum);
            nextNum++;
        } while (serviceRepository.existsByServiceCode(candidate));

        return candidate;
    }
}

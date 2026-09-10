package iuh.fit.backend.treatment.service;

import iuh.fit.backend.treatment.dto.ServiceCreateDTO;
import iuh.fit.backend.treatment.dto.ServiceDTO;
import iuh.fit.backend.treatment.enums.ServiceCategory;

import java.util.List;
import java.util.UUID;

public interface DentalService {
    List<ServiceDTO> getAllServices(String search, ServiceCategory category, Boolean isActive, Boolean isFeatured);
    ServiceDTO getServiceById(UUID id);
    ServiceDTO createService(ServiceCreateDTO dto);
    ServiceDTO updateService(UUID id, ServiceCreateDTO dto);
    void deleteService(UUID id);
    ServiceDTO toggleActiveStatus(UUID id);
    ServiceDTO toggleFeaturedStatus(UUID id);
}

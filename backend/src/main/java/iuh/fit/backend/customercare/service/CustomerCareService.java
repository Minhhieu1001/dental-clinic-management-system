package iuh.fit.backend.customercare.service;

import iuh.fit.backend.customercare.dto.CustomerCareResponse;
import iuh.fit.backend.customercare.dto.CustomerCareRequest;
import iuh.fit.backend.customercare.dto.CustomerCareSuggestionResponse;
import iuh.fit.backend.customercare.dto.CustomerCareSummaryResponse;
import iuh.fit.backend.customercare.dto.BulkCareMessageDTO;
import iuh.fit.backend.customercare.dto.BulkCareResponse;

import java.util.List;
import java.util.UUID;

public interface CustomerCareService {
    BulkCareResponse createBulkPromotion(BulkCareMessageDTO request);
    List<CustomerCareResponse> getAll();
    CustomerCareResponse getById(UUID id);
    CustomerCareResponse create(CustomerCareRequest request);
    CustomerCareResponse update(UUID id, CustomerCareRequest request);
    void delete(UUID id);
    CustomerCareSummaryResponse getSummary();
    List<CustomerCareSuggestionResponse> getSuggestions(Integer month, Integer year, UUID patientId);
}

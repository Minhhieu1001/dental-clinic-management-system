package iuh.fit.backend.treatment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TreatmentServiceResponse(
        UUID id,
        UUID phaseId,
        UUID serviceId,
        String serviceName,
        String toothNumber,
        Integer quantity,
        BigDecimal price,
        BigDecimal totalAmount) {
}

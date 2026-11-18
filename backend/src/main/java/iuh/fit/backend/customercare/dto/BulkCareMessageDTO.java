package iuh.fit.backend.customercare.dto;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

// HTTP request; RabbitMQ messages only carry the saved careTaskId.
public record BulkCareMessageDTO(
        @NotNull UUID promotionId,
        @NotEmpty @Size(max = 500) List<@NotNull UUID> patientIds
) {}

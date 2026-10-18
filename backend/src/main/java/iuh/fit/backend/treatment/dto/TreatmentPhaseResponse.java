package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.StatusPhase;
import java.time.LocalDateTime;
import java.util.UUID;

public record TreatmentPhaseResponse(UUID id, UUID planId,
        String phaseName,
        String phaseOrder,
        String treatmentType,
        String description,
        StatusPhase status,
        String estimatedDuration,
        LocalDateTime expectedStartDate,
        LocalDateTime expectedEndDate) {
}

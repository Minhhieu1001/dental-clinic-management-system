package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.StatusPhase;
import java.util.UUID;

public record TreatmentVisitResponse(
        UUID id,
        UUID phaseId,
        String visitName,
        Integer visitOrder,
        String startDate,
        StatusPhase status,
        String clinicalNotes,
        String assignedDentist,
        String facilityName,
        String facilityAddress) {
}

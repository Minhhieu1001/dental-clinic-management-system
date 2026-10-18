package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.StatusPhase;

import java.util.UUID;

public record TreatmentStatusResponse(UUID id, StatusPhase status) {
}

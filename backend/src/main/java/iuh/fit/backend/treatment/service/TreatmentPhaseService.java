package iuh.fit.backend.treatment.service;

import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.dto.TreatmentPhaseRequest;
import iuh.fit.backend.treatment.dto.TreatmentPhaseResponse;
import iuh.fit.backend.treatment.enums.StatusPhase;

import java.util.UUID;

public interface TreatmentPhaseService {
    TreatmentPhaseResponse createTreatmentPhase(UUID parentId, TreatmentPhaseRequest request);
    TreatmentPhaseResponse updateTreatmentPhase(UUID id, TreatmentPhaseRequest request);
    void deleteTreatmentPhase(UUID id);
    TreatmentStatusResponse updateTreatmentPhaseStatus(UUID id, StatusPhase status);
}

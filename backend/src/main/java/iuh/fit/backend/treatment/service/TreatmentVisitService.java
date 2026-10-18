package iuh.fit.backend.treatment.service;

import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.dto.TreatmentVisitRequest;
import iuh.fit.backend.treatment.dto.TreatmentVisitResponse;
import iuh.fit.backend.treatment.enums.StatusPhase;

import java.util.UUID;

public interface TreatmentVisitService {
    TreatmentVisitResponse createTreatmentVisit(UUID parentId, TreatmentVisitRequest request);
    TreatmentVisitResponse updateTreatmentVisit(UUID id, TreatmentVisitRequest request);
    void deleteTreatmentVisit(UUID id);
    TreatmentStatusResponse updateTreatmentVisitStatus(UUID id, StatusPhase status);
}

package iuh.fit.backend.treatment.service;

import iuh.fit.backend.treatment.dto.TreatmentServiceRequest;
import iuh.fit.backend.treatment.dto.TreatmentServiceResponse;

import java.util.UUID;

public interface TreatmentServiceI {
    TreatmentServiceResponse createTreatmentService(UUID phaseId, TreatmentServiceRequest request);
    TreatmentServiceResponse updateTreatmentService(UUID id, TreatmentServiceRequest request);
    void deleteTreatmentService(UUID id);
}

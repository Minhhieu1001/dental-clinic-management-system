package iuh.fit.backend.treatment.service;

import iuh.fit.backend.treatment.dto.TreatmentPlanRequest;
import iuh.fit.backend.treatment.dto.TreatmentPlanResponse;

import java.util.List;
import java.util.UUID;

public interface TreatmentPlanService {
    TreatmentPlanResponse createTreatmentPlan(TreatmentPlanRequest request);
    TreatmentPlanResponse getTreatmentPlanById(UUID id);
    List<TreatmentPlanResponse> getTreatmentPlansByPatientId(UUID patientId);
    TreatmentPlanResponse getTreatmentPlanByExaminationResultId(UUID examinationResultId);
    TreatmentPlanResponse updateTreatmentPlan(UUID id, TreatmentPlanRequest request);
    void deleteTreatmentPlan(UUID id);
    TreatmentPlanResponse autoScheduleFollowUpAppointments(UUID id);
}

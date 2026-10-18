package iuh.fit.backend.treatment.service;

import iuh.fit.backend.treatment.dto.TreatmentPlanRequest;
import iuh.fit.backend.treatment.dto.TreatmentPlanResponse;
import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.enums.StatusPhase;

import java.util.List;
import java.util.UUID;

public interface TreatmentPlanService {
    TreatmentStatusResponse updateTreatmentPlanStatus(UUID id, StatusPhase status);
    TreatmentPlanResponse createTreatmentPlan(TreatmentPlanRequest request);
    TreatmentPlanResponse getTreatmentPlanById(UUID id);
    List<TreatmentPlanResponse> getTreatmentPlansByPatientId(UUID patientId);
    TreatmentPlanResponse getTreatmentPlanByExaminationResultId(UUID examinationResultId);
    TreatmentPlanResponse updateTreatmentPlan(UUID id, TreatmentPlanRequest request);
    void deleteTreatmentPlan(UUID id);
    TreatmentPlanResponse autoScheduleFollowUpAppointments(UUID id);
}

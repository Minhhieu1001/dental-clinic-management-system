package iuh.fit.backend.treatment.repository;

import iuh.fit.backend.treatment.entity.TreatmentPlan;
import iuh.fit.backend.treatment.enums.StatusPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TreatmentPlanRepository extends JpaRepository<TreatmentPlan, UUID> {

    List<TreatmentPlan> findByExaminationResultMedicalRecordPatientIdAndStatusOrderByStartDateDesc(
            UUID patientId, StatusPhase status);

    long countByExaminationResultMedicalRecordPatientId(UUID patientId);

    long countByExaminationResultMedicalRecordPatientIdAndStatus(UUID patientId, StatusPhase status);

    @Query("SELECT tp FROM TreatmentPlan tp WHERE tp.examinationResult.id = :examinationResultId")
    Optional<TreatmentPlan> findByExaminationResultId(@Param("examinationResultId") UUID examinationResultId);

    @Query("SELECT tp FROM TreatmentPlan tp WHERE tp.examinationResult.medicalRecord.patient.id = :patientId ORDER BY tp.startDate DESC")
    List<TreatmentPlan> findByPatientId(@Param("patientId") UUID patientId);

    @Query(value = "SELECT DISTINCT tp.* FROM treatment_plans tp " +
           "LEFT JOIN treatment_phases ph ON ph.treatment_plan_id = tp.id " +
           "WHERE (tp.status = 'IN_PROGRESS' OR ph.status = 'IN_PROGRESS') " +
           "AND (tp.roadmap_sent = false OR tp.roadmap_sent IS NULL)",
           nativeQuery = true)
    List<TreatmentPlan> findPlansNeedingRoadmapNotification();
}

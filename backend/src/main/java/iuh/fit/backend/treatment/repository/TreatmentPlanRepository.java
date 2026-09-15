package iuh.fit.backend.treatment.repository;

import iuh.fit.backend.treatment.entity.TreatmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TreatmentPlanRepository extends JpaRepository<TreatmentPlan, UUID> {

    @Query("SELECT tp FROM TreatmentPlan tp WHERE tp.examinationResult.id = :examinationResultId")
    Optional<TreatmentPlan> findByExaminationResultId(@Param("examinationResultId") UUID examinationResultId);

    @Query("SELECT tp FROM TreatmentPlan tp WHERE tp.examinationResult.medicalRecord.patient.id = :patientId ORDER BY tp.startDate DESC")
    List<TreatmentPlan> findByPatientId(@Param("patientId") UUID patientId);
}

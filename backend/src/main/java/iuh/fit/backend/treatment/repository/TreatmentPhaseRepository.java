package iuh.fit.backend.treatment.repository;

import iuh.fit.backend.treatment.entity.TreatmentPhase;
import iuh.fit.backend.treatment.enums.StatusPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TreatmentPhaseRepository extends JpaRepository<TreatmentPhase, UUID> {
    @Query("""
            SELECT ph FROM TreatmentPhase ph
            JOIN FETCH ph.treatmentPlan tp JOIN FETCH tp.examinationResult e
            JOIN FETCH e.medicalRecord m JOIN FETCH m.patient p
            WHERE tp.status = :planStatus AND ph.status IN :phaseStatuses
              AND ((ph.expectedStartDate >= :start AND ph.expectedStartDate < :end)
                OR (ph.expectedEndDate >= :start AND ph.expectedEndDate < :end))
              AND (:patientId IS NULL OR p.id = :patientId)
            ORDER BY p.id, ph.expectedStartDate, ph.id
            """)
    List<TreatmentPhase> findCarePhases(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("patientId") UUID patientId,
            @Param("planStatus") StatusPhase planStatus,
            @Param("phaseStatuses") List<StatusPhase> phaseStatuses);

}

package iuh.fit.backend.patient.repository;

import iuh.fit.backend.patient.entity.PatientRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRelationshipRepository extends JpaRepository<PatientRelationship, UUID> {
    @EntityGraph(attributePaths = "relatedPatient")
    List<PatientRelationship> findByPatientIdAndStatusTrueOrderByCreatedAtAscIdAsc(UUID patientId);

    List<PatientRelationship> findByStatusTrueOrderByCreatedAtDesc();

    boolean existsByRelatedPatientIdAndStatusTrue(UUID relatedPatientId);
    Optional<PatientRelationship> findByPatientIdAndRelatedPatientId(UUID patientId, UUID relatedPatientId);
}

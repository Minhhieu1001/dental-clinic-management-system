package iuh.fit.backend.system.repository;

import iuh.fit.backend.system.entity.PrimaryDiagnosis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PrimaryDiagnosisRepository extends JpaRepository<PrimaryDiagnosis, UUID> {
    boolean existsByPrimaryDiagnosisNameIgnoreCase(String primaryDiagnosisName);

    boolean existsByPrimaryDiagnosisNameIgnoreCaseAndIdNot(String primaryDiagnosisName, UUID id);
}

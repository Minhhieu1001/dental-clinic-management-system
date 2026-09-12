package iuh.fit.backend.medicalrecord.repository;

import iuh.fit.backend.medicalrecord.entity.Diagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DiagnosisRepository extends JpaRepository<Diagnosis, UUID> {

    List<Diagnosis> findByExaminationResultId(UUID examinationResultId);

    void deleteByExaminationResultId(UUID examinationResultId);
}

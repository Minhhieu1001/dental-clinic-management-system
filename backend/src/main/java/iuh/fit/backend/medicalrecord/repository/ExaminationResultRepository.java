package iuh.fit.backend.medicalrecord.repository;

import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExaminationResultRepository extends JpaRepository<ExaminationResult, UUID> {

    List<ExaminationResult> findAllByOrderByExaminationDateDesc();

    List<ExaminationResult> findByMedicalRecordIdOrderByExaminationDateDesc(UUID medicalRecordId);

    List<ExaminationResult> findByMedicalRecordPatientIdOrderByExaminationDateDesc(UUID patientId);
}

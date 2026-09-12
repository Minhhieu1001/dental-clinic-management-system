package iuh.fit.backend.medicalrecord.repository;

import iuh.fit.backend.medicalrecord.entity.ToothRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ToothRecordRepository extends JpaRepository<ToothRecord, UUID> {

    List<ToothRecord> findByExaminationResultId(UUID examinationResultId);

    Optional<ToothRecord> findByExaminationResultIdAndToothNumber(UUID examinationResultId, String toothNumber);

    void deleteByExaminationResultId(UUID examinationResultId);
}

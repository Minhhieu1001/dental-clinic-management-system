package iuh.fit.backend.medicalrecord.repository;

import iuh.fit.backend.medicalrecord.entity.XrayImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface XrayImageRepository extends JpaRepository<XrayImage, UUID> {

    List<XrayImage> findByExaminationResult_MedicalRecord_IdOrderByCaptureDateDesc(UUID medicalRecordId);

    Optional<XrayImage> findByExaminationResultId(UUID examinationResultId);
}


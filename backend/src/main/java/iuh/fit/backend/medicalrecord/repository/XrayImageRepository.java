package iuh.fit.backend.medicalrecord.repository;

import iuh.fit.backend.medicalrecord.entity.XrayImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface XrayImageRepository extends JpaRepository<XrayImage, UUID> {

    List<XrayImage> findByMedicalRecordIdOrderByCaptureDateDesc(UUID medicalRecordId);

    List<XrayImage> findByExaminationResultIdOrderByCaptureDateDesc(UUID examinationResultId);
}


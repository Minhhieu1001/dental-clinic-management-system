package iuh.fit.backend.prescription.repository;

import iuh.fit.backend.prescription.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    long countByExaminationResultMedicalRecordPatientId(UUID patientId);

    List<Prescription> findByExaminationResultId(UUID examinationResultId);

    @Query("SELECT p FROM Prescription p WHERE p.examinationResult.medicalRecord.patient.id = :patientId ORDER BY p.prescriptionDate DESC")
    List<Prescription> findByPatientId(@Param("patientId") UUID patientId);

    @Query("SELECT p FROM Prescription p WHERE p.examinationResult.medicalRecord.patient.patientCode = :patientCode ORDER BY p.prescriptionDate DESC")
    List<Prescription> findByPatientCode(@Param("patientCode") String patientCode);

    Optional<Prescription> findByPrescriptionCode(String prescriptionCode);

    boolean existsByPrescriptionCode(String prescriptionCode);

    List<Prescription> findAllByOrderByPrescriptionDateDesc();
}

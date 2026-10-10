package iuh.fit.backend.medicalrecord.repository;

import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, UUID> {

    List<MedicalRecord> findAllByOrderByRecordDateDesc();

    List<MedicalRecord> findByPatientIdOrderByRecordDateDesc(UUID patientId);

    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.patient.patientCode = :patientCode ORDER BY mr.recordDate DESC")
    List<MedicalRecord> findByPatientCodeOrderByRecordDateDesc(@Param("patientCode") String patientCode);

    Optional<MedicalRecord> findByMedicalRecordCode(String medicalRecordCode);

    List<MedicalRecord> findByDentistIdOrderByRecordDateDesc(UUID dentistId);

    Optional<MedicalRecord> findByAppointmentId(UUID appointmentId);
}

package iuh.fit.backend.patient.repository;

import iuh.fit.backend.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {
    Optional<Patient> findByPatientCode(String patientCode);
    List<Patient> findAllByOrderByCreatedAtDesc();
    List<Patient> findByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);
}

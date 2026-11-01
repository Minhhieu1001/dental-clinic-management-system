package iuh.fit.backend.patient.repository;

import iuh.fit.backend.patient.entity.PatientRelationshipOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PatientRelationshipOtpRepository extends JpaRepository<PatientRelationshipOtp, UUID> {}

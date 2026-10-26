package iuh.fit.backend.auth.repository;

import iuh.fit.backend.auth.entity.PatientActivation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PatientActivationRepository extends JpaRepository<PatientActivation, UUID> {}

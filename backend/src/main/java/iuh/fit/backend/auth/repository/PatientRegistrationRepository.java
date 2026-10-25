package iuh.fit.backend.auth.repository;

import iuh.fit.backend.auth.entity.PatientRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRegistrationRepository extends JpaRepository<PatientRegistration, String> {}

package iuh.fit.backend.inforclinic.repository;

import iuh.fit.backend.inforclinic.entity.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicRepository extends JpaRepository<Clinic, String> {
    boolean existsByClinicCodeIgnoreCase(String clinicCode);
    boolean existsByClinicCodeIgnoreCaseAndClinicIdNot(String clinicCode, String clinicId);
}

package iuh.fit.backend.system.repository;

import iuh.fit.backend.system.entity.ToothStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ToothStatusRepository extends JpaRepository<ToothStatus, UUID> {
    boolean existsByToothCodeIgnoreCase(String toothCode);

    boolean existsByToothCodeIgnoreCaseAndIdNot(String toothCode, UUID id);
}

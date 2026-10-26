package iuh.fit.backend.auth.repository;

import iuh.fit.backend.auth.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, UUID> {
}

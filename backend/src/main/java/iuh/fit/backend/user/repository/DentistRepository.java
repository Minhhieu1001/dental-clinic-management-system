package iuh.fit.backend.user.repository;

import iuh.fit.backend.user.entity.Dentist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DentistRepository extends JpaRepository<Dentist, UUID> {
    Optional<Dentist> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}

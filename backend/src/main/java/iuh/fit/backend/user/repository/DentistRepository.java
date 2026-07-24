package iuh.fit.backend.user.repository;

import iuh.fit.backend.user.entity.Dentist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DentistRepository extends JpaRepository<Dentist, UUID> {
    Optional<Dentist> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    @Query("SELECT DISTINCT d FROM Dentist d " +
           "LEFT JOIN FETCH d.user " +
           "ORDER BY d.user.createdAt DESC")
    List<Dentist> findAllWithUser();

    @Query("SELECT d FROM Dentist d " +
           "LEFT JOIN FETCH d.user " +
           "WHERE d.id = :id")
    Optional<Dentist> findByIdWithUser(UUID id);
}



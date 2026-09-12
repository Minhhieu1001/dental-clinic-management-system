package iuh.fit.backend.treatment.repository;

import iuh.fit.backend.treatment.entity.TreatmentVisits;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TreatmentVisitsRepository extends JpaRepository<TreatmentVisits, UUID> {
}

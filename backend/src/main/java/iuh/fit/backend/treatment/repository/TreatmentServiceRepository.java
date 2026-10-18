package iuh.fit.backend.treatment.repository;

import iuh.fit.backend.treatment.entity.TreatmentService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TreatmentServiceRepository extends JpaRepository<TreatmentService, UUID> {
    @Query("select count(d) > 0 from InvoiceDetail d where d.treatmentServiceId = :id")
    boolean existsInvoiceReference(@Param("id") String id);
}

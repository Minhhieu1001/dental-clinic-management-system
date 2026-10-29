package iuh.fit.backend.treatment.repository;

import iuh.fit.backend.treatment.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {
    Optional<Service> findByServiceCode(String serviceCode);
    boolean existsByServiceCode(String serviceCode);
    List<Service> findAllByOrderBySortOrderAscServiceNameAsc();

    @Query("SELECT s FROM Service s LEFT JOIN FETCH s.promotion ORDER BY s.sortOrder ASC, s.serviceName ASC")
    List<Service> findAllWithPromotion();

    // Lock in a stable order so concurrent promotion edits cannot claim the same service.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Service s ORDER BY s.id")
    List<Service> findAllForPromotionUpdate();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM treatment_services WHERE service_id = :id", nativeQuery = true)
    void deleteTreatmentServicesByServiceId(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM services WHERE id = :id", nativeQuery = true)
    void deleteServiceByIdNative(@Param("id") UUID id);
}

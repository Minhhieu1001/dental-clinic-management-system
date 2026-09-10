package iuh.fit.backend.treatment.repository;

import iuh.fit.backend.treatment.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {
    Optional<Service> findByServiceCode(String serviceCode);
    boolean existsByServiceCode(String serviceCode);
    List<Service> findAllByOrderBySortOrderAscServiceNameAsc();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM promotion_services WHERE service_id = :id", nativeQuery = true)
    void deletePromotionServicesByServiceId(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM treatment_services WHERE service_id = :id", nativeQuery = true)
    void deleteTreatmentServicesByServiceId(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM invoice_details WHERE service_id = :id", nativeQuery = true)
    void deleteInvoiceDetailsByServiceId(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM services WHERE id = :id", nativeQuery = true)
    void deleteServiceByIdNative(@Param("id") UUID id);
}

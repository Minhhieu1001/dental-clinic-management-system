package iuh.fit.backend.prescription.repository;

import iuh.fit.backend.prescription.entity.Medicine;
import iuh.fit.backend.prescription.enums.MedicineStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, UUID> {

    Optional<Medicine> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    List<Medicine> findAllByOrderByCreatedAtDesc();

    List<Medicine> findByStatusOrderByCreatedAtDesc(MedicineStatus status);

    @Query("SELECT DISTINCT m.unit FROM Medicine m WHERE m.unit IS NOT NULL AND m.unit != '' ORDER BY m.unit ASC")
    List<String> findDistinctUnits();

    @Query("SELECT m FROM Medicine m WHERE " +
            "(:keyword IS NULL OR :keyword = '' " +
            "OR LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(m.code) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(m.usageInstruction) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:status IS NULL OR m.status = :status) " +
            "AND (:unit IS NULL OR :unit = '' OR :unit = 'ALL' OR m.unit = :unit) " +
            "AND (:stockStatus IS NULL OR :stockStatus = '' OR :stockStatus = 'ALL' " +
            "  OR (:stockStatus = 'IN_STOCK' AND m.stockQuantity >= 30) " +
            "  OR (:stockStatus = 'LOW' AND m.stockQuantity > 0 AND m.stockQuantity < 30) " +
            "  OR (:stockStatus = 'OUT' AND (m.stockQuantity IS NULL OR m.stockQuantity <= 0)))")
    List<Medicine> searchMedicinesAdvanced(
            @Param("keyword") String keyword,
            @Param("status") MedicineStatus status,
            @Param("unit") String unit,
            @Param("stockStatus") String stockStatus,
            Sort sort
    );

    @Query("SELECT m FROM Medicine m WHERE " +
            "(:keyword IS NULL OR :keyword = '' " +
            "OR LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(m.code) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(m.usageInstruction) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:status IS NULL OR m.status = :status) " +
            "ORDER BY m.createdAt DESC")
    List<Medicine> searchMedicines(@Param("keyword") String keyword, @Param("status") MedicineStatus status);

    @Query("SELECT m FROM Medicine m WHERE m.expiryDate IS NOT NULL " +
            "AND m.expiryDate >= :today AND m.expiryDate <= :thresholdDate " +
            "ORDER BY m.expiryDate ASC")
    List<Medicine> findExpiringSoon(@Param("today") LocalDate today, @Param("thresholdDate") LocalDate thresholdDate);

    @Query("SELECT m FROM Medicine m WHERE m.expiryDate IS NOT NULL " +
            "AND m.expiryDate < :today " +
            "ORDER BY m.expiryDate ASC")
    List<Medicine> findExpired(@Param("today") LocalDate today);

    @Query("SELECT m FROM Medicine m WHERE m.stockQuantity <= :threshold " +
            "ORDER BY m.stockQuantity ASC")
    List<Medicine> findLowStock(@Param("threshold") Integer threshold);
}

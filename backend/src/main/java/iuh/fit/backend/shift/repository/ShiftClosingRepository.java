package iuh.fit.backend.shift.repository;

import iuh.fit.backend.shift.entity.ShiftClosing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShiftClosingRepository extends JpaRepository<ShiftClosing, UUID> {

    @Query("SELECT s FROM ShiftClosing s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH s.handoverEmployee he " +
           "LEFT JOIN FETCH s.branch b " +
           "ORDER BY s.createdAt DESC")
    List<ShiftClosing> findAllWithDetails();

    @Query("SELECT s FROM ShiftClosing s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH s.handoverEmployee he " +
           "LEFT JOIN FETCH s.branch b " +
           "WHERE e.id = :employeeId OR he.id = :employeeId " +
           "ORDER BY s.createdAt DESC")
    List<ShiftClosing> findByEmployeeIdWithDetails(@Param("employeeId") UUID employeeId);

    @Query("SELECT s FROM ShiftClosing s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH s.handoverEmployee he " +
           "LEFT JOIN FETCH s.branch b " +
           "WHERE s.id = :id")
    Optional<ShiftClosing> findByIdWithDetails(@Param("id") UUID id);

    Optional<ShiftClosing> findByShiftCode(String shiftCode);

    @Query("SELECT s FROM ShiftClosing s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH s.handoverEmployee he " +
           "LEFT JOIN FETCH s.branch b " +
           "WHERE s.shiftType = :shiftType " +
           "AND s.startTime >= :dayStart AND s.startTime < :dayEnd " +
           "ORDER BY s.createdAt DESC")
    List<ShiftClosing> findClosedShiftForDate(
            @Param("shiftType") iuh.fit.backend.shift.enums.ShiftType shiftType,
            @Param("dayStart") java.time.LocalDateTime dayStart,
            @Param("dayEnd") java.time.LocalDateTime dayEnd
    );

    @Query("SELECT s FROM ShiftClosing s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH s.handoverEmployee he " +
           "LEFT JOIN FETCH s.branch b " +
           "WHERE s.shiftType = :shiftType " +
           "AND s.startTime >= :dayStart AND s.startTime < :dayEnd " +
           "AND (:branchId IS NULL OR (b IS NOT NULL AND b.branchId = :branchId)) " +
           "ORDER BY s.createdAt DESC")
    List<ShiftClosing> findClosedShiftForDateAndBranch(
            @Param("shiftType") iuh.fit.backend.shift.enums.ShiftType shiftType,
            @Param("dayStart") java.time.LocalDateTime dayStart,
            @Param("dayEnd") java.time.LocalDateTime dayEnd,
            @Param("branchId") String branchId
    );

    @Query("SELECT s FROM ShiftClosing s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH s.handoverEmployee he " +
           "LEFT JOIN FETCH s.branch b " +
           "WHERE s.startTime < :targetTime " +
           "AND (:branchId IS NULL OR (b IS NOT NULL AND b.branchId = :branchId)) " +
           "ORDER BY s.endTime DESC, s.createdAt DESC")
    List<ShiftClosing> findLatestClosedShiftBefore(
            @Param("targetTime") java.time.LocalDateTime targetTime,
            @Param("branchId") String branchId
    );
}


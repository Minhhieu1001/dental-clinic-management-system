package iuh.fit.backend.customercare.repository;

import iuh.fit.backend.customercare.entity.CareStrategy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

import java.util.List;
import java.util.UUID;

public interface CareStrategyRepository extends JpaRepository<CareStrategy, UUID> {

    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    @org.springframework.data.jpa.repository.Modifying
    @Query("update CareStrategy c set c.status = :status where c.careTaskId = :id and c.status = :expected")
    int updateStatus(@Param("id") UUID id, @Param("expected") String expected, @Param("status") String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CareStrategy c where c.careTaskId = :id")
    Optional<CareStrategy> findForUpdate(@Param("id") UUID id);

    @Query("""
            SELECT c FROM CareStrategy c
            LEFT JOIN FETCH c.patient
            LEFT JOIN FETCH c.employee
            ORDER BY c.createAt DESC, c.careTaskId
            """)
    List<CareStrategy> findAllWithPatientAndEmployee();
}

package iuh.fit.backend.user.repository;

import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user u ORDER BY u.createdAt DESC")
    List<Employee> findAllWithUser();

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user u " +
            "WHERE e.branch.branchId = :branchId ORDER BY u.createdAt DESC")
    List<Employee> findAllByBranchIdWithUser(@Param("branchId") String branchId);

    @Query("SELECT e FROM Employee e WHERE e.user.id = :userId")
    Optional<Employee> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT e FROM Employee e JOIN FETCH e.user u WHERE e.branch.branchId = :branchId AND u.status = :status AND u.role = :role")
    List<Employee> findActiveEmployeesByBranch(
            @Param("branchId") String branchId,
            @Param("status") StatusUser status,
            @Param("role") Role role);

    boolean existsByUserId(UUID userId);

}

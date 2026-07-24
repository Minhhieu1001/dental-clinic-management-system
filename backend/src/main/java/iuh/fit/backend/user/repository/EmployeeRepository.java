package iuh.fit.backend.user.repository;

import iuh.fit.backend.user.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user u ORDER BY u.createdAt DESC")
    List<Employee> findAllWithUser();

    Optional<Employee> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

}

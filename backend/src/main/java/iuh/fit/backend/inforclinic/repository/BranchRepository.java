package iuh.fit.backend.inforclinic.repository;

import iuh.fit.backend.inforclinic.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, String> {
    List<Branch> findAllByClinicClinicIdOrderByBranchNameAsc(String clinicId);
    boolean existsByBranchCodeIgnoreCase(String branchCode);
    boolean existsByBranchCodeIgnoreCaseAndBranchIdNot(String branchCode, String branchId);
    java.util.Optional<Branch> findFirstByBranchNameIgnoreCase(String branchName);
}

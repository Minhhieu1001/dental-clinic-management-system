package iuh.fit.backend.user.repository;

import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static jakarta.persistence.LockModeType.PESSIMISTIC_WRITE;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmailIgnoreCase(String email);

    @Query(value = """
            select count(*) from users
            where regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^84', '0') = :phone
            """, nativeQuery = true)
    long countByNormalizedPhone(@Param("phone") String phone);

    @Lock(PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = :email")
    Optional<User> findByEmailForPasswordReset(@Param("email") String email);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRoleAndStatus(Role role, StatusUser status);
    List<User> findByRoleAndStatus(Role role, StatusUser status);
    List<User> findByRoleAndStatusAndEmployee_Branch_BranchId(Role role, StatusUser status, String branchId);
    Optional<User> findByPhone(String phone);
    Optional<User> findByUsername(String username);
    Optional<User> findByCodeName(String codeName);
    boolean existsByCodeName(String codeName);
    Optional<User> findByCodeNameAndRole(String codeName, Role role);
}

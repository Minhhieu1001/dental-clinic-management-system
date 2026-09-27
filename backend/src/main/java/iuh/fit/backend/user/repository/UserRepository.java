package iuh.fit.backend.user.repository;

import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRoleAndStatus(Role role, StatusUser status);
    List<User> findByRoleAndStatus(Role role, StatusUser status);
    Optional<User> findByPhone(String phone);
    Optional<User> findByUsername(String username);
}

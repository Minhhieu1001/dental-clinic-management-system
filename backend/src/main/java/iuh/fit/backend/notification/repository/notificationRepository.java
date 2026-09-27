package iuh.fit.backend.notification.repository;

import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.prescription.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface notificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndIsReadFalse(UUID userId);
}

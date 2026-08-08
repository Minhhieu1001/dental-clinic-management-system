package iuh.fit.backend.appointment.repository;

import iuh.fit.backend.appointment.entity.AppointmentRequest;
import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRequestRepository extends JpaRepository<AppointmentRequest, UUID> {
    List<AppointmentRequest> findByCreateAtGreaterThanEqualAndCreateAtLessThanOrderByCreateAtDesc(
            LocalDateTime startOfDay,
            LocalDateTime startOfNextDay
    );

    List<AppointmentRequest> findByStatustAppointmentRequestAndCreateAtGreaterThanEqualAndCreateAtLessThanOrderByCreateAtDesc(
            StatustAppointmentRequest status,
            LocalDateTime startOfDay,
            LocalDateTime startOfNextDay
    );

    long countByCreateAtGreaterThanEqualAndCreateAtLessThan(
            LocalDateTime startOfDay,
            LocalDateTime startOfNextDay
    );
}

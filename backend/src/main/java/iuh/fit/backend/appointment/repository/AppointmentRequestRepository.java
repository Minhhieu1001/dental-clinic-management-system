package iuh.fit.backend.appointment.repository;

import iuh.fit.backend.appointment.entity.AppointmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AppointmentRequestRepository extends JpaRepository<AppointmentRequest, UUID> {
}

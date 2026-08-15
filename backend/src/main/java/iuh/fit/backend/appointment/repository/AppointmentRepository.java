package iuh.fit.backend.appointment.repository;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByDentistIdOrderByAppointmentDateAscAppointmentTimeAsc(UUID dentistId);

    List<Appointment> findByDentistIdInOrderByAppointmentDateAscAppointmentTimeAsc(List<UUID> dentistIds);

    @Query("SELECT a FROM Appointment a WHERE (a.dentist IS NOT NULL AND (a.dentist.user.id = :userId OR a.dentist.id = :userId)) ORDER BY a.appointmentDate ASC, a.appointmentTime ASC")
    List<Appointment> findByDentistUserIdOrderByAppointmentDateAscAppointmentTimeAsc(@Param("userId") UUID userId);


    List<Appointment> findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDentistIdAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(
            UUID dentistId, LocalDateTime start, LocalDateTime end
    );

    List<Appointment> findByStatusOrderByAppointmentDateAscAppointmentTimeAsc(StatusAppointment status);

    List<Appointment> findAllByOrderByAppointmentDateDescAppointmentTimeDesc();
}


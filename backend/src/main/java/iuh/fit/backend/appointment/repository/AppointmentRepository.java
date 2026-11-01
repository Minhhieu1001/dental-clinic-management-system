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
  List<Appointment> findByPatient_IdOrderByAppointmentDateDescAppointmentTimeDesc(UUID patientId);

  @Query("""
      SELECT COUNT(a) FROM Appointment a
       WHERE a.patient.id = :patientId
        AND a.appointmentDate >= :start
        AND a.appointmentDate < :end
      """)
  long countByPatientAndDateRange(@Param("patientId") UUID patientId,
      @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

  @Query("""
      SELECT a FROM Appointment a
      WHERE a.branch.branchId = :branchId
        AND a.appointmentDate >= :start
        AND a.appointmentDate < :end
      ORDER BY a.appointmentDate ASC, a.appointmentTime ASC
      """)
  List<Appointment> findByBranchAndDateRange(@Param("branchId") String branchId,
      @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

  List<Appointment> findByDentistIdOrderByAppointmentDateAscAppointmentTimeAsc(UUID dentistId);

  List<Appointment> findByDentistIdInOrderByAppointmentDateAscAppointmentTimeAsc(List<UUID> dentistIds);

  @Query("SELECT a FROM Appointment a WHERE (a.dentist IS NOT NULL AND (a.dentist.user.id = :userId OR a.dentist.id = :userId)) ORDER BY a.appointmentDate ASC, a.appointmentTime ASC")
  List<Appointment> findByDentistUserIdOrderByAppointmentDateAscAppointmentTimeAsc(@Param("userId") UUID userId);

  List<Appointment> findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(LocalDateTime start,
      LocalDateTime end);

  List<Appointment> findByDentistIdAndAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(
      UUID dentistId, LocalDateTime start, LocalDateTime end);

  List<Appointment> findByStatusOrderByAppointmentDateAscAppointmentTimeAsc(StatusAppointment status);

  List<Appointment> findAllByOrderByAppointmentDateDescAppointmentTimeDesc();

  @Query("SELECT a FROM Appointment a WHERE (a.status = 'CONFIRMED' OR a.status = 'PENDING' OR a.status = 'WAITING') AND (a.reminded1Day IS NULL OR a.reminded1Day = false) AND a.appointmentTime >= :startTime AND a.appointmentTime <= :endTime")
  List<Appointment> findAppointmentsNeeding1DayReminder(@Param("startTime") LocalDateTime startTime,
      @Param("endTime") LocalDateTime endTime);

  @Query("SELECT a FROM Appointment a WHERE (a.status = 'CONFIRMED' OR a.status = 'PENDING' OR a.status = 'WAITING') AND (a.reminded1Hour IS NULL OR a.reminded1Hour = false) AND a.appointmentTime >= :startTime AND a.appointmentTime <= :endTime")
  List<Appointment> findAppointmentsNeeding1HourReminder(@Param("startTime") LocalDateTime startTime,
      @Param("endTime") LocalDateTime endTime);
}

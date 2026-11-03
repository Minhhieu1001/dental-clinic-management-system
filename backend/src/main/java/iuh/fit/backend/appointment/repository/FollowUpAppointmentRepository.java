package iuh.fit.backend.appointment.repository;

import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FollowUpAppointmentRepository extends JpaRepository<FollowUpAppointment, UUID> {

    @Query("""
            SELECT COUNT(f) FROM FollowUpAppointment f
            WHERE f.examinationResult.medicalRecord.patient.id = :patientId
              AND f.followUpDate >= :start
              AND f.followUpDate < :end
            """)
    long countByPatientAndDateRange(
            @Param("patientId") UUID patientId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT f FROM FollowUpAppointment f
            WHERE f.examinationResult.medicalRecord.patient.id = :patientId
              AND f.followUpDate >= :start
              AND f.followUpDate < :end
            ORDER BY f.followUpDate ASC, f.id ASC
            """)
    List<FollowUpAppointment> findByPatientAndDateRange(
            @Param("patientId") UUID patientId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    List<FollowUpAppointment> findByExaminationResultIdOrderByFollowUpDateDesc(UUID examinationResultId);

    @Query("SELECT f FROM FollowUpAppointment f " +
           "LEFT JOIN f.examinationResult e " +
           "LEFT JOIN e.medicalRecord m " +
           "LEFT JOIN m.patient p " +
           "WHERE (:patientId IS NULL OR p.id = :patientId) " +
           "AND (:patientCode IS NULL OR LOWER(p.patientCode) = LOWER(CAST(:patientCode AS String))) " +
           "AND (:examinationResultId IS NULL OR e.id = :examinationResultId) " +
           "ORDER BY f.followUpDate DESC")
    List<FollowUpAppointment> findFollowUpAppointments(
            @Param("patientId") UUID patientId,
            @Param("patientCode") String patientCode,
            @Param("examinationResultId") UUID examinationResultId
    );

    @Query("SELECT f FROM FollowUpAppointment f ORDER BY f.followUpDate DESC")
    List<FollowUpAppointment> findAllByOrderByFollowUpDateDesc();

    // === Scheduler Reminder Queries ===
    @Query("SELECT f FROM FollowUpAppointment f WHERE (f.status IS NULL OR f.status = true) " +
           "AND (f.reminded1Day IS NULL OR f.reminded1Day = false) " +
           "AND f.followUpDate >= :startTime AND f.followUpDate <= :endTime")
    List<FollowUpAppointment> findFollowUpsNeeding1DayReminder(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT f FROM FollowUpAppointment f WHERE (f.status IS NULL OR f.status = true) " +
           "AND (f.reminded1Hour IS NULL OR f.reminded1Hour = false) " +
           "AND f.followUpDate >= :startTime AND f.followUpDate <= :endTime")
    List<FollowUpAppointment> findFollowUpsNeeding1HourReminder(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}

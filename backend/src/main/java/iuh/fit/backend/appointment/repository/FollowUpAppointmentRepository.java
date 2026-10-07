package iuh.fit.backend.appointment.repository;

import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FollowUpAppointmentRepository extends JpaRepository<FollowUpAppointment, UUID> {

    List<FollowUpAppointment> findByExaminationResultIdOrderByFollowUpDateDesc(UUID examinationResultId);

    @Query("SELECT f FROM FollowUpAppointment f " +
           "LEFT JOIN f.examinationResult e " +
           "LEFT JOIN e.medicalRecord m " +
           "LEFT JOIN m.patient p " +
           "WHERE (:patientId IS NULL OR p.id = :patientId) " +
           "AND (:patientCode IS NULL OR LOWER(p.patientCode) = LOWER(:patientCode)) " +
           "AND (:examinationResultId IS NULL OR e.id = :examinationResultId) " +
           "ORDER BY f.followUpDate DESC")
    List<FollowUpAppointment> findFollowUpAppointments(
            @Param("patientId") UUID patientId,
            @Param("patientCode") String patientCode,
            @Param("examinationResultId") UUID examinationResultId
    );

    @Query("SELECT f FROM FollowUpAppointment f ORDER BY f.followUpDate DESC")
    List<FollowUpAppointment> findAllByOrderByFollowUpDateDesc();
}

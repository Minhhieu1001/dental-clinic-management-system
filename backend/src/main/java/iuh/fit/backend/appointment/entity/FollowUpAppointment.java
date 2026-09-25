package iuh.fit.backend.appointment.entity;

import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "follow_up_appointment")
public class FollowUpAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private LocalDateTime followUpDate;
    private String reason;
    private String note;
    private Boolean status;

    private LocalDateTime createAt;
    private LocalDateTime updatedAt;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_result_id", nullable = true)
    private ExaminationResult examinationResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id", nullable = true)
    private Dentist dentist;
}

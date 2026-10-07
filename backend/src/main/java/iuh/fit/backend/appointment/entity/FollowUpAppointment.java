package iuh.fit.backend.appointment.entity;

import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.user.entity.Dentist;
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
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column(columnDefinition = "TEXT")
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

    @PrePersist
    protected void onCreate() {
        if (createAt == null) {
            createAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

package iuh.fit.backend.customercare.entity;

import iuh.fit.backend.customercare.enums.ContactChannel;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.user.entity.Employee;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "care_strategies")
public class CareStrategy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "care_task_id")
    private UUID careTaskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private String careCategory;

    @Column(columnDefinition = "TEXT")
    private String careContent;

    @Enumerated(EnumType.STRING)
    private ContactChannel contactChannel;

    private String status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createAt;
}

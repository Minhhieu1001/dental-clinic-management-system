package iuh.fit.backend.appointment.entity;

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
@Table(name = "shifts")
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    private LocalDateTime shiftDate;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Boolean status;
}

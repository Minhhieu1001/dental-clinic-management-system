package iuh.fit.backend.appointment.entity;

import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;
import iuh.fit.backend.inforclinic.entity.Branch;
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
@Table(name = "appointment_requests")
public class AppointmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String fullName;
    private String phone;
    @Column(columnDefinition = "TEXT")
    private String description;
    private LocalDateTime createAt;

    @Enumerated(EnumType.STRING)
    private StatustAppointmentRequest statustAppointmentRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = true)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;

    @Version
    @Builder.Default
    private Long version = 0L;



}

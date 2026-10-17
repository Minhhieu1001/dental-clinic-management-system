package iuh.fit.backend.appointment.entity;

import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;
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
}

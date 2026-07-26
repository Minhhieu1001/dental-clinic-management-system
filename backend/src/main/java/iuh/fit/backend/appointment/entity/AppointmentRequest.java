package iuh.fit.backend.appointment.entity;

import iuh.fit.backend.patient.entity.Patient;
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
@Table(name = "appoinment_requests")
public class AppoinmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String fullName;
    private String phone;
    @Column(columnDefinition = "TEXT")
    private String description;
    private LocalDateTime createAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;



}

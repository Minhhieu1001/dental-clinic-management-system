package iuh.fit.backend.appointment.entity;

import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.user.entity.Dentist;
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
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private LocalDateTime appointmentDate;

    private LocalDateTime appointmentTime;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 255)
    private String attribute;

    @Enumerated(EnumType.STRING)
    private StatusAppointment status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;
}

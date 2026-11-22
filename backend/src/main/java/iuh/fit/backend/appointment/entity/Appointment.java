package iuh.fit.backend.appointment.entity;

import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.patient.entity.Patient;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @Column(name = "appointment_code", unique = true, length = 40)
    private String appointmentCode;

    @Builder.Default
    @Column(name = "is_check", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    private Boolean isCheck = false;

    @Column(length = 254)
    private String email;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", foreignKey = @ForeignKey(name = "fk_appointments_patient"))
    private Patient patient;

    @Column(length = 255)
    private String patientName;

    @Column(length = 50)
    private String phone;

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

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String treatmentNotes;

    @Builder.Default
    @Column(name = "reminded_1day")
    private Boolean reminded1Day = false;

    @Builder.Default
    @Column(name = "reminded_1hour")
    private Boolean reminded1Hour = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;

    @Version
    @Builder.Default
    private Long version = 0L;
}

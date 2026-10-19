package iuh.fit.backend.customercare.entity;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.customercare.enums.CareChannel;
import iuh.fit.backend.customercare.enums.CareStatus;
import iuh.fit.backend.customercare.enums.CareType;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.prescription.entity.Prescription;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.Employee;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "customer_care_records")
public class CustomerCareRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_plan_id")
    private TreatmentPlan treatmentPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "care_type", length = 50)
    private CareType careType;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", length = 50)
    private CareChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private CareStatus status;

    @Column(name = "care_time")
    private LocalDateTime careTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_name", length = 255)
    private String createdByName;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

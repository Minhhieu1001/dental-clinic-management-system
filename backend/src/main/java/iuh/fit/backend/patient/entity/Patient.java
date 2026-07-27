package iuh.fit.backend.patient.entity;

import iuh.fit.backend.appointment.entity.AppointmentRequest;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.patient.enums.Gender;
import iuh.fit.backend.prescription.entity.Prescription;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
import iuh.fit.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 255)
    private String patientCode;

    @Column(length = 255)
    private String fullName;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDateTime dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Appointment> appointments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<MedicalRecord> medicalRecords = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Prescription> prescriptions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<PatientInsurance> patientInsurances = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Review> reviews = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Invoice> invoices = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentPlan> treatmentPlans = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<AppointmentRequest> appointmentsRequests = new ArrayList<>();
}

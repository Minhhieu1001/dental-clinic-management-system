package iuh.fit.backend.patient.entity;

import iuh.fit.backend.appointment.entity.AppointmentRequest;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.entity.PaymentTransactions;
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

    @Column(length = 255)
    private String patientCode;

    @Column(length = 255)
    private String fullName;

    @Column(length = 255)
    private String nationality;

    @Column(length = 255)
    private String hometown;

    @Column(length = 255)
    private String job;

    @Column(length = 50)
    private String phoneNumber;

    @Column(length = 20)
    private String cccd;

    @Column(length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDateTime dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String systemicDisease;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String currentMedications;

    @Column(columnDefinition = "TEXT")
    private String surgicalHistory;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "customer_group", length = 100)
    private String customerGroup;

    @Column(name = "customer_source", length = 100)
    private String customerSource;

    @Column(name = "customer_card", length = 100)
    private String customerCard;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<MedicalRecord> medicalRecords = new ArrayList<>();


    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<PatientInsurance> patientInsurances = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Review> reviews = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Invoice> invoices = new ArrayList<>();


}

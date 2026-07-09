package iuh.fit.backend.user.entity;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.Shift;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.prescription.entity.Prescription;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dentists")
public class Dentist {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 255)
    private String licenseNumber;

    @Column(length = 255)
    private String specialization;

    private Integer experienceYears;

    @Column(length = 255)
    private String qualification;

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Shift> shifts = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Appointment> appointments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<MedicalRecord> medicalRecords = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Prescription> prescriptions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentPlan> treatmentPlans = new ArrayList<>();
}

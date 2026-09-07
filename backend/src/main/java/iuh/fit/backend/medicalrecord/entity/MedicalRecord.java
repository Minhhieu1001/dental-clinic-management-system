package iuh.fit.backend.medicalrecord.entity;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.prescription.entity.Prescription;
import iuh.fit.backend.user.entity.Dentist;
import jakarta.persistence.*;
import lombok.*;

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
@Table(name = "medical_records")
public class MedicalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String treatmentNotes;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    private LocalDateTime recordDate;

    @Column(length = 255)
    private String fileName;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String dentalClinicName;

    @Builder.Default
    @OneToMany(mappedBy = "medicalRecord", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<ExaminationResult> examinationsResults = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "medicalRecord", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<XrayImage> xrayImages = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "medicalRecord", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Prescription> prescriptions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "medicalRecord", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentHistorys> treatmentHistorys = new ArrayList<>();
}

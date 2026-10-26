package iuh.fit.backend.medicalrecord.entity;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.inforclinic.entity.Branch;
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

    @Column(name = "medical_record_code", length = 30, unique = true)
    private String medicalRecordCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(columnDefinition = "TEXT")
    private String treatmentNotes;

    private LocalDateTime recordDate;

    @Builder.Default
    @OneToMany(mappedBy = "medicalRecord", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<ExaminationResult> examinationsResults = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "medicalRecord", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<XrayImage> xrayImages = new ArrayList<>();


    @Builder.Default
    @OneToMany(mappedBy = "medicalRecord", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentHistorys> treatmentHistorys = new ArrayList<>();

    @PrePersist
    private void generateMedicalRecordCode() {
        if (medicalRecordCode == null || medicalRecordCode.isBlank()) {
            medicalRecordCode = "HSBA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}

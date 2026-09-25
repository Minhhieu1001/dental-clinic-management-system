package iuh.fit.backend.medicalrecord.entity;

import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import iuh.fit.backend.prescription.entity.Prescription;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
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
@Table(name = "examinations_result")
public class ExaminationResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    private LocalDateTime examinationDate;

    @Builder.Default
    @Column(name = "disabled")
    private Boolean disabled = true;

    @Builder.Default
    @OneToMany(mappedBy = "examinationResult", fetch = FetchType.LAZY,
            cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Diagnosis> diagnoses = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "examinationResult", fetch = FetchType.LAZY,
            cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<ToothRecord> toothRecords = new ArrayList<>();

    @OneToOne(mappedBy = "examinationResult", fetch = FetchType.LAZY)
    private TreatmentPlan treatmentPlan;

    @Builder.Default
    @OneToMany(mappedBy = "examinationResult", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Prescription> prescriptions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "examinationResult", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<FollowUpAppointment> followUpAppointments = new ArrayList<>();
}
